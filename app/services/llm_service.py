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

        # 3. Fall back to deterministic mock if no server API key is configured (local dev)
        # Note: Local mocks are NEVER charged against the global Gemini call budget
        if not effective_key:
            mock_text = LLMService._fallback_mock_response(user_prompt)
            latency_ms = round((time.perf_counter() - t_wall_start) * 1000, 2)
            return {
                "text": mock_text,
                "model_used": "mock-fallback",
                "model": "mock-fallback",
                "requested_model": requested_model,
                "fallback_used": False,
                "source": "mock",
                "tokens": 150,
                "prompt_tokens": 100,
                "completion_tokens": 50,
                "thoughts_tokens": 0,
                "latency_ms": latency_ms,
                "total_wall_ms": latency_ms,
                "attempts": 1,
            }

        # 4. For real outbound requests: consume from workflow reservation or debit 1 global unit
        consumed_reserved = False
        active_res_id = reservation_id
        if not active_res_id:
            try:
                from flask import g, has_request_context
                if has_request_context() and hasattr(g, "quota_reservation_id"):
                    active_res_id = g.quota_reservation_id
            except Exception:
                pass

        if active_res_id:
            consumed_reserved = rate_limiter.consume_reservation(active_res_id)

        if not consumed_reserved:
            global_res = rate_limiter.acquire_global_gemini(units=1)
            if not global_res.allowed:
                log.warning(
                    f"[Rate Limiter] Global Gemini API daily ceiling reached. Retry after {global_res.retry_after}s."
                )
                raise GlobalQuotaExhaustedError(
                    f"Global daily Gemini API quota reached ({rate_limiter.host_daily_limit} requests/day). Retry after {global_res.retry_after}s.",
                    retry_after=global_res.retry_after,
                )

        # 5. Outgoing REST call: Key in x-goog-api-key header, NEVER in URL
        max_output = max(max_tokens, 2500)
        payload = {
            "contents": [
                {
                    "role": "user",
                    "parts": [{"text": f"System: {system_prompt}\n\nUser Goal: {user_prompt}"}],
                }
            ],
            "generationConfig": {
                "temperature": temperature,
                "maxOutputTokens": max_output,
                "thinkingConfig": {"thinkingBudget": 0},
            },
        }

        models_to_try = [model_name]
        if model_name != "gemini-3.5-flash":
            models_to_try.append("gemini-3.5-flash")

        attempts = 0
        last_err = None
        for current_model in models_to_try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{current_model}:generateContent"
            for attempt in range(2):
                attempts += 1
                t_req_start = time.perf_counter()
                try:
                    req = urllib.request.Request(
                        url,
                        data=json.dumps(payload).encode("utf-8"),
                        headers={
                            "Content-Type": "application/json",
                            "x-goog-api-key": effective_key,
                        },
                    )
                    with urllib.request.urlopen(req, timeout=30) as resp:
                        data = json.loads(resp.read().decode("utf-8"))
                        text = data["candidates"][0]["content"]["parts"][0]["text"]
                        # latency_ms = duration of final successful HTTP request only
                        latency_ms = round((time.perf_counter() - t_req_start) * 1000, 2)
                        total_wall_ms = round((time.perf_counter() - t_wall_start) * 1000, 2)

                        usage = data.get("usageMetadata", {})
                        prompt_tokens = int(usage.get("promptTokenCount", 0))
                        completion_tokens = int(usage.get("candidatesTokenCount", 0))
                        thoughts_tokens = int(usage.get("thoughtsTokenCount", 0))
                        total_tokens = int(usage.get("totalTokenCount", prompt_tokens + completion_tokens + thoughts_tokens))

                        # Model reported by API response (fallback to current_model if omitted)
                        model_reported = data.get("modelVersion") or data.get("model") or current_model
                        fallback_used = bool(model_reported != requested_model)

                        return {
                            "text": text,
                            "model_used": model_reported,
                            "model": model_reported,
                            "requested_model": requested_model,
                            "fallback_used": fallback_used,
                            "tokens": total_tokens,
                            "prompt_tokens": prompt_tokens,
                            "completion_tokens": completion_tokens,
                            "thoughts_tokens": thoughts_tokens,
                            "latency_ms": latency_ms,
                            "total_wall_ms": total_wall_ms,
                            "attempts": attempts,
                            "source": "live",
                        }
                except urllib.error.HTTPError as e:
                    safe_err = redact_credentials(str(e), effective_key)
                    log.error(f"[Gemini HTTPError {e.code}] {safe_err}")
                    if e.code == 503:
                        if attempt == 0:
                            time.sleep(1.0)
                            continue
                        if current_model != models_to_try[-1]:
                            log.warning(f"Model {current_model} returned 503 high demand; falling back to {models_to_try[-1]}")
                            break
                    if e.code == 429:
                        if current_model != models_to_try[-1]:
                            log.warning(f"Model {current_model} returned 429 quota exhausted; falling back to {models_to_try[-1]}")
                            break
                        retry_after = 60
                        try:
                            retry_header = e.headers.get("Retry-After")
                            if retry_header:
                                retry_after = int(retry_header)
                        except Exception:
                            pass
                        raise UpstreamRateLimitError(
                            f"Upstream Gemini API rate limit exceeded (429). Retry after {retry_after}s.",
                            retry_after=retry_after,
                        ) from None
                    last_err = e
                    if current_model == models_to_try[-1]:
                        raise UpstreamProviderError(
                            f"Upstream Gemini API error ({e.code})",
                            status_code=502 if e.code >= 500 else 500,
                        ) from None
                except urllib.error.URLError as e:
                    safe_err = redact_credentials(str(e), effective_key)
                    log.error(f"[Gemini URLError] {safe_err}")
                    if attempt == 0:
                        time.sleep(1.0)
                        continue
                    if current_model != models_to_try[-1]:
                        log.warning(f"Model {current_model} network error; falling back to {models_to_try[-1]}")
                        break
                    last_err = e
                    if current_model == models_to_try[-1]:
                        raise UpstreamProviderError(
                            "Upstream Gemini API connection failure",
                            status_code=503,
                        ) from None
                except Exception as e:
                    safe_err = redact_credentials(str(e), effective_key)
                    log.error(f"[Gemini Provider Error] {safe_err}")
                    if current_model != models_to_try[-1]:
                        log.warning(f"Model {current_model} error {safe_err}; falling back to {models_to_try[-1]}")
                        break
                    last_err = e
                    if current_model == models_to_try[-1]:
                        raise UpstreamProviderError(f"Gemini API error: {safe_err}", status_code=502) from None

        if last_err:
            raise UpstreamProviderError(f"Gemini API error: {last_err}", status_code=502) from None

        if last_err:
            raise UpstreamProviderError(f"Gemini API error: {last_err}", status_code=502) from None

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
