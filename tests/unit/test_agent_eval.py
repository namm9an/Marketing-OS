"""
Unit Tests for Frontier Agent Evaluation Suite (Anthropic Standard).

Tests:
1. The Grader Triad (CodeGrader, ModelGrader, HumanReferenceGrader)
2. Class-Balanced Scenario Banks (50% positive triggers / 50% negative triggers)
3. Multi-Trial Trajectory Harness (pass@1, pass@k, pass^k formulations)
"""

import tempfile
import sqlite3
import pytest
from pathlib import Path

from app.core.config import settings
from app.db import database
from app.db.database import init_db, save_decision, save_knowledge_unit
from app.db.grounded_seed import seed_grounded_knowledge
from app.eval.graders import CodeGrader, ModelGrader, HumanReferenceGrader
from app.eval.scenarios import (
    GOVERNANCE_SCENARIOS,
    MEMORY_GATE_SCENARIOS,
    GovernanceScenario,
    MemoryScenario,
)
from app.eval.agent_eval import FrontierAgentEvaluator, _estimate_tokens


@pytest.fixture
def eval_db():
    tmp = tempfile.TemporaryDirectory()
    original_db = settings.DB_PATH
    db_path = Path(tmp.name) / "eval_test.db"
    settings.DB_PATH = db_path
    database.init_db(force=True)
    seed_grounded_knowledge()
    yield db_path
    settings.DB_PATH = original_db
    database._INITIALIZED = False
    tmp.cleanup()


# ====================================================================================
# 1. Grader Triad: CodeGrader Tests
# ====================================================================================

class TestCodeGrader:
    def test_assert_outcome_state_success(self, eval_db):
        save_decision(
            decision_id="test_dec_01",
            goal_statement="Evaluate pricing strategy",
            selected_option="Option A",
            confidence="High",
            escalated=True,
            reasoning_source="test",
            rationale="Approved",
            risks="None",
        )
        assert CodeGrader.assert_outcome_state(
            db=eval_db,
            table="decisions",
            expected_fields={
                "id": "test_dec_01",
                "escalated": 1,
                "goal_statement": "Evaluate pricing strategy",
            },
        )

    def test_assert_outcome_state_failure_raises(self, eval_db):
        with pytest.raises(AssertionError) as exc:
            CodeGrader.assert_outcome_state(
                db=eval_db,
                table="decisions",
                expected_fields={"id": "non_existent_decision_id"},
            )
        assert "Outcome state check failed" in str(exc.value)

    def test_zero_namespace_leakage_clean(self):
        transcript = {
            "agent_type": "branding",
            "namespace": "agent:branding",
            "reply": "Our positioning strategy is developer-first.",
            "memories": [{"id": "m1", "namespace": "agent:branding"}],
        }
        forbidden = ["agent:pr", "agent:social", "triage:pr+social"]
        assert CodeGrader.assert_zero_namespace_leakage(transcript, forbidden)

    def test_zero_namespace_leakage_detects_forbidden_namespace(self):
        leaked_transcript = {
            "agent_type": "branding",
            "namespace": "agent:branding",
            "reply": "Reading from agent:pr memory without permission.",
        }
        forbidden = ["agent:pr", "agent:social"]
        with pytest.raises(AssertionError) as exc:
            CodeGrader.assert_zero_namespace_leakage(leaked_transcript, forbidden)
        assert "Namespace leakage detected" in str(exc.value)

    def test_zero_namespace_leakage_no_substring_collision(self):
        """Verify agent:pr does not collide with agent:product_marketing."""
        transcript = {
            "agent_type": "product_marketing",
            "namespace": "agent:product_marketing",
            "reply": "PMM battlecard analysis for enterprise cloud.",
        }
        forbidden = ["agent:pr"]
        assert CodeGrader.assert_zero_namespace_leakage(transcript, forbidden)

    def test_valid_citations_success(self, eval_db):
        conn = sqlite3.connect(str(eval_db))
        conn.row_factory = sqlite3.Row
        sample_fact = conn.execute(
            "SELECT source_url FROM knowledge_units WHERE source_url IS NOT NULL AND source_url != '' LIMIT 1"
        ).fetchone()
        conn.close()
        valid_url = sample_fact["source_url"]

        response = {
            "reply": f"According to verified documentation at {valid_url}, the cluster is active.",
            "citations": [valid_url],
        }
        assert CodeGrader.assert_valid_citations(response, corpus_db=eval_db)

    def test_invalid_citations_failure(self, eval_db):
        fake_url = "https://fabricated-unverified-hallucinated-cloud.com/pricing"
        response = {
            "reply": f"Check competitor rates at {fake_url}",
            "citations": [fake_url],
        }
        with pytest.raises(AssertionError) as exc:
            CodeGrader.assert_valid_citations(response, corpus_db=eval_db)
        assert "Citation verification failed" in str(exc.value)

    def test_assert_outcome_state_raw_connection_without_row_factory(self, eval_db):
        conn = sqlite3.connect(str(eval_db))
        # Deliberately do NOT set conn.row_factory
        assert conn.row_factory is None
        try:
            assert CodeGrader.assert_outcome_state(
                db=conn,
                table="knowledge_units",
                expected_fields={"organization": "Crusoe Cloud"},
            )
        finally:
            conn.close()

    def test_zero_namespace_leakage_with_pydantic_model(self):
        from pydantic import BaseModel
        class MockTurn(BaseModel):
            speaker: str
            namespace: str
            text: str

        clean_turn = MockTurn(speaker="branding", namespace="agent:branding", text="Hello")
        assert CodeGrader.assert_zero_namespace_leakage(clean_turn, ["agent:pr"])

        leaked_turn = MockTurn(speaker="branding", namespace="agent:pr", text="Leaked")
        with pytest.raises(AssertionError) as exc:
            CodeGrader.assert_zero_namespace_leakage(leaked_turn, ["agent:pr"])
        assert "Namespace leakage detected" in str(exc.value)

    def test_zero_namespace_leakage_cycle_resilience(self):
        cyclic_dict = {"agent": "branding"}
        cyclic_dict["self"] = cyclic_dict
        assert CodeGrader.assert_zero_namespace_leakage(cyclic_dict, ["agent:pr"])

    def test_valid_citations_database_error_graceful(self):
        conn = sqlite3.connect(":memory:")
        ok, reason, invalid = CodeGrader.check_valid_citations(
            {"citations": ["https://foo.com"]},
            corpus_db=conn,
        )
        assert ok is False
        assert "Database query failed during citation check" in reason
        conn.close()


