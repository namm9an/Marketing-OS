"""
Unit Tests for Dynamic Model Selection, BYOK Routing, and Credential Sanitization
"""

import json
from unittest.mock import patch, MagicMock
import pytest

from app.core.config import settings
from app.core.rate_limiter import rate_limiter
from app.services.llm_service import LLMService, redact_credentials
from app.main import app


def test_redact_credentials():
    test_key = "server-test-key"
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key={test_key}"
    err_message = f"HTTP Error 400: Bad Request to {url} with secret {test_key}"

    sanitized = redact_credentials(err_message, test_key)
    assert test_key not in sanitized
    assert "key=REDACTED" in sanitized
    assert "secret REDACTED" in sanitized


def test_server_model_enforcement_and_no_key_in_url():
    captured_requests = []
    captured_headers = []

    def mock_urlopen(req, timeout=30):
        captured_requests.append(req.full_url)
        captured_headers.append(dict(req.headers))
        mock_resp = MagicMock()
        mock_resp.__enter__.return_value = mock_resp
        mock_resp.read.return_value = json.dumps({
            "candidates": [{"content": {"parts": [{"text": '{"selected_option": "Test", "statement": "OK", "rationale": "OK", "risks": "None", "confidence": "High"}'}]}}]
        }).encode("utf-8")
        return mock_resp

    test_key = "server-test-key"
    with patch("urllib.request.urlopen", side_effect=mock_urlopen):
        # 1. Default model gemini-3.8-flash, key authenticated in headers, NOT in URL
        res = LLMService.generate(
            system_prompt="system",
            user_prompt="goal",
            api_key=test_key,
        )
        assert "gemini-3.8-flash:generateContent" in captured_requests[0]
        assert "key=" not in captured_requests[0]
        assert test_key not in captured_requests[0]
        assert captured_headers[0].get("X-goog-api-key") == test_key
        assert res["model_used"] == "gemini-3.8-flash"

        # 2. Unapproved model routing cannot affect outgoing model name
        res2 = LLMService.generate(
            system_prompt="system",
            user_prompt="goal",
            provider="gemini-2.5-pro",
            api_key=test_key,
        )
        # Server enforces gemini-3.8-flash; arbitrary unapproved model is ignored
        assert "gemini-3.8-flash:generateContent" in captured_requests[1]
        assert "gemini-2.5-pro" not in captured_requests[1]
        assert "key=" not in captured_requests[1]
        assert res2["model_used"] == "gemini-3.8-flash"


def test_captured_headers_contain_key_without_logging_it():
    captured_headers = []
    captured_urls = []

    def mock_urlopen(req, timeout=30):
        captured_urls.append(req.full_url)
        captured_headers.append(dict(req.headers))
        mock_resp = MagicMock()
        mock_resp.__enter__.return_value = mock_resp
        mock_resp.read.return_value = json.dumps({
            "candidates": [{"content": {"parts": [{"text": '{"selected_option": "Test", "statement": "OK", "rationale": "OK", "risks": "None", "confidence": "High"}'}]}}]
        }).encode("utf-8")
        return mock_resp

    test_key = "server-test-key"
    with patch("urllib.request.urlopen", side_effect=mock_urlopen):
        LLMService.generate(
            system_prompt="system",
            user_prompt="goal",
            api_key=test_key,
        )
        assert captured_headers[0].get("X-goog-api-key") == test_key
        assert "key=" not in captured_urls[0]
        assert test_key not in captured_urls[0]

        # Verify key is redacted when formatted into log strings
        log_sample = f"Request to {captured_urls[0]} with headers {captured_headers[0]}"
        redacted = redact_credentials(log_sample, test_key)
        assert test_key not in redacted
        assert "REDACTED" in redacted


def test_gemini_3_8_flash_remains_configured_default():
    assert settings.DEFAULT_MODEL == "gemini-3.8-flash"


def test_quota_reached_raises_error_no_mock_answer(monkeypatch):
    monkeypatch.setattr(settings, "GEMINI_API_KEY", "test-server-key")
    rate_limiter.reset()
    # Consume global daily quota
    rate_limiter.acquire_global_gemini(units=rate_limiter.host_daily_limit)

    # Next call must raise RuntimeError, NOT return a synthetic mock answer
    with pytest.raises(RuntimeError) as exc_info:
        LLMService.generate(
            system_prompt="system",
            user_prompt="goal",
        )
    assert "Global daily Gemini API quota reached" in str(exc_info.value)


def test_api_byok_header_in_request():
    client = app.test_client()
    client.post(
        "/api/login",
        data=json.dumps({"username": "admin", "password": "marketing2026"}),
        content_type="application/json",
    )
    headers = {"X-API-Key": "AIzaSyCustomVisitorKey12345678901"}
    res = client.post(
        "/api/run",
        data=json.dumps({"goal": "Test BYOK header routing", "provider": "gemini-3.8-flash"}),
        headers=headers,
        content_type="application/json",
    )
    assert res.status_code == 200
    data = res.get_json()
    assert data["success"] is True
    assert "decision" in data


def test_zero_credential_logging_in_sqlite():
    """Verify that client API keys are never stored in SQLite decisions, turns, or memories."""
    from app.db.database import save_decision, get_all_decisions
    from app.memory.store import add_memory, add_turn, list_memories, get_turns
    from app.core.primitives import new_id

    secret_key = "AIzaSyTEST_ONLY_REDACTION"
    d_id = f"test-sec-{new_id()[:8]}"
    save_decision(
        decision_id=d_id,
        goal_statement=f"Goal containing secret {secret_key}",
        selected_option="Secure Option",
        confidence="High",
        escalated=False,
        reasoning_source="test_zero_cred",
        rationale=f"Rationale with key={secret_key}",
        risks=f"Risks with secret {secret_key}",
    )
    decisions = [d for d in get_all_decisions() if d["id"] == d_id]
    assert len(decisions) == 1
    assert secret_key not in decisions[0]["goal_statement"]
    assert secret_key not in decisions[0]["rationale"]
    assert secret_key not in decisions[0]["risks"]
    assert "REDACTED" in decisions[0]["goal_statement"]

    # Also test memory and turn
    mem_id = add_memory("agent:branding", f"Note containing {secret_key}")
    memories = [m for m in list_memories("agent:branding") if m["id"] == mem_id]
    assert secret_key not in memories[0]["content"]
    assert "REDACTED" in memories[0]["content"]


def test_digest_and_triage_fail_when_global_quota_exhausted(monkeypatch):
    from app.graph.digest import run_digest
    from app.graph.triage import run_triage

    monkeypatch.setattr(settings, "GEMINI_API_KEY", "test-server-key")
    # Exhaust global quota
    rate_limiter.reset()
    rate_limiter.acquire_global_gemini(units=rate_limiter.host_daily_limit)

    # Calling triage or digest with exhausted global quota must visibly fail, NOT return mock answers
    with pytest.raises(RuntimeError) as exc_triage:
        run_triage(
            agents=["branding", "pr"],
            message="What is our pricing strategy?",
        )
    assert "Global daily Gemini API quota reached" in str(exc_triage.value)

    with pytest.raises(RuntimeError) as exc_digest:
        run_digest()
    assert "Global daily Gemini API quota reached" in str(exc_digest.value)
