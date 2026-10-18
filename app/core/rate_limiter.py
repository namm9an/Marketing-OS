"""
Sliding-Window Rate Limiter & Abuse Defense (Enterprise Hardening)
"""

import time
import threading
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
from flask import jsonify, Response


@dataclass
class RateLimitResult:
    allowed: bool
    notice: Optional[str] = None
    retry_after: int = 0
    limit_type: Optional[str] = None


class RateLimiter:
    """
    In-memory thread-safe sliding-window rate limiter enforcing:
    1. Host-wide daily ceiling on shared Gemini key: Exactly 200 requests/day max (bypassed if BYOK).
    2. Per-IP daily limit: 10 requests/day max.
    3. Per-IP burst limit: 3 requests/minute max.
    """

    def __init__(
        self,
        host_daily_limit: int = 200,
        ip_daily_limit: int = 10,
        ip_burst_limit: int = 3,
        day_window_seconds: int = 86400,
        burst_window_seconds: int = 60,
    ):
        self.host_daily_limit = host_daily_limit
        self.ip_daily_limit = ip_daily_limit
        self.ip_burst_limit = ip_burst_limit
        self.day_window_seconds = day_window_seconds
        self.burst_window_seconds = burst_window_seconds

        self._lock = threading.Lock()
        self._host_requests: List[float] = []
        self._ip_daily_requests: Dict[str, List[Tuple[float, Optional[str]]]] = {}
        self._ip_burst_requests: Dict[str, List[Tuple[float, Optional[str]]]] = {}

    def reset(self) -> None:
        """Reset all rate limit tracking buckets (useful for hermetic tests)."""
        with self._lock:
            self._host_requests.clear()
            self._ip_daily_requests.clear()
            self._ip_burst_requests.clear()

    def check(
        self,
        ip: str,
        is_byok: bool = False,
        request_id: Optional[str] = None,
        now: Optional[float] = None,
    ) -> RateLimitResult:
        """Inspect rate limit status without consuming a token."""
        return self._evaluate(ip, is_byok=is_byok, consume=False, request_id=request_id, now=now)

    def acquire(
        self,
        ip: str,
        is_byok: bool = False,
        request_id: Optional[str] = None,
        now: Optional[float] = None,
    ) -> RateLimitResult:
        """Check and consume a token if allowed."""
        if request_id is None:
            try:
                from flask import g, has_request_context
                if has_request_context() and hasattr(g, "request_id"):
                    request_id = g.request_id
            except Exception:
                pass
        return self._evaluate(ip, is_byok=is_byok, consume=True, request_id=request_id, now=now)

    def _evaluate(
        self,
        ip: str,
        is_byok: bool = False,
        consume: bool = True,
        request_id: Optional[str] = None,
        now: Optional[float] = None,
    ) -> RateLimitResult:
        t = time.time() if now is None else now
        ip_key = ip.strip() if ip else "127.0.0.1"

        with self._lock:
            # 1. Prune expired entries
            burst_cutoff = t - self.burst_window_seconds
            ip_burst = [item for item in self._ip_burst_requests.get(ip_key, []) if item[0] > burst_cutoff]
            self._ip_burst_requests[ip_key] = ip_burst

            daily_cutoff = t - self.day_window_seconds
            ip_daily = [item for item in self._ip_daily_requests.get(ip_key, []) if item[0] > daily_cutoff]
            self._ip_daily_requests[ip_key] = ip_daily

            # Check if this request_id was already admitted for this IP (e.g. multi-agent workflow)
            already_admitted = False
            if request_id is not None:
                already_admitted = any(item[1] == request_id for item in ip_burst) or any(
                    item[1] == request_id for item in ip_daily
                )

            if not already_admitted:
                # 1. Check IP burst window (3 requests/minute)
                if len(ip_burst) >= self.ip_burst_limit:
                    earliest = ip_burst[0][0]
                    retry_after = max(1, int(self.burst_window_seconds - (t - earliest)))
                    return RateLimitResult(
                        allowed=False,
                        notice="Quota reached",
                        retry_after=retry_after,
                        limit_type="ip_burst",
                    )

                # 2. Check IP daily window (10 requests/day)
                if len(ip_daily) >= self.ip_daily_limit:
                    earliest = ip_daily[0][0]
                    retry_after = max(1, int(self.day_window_seconds - (t - earliest)))
                    return RateLimitResult(
                        allowed=False,
                        notice="Quota reached",
                        retry_after=retry_after,
                        limit_type="ip_daily",
                    )

            # 3. Check Host-wide daily ceiling on shared key (200 requests/day max, bypassed if BYOK)
            if not is_byok:
                host_cutoff = t - self.day_window_seconds
                self._host_requests = [ts for ts in self._host_requests if ts > host_cutoff]
                if len(self._host_requests) >= self.host_daily_limit:
                    earliest = self._host_requests[0]
                    retry_after = max(1, int(self.day_window_seconds - (t - earliest)))
                    return RateLimitResult(
                        allowed=False,
                        notice="Quota reached",
                        retry_after=retry_after,
                        limit_type="host_daily",
                    )

            # If consume is requested, record the timestamp
            if consume:
                if not already_admitted:
                    self._ip_burst_requests[ip_key].append((t, request_id))
                    self._ip_daily_requests[ip_key].append((t, request_id))
                if not is_byok:
                    self._host_requests.append(t)

            return RateLimitResult(allowed=True, notice=None, retry_after=0, limit_type=None)

    @staticmethod
    def make_429_response(retry_after: int, message: str = "Rate limit exceeded") -> Tuple[Response, int]:
        """Construct a structured HTTP 429 response with Retry-After header."""
        resp = jsonify({
            "error": "rate_limit_exceeded",
            "message": message,
            "notice": "Quota reached",
            "retry_after": retry_after,
        })
        resp.status_code = 429
        resp.headers["Retry-After"] = str(retry_after)
        return resp, 429


# Global singleton instance
rate_limiter = RateLimiter()