# ====================================================================================
# 2. Grader Triad: ModelGrader Tests
# ====================================================================================

class TestModelGrader:
    def test_groundedness_compliant_unknown_when_context_lacks_evidence(self):
        """Mandatory guardrail: 'If context lacks evidence, return UNKNOWN. Do not fabricate.'"""
        response = "The requested information is UNKNOWN as context lacks evidence."
        result = ModelGrader.score_groundedness(response=response, context_facts=[])
        assert result["score"] == 5
        assert result["verdict"] == "COMPLIANT_UNKNOWN"
        assert result["unknown"] is True

    def test_groundedness_detects_fabrication_violation(self):
        """Violating the guardrail by inventing facts when context is empty."""
        response = "Nebius operates 5000 H100 SXM5 GPUs in Dublin at $2.10/hr."
        result = ModelGrader.score_groundedness(response=response, context_facts=[], strict_guardrail=True)
        assert result["score"] == 1
        assert result["verdict"] == "FABRICATION_VIOLATION"
        assert result["grounded"] is False

    def test_groundedness_detects_invented_prices(self):
        context = [{"content": "Verified GPU Hardware Fleet on RunPod: H100, L40S."}]
        response = "RunPod offers H100 GPUs at $1.49/hr on-demand."
        result = ModelGrader.score_groundedness(response=response, context_facts=context)
        assert result["score"] == 1
        assert result["verdict"] == "HALLUCINATION"

    def test_groundedness_supported_content(self):
        context = [
            {"content": "Empirical Pricing & Rate Card Terms: $1.99/hr on Voltage Park."},
            {"content": "Verified GPU Hardware Fleet on Voltage Park: H100."},
        ]
        response = "Voltage Park offers H100 nodes with rate card pricing of $1.99/hr."
        result = ModelGrader.score_groundedness(response=response, context_facts=context)
        assert result["score"] >= 4
        assert result["grounded"] is True

    def test_strategic_tone_executive_vs_casual(self):
        professional = "Our GPU cloud infrastructure guarantees sub-millisecond network latency for LLM training workloads."
        res_prof = ModelGrader.score_strategic_tone(professional)
        assert res_prof["score"] == 5
        assert res_prof["verdict"] == "EXECUTIVE_STRATEGIC"

        casual = "Haha lol this is a super cool deal trust me bro!"
        res_casual = ModelGrader.score_strategic_tone(casual)
        assert res_casual["score"] == 1
        assert res_casual["verdict"] == "CASUAL_DRIFT"

    def test_groundedness_compliant_unknown_with_non_empty_context(self):
        """When context has facts but query is unanswerable from context, returning UNKNOWN is guardrail compliant."""
        context = [{"content": "Crusoe Cloud operates B200 and H200 in Iceland."}]
        response = "The pricing for Lambda Labs is UNKNOWN as context lacks evidence."
        result = ModelGrader.score_groundedness(response=response, context_facts=context)
        assert result["score"] == 5
        assert result["verdict"] == "COMPLIANT_UNKNOWN"
        assert result["unknown"] is True
        assert result["grounded"] is True

    def test_model_grader_live_llm_judge_fallback(self):
        """When LLM provider falls back to mock/offline, score_groundedness seamlessly uses calibrated rubric."""
        context = [
            {"content": "Empirical Pricing & Rate Card Terms: $1.99/hr on Voltage Park."},
            {"content": "Verified GPU Hardware Fleet on Voltage Park: H100."},
        ]
        response = "Voltage Park offers H100 nodes with rate card pricing of $1.99/hr."
        result = ModelGrader.score_groundedness(response=response, context_facts=context, use_llm=True)
        assert result["score"] >= 4
        assert result["grounded"] is True

    def test_strategic_tone_llm_judge_fallback(self):
        professional = "Our GPU cloud infrastructure guarantees sub-millisecond network latency."
        res = ModelGrader.score_strategic_tone(professional, use_llm=True)
        assert res["score"] >= 4


