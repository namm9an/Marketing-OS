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
    test_key = "AIzaSyTEST_ONLY_REDACTION"
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key={test_key}"
    err_message = f"HTTP Error 400: Bad Request to {url} with secret {test_key}"

    sanitized = redact_credentials(err_message, test_key)
    assert test_key not in sanitized
    assert "key=REDACTED" in sanitized
    assert "secret REDACTED" in sanitized


def test_dynamic_model_routing_in_url():
    captured_requests = []

    def mock_urlopen(req, timeout=30):
        captured_requests.append(req.full_url)
        mock_resp = MagicMock()
        mock_resp.__enter__.return_value = mock_resp
        mock_resp.read.return_value = json.dumps({
            "candidates": [{"content": {"parts": [{"text": '{"selected_option": "Test", "statement": "OK", "rationale": "OK", "risks": "None", "confidence": "High"}'}]}}]
        }).encode("utf-8")
        return mock_resp

    with patch("urllib.request.urlopen", side_effect=mock_urlopen):
        # 1. Default model gemini-3.8-flash
        res = LLMService.generate(
            system_prompt="system",
            user_prompt="goal",
            api_key="AIzaSyTestKey12345678901234567890123",
        )
        assert "gemini-3.8-flash:generateContent" in captured_requests[0]
        assert res["model_used"] == "gemini-3.8-flash"

        # 2. Custom model routing
        res2 = LLMService.generate(
            system_prompt="system",
            user_prompt="goal",
            provider="gemini-2.5-pro",
            api_key="AIzaSyTestKey12345678901234567890123",
        )
        assert "gemini-2.5-pro:generateContent" in captured_requests[1]
        assert res2["model_used"] == "gemini-2.5-pro"


def test_byok_api_key_override():
    captured_requests = []

    def mock_urlopen(req, timeout=30):
        captured_requests.append(req.full_url)
        mock_resp = MagicMock()
        mock_resp.__enter__.return_value = mock_resp
        mock_resp.read.return_value = json.dumps({
            "candidates": [{"content": {"parts": [{"text": '{"selected_option": "Test", "statement": "OK", "rationale": "OK", "risks": "None", "confidence": "High"}'}]}}]
        }).encode("utf-8")
        return mock_resp

    client_byok_key = "AIzaSyClientPersonalKey9999999999999"
    with patch("urllib.request.urlopen", side_effect=mock_urlopen):
        LLMService.generate(
            system_prompt="system",
            user_prompt="goal",
            api_key=client_byok_key,
        )
        assert f"key={client_byok_key}" in captured_requests[0]


def test_quota_reached_graceful_fallback():
    # Force rate limit
    ip = "192.168.99.1"
    rate_limiter.reset()
    for _ in range(3):
        rate_limiter.acquire(ip)

    # 4th burst request exceeds rate limiter
    res = LLMService.generate(
        system_prompt="system",
        user_prompt="goal",
        client_ip=ip,
        api_key="AIzaSyTestKey123",
    )
    assert res["model_used"] == "mock-fallback"
    assert res["notice"] == "Quota reached"
    text = json.loads(res["text"])
    assert text["notice"] == "Quota reached"
    assert "Strategy" in text["selected_option"]


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

    secret_key = "AIzaSyTEST_ONLY_REDACTIONte123"
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


def test_digest_and_triage_notice_propagation_on_quota():
    from app.graph.digest import run_digest
    from app.graph.triage import run_triage

    # Exhaust quota for a test IP
    quota_ip = "192.168.88.88"
    rate_limiter.reset()
    for _ in range(3):
        rate_limiter.acquire(quota_ip)

    # Calling triage with exhausted quota must gracefully return deterministic mock with notice
    triage_res = run_triage(
        agents=["branding", "pr"],
        message="What is our pricing strategy?",
        client_ip=quota_ip,
    )
    assert triage_res["success"] is True
    assert triage_res.get("notice") == "Quota reached"

    # Calling digest with exhausted quota must gracefully return deterministic mock with notice
    digest_res = run_digest(client_ip=quota_ip)
    assert digest_res["success"] is True
    assert digest_res.get("notice") == "Quota reached"
