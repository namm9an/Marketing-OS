import json

import pytest

from app.core.config import settings
from app.db import database, grounded_seed
from app.agents.base import run_agent
from app.services.llm_service import LLMService


@pytest.mark.parametrize("snippet", [
    "Hyperstack GPU cloud pricing. This website stores cookies on your computer. These cookies are used to collect information about how you interact with our website.",
    "TIR Platform: AI/ML Model Deployment. Company Partner Investor Resources Careers Contact Sign In GPU Pricing Company Blog Latest News.",
    "E2E Cloud Skip to main content MyAccount TIR Search docs or Ask AI Sign Up Explore All Products and documentation pages.",
    "The Ultimate AI Cloud. Products Solutions Resources Pricing Company Investors Contact sales Log in. Build and scale AI faster.",
])
def test_page_chrome_is_not_accepted_as_documentation_evidence(snippet):
    assert not grounded_seed.is_valid_corpus_content(snippet)


def test_useful_privacy_content_is_not_rejected_for_mentioning_cookies():
    assert grounded_seed.is_valid_corpus_content(
        "The privacy policy describes optional analytics cookies and explains how customers can disable telemetry for their deployments."
    )


def test_seed_keeps_observations_without_claiming_a_complete_fleet_or_price_mapping(tmp_path, monkeypatch):
    monkeypatch.setattr(settings, "DB_PATH", tmp_path / "source.db")
    database.reset_db_state()
    source = tmp_path / "scrape.json"
    source.write_text(json.dumps([{"name": "Example Cloud", "region": "global", "subpages": [{
        "status": "success", "url": "https://example.com/gpu", "gpus": ["H100"],
        "pricing": ["$1.20/hr"], "headings": ["GPU compute"],
        "snippet": "GPU compute. This website stores cookies on your computer to collect information about how you interact with our website.",
    }]}]))
    monkeypatch.setattr(grounded_seed, "DEEP_SCRAPE_PATH", source)
    grounded_seed.seed_grounded_knowledge()
    rows = database.search_knowledge_units(limit=20, sourced_only=True)
    assert {row["knowledge_class"] for row in rows} == {"hardware", "pricing", "positioning"}
    hardware = next(row for row in rows if row["knowledge_class"] == "hardware")
    pricing = next(row for row in rows if row["knowledge_class"] == "pricing")
    assert "snapshot" in hardware["content"].lower() and "not a complete fleet" in hardware["content"].lower()
    assert "H100" not in pricing["content"] and "$1.20/hr" in pricing["content"]
    assert all(row["source_url"] == "https://example.com/gpu" for row in rows)
    connection = database.get_connection()
    try:
        assert connection.execute("SELECT COUNT(*) FROM edges WHERE rel = 'prices'").fetchone()[0] == 0
    finally:
        connection.close()


def test_agent_prompt_does_not_supply_unretrieved_slas_or_prices(monkeypatch):
    fact = {"id": "source-1", "organization": "Example Cloud", "knowledge_class": "hardware",
            "content": "A partial source snapshot mentions H100.", "source_url": "https://example.com/gpu"}
    monkeypatch.setattr("app.agents.base.search_knowledge_units", lambda *a, **k: [fact])
    def generate(**kwargs):
        prompt = kwargs["system_prompt"] + kwargs["user_prompt"]
        assert "99.95%" not in prompt and "Rs671" not in prompt and "Rs334" not in prompt
        return {"text": json.dumps({"selected_option": "Evidence-led brief", "statement": "Recommend a launch message.",
                "rationale": "Use the observed source context.", "risks": "Confirm missing details.",
                "confidence": "Medium", "evidence_ids": ["source-1"]}), "source": "mock"}
    monkeypatch.setattr(LLMService, "generate", generate)
    result = run_agent("branding", "Recommend a launch message from available evidence")
    assert result["evidence_ids"] == ["source-1"]


@pytest.mark.parametrize("query,skus", [
    ("H200 GPU availability", ("H200",)),
    ("Who offers last-generation Hopper cards?", ("H100", "H200", "GH200")),
])
def test_specific_hardware_queries_prioritize_matching_observations(tmp_path, monkeypatch, query, skus):
    monkeypatch.setattr(settings, "DB_PATH", tmp_path / "hardware.db")
    database.reset_db_state()
    grounded_seed.seed_grounded_knowledge()
    rows = database.search_knowledge_units(query, limit=5, sourced_only=True, expand_taxonomy=True)
    assert rows and all(any(sku in row["content"] for sku in skus) for row in rows)
