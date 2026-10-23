"""
Transactional SQLite-Backed Rate Limiter & Abuse Defense (Enterprise Hardening)
"""

import datetime
import secrets
import sqlite3
import threading
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Any
from flask import jsonify, Response

from app.db.database import retry_on_locked

try:
    import zoneinfo
    PT_TZ = zoneinfo.ZoneInfo("America/Los_Angeles")
except Exception:
    PT_TZ = datetime.timezone(datetime.timedelta(hours=-8))


def get_pt_day_boundaries(now: Optional[float] = None) -> Tuple[float, int]:
    """
    Compute current provider day start (timestamp) and seconds until reset (midnight PT).
    """
    t = time.time() if now is None else now
    dt = datetime.datetime.fromtimestamp(t, tz=PT_TZ)
    start_of_day = dt.replace(hour=0, minute=0, second=0, microsecond=0)
    tomorrow = start_of_day + datetime.timedelta(days=1)
    seconds_until_midnight = max(1, int((tomorrow - dt).total_seconds()))
    return start_of_day.timestamp(), seconds_until_midnight


@dataclass
class RateLimitResult:
    allowed: bool
    notice: Optional[str] = None
    retry_after: int = 0
    limit_type: Optional[str] = None


class RateLimiter:
    """
    Two-layer transactional SQLite-backed quota limiter:
    1. Visitor action quota: 10 frontend AI actions/day per visitor identity.
       (Tracked per browser session as a best-effort identity; true per-person limits require individual accounts).
       Client IP acts as a higher abuse ceiling (default 50/day) to catch session-rotation abuse.
    2. Global Gemini-call quota: 200 actual provider calls/day host-wide.
       Supports atomic fan-out reservations before workflow execution and deliberate release of unused units.

    State is stored authoritatively in SQLite (at settings.DB_PATH) using BEGIN IMMEDIATE transactions
    to serialize concurrent access across multiple WSGI worker processes on the same host.
    """

    def __init__(
        self,
        host_daily_limit: Optional[int] = None,
        visitor_daily_limit: Optional[int] = None,
        ip_daily_limit: Optional[int] = None,
        ip_burst_limit: int = 3,
        day_window_seconds: int = 86400,
        burst_window_seconds: int = 60,
        max_buckets: Optional[int] = 10000,
        db_path: Optional[Path] = None,
    ):
        self._host_daily_limit = host_daily_limit
        self._visitor_daily_limit = visitor_daily_limit
        self._ip_daily_limit = ip_daily_limit
        self.ip_burst_limit = ip_burst_limit
        self.day_window_seconds = day_window_seconds
        self.burst_window_seconds = burst_window_seconds
        self.max_buckets = max_buckets
        self._db_path = db_path
        self._lock = threading.Lock()

    @property
    def db_path(self) -> Path:
        if self._db_path is not None:
            return self._db_path
        from app.core.config import settings
        return settings.DB_PATH

    def _get_conn(self, timeout: float = 10.0) -> sqlite3.Connection:
        from app.db.database import init_db
        init_db()
        conn = sqlite3.connect(str(self.db_path), timeout=timeout, isolation_level=None)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA journal_mode = WAL;")
        conn.execute("PRAGMA busy_timeout = 5000;")
        conn.execute("PRAGMA synchronous = NORMAL;")
        return conn

    @property
    def host_daily_limit(self) -> int:
        if self._host_daily_limit is not None:
            return self._host_daily_limit
        try:
            from app.core.config import settings
            return getattr(settings, "GEMINI_DAILY_LIMIT", 200)
        except Exception:
            return 200

    @host_daily_limit.setter
    def host_daily_limit(self, val: int):
        self._host_daily_limit = val

    @property
    def visitor_daily_limit(self) -> int:
        if self._visitor_daily_limit is not None:
            return self._visitor_daily_limit
        try:
            from app.core.config import settings
            return getattr(settings, "VISITOR_DAILY_LIMIT", 10)
        except Exception:
            return 10

    @visitor_daily_limit.setter
    def visitor_daily_limit(self, val: int):
        self._visitor_daily_limit = val

    @property
    def ip_daily_limit(self) -> int:
        if self._ip_daily_limit is not None:
            return self._ip_daily_limit
        try:
            from app.core.config import settings
            return getattr(settings, "IP_DAILY_LIMIT", 50)
        except Exception:
            return 50

    @ip_daily_limit.setter
    def ip_daily_limit(self, val: int):
        self._ip_daily_limit = val

    @retry_on_locked()
    def reset(self) -> None:
        """Reset all rate limit tracking tables in SQLite (useful for hermetic tests)."""
        with self._lock:
            conn = self._get_conn()
            try:
                conn.execute("BEGIN IMMEDIATE")
                conn.execute("DELETE FROM quota_visitor_actions")
                conn.execute("DELETE FROM quota_ip_actions")
                conn.execute("DELETE FROM quota_global_gemini_calls")
                conn.execute("DELETE FROM quota_reservations")
                conn.execute("DELETE FROM quota_host_requests")
                conn.execute("COMMIT")
            except Exception:
                conn.execute("ROLLBACK")
                raise
            finally:
                conn.close()

    # --- Layer 1: Visitor Action Quota (10 actions / day) ---

    @retry_on_locked()
    def acquire_visitor_action(
        self, identity: str, client_ip: Optional[str] = None, now: Optional[float] = None
    ) -> RateLimitResult:
        """
        Check and consume 1 visitor action credit in an atomic SQLite transaction.
        Exhaustion returns allowed=False with retry_after pointing to PT midnight reset.
        Enforces best-effort per-session visitor identity (10/day) and an IP abuse ceiling
        (settings.IP_DAILY_LIMIT, default 50/day) to prevent session-rotation evasion.
        """
        t = time.time() if now is None else now
        key = identity.strip() if identity else "anonymous"
        ip_key = client_ip.strip() if client_ip else None
        day_start_ts, retry_after = get_pt_day_boundaries(t)

        with self._lock:
            conn = self._get_conn()
            try:
                conn.execute("BEGIN IMMEDIATE")

                # 1. Prune outdated actions from previous quota days
                conn.execute("DELETE FROM quota_visitor_actions WHERE quota_day < ?", (day_start_ts,))
                conn.execute("DELETE FROM quota_ip_actions WHERE quota_day < ?", (day_start_ts,))

                # 2. Check visitor identity limit
                cur = conn.execute(
                    "SELECT COUNT(*) AS c FROM quota_visitor_actions WHERE identity = ? AND quota_day = ?",
                    (key, day_start_ts),
                )
                v_count = cur.fetchone()["c"]
                if v_count >= self.visitor_daily_limit:
                    conn.execute("COMMIT")
                    return RateLimitResult(
                        allowed=False,
                        notice="Quota reached",
                        retry_after=retry_after,
                        limit_type="visitor_action",
                    )

                # 3. Check IP abuse ceiling (catches session-rotation evasion)
                if ip_key:
                    cur = conn.execute(
                        "SELECT COUNT(*) AS c FROM quota_ip_actions WHERE ip = ? AND quota_day = ?",
                        (ip_key, day_start_ts),
                    )
                    ip_count = cur.fetchone()["c"]
                    if ip_count >= self.ip_daily_limit:
                        conn.execute("COMMIT")
                        return RateLimitResult(
                            allowed=False,
                            notice="Quota reached",
                            retry_after=retry_after,
                            limit_type="ip_daily",
                        )

                # 4. Enforce cardinality bounding if configured
                if self.max_buckets is not None:
                    cur = conn.execute(
                        "SELECT DISTINCT identity, MIN(created_at) AS first_seen FROM quota_visitor_actions WHERE quota_day = ? GROUP BY identity ORDER BY first_seen ASC",
                        (day_start_ts,),
                    )
                    identities = [r["identity"] for r in cur.fetchall()]
                    if key not in identities and len(identities) >= self.max_buckets:
                        excess = len(identities) - self.max_buckets + 1
                        for evict_id in identities[:excess]:
                            conn.execute(
                                "DELETE FROM quota_visitor_actions WHERE identity = ? AND quota_day = ?",
                                (evict_id, day_start_ts),
                            )

                # 5. Insert visitor action token
                conn.execute(
                    "INSERT INTO quota_visitor_actions (identity, quota_day, created_at) VALUES (?, ?, ?)",
                    (key, day_start_ts, t),
                )
                if ip_key:
                    conn.execute(
                        "INSERT INTO quota_ip_actions (ip, quota_day, created_at, request_id) VALUES (?, ?, ?, NULL)",
                        (ip_key, day_start_ts, t),
                    )

                conn.execute("COMMIT")
                return RateLimitResult(allowed=True, notice=None, retry_after=0, limit_type=None)
            except Exception:
                conn.execute("ROLLBACK")
                raise
            finally:
                conn.close()

    # --- Layer 2: Global Gemini Quota (200 provider calls / day) & Atomic Reservations ---

    @retry_on_locked()
    def has_global_gemini_capacity(
        self, required_units: int = 1, now: Optional[float] = None
    ) -> Tuple[bool, int]:
        """
        Inspect whether the global Gemini quota has capacity for required_units calls,
        taking into account committed calls and active in-flight reservations across all workers.
        Returns (has_capacity, retry_after).
        """
        t = time.time() if now is None else now
        day_start_ts, retry_after = get_pt_day_boundaries(t)

        with self._lock:
            conn = self._get_conn()
            try:
                conn.execute("BEGIN IMMEDIATE")
                # Prune expired reservations
                conn.execute("DELETE FROM quota_reservations WHERE expires_at <= ?", (t,))

                # Count committed calls today
                cur = conn.execute(
                    "SELECT COUNT(*) AS c FROM quota_global_gemini_calls WHERE quota_day = ?",
                    (day_start_ts,),
                )
                committed = cur.fetchone()["c"]

                # Count active reserved units
                cur = conn.execute(
                    "SELECT COALESCE(SUM(units_reserved - units_consumed), 0) AS res FROM quota_reservations WHERE quota_day = ? AND expires_at > ?",
                    (day_start_ts, t),
                )
                reserved = cur.fetchone()["res"]

                in_use = committed + reserved
                conn.execute("COMMIT")

                if in_use + required_units > self.host_daily_limit:
                    return False, retry_after
                return True, 0
            except Exception:
                conn.execute("ROLLBACK")
                raise
            finally:
                conn.close()

    @retry_on_locked()
    def reserve_capacity(
        self, units: int = 1, ttl_seconds: int = 120, now: Optional[float] = None
    ) -> Tuple[bool, Optional[str], int]:
        """
        Atomically reserve 'units' global Gemini-call credits before starting a workflow.
        Serializes competing workers using SQLite BEGIN IMMEDIATE.
        Returns (allowed, reservation_id, retry_after).
        """
        t = time.time() if now is None else now
        day_start_ts, retry_after = get_pt_day_boundaries(t)

        with self._lock:
            conn = self._get_conn()
            try:
                conn.execute("BEGIN IMMEDIATE")
                conn.execute("DELETE FROM quota_reservations WHERE expires_at <= ?", (t,))

                cur = conn.execute(
                    "SELECT COUNT(*) AS c FROM quota_global_gemini_calls WHERE quota_day = ?",
                    (day_start_ts,),
                )
                committed = cur.fetchone()["c"]

                cur = conn.execute(
                    "SELECT COALESCE(SUM(units_reserved - units_consumed), 0) AS res FROM quota_reservations WHERE quota_day = ? AND expires_at > ?",
                    (day_start_ts, t),
                )
                reserved = cur.fetchone()["res"]

                in_use = committed + reserved
                if in_use + units > self.host_daily_limit:
                    conn.execute("COMMIT")
                    return False, None, retry_after

                res_id = secrets.token_urlsafe(16)
                conn.execute(
                    "INSERT INTO quota_reservations (reservation_id, quota_day, units_reserved, units_consumed, created_at, expires_at) VALUES (?, ?, ?, 0, ?, ?)",
                    (res_id, day_start_ts, units, t, t + ttl_seconds),
                )
                conn.execute("COMMIT")
                return True, res_id, 0
            except Exception:
                conn.execute("ROLLBACK")
                raise
            finally:
                conn.close()

    @retry_on_locked()
    def consume_reservation(
        self, reservation_id: Optional[str], now: Optional[float] = None
    ) -> bool:
        """
        Consume 1 unit against an active reservation immediately before an outbound request.
        Appends to quota_global_gemini_calls in the same transaction.
        """
        if not reservation_id:
            return False
        t = time.time() if now is None else now

        with self._lock:
            conn = self._get_conn()
            try:
                conn.execute("BEGIN IMMEDIATE")
                conn.execute("DELETE FROM quota_reservations WHERE expires_at <= ?", (t,))

                cur = conn.execute(
                    "SELECT quota_day, units_reserved, units_consumed FROM quota_reservations WHERE reservation_id = ? AND expires_at > ?",
                    (reservation_id, t),
                )
                row = cur.fetchone()
                if row and row["units_consumed"] < row["units_reserved"]:
                    new_consumed = row["units_consumed"] + 1
                    conn.execute(
                        "UPDATE quota_reservations SET units_consumed = ? WHERE reservation_id = ?",
                        (new_consumed, reservation_id),
                    )
                    conn.execute(
                        "INSERT INTO quota_global_gemini_calls (quota_day, created_at) VALUES (?, ?)",
                        (row["quota_day"], t),
                    )
                    if new_consumed >= row["units_reserved"]:
                        conn.execute("DELETE FROM quota_reservations WHERE reservation_id = ?", (reservation_id,))
                    conn.execute("COMMIT")
                    return True

                conn.execute("COMMIT")
                return False
            except Exception:
                conn.execute("ROLLBACK")
                raise
            finally:
                conn.close()

    @retry_on_locked()
    def release_reservation(
        self, reservation_id: Optional[str], now: Optional[float] = None
    ) -> int:
        """
        Release unconsumed reserved units back to the global pool on workflow completion or failure.
        Returns the number of released units.
        """
        if not reservation_id:
            return 0
        t = time.time() if now is None else now

        with self._lock:
            conn = self._get_conn()
            try:
                conn.execute("BEGIN IMMEDIATE")
                cur = conn.execute(
                    "SELECT units_reserved, units_consumed FROM quota_reservations WHERE reservation_id = ?",
                    (reservation_id,),
                )
                row = cur.fetchone()
                if row:
                    unused = max(0, row["units_reserved"] - row["units_consumed"])
                    conn.execute("DELETE FROM quota_reservations WHERE reservation_id = ?", (reservation_id,))
                    conn.execute("COMMIT")
                    return unused

                conn.execute("COMMIT")
                return 0
            except Exception:
                conn.execute("ROLLBACK")
                raise
            finally:
                conn.close()

    @retry_on_locked()
    def acquire_global_gemini(
        self, units: int = 1, now: Optional[float] = None
    ) -> RateLimitResult:
        """
        Consume 'units' global Gemini-call credits (each internal call consumes 1).
        Respects active reservations. Does NOT deduplicate across multi-agent workflows.
        """
        t = time.time() if now is None else now
        day_start_ts, retry_after = get_pt_day_boundaries(t)

        with self._lock:
            conn = self._get_conn()
            try:
                conn.execute("BEGIN IMMEDIATE")
                conn.execute("DELETE FROM quota_reservations WHERE expires_at <= ?", (t,))

                cur = conn.execute(
                    "SELECT COUNT(*) AS c FROM quota_global_gemini_calls WHERE quota_day = ?",
                    (day_start_ts,),
                )
                committed = cur.fetchone()["c"]

                cur = conn.execute(
                    "SELECT COALESCE(SUM(units_reserved - units_consumed), 0) AS res FROM quota_reservations WHERE quota_day = ? AND expires_at > ?",
                    (day_start_ts, t),
                )
                reserved = cur.fetchone()["res"]

                if committed + reserved + units > self.host_daily_limit:
                    conn.execute("COMMIT")
                    return RateLimitResult(
                        allowed=False,
                        notice="Quota reached",
                        retry_after=retry_after,
                        limit_type="host_daily",
                    )

                for _ in range(units):
                    conn.execute(
                        "INSERT INTO quota_global_gemini_calls (quota_day, created_at) VALUES (?, ?)",
                        (day_start_ts, t),
                    )

                conn.execute("COMMIT")
                return RateLimitResult(allowed=True, notice=None, retry_after=0, limit_type=None)
            except Exception:
                conn.execute("ROLLBACK")
                raise
            finally:
                conn.close()

    # --- Backward-Compatible Properties reading directly from SQLite ---

    @property
    def _global_gemini_calls(self) -> List[float]:
        day_start_ts, _ = get_pt_day_boundaries()
        conn = self._get_conn()
        try:
            rows = conn.execute(
                "SELECT created_at FROM quota_global_gemini_calls WHERE quota_day = ? ORDER BY created_at ASC",
                (day_start_ts,),
            ).fetchall()
            return [row["created_at"] for row in rows]
        finally:
            conn.close()

    @property
    def _visitor_daily_actions(self) -> Dict[str, List[float]]:
        day_start_ts, _ = get_pt_day_boundaries()
        conn = self._get_conn()
        try:
            rows = conn.execute(
                "SELECT identity, created_at FROM quota_visitor_actions WHERE quota_day = ? ORDER BY created_at ASC",
                (day_start_ts,),
            ).fetchall()
            res: Dict[str, List[float]] = {}
            for row in rows:
                res.setdefault(row["identity"], []).append(row["created_at"])
            return res
        finally:
            conn.close()

    @property
    def _ip_daily_actions(self) -> Dict[str, List[float]]:
        day_start_ts, _ = get_pt_day_boundaries()
        conn = self._get_conn()
        try:
            rows = conn.execute(
                "SELECT ip, created_at FROM quota_ip_actions WHERE quota_day = ? ORDER BY created_at ASC",
                (day_start_ts,),
            ).fetchall()
            res: Dict[str, List[float]] = {}
            for row in rows:
                res.setdefault(row["ip"], []).append(row["created_at"])
            return res
        finally:
            conn.close()

    @property
    def _active_reservations(self) -> Dict[str, Dict[str, Any]]:
        now = time.time()
        conn = self._get_conn()
        try:
            rows = conn.execute(
                "SELECT * FROM quota_reservations WHERE expires_at > ?",
                (now,),
            ).fetchall()
            return {
                row["reservation_id"]: {
                    "units_reserved": row["units_reserved"],
                    "units_consumed": row["units_consumed"],
                    "created_at": row["created_at"],
                    "expires_at": row["expires_at"],
                }
                for row in rows
            }
        finally:
            conn.close()

    # --- Legacy IP and Host limiter support (maintains backward compatibility with unit tests) ---

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

    @retry_on_locked()
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
        day_start_ts, _ = get_pt_day_boundaries(t)

        with self._lock:
            conn = self._get_conn()
            try:
                conn.execute("BEGIN IMMEDIATE")

                burst_cutoff = t - self.burst_window_seconds
                daily_cutoff = t - self.day_window_seconds
                host_cutoff = t - self.day_window_seconds

                # Prune entries older than day_window_seconds
                conn.execute("DELETE FROM quota_ip_actions WHERE created_at <= ?", (daily_cutoff,))
                conn.execute("DELETE FROM quota_host_requests WHERE created_at <= ?", (host_cutoff,))

                # Check if this request_id was already admitted for this IP (burst defense for multi-agent subcalls)
                already_admitted = False
                if request_id is not None:
                    cur = conn.execute(
                        "SELECT COUNT(*) AS c FROM quota_ip_actions WHERE ip = ? AND created_at > ? AND request_id = ?",
                        (ip_key, burst_cutoff, request_id),
                    )
                    already_admitted = cur.fetchone()["c"] > 0

                if not already_admitted:
                    # 1. Check IP burst window
                    cur = conn.execute(
                        "SELECT created_at FROM quota_ip_actions WHERE ip = ? AND created_at > ? ORDER BY created_at ASC",
                        (ip_key, burst_cutoff),
                    )
                    burst_rows = cur.fetchall()
                    if len(burst_rows) >= self.ip_burst_limit:
                        earliest = burst_rows[0]["created_at"]
                        retry_after = max(1, int(self.burst_window_seconds - (t - earliest)))
                        conn.execute("COMMIT")
                        return RateLimitResult(
                            allowed=False,
                            notice="Quota reached",
                            retry_after=retry_after,
                            limit_type="ip_burst",
                        )

                    # 2. Check IP daily window
                    cur = conn.execute(
                        "SELECT created_at FROM quota_ip_actions WHERE ip = ? AND created_at > ? ORDER BY created_at ASC",
                        (ip_key, daily_cutoff),
                    )
                    daily_rows = cur.fetchall()
                    if len(daily_rows) >= self.ip_daily_limit:
                        earliest = daily_rows[0]["created_at"]
                        retry_after = max(1, int(self.day_window_seconds - (t - earliest)))
                        conn.execute("COMMIT")
                        return RateLimitResult(
                            allowed=False,
                            notice="Quota reached",
                            retry_after=retry_after,
                            limit_type="ip_daily",
                        )

                # 3. Check Host-wide daily ceiling on shared key (bypassed if BYOK)
                if not is_byok:
                    cur = conn.execute(
                        "SELECT created_at FROM quota_host_requests WHERE created_at > ? ORDER BY created_at ASC",
                        (host_cutoff,),
                    )
                    host_rows = cur.fetchall()
                    if len(host_rows) >= self.host_daily_limit:
                        earliest = host_rows[0]["created_at"]
                        retry_after = max(1, int(self.day_window_seconds - (t - earliest)))
                        conn.execute("COMMIT")
                        return RateLimitResult(
                            allowed=False,
                            notice="Quota reached",
                            retry_after=retry_after,
                            limit_type="host_daily",
                        )

                # If consume is requested, record to SQLite
                if consume:
                    if not already_admitted:
                        conn.execute(
                            "INSERT INTO quota_ip_actions (ip, quota_day, created_at, request_id) VALUES (?, ?, ?, ?)",
                            (ip_key, day_start_ts, t, request_id),
                        )
                    if not is_byok:
                        conn.execute(
                            "INSERT INTO quota_host_requests (created_at) VALUES (?)",
                            (t,),
                        )

                conn.execute("COMMIT")
                return RateLimitResult(allowed=True, notice=None, retry_after=0, limit_type=None)
            except Exception:
                conn.execute("ROLLBACK")
                raise
            finally:
                conn.close()

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
