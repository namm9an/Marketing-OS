"""Sequential backend repair regressions and Flask API workflow checks.

All state is isolated. Live-provider behavior is exercised with controlled HTTP
responses, never a paid API call. Frontend source is deliberately untouched.
"""


import json


import io


import urllib.error


from unittest.mock import patch


import pytest


from app.core.config import settings


from app.db import database


from app.db.grounded_seed import seed_grounded_knowledge


from app.main import app


from app.memory import store


from app.services.llm_service import LLMService


from app.core.rate_limiter import rate_limiter


from app.core.exceptions import UpstreamProviderError, UpstreamRateLimitError


@pytest.fixture
def repair_client(tmp_path, monkeypatch):
    monkeypatch.setattr(settings, "DB_PATH", tmp_path / "repairs.db")
    database.reset_db_state()
    database.init_db(force=True)
    seed_grounded_knowledge()
    client = app.test_client()
    assert client.post("/api/login", json={
        "username": settings.ADMIN_USER, "password": settings.ADMIN_PASSWORD,
    }).status_code == 200
    yield client
    database.reset_db_state()


def exercise_workflows(client):
    """Login, all five specialists, persistent chat, pair synthesis, digest, export."""
    assert client.get("/api/me").get_json()["authenticated"] is True
    assert client.get("/api/health").get_json()["database"] == "connected"
    runs = []
    for agent in ("branding", "pr", "social", "product_marketing", "events"):
        response = client.post("/api/run", json={
            "agent_type": agent, "goal": "Position B200 against Nebius pricing",
        })
        assert response.status_code == 200, response.get_json()
        run = response.get_json()
        assert run["success"] and run["decision"]["id"]
        assert run["positioning"]["statement"]
        runs.append(run)
    first = client.post("/api/chat", json={
        "agent": "branding", "message": "Always lead B200 messaging with reliability",
    })
    assert first.status_code == 200, first.get_json()
    thread = first.get_json()["thread_id"]
    second = client.post("/api/chat", json={
        "agent": "branding", "message": "What B200 messaging should we use?",
        "thread_id": thread,
    })
    assert second.status_code == 200, second.get_json()
    assert len(client.get(f"/api/chat/thread/{thread}").get_json()["turns"]) == 4
    triage = client.post("/api/triage", json={
        "agents": ["branding", "pr"], "message": "Compare B200 positioning against Nebius",
    })
    assert triage.status_code == 200, triage.get_json()
    assert len(triage.get_json()["views"]) == 2
    digest = client.post("/api/digest", json={})
    assert digest.status_code == 200, digest.get_json()
    assert len(digest.get_json()["agent_briefs"]) == 5
    assert digest.get_json()["citations"]
    assert client.get("/api/digest/network").get_json()["total_facts"] > 0
    export = client.post("/api/export/markdown", json=runs[0])
    assert export.status_code == 200 and "# Positioning" in export.get_data(as_text=True)
    history = client.get("/api/history").get_json()["history"]
    assert {r["decision"]["id"] for r in runs} <= {r["id"] for r in history}
    assert client.post("/api/logout").status_code == 200
    assert client.get("/api/history").status_code == 401
    return runs


@pytest.mark.parametrize("namespace", ["agent:branding", "triage:branding+social"])
def test_fix_1_foreign_transcript_rejected(repair_client, namespace):
    thread = store.create_thread(namespace, "Private conversation")
    store.add_turn(thread, "user", "private-sentinel-must-not-enter-pr")
    before = store.get_turns(thread)
    with patch("app.graph.chat.LLMService.generate") as generate:
        response = repair_client.post("/api/chat", json={
            "agent": "pr", "message": "Draft the announcement", "thread_id": thread,
        })
    assert response.status_code == 400
    generate.assert_not_called()
    assert store.get_turns(thread) == before


def test_fix_1_full_workflow(repair_client):
    exercise_workflows(repair_client)