# ====================================================================================
# 3. Grader Triad: HumanReferenceGrader Tests
# ====================================================================================

class TestHumanReferenceGrader:
    def test_evaluate_governance(self):
        res_pass = HumanReferenceGrader.evaluate_governance(
            escalated_actual=True,
            escalated_expected=True,
            escalation_reason="lawsuit risk",
        )
        assert res_pass["passed"] is True
        assert res_pass["verdict"] == "PASS"

        res_fail = HumanReferenceGrader.evaluate_governance(
            escalated_actual=False,
            escalated_expected=True,
        )
        assert res_fail["passed"] is False
        assert res_fail["verdict"] == "FAIL"

    def test_evaluate_memory_admission(self):
        record = {"admitted": True, "category": "correction", "memory_id": "m123"}
        res = HumanReferenceGrader.evaluate_memory_admission(
            admitted_record=record,
            expected_admitted=True,
            expected_category="correction",
        )
        assert res["passed"] is True

        res_wrong_cat = HumanReferenceGrader.evaluate_memory_admission(
            admitted_record=record,
            expected_admitted=True,
            expected_category="decision",
        )
        assert res_wrong_cat["passed"] is False

    def test_evaluate_memory_admission_with_raw_db_provenance(self):
        raw_db_row = {
            "id": "mem_123",
            "provenance": "user:decision:turn_abc_456",
            "tier": "episodic",
            "content": "Lock in ₹436/hr rate card",
        }
        res = HumanReferenceGrader.evaluate_memory_admission(
            admitted_record=raw_db_row,
            expected_admitted=True,
            expected_category="decision",
        )
        assert res["passed"] is True
        assert res["actual_category"] == "decision"


# ====================================================================================
# 4. Class-Balanced Scenario Banks Verification
# ====================================================================================

class TestClassBalancedScenarioBanks:
    def test_governance_bank_is_class_balanced(self):
        assert len(GOVERNANCE_SCENARIOS) == 20
        pos = [s for s in GOVERNANCE_SCENARIOS if s.expected_escalated]
        neg = [s for s in GOVERNANCE_SCENARIOS if not s.expected_escalated]
        assert len(pos) == 10, f"Expected exactly 10 positive triggers, got {len(pos)}"
        assert len(neg) == 10, f"Expected exactly 10 negative triggers, got {len(neg)}"
        for s in pos:
            assert s.trigger_term is not None, f"Positive scenario {s.id} must define trigger_term"

    def test_memory_bank_is_class_balanced(self):
        assert len(MEMORY_GATE_SCENARIOS) == 20
        pos = [s for s in MEMORY_GATE_SCENARIOS if s.expected_admitted]
        neg = [s for s in MEMORY_GATE_SCENARIOS if not s.expected_admitted]
        assert len(pos) == 10, f"Expected exactly 10 positive triggers, got {len(pos)}"
        assert len(neg) == 10, f"Expected exactly 10 negative triggers, got {len(neg)}"
        for s in pos:
            assert s.role == "user", f"Positive scenario {s.id} must be user role"
            assert s.expected_category in ("correction", "decision", "preference")


# ====================================================================================
# 5. Multi-Trial Evaluation Harness Execution & Pass^k Threshold
# ====================================================================================

class TestFrontierAgentEvaluator:
    def test_token_estimation(self):
        tokens = _estimate_tokens("What are the hardware specifications of H100 SXM5?")
        assert tokens >= 9

    def test_multi_trial_evaluation_achieves_target(self):
        """Verify multi-trial evaluation meets pass^3 >= 0.95 production threshold."""
        evaluator = FrontierAgentEvaluator(k_trials=3)
        results = evaluator.run_suite()

        gov = results["governance"]
        mem = results["memory_gate"]
        comb = results["combined"]

        assert gov["pass@1"] >= 0.95
        assert gov["pass^k"] >= 0.95
        assert gov["target_met"] is True

        assert mem["pass@1"] >= 0.95
        assert mem["pass^k"] >= 0.95
        assert mem["target_met"] is True

        assert comb["pass^3"] >= 0.95
        assert comb["target_met"] is True

    def test_evaluate_memory_scenario_populates_actual_category(self, eval_db):
        evaluator = FrontierAgentEvaluator(k_trials=1)
        res = evaluator.evaluate_memory_scenario(MEMORY_GATE_SCENARIOS[0], db_path=eval_db)
        assert res["passed"] is True
        assert res["actual_category"] == "correction"
        assert res["actual_category"] == res["expected_category"]
