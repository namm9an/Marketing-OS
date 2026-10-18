"""
Unified LLM Provider Service Factory (Dynamic Model Routing & BYOK)
"""

import json
import logging
import re
import urllib.request
from typing import Dict, Any, Optional

from app.core.config import settings
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
        r"""(?i)(["']?(?:api[_-]?key|secret|token|password)["']?\s*[:=]\s*["'])([^"'\s]{8,})(["'])""",
        r"\g<1>REDACTED\g<3>",
        sanitized,
    )
    return sanitized


class LLMService:
    @staticmethod
    def generate(
        system_prompt: str,
        user_prompt: str,
        provider: str = "gemini-3.8-flash",
        api_key: Optional[str] = None,
        client_ip: Optional[str] = None,
        request_id: Optional[str] = None,
        temperature: float = 0.3,
        max_tokens: int = 1024,
    ) -> Dict[str, Any]:
        """
        Gemini REST generation endpoint with:
        1. Dynamic model dispatch (defaulting to gemini-3.8-flash).
        2. Client Bring-Your-Own-Key (BYOK) via X-API-Key header.
        3. Rate limiter check (host-wide 200 ceiling bypassed if BYOK).
        4. Zero-crash graceful fallback with notice: "Quota reached".
        5. Zero credential logging (all keys redacted from logs/traces).
        """
        model_name = (provider or "gemini-3.8-flash").strip()
        if not model_name:
            model_name = "gemini-3.8-flash"

        # 1. Resolve effective key & BYOK status
        if api_key and isinstance(api_key, str) and api_key.strip():
            effective_key = api_key.strip()
            is_byok = True
        else:
            effective_key = settings.GEMINI_API_KEY.strip() if settings.GEMINI_API_KEY else ""
            is_byok = False

        # 2. Check Sliding-Window Rate Limiter
        ip_addr = client_ip or "127.0.0.1"
        lim_result = rate_limiter.acquire(ip_addr, is_byok=is_byok, request_id=request_id)
        if not lim_result.allowed:
            log.warning(
                f"[Rate Limiter] {lim_result.limit_type} ceiling reached for IP {ip_addr}. "
                "Degrading gracefully to deterministic mock."
            )
            return {
                "text": LLMService._fallback_mock_response(user_prompt, notice="Quota reached"),
                "model_used": "mock-fallback",
                "tokens": 150,
                "notice": "Quota reached",
                "retry_after": lim_result.retry_after,
            }

        # 3. Fall back to mock if no API key is available
        if not effective_key:
            return {
                "text": LLMService._fallback_mock_response(user_prompt),
                "model_used": "mock-fallback",
                "tokens": 150,
            }

        # 4. Target the requested dynamic model in the URL
        url = (
            f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:"
            f"generateContent?key={effective_key}"
        )
        payload = {
            "contents": [
                {
                    "role": "user",
                    "parts": [{"text": f"System: {system_prompt}\n\nUser Goal: {user_prompt}"}],
                }
            ],
            "generationConfig": {"temperature": temperature, "maxOutputTokens": max_tokens},
        }

        try:
            req = urllib.request.Request(
                url,
                data=json.dumps(payload).encode("utf-8"),
                headers={"Content-Type": "application/json"},
            )
            with urllib.request.urlopen(req, timeout=30) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                text = data["candidates"][0]["content"]["parts"][0]["text"]
                return {"text": text, "model_used": model_name, "tokens": 250}
        except Exception as e:
            # Zero-credential logging: Never leak client or host API keys into logs or audit tables
            safe_err = redact_credentials(str(e), effective_key)
            is_quota_err = "429" in safe_err or "quota" in safe_err.lower() or "exhausted" in safe_err.lower()
            notice_val = "Quota reached" if is_quota_err else None
            return {
                "text": LLMService._fallback_mock_response(user_prompt, notice=notice_val),
                "model_used": f"{model_name}-fallback",
                "tokens": 150,
                "notice": notice_val,
            }

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
        }
        if notice:
            data["notice"] = notice
        return json.dumps(data, indent=2)
