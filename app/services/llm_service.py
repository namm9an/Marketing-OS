"""
Unified LLM Provider Service Factory (Gemini Header Auth & Server Model Enforcement)
"""

import json
import logging
import re
import time
import urllib.request
import urllib.error
from typing import Dict, Any, Optional

from app.core.config import settings
from app.core.exceptions import (
    GlobalQuotaExhaustedError,
    UpstreamRateLimitError,
    UpstreamProviderError,
)
from app.core.rate_limiter import rate_limiter

log = logging.getLogger(__name__)


def current_quota_reservation() -> Optional[str]:
    """Capture this before LangGraph dispatches work to threads without Flask context."""
    from flask import g, has_request_context
    return getattr(g, "quota_reservation_id", None) if has_request_context() else None


def redact_credentials(text: str, key: Optional[str] = None) -> str:
    """Sanitize any API keys or secrets from exception messages, logs, and database records."""
    if not text:
        return ""
    sanitized = text
    if key and key.strip():
        sanitized = sanitized.replace(key.strip(), "REDACTED")
    # Redact URL query parameter patterns like ?key=... or &key=...
    sanitized = re.sub(r"([?&]key=)[^&\s\"']+", r"\g<1>REDACTED", sanitized)
    sanitized = re.sub(r"(AIzaSy[A-Za-z0-9_-]{10,})", "REDACTED", sanitized)
    sanitized = re.sub(r"(sk-[A-Za-z0-9_-]{10,})", "REDACTED", sanitized)
    sanitized = re.sub(
        r"""(?i)(["']?(?:api[_-]?key|secret|token|password|x-goog-api-key)["']?\s*[:=]\s*["'])([^"'\s]{8,})(["'])""",
        r"\g<1>REDACTED\g<3>",
        sanitized,
    )
    return sanitized


