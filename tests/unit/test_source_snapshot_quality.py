import json

import pytest

from app.core.config import settings
from app.core.primitives import content_hash
from app.db import database, grounded_seed
from app.memory.graph import rebuild_corpus_graph
from app.agents.base import run_agent
from app.services.llm_service import LLMService


@pytest.mark.parametrize("snippet", [
    "Hyperstack GPU cloud pricing. This website stores cookies on your computer. These cookies are used to collect information about how you interact with our website.",
    "AI Platform: Model Deployment. Company Partner Investor Resources Careers Contact Sign In GPU Pricing Company Blog Latest News.",
    "Example Cloud Skip to main content Dashboard Search docs or Ask AI Sign Up Explore All Products and documentation pages.",
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
    source = tmp_path / "sources.json"
    hardware = "The cloud overview mentions H100, without listing its complete fleet."
    pricing = "The vendor publishes a rate that is not attributed to a specific SKU."
    source.write_text(json.dumps([
        {"organization": "Example Cloud", "knowledge_class": kind, "content": content,
         "source_url": "https://example.com/gpu"}
        for kind, content in (("hardware", hardware), ("pricing", pricing))
    ]))
    monkeypatch.setattr(grounded_seed, "STARTER_SOURCES", source)
    grounded_seed.seed_grounded_knowledge()
    rows = database.search_knowledge_units(limit=20, sourced_only=True)
    assert {row["knowledge_class"]: row["content"] for row in rows} == {
        "hardware": hardware, "pricing": pricing,
    }
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


def test_reseed_failure_preserves_existing_corpus_and_search_index(tmp_path, monkeypatch):
    monkeypatch.setattr(settings, "DB_PATH", tmp_path / "corpus.db")
    grounded_seed.seed_grounded_knowledge(only_if_empty=True)
    original = database.search_knowledge_units("H100", limit=20, sourced_only=True)
    assert original

    source = tmp_path / "replacement-sources.json"
    source.write_text(json.dumps([{
        "organization": "RollbackSentinel", "knowledge_class": "hardware",
        "source_url": "https://example.com/gpu", "content": "The vendor mentions L40S without claiming a complete fleet.",
    }]))
    monkeypatch.setattr(grounded_seed, "STARTER_SOURCES", source)

    def graph_failure(conn):
        conn.execute("DELETE FROM edges WHERE namespace = 'corpus:global'")
        raise RuntimeError("could not refresh graph")

    monkeypatch.setattr(grounded_seed, "replace_corpus_edges", graph_failure)
    with pytest.raises(RuntimeError, match="could not refresh graph"):
        grounded_seed.seed_grounded_knowledge(only_if_empty=True)

    assert database.search_knowledge_units("H100", limit=20, sourced_only=True) == original
    assert not database.search_knowledge_units("RollbackSentinel")
    with database.get_connection() as conn:
        assert conn.execute("SELECT COUNT(*) FROM edges WHERE namespace = 'corpus:global'").fetchone()[0] > 0


def test_startup_replaces_legacy_sources_and_preserves_other_records(tmp_path, monkeypatch):
    monkeypatch.setattr(settings, "DB_PATH", tmp_path / "existing.db")
    database.reset_db_state()
    organization = "Retired Cloud"
    url = "https://retired.example/gpus"
    content = "Hardware fleet observations in a source snapshot for Retired Cloud: H100."
    legacy_id = content_hash(f"{organization}|hardware|{url}|{content}")
    database.save_knowledge_unit(
        id_str=legacy_id, organization=organization, k_class="hardware", confidence="high",
        content=content, source_url=url, enriched_by="grounded_crawler",
    )
    older_id = "a" * 32
    database.save_knowledge_unit(
        id_str=older_id, organization=organization, k_class="hardware", confidence="high",
        content="Verified GPU Hardware Fleet on Retired Cloud: A100.", source_url=url,
        enriched_by="grounded_crawler",
    )
    database.save_knowledge_unit(
        id_str="operator-source", organization="Operator reference", k_class="hardware",
        confidence="high", content="Custom H100 source reference.",
        source_url="https://operator.example/gpus", enriched_by="grounded_crawler",
    )
    rebuild_corpus_graph()
    with database.get_connection() as conn:
        conn.execute(
            "INSERT INTO edges (id, src, rel, dst, namespace) VALUES (?, ?, ?, ?, ?)",
            ("private-edge", "mem:1", "anchored_to", "H100", "agent:branding"),
        )

    grounded_seed.seed_grounded_knowledge(only_if_empty=True)
    after_migration = database.search_knowledge_units(limit=100, sourced_only=True)
    grounded_seed.seed_grounded_knowledge(only_if_empty=True)
    assert database.search_knowledge_units(limit=100, sourced_only=True) == after_migration
    assert any(row["id"] == "operator-source" for row in after_migration)
    assert any(row["id"].startswith("starter:") for row in after_migration)
    assert all(row["id"] not in {legacy_id, older_id} for row in after_migration)
    with database.get_connection() as conn:
        assert not conn.execute("SELECT 1 FROM knowledge_units_fts WHERE id = ?", (legacy_id,)).fetchone()
        assert not conn.execute("SELECT 1 FROM edges WHERE src = ?", (organization,)).fetchone()
        assert conn.execute("SELECT 1 FROM edges WHERE id = 'private-edge'").fetchone()


@pytest.mark.parametrize("query,skus", [
    ("H200 GPU availability", ("H200",)),
    ("Who offers last-generation Hopper cards?", ("H100", "H200", "GH200")),
])
def test_specific_hardware_queries_prioritize_matching_observations(tmp_path, monkeypatch, query, skus):
    monkeypatch.setattr(settings, "DB_PATH", tmp_path / "hardware.db")
    database.reset_db_state()
    grounded_seed.seed_grounded_knowledge()
    corpus = database.search_knowledge_units(limit=100, sourced_only=True)
    matching = {
        row["id"] for row in corpus
        if row["knowledge_class"] == "hardware" and any(sku in row["content"] for sku in skus)
    }
    assert matching
    rows = database.search_knowledge_units(query, limit=5, sourced_only=True, expand_taxonomy=True)
    top = rows[:min(5, len(matching))]
    assert len(top) == min(5, len(matching))
    assert all(row["id"] in matching for row in top)
