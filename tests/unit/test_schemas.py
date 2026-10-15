"""
Unit Tests for Pydantic v2 Domain Schemas
"""

import pytest
from pydantic import ValidationError
from app.core.schemas import (
    KnowledgeUnitSchema,
    DecisionRecordSchema,
    MemoryRecordSchema,
    ChatTurnSchema,
    TriageOutputSchema,
    TriageResponseSchema,
    AgentResponseSchema,
    DigestSchema,
    RunRequestSchema,
)


def test_knowledge_unit_schema():
    ku = KnowledgeUnitSchema(
        id="a1b2c3d4e5f6",
        organization="Vanguard Cloud",
        knowledge_class="pricing",
        content="Empirical Pricing & Rate Card Terms: $1.99/hr.",
        source_url="https://vanguardcloud.ai/pricing",
    )
    assert ku.organization == "Vanguard Cloud"
    assert ku.confidence == "high"
    assert ku.enriched_by == "system"
    dumped = ku.model_dump()
    assert dumped["id"] == "a1b2c3d4e5f6"


def test_knowledge_unit_missing_required():
    with pytest.raises(ValidationError):
        KnowledgeUnitSchema(id="123", organization="Vanguard Cloud")


def test_decision_record_schema():
    rec = DecisionRecordSchema(
        id="d1d2d3d4",
        goal_statement="Differentiate on sovereign AI compliance",
        selected_option="Sovereign AI Security",
        reasoning_source="branding",
        rationale="MeitY and SOC2 certifications",
        risks="Low risk profile",
    )
    assert rec.escalated is False
    assert rec.confidence == "High"


def test_memory_record_schema():
    mem = MemoryRecordSchema(
        id="m1m2m3",
        namespace="agent:branding",
        content="Standing instruction: never offer ungrounded pricing",
    )
    assert mem.tier == "episodic"
    assert mem.confidence == "medium"
    assert mem.hit_count == 0


def test_chat_turn_schema():
    turn = ChatTurnSchema(
        thread_id="th1",
        turn_id="tu1",
        agent="branding",
        role="user",
        content="Compare our H100 with Nebius",
    )
    assert turn.agent == "branding"
    assert turn.recalled_memories == []


def test_triage_output_schema_and_alias():
    out = TriageOutputSchema(
        agents=["branding", "pr"],
        namespace="triage:branding+pr",
        thread_id="th_triage_1",
        answer="Coordinated positioning across PR and brand",
    )
    assert out.success is True
    assert TriageResponseSchema is TriageOutputSchema


def test_agent_response_schema():
    resp = AgentResponseSchema(
        selected_option="Price Matching Strategy",
        statement="Maintain competitive edge on GPU hourly rates",
        rationale="Market rates show $2.00/hr baseline",
        risks="Margin compression",
        confidence="High",
    )
    assert resp.selected_option == "Price Matching Strategy"


def test_digest_schema():
    digest = DigestSchema(
        headline="Market pricing pressure stabilizes",
        executive_summary="All 10 competitors held pricing steady this week",
        competitor_movements=["Nebius expanded B200 availability"],
        recommended_actions=["Highlight instant provisioning"],
    )
    assert len(digest.competitor_movements) == 1


def test_run_request_schema():
    req = RunRequestSchema(goal="Analyze GPU pricing")
    assert req.agent_type == "branding"
    assert req.provider is None


def test_thread_and_edge_schemas():
    from app.core.schemas import ThreadSchema, GraphEdgeSchema

    thread = ThreadSchema(id="th_100", namespace="agent:branding", title="Blackwell positioning")
    assert thread.id == "th_100"
    assert thread.namespace == "agent:branding"

    edge = GraphEdgeSchema(id="ed_1", src="Vanguard Cloud", rel="offers", dst="B200")
    assert edge.src == "Vanguard Cloud"
    assert edge.dst == "B200"
    assert edge.namespace == "corpus:global"


def test_chat_and_triage_request_schemas():
    from app.core.schemas import ChatRequestSchema, TriageRequestSchema

    chat_req = ChatRequestSchema(message="Position against Nebius")
    assert chat_req.agent == "branding"
    assert chat_req.provider == "gemini-3.6-flash"

    triage_req = TriageRequestSchema(agents=["branding", "pr"], message="Joint positioning")
    assert triage_req.agents == ["branding", "pr"]
    assert triage_req.thread_id is None
