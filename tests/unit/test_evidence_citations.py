"""
Unit Tests for Provenance Evidence Citations & Grounding Verification

Verifies that cited fact IDs are deterministically checked against the retrieved fact set.
Note: This proves cited facts were actually retrieved, not that the text is supported by them.
"""

import pytest
from app.agents.base import verify_citations, run_agent
from app.core.schemas import AgentResponseSchema


def test_citation_valid_subset_retained():
    """Valid cited IDs in the retrieved set are preserved with 0 invalid count."""
    retrieved = {"ku_h100_pricing", "ku_b200_specs", "ku_sla_uptime"}
    model_cited = ["ku_h100_pricing", "ku_sla_uptime"]

    valid_ids, invalid_count = verify_citations(model_cited, retrieved)
    assert valid_ids == ["ku_h100_pricing", "ku_sla_uptime"]
    assert invalid_count == 0


def test_citation_hallucinated_and_unretrieved_dropped():
    """Hallucinated or unretrieved IDs are dropped and counted as invalid."""
    retrieved = {"ku_b200_specs"}
    model_cited = ["ku_b200_specs", "ku_fake_fact_999", "ku_unretrieved_fact"]

    valid_ids, invalid_count = verify_citations(model_cited, retrieved)
    assert valid_ids == ["ku_b200_specs"]
    assert invalid_count == 2


def test_citation_malformed_empty_and_deduplication():
    """Non-list types, non-string items, and duplicates are handled deterministically."""
    retrieved = {"ku_valid_1"}

    # 1. Empty and None inputs
    assert verify_citations([], retrieved) == ([], 0)
    assert verify_citations(None, retrieved) == ([], 0)
    assert verify_citations("not-a-list", retrieved) == ([], 0)

    # 2. Duplicate citations are deduplicated without inflating count
    dupes = ["ku_valid_1", "ku_valid_1", "ku_invalid_2"]
    valid_ids, invalid_count = verify_citations(dupes, retrieved)
    assert valid_ids == ["ku_valid_1"]
    assert invalid_count == 1  # 1 invalid id dropped


def test_agent_schema_supports_evidence_ids():
    """AgentResponseSchema validates evidence_ids field with default empty list."""
    res = AgentResponseSchema(
        selected_option="Positioning Strategy",
        statement="Vanguard Cloud certified uptime",
        rationale="Supported by SLA facts",
        risks="Market pressure",
        confidence="High",
        evidence_ids=["fact_123", "fact_456"],
    )
    assert res.evidence_ids == ["fact_123", "fact_456"]

    res_default = AgentResponseSchema(
        selected_option="Strategy",
        statement="Statement",
        rationale="Rationale",
        risks="Risks",
    )
    assert res_default.evidence_ids == []


def test_mock_run_agent_telemetry():
    """Agent execution on mock path returns measurable telemetry with source='mock'."""
    out = run_agent("branding", "Position B200 against Nebius on price")
    assert out["source"] == "mock"
    assert out["model"] == "mock-fallback"
    assert out["requested_model"] == "gemini-3.8-flash"
    assert out["fallback_used"] is False
    assert out["attempts"] == 1
    assert isinstance(out["latency_ms"], (int, float))
    assert isinstance(out["total_wall_ms"], (int, float))
    assert isinstance(out["retrieval_ms"], (int, float))
    assert isinstance(out["facts_retrieved"], int)
    assert out["facts_retrieved"] >= 0
    assert out["tokens"] == 150
    assert out["prompt_tokens"] == 100
    assert out["completion_tokens"] == 50
    assert out["thoughts_tokens"] == 0
    assert isinstance(out["evidence_ids"], list)
    assert out["invalid_evidence_ids_count"] == 0


def test_decision_record_schema_telemetry_fields():
    """DecisionRecordSchema validates honest telemetry fields."""
    from app.core.schemas import DecisionRecordSchema

    rec = DecisionRecordSchema(
        id="test-id",
        goal_statement="Goal",
        selected_option="Option",
        reasoning_source="test",
        rationale="Rationale",
        risks="Risks",
        latency_ms=120.5,
        total_wall_ms=1300.0,
        attempts=2,
        thoughts_tokens=500,
        requested_model="gemini-3.8-flash",
        model="gemini-3.6-flash",
        fallback_used=True,
    )
    assert rec.latency_ms == 120.5
    assert rec.total_wall_ms == 1300.0
    assert rec.attempts == 2
    assert rec.thoughts_tokens == 500
    assert rec.requested_model == "gemini-3.8-flash"
    assert rec.model == "gemini-3.6-flash"
    assert rec.fallback_used is True