@pytest.mark.parametrize("output", ["not JSON", "```", "{}", json.dumps({
    "selected_option": "Option", "statement": "", "rationale": "Reason",
    "risks": "None", "confidence": "High",
})])
def test_fix_2_invalid_generation_is_not_a_strategy(repair_client, output):
    before = database.get_all_decisions()
    with patch("app.agents.base.LLMService.generate", return_value={
        "text": output, "source": "live", "model_used": "controlled-test-model",
    }):
        response = repair_client.post("/api/run", json={"goal": "Position B200"})
    assert response.status_code == 502
    assert database.get_all_decisions() == before


def test_fix_2_full_workflow(repair_client):
    exercise_workflows(repair_client)


def test_fix_3_review_is_authenticated_persistent_and_decision_bound(repair_client):
    first = repair_client.post("/api/run", json={"goal": "Avoid a price war"}).get_json()
    decision_id = first["decision"]["id"]
    url = f"/api/decisions/{decision_id}/review"
    assert app.test_client().post(url, json={"status": "approved"}).status_code == 401
    reviewed = repair_client.post(url, json={"status": "approved", "reason": "Reviewed the evidence"})
    assert reviewed.status_code == 200
    row = repair_client.get(f"/api/decisions/{decision_id}").get_json()["decision"]
    assert row["review_status"] == "approved"
    assert row["reviewed_by"] == settings.ADMIN_USER and row["reviewed_at"]
    assert row["escalated"]  # Approval does not erase the original risk signal.
    assert row["reviews"][0]["reason"] == "Reviewed the evidence"
    second = repair_client.post("/api/run", json={"goal": "New B200 strategy"}).get_json()
    other = repair_client.get(f"/api/decisions/{second['decision']['id']}").get_json()["decision"]
    assert other["review_status"] == "unreviewed" and other["reviewed_by"] is None
    assert repair_client.post(url, json={"status": "invalid"}).status_code == 400
    assert repair_client.post("/api/decisions/missing/review", json={"status": "approved"}).status_code == 404


def test_fix_3_full_workflow(repair_client):
    exercise_workflows(repair_client)


def test_fix_4_original_result_survives_history_reload(repair_client):
    run = repair_client.post("/api/run", json={"goal": "Position B200 against Nebius"}).get_json()
    row = repair_client.get(f"/api/decisions/{run['decision']['id']}").get_json()["decision"]
    assert row["workflow_type"] == "run"
    assert row["result_available"] is True
    assert row["result"] == run
    assert row["result"]["positioning"]["statement"] != row["selected_option"]
    assert isinstance(row["result"]["knowledge_units"], list)
    history = repair_client.get("/api/history").get_json()["history"]
    assert next(r for r in history if r["id"] == row["id"])["result"] == run


def test_fix_4_snapshot_redaction_preserves_quoted_json(repair_client):
    response = repair_client.post("/api/run", json={
        "goal": 'B200 comparison with https://example.com/?key=offline-test-value" quoted text',
    })
    assert response.status_code == 200
    decision_id = response.get_json()["decision"]["id"]
    restored = repair_client.get(f"/api/decisions/{decision_id}")
    assert restored.status_code == 200
    snapshot = restored.get_json()["decision"]["result"]
    assert "offline-test-value" not in json.dumps(snapshot)
    assert 'REDACTED" quoted text' in snapshot["goalStatement"]


def test_fix_4_persistence_failure_is_not_success(repair_client):
    with patch("app.graph.workflow.save_decision", side_effect=OSError("controlled persistence failure")):
        response = repair_client.post("/api/run", json={"goal": "Position B200"})
    assert response.status_code == 503
    assert "decision" not in response.get_json()


def test_fix_4_full_workflow(repair_client):
    exercise_workflows(repair_client)


@pytest.mark.parametrize("path,payload,kind", [
    ("/api/chat", {"agent": "branding", "message": "What is B200?"}, "chat"),
    ("/api/triage", {"agents": ["branding", "pr"], "message": "Compare B200"}, "triage"),
])
def test_fix_4_other_workflows_keep_original_results(repair_client, path, payload, kind):
    result = repair_client.post(path, json=payload).get_json()
    row = database.get_decision(result["decision_id"])
    assert row["workflow_type"] == kind and row["result"] == result