class LLMService:
    @staticmethod
    def generate(
        system_prompt: str,
        user_prompt: str,
        provider: Optional[str] = None,
        api_key: Optional[str] = None,
        client_ip: Optional[str] = None,
        request_id: Optional[str] = None,
        reservation_id: Optional[str] = None,
        temperature: float = 0.3,
        max_tokens: int = 1024,
    ) -> Dict[str, Any]:
        """
        Gemini REST generation endpoint with:
        1. Server-owned model enforcement (defaulting to configured DEFAULT_MODEL gemini-3.8-flash).
        2. REST call authentication via x-goog-api-key header (no key in URL).
        3. Deterministic local mock fallback ONLY when no server key is configured (local mocks never debit quota).
        4. Atomic capacity consumption (from reservation or immediate debit) immediately before real HTTP call.
        5. Typed provider error handling (UpstreamRateLimitError -> 429, UpstreamProviderError -> 502/503).
        6. Zero credential logging (all keys redacted from logs/traces).
        7. Measured latency_ms and token usage extracted from upstream usageMetadata.
        """
        t_wall_start = time.perf_counter()

        # 1. Enforce server-owned configured model (unapproved client input cannot affect model)
        approved_model = settings.DEFAULT_MODEL or "gemini-3.8-flash"
        requested_model = approved_model
        model_name = approved_model

        # 2. Key resolution: explicit api_key parameter (for unit testing) or server-owned settings.GEMINI_API_KEY
        if api_key and isinstance(api_key, str) and api_key.strip():
            effective_key = api_key.strip()
        else:
            effective_key = settings.GEMINI_API_KEY.strip() if settings.GEMINI_API_KEY else ""

        # Local development is explicit, with no fabricated provider usage.
        if not effective_key:
            return {
                "text": LLMService._fallback_mock_response(user_prompt),
                "model_used": "mock-fallback", "model": "mock-fallback",
                "requested_model": requested_model, "fallback_used": False,
                "served_model_verified": False, "source": "mock",
                "tokens": None, "total_tokens": None, "prompt_tokens": None,
                "completion_tokens": None, "thoughts_tokens": None,
                "latency_ms": None, "finish_reason": None,
                "total_wall_ms": round((time.perf_counter() - t_wall_start) * 1000, 2),
                "attempts": 0,
            }

        active_res_id = reservation_id or current_quota_reservation()

        payload = {
            "contents": [{"role": "user", "parts": [
                {"text": f"System: {system_prompt}\n\nUser Goal: {user_prompt}"},
            ]}],
            "generationConfig": {
                "temperature": temperature, "maxOutputTokens": max(max_tokens, 2500),
                "thinkingConfig": {"thinkingBudget": 0},
            },
        }
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent"
        for attempt in range(3):
            # Every outbound attempt, including retries, consumes one unit atomically.
            if not (active_res_id and rate_limiter.consume_reservation(active_res_id)):
                capacity = rate_limiter.acquire_global_gemini(units=1)
                if not capacity.allowed:
                    raise GlobalQuotaExhaustedError(
                        f"Global daily Gemini API quota reached ({rate_limiter.host_daily_limit} requests/day). Retry after {capacity.retry_after}s.",
                        retry_after=capacity.retry_after,
                    )
            t_req_start = time.perf_counter()
            try:
                req = urllib.request.Request(
                    url, data=json.dumps(payload).encode("utf-8"),
                    headers={"Content-Type": "application/json", "x-goog-api-key": effective_key},
                )
                with urllib.request.urlopen(req, timeout=30) as resp:
                    data = json.loads(resp.read().decode("utf-8"))
                candidate = data["candidates"][0]
                finish_reason = candidate.get("finishReason")
                if finish_reason != "STOP":
                    raise UpstreamProviderError("Provider returned an incomplete or blocked response")
                text = "".join(
                    part.get("text", "") for part in candidate.get("content", {}).get("parts", [])
                    if not part.get("thought", False)
                ).strip()
                if not text:
                    raise UpstreamProviderError("Provider returned no public answer")
                usage = data.get("usageMetadata") or {}
                def count(field):
                    value = usage.get(field)
                    return value if isinstance(value, int) and not isinstance(value, bool) and value >= 0 else None
                model_reported = data.get("modelVersion") or data.get("model")
                return {
                    "text": text, "model_used": model_reported or "unknown",
                    "model": model_reported or "unknown", "requested_model": requested_model,
                    "served_model_verified": bool(model_reported), "fallback_used": False,
                    "tokens": count("totalTokenCount"), "total_tokens": count("totalTokenCount"),
                    "prompt_tokens": count("promptTokenCount"),
                    "completion_tokens": count("candidatesTokenCount"),
                    "thoughts_tokens": count("thoughtsTokenCount"),
                    "latency_ms": round((time.perf_counter() - t_req_start) * 1000, 2),
                    "total_wall_ms": round((time.perf_counter() - t_wall_start) * 1000, 2),
                    "attempts": attempt + 1, "source": "live", "finish_reason": finish_reason,
                }
            except urllib.error.HTTPError as err:
                # Never echo a provider body, which may contain prompts or credentials.
                if err.code == 429:
                    retry_after = LLMService._retry_after(err)
                    raise UpstreamRateLimitError(
                        f"Upstream Gemini API rate limit exceeded (429). Retry after {retry_after}s.",
                        retry_after=retry_after,
                    ) from None
                if err.code != 503 or attempt == 2:
                    raise UpstreamProviderError(
                        f"Upstream Gemini API error ({err.code})",
                        status_code=503 if err.code == 503 else 502,
                    ) from None
            except (urllib.error.URLError, TimeoutError):
                if attempt == 2:
                    raise UpstreamProviderError("Upstream Gemini API connection failure", status_code=503) from None
            except UpstreamProviderError:
                raise
            except (ValueError, KeyError, IndexError, TypeError, AttributeError):
                raise UpstreamProviderError("Provider returned an invalid response") from None
            time.sleep(2 ** (attempt + 1))
        raise UpstreamProviderError("Upstream Gemini API unavailable", status_code=503)

    @staticmethod
    def _retry_after(error) -> int:
        """Honor Retry-After seconds/date or Google's RetryInfo; never retry 429 here."""
        import math
        from datetime import datetime, timezone
        from email.utils import parsedate_to_datetime

        header = error.headers.get("Retry-After") if error.headers else None
        if header:
            try:
                return max(1, math.ceil(float(header)))
            except (ValueError, OverflowError):
                try:
                    return max(1, math.ceil((parsedate_to_datetime(header) - datetime.now(timezone.utc)).total_seconds()))
                except (ValueError, TypeError, OverflowError):
                    pass
        try:
            data = json.loads(error.read())
            for detail in data.get("error", {}).get("details", []):
                if detail.get("@type", "").endswith("RetryInfo"):
                    return max(1, math.ceil(float(detail["retryDelay"].removesuffix("s"))))
        except (ValueError, KeyError, TypeError, AttributeError, OverflowError):
            pass
        return 60

    @staticmethod
    def _fallback_mock_response(prompt: str, notice: Optional[str] = None) -> str:
        industry = (settings.TARGET_INDUSTRY or "Enterprise AI & GPU Cloud").strip()
        strategy_title = industry if industry.lower().startswith("enterprise") else f"Enterprise {industry}"
        infra_industry = (
            industry[len("enterprise"):].strip()
            if industry.lower().startswith("enterprise")
            else industry
        ).lower()
        data = {
            "selected_option": f"{strategy_title} Strategy",
            "statement": f"{settings.TARGET_ORGANIZATION} delivers enterprise {infra_industry} infrastructure with sub-50ms latency.",
            "rationale": f"Positioning around certified compliance, B200 availability, and high-performance SLA for {settings.TARGET_ORGANIZATION}.",
            "risks": "Hyperscaler pricing pressure on standard compute instances.",
            "confidence": "High",
            "evidence_ids": [],
        }
        if notice:
            data["notice"] = notice
        return json.dumps(data, indent=2)