def test_fix_4_legacy_migration_does_not_invent_lost_output(repair_client, tmp_path, monkeypatch):
    import sqlite3
    path = tmp_path / "legacy.db"
    with sqlite3.connect(path) as conn:
        conn.executescript("""
            CREATE TABLE decisions (id TEXT PRIMARY KEY, goal_statement TEXT,
            selected_option TEXT, confidence TEXT, escalated INTEGER,
            reasoning_source TEXT, rationale TEXT, risks TEXT, created_at TEXT);
            INSERT INTO decisions VALUES ('old', 'Goal', 'Title', 'High', 0,
            'legacy', 'Reason', 'None', '2026-01-01');
        """)
    monkeypatch.setattr(settings, "DB_PATH", path)
    database.init_db(force=True)
    database.init_db(force=True)
    row = database.get_decision("old")
    assert row["selected_option"] == "Title" and row["created_at"] == "2026-01-01"
    assert row["workflow_type"] == "legacy" and row["result"] is None
    assert row["result_available"] is False


@pytest.mark.parametrize("path,payload", [
    ("/api/run", {"goal": ["wrong type"]}),
    ("/api/run", ["not an object"]),
    ("/api/chat", {"message": {"wrong": "type"}}),
    ("/api/triage", {"message": "Question", "agents": [1, 2]}),
    ("/api/triage", {"message": "Question", "agents": "branding,pr"}),
    ("/api/login", {"username": ["wrong type"], "password": "unused"}),
    ("/api/digest", ["not an object"]),
    ("/api/export/markdown", {"decision": ["wrong type"]}),
])
def test_fix_6_invalid_requests_are_client_errors(repair_client, path, payload):
    before = database.get_all_decisions()
    with patch("app.services.llm_service.LLMService.generate") as generate:
        response = repair_client.post(path, json=payload)
    assert response.status_code == 400
    assert response.is_json
    generate.assert_not_called()
    assert database.get_all_decisions() == before


def test_fix_6_full_workflow(repair_client):
    exercise_workflows(repair_client)


def test_fix_9_console_direct_navigation(repair_client, tmp_path, monkeypatch):
    """Use a minimal build artifact to verify Flask's SPA routing independently."""
    import importlib
    main = importlib.import_module("app.main")
    (tmp_path / "index.html").write_text("<html>console-routing-sentinel</html>")
    monkeypatch.setattr(main, "FRONTEND_DIST", tmp_path)
    for route in ("/console", "/console/", "/console/history"):
        response = repair_client.get(route)
        assert response.status_code == 200
        assert "console-routing-sentinel" in response.get_data(as_text=True)
    assert repair_client.get("/api/not-a-real-endpoint").status_code == 404


def test_fix_9_concurrent_legacy_schema_upgrade(tmp_path, monkeypatch):
    """Workers starting together must preserve old results and agree on new columns."""
    import sqlite3
    from concurrent.futures import ThreadPoolExecutor

    monkeypatch.setattr(settings, "DB_PATH", tmp_path / "concurrent-upgrade.db")
    with sqlite3.connect(settings.DB_PATH) as conn:
        conn.execute("""CREATE TABLE decisions (
            id TEXT PRIMARY KEY, goal_statement TEXT, selected_option TEXT,
            confidence TEXT, escalated INTEGER, reasoning_source TEXT,
            rationale TEXT, risks TEXT, created_at TEXT
        )""")
        conn.execute("INSERT INTO decisions VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", (
            "legacy-parallel", "Old goal", "Old title", "High", 0, "old", "Old rationale", "Old risks", "2026-01-01",
        ))
    try:
        with ThreadPoolExecutor(max_workers=8) as pool:
            list(pool.map(lambda _: database.init_db(force=True), range(8)))
        saved = database.get_decision("legacy-parallel")
        assert saved["goal_statement"] == "Old goal"
        assert saved["workflow_type"] == "legacy" and saved["result"] is None
        assert saved["reviews"] == [] and saved["review_status"] == "unreviewed"
    finally:
        database.reset_db_state()
