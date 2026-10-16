"""
Unit tests for the promotion gate (Phase 9, M9.2).

The gate is what stops an agent's own prose becoming its own "memory" next session.
M5 already needed the equivalent guard on the corpus (`enriched_by NOT LIKE '%agent%'`),
so this failure mode is not hypothetical here.
"""

import sys
import tempfile
import unittest
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(BASE_DIR))

from app.core.config import settings
from app.db import database
from app.memory import gate, store


class TestPromotionGate(unittest.TestCase):
    # Per-test DB, not per-class: several of these assert a namespace is *empty*, which is
    # only meaningful if no sibling test has written to it first.
    def setUp(self):
        self._tmp = tempfile.TemporaryDirectory()
        self._real_path = settings.DB_PATH
        settings.DB_PATH = Path(self._tmp.name) / "gate_test.db"
        database.init_db(force=True)

    def tearDown(self):
        settings.DB_PATH = self._real_path
        database._INITIALIZED = False
        self._tmp.cleanup()

    # --- rule 1: only user-sourced signal ---

    def test_agent_prose_is_never_admitted(self):
        """The contamination defence. Agent output phrased exactly like a strong user
        preference must still be rejected — the rule is the speaker, not the wording."""
        ns = store.agent_ns("branding")
        verdict = gate.admit(ns, "agent", "Always position E2E on sovereignty, never on price.")
        self.assertFalse(verdict["admitted"])
        self.assertIsNone(verdict["memory_id"])
        self.assertEqual(store.list_memories(ns), [])

    def test_chatter_and_questions_are_discarded(self):
        ns = store.agent_ns("events")
        for content in ("ok thanks", "yes", "what tone should we use for the launch?",
                        "can you always include a benchmark?"):
            self.assertFalse(gate.admit(ns, "user", content)["admitted"], content)
        self.assertEqual(store.list_memories(ns), [])

    # --- rule 2: the three admitted categories ---

    def test_correction_is_admitted_with_high_confidence(self):
        ns = store.agent_ns("pr")
        verdict = gate.admit(ns, "user", "no, never frame this as a price war", turn_id="t1")
        self.assertTrue(verdict["admitted"])
        self.assertEqual(verdict["category"], "correction")
        self.assertEqual(verdict["tier"], "episodic")

        row = store.list_memories(ns)[0]
        self.assertEqual(row["confidence"], "high")
        self.assertEqual(row["provenance"], "user:correction:t1")

    def test_stated_preference_is_admitted(self):
        ns = store.agent_ns("social")
        verdict = gate.admit(ns, "user", "from now on our tone stays developer-first")
        self.assertEqual(verdict["category"], "preference")
        self.assertEqual(store.list_memories(ns)[0]["confidence"], "medium")

    def test_ratified_decision_is_admitted(self):
        ns = store.agent_ns("product_marketing")
        verdict = gate.admit(ns, "user", "approved — go with the sovereign-cloud battlecard")
        self.assertEqual(verdict["category"], "decision")
        self.assertTrue(verdict["admitted"])

    def test_a_correction_phrased_as_a_question_still_counts(self):
        """Questions are dropped, but 'didn't we say never to do that?' is a correction."""
        ns = store.agent_ns("branding")
        self.assertTrue(
            gate.admit(ns, "user", "don't we already avoid the price-war framing?")["admitted"]
        )

    # --- repetition -> semantic ---

    def test_third_occurrence_is_promoted_to_semantic(self):
        ns = store.agent_ns("pr")
        first = gate.admit(ns, "user", "always lead the Nebius response with sovereignty (a)")
        second = gate.admit(ns, "user", "always lead the Nebius response with sovereignty (b)")
        third = gate.admit(ns, "user", "always lead the Nebius response with sovereignty (c)")
        self.assertEqual([first["tier"], second["tier"], third["tier"]],
                         ["episodic", "episodic", "semantic"])

    def test_verbatim_restatement_promotes_in_place_without_duplicating(self):
        ns = store.agent_ns("events")
        first = gate.admit(ns, "user", "never schedule a summit during Diwali week")
        before = len(store.list_memories(ns))
        again = gate.admit(ns, "user", "Never schedule a summit during Diwali week.")

        self.assertEqual(again["memory_id"], first["memory_id"])
        self.assertEqual(again["tier"], "semantic")
        self.assertEqual(len(store.list_memories(ns)), before)

    # --- the gate respects the isolation boundary ---

    def test_gate_writes_only_to_the_namespace_it_was_given(self):
        gate.admit(store.agent_ns("branding"), "user", "never use the phrase 'cheapest GPUs'")
        self.assertEqual(
            store.search_memories(store.readable_namespaces("social"), "cheapest GPUs"), []
        )

    # --- hardened admission & promotion tests (Commit 13) ---

    def test_mandatory_user_role_blocks_model_and_system_prose(self):
        """Rule 1: Only role == 'user' is admitted. All model/agent/system prose is blocked."""
        ns = store.agent_ns("pr")
        prose_candidates = [
            ("agent", "Always position our GPUs on sovereignty, never on price."),
            ("assistant", "We have decided to ship the new battlecard immediately."),
            ("model", "No, do not mention competitor benchmarks in press releases."),
            ("system", "Our tone should always be developer-first and authoritative."),
            ("bot", "Approved — go with the sovereign cloud messaging."),
            ("", "Always position our GPUs on sovereignty, never on price."),
            (None, "Always position our GPUs on sovereignty, never on price."),
        ]
        for role, text in prose_candidates:
            verdict = gate.admit(ns, role, text)
            self.assertFalse(verdict["admitted"], f"Role '{role}' must be blocked")
            self.assertIsNone(verdict["memory_id"])
            self.assertIn("blocked", verdict["reason"].lower())
        self.assertEqual(store.list_memories(ns), [])

    def test_regex_intent_classifiers_verification(self):
        """Verify regex patterns for correction, decision, and preference categories."""
        ns = store.agent_ns("product_marketing")
        
        # Corrections (high confidence)
        corrections = [
            "no, never compare our nodes on raw price",
            "don't highlight competitor benchmarks",
            "avoid mentioning spot pricing",
            "wrong architecture cited in the copy",
            "not cheap but sovereign and resilient",
        ]
        for text in corrections:
            verdict = gate.admit(ns, "user", text)
            self.assertTrue(verdict["admitted"], f"Failed to admit correction: {text}")
            self.assertEqual(verdict["category"], "correction")

        # Decisions (high confidence)
        decisions = [
            "approved — go with the hybrid cloud battlecard",
            "ratified the enterprise messaging strategy",
            "we have decided on the multi-cloud approach",
            "ship it without the price comparison",
            "lock in the sovereign cloud positioning",
        ]
        for text in decisions:
            verdict = gate.admit(ns, "user", text)
            self.assertTrue(verdict["admitted"], f"Failed to admit decision: {text}")
            self.assertEqual(verdict["category"], "decision")

        # Preferences (medium confidence)
        preferences = [
            "our tone should be assertive and technical",
            "developer-first messaging on B200 hardware",
            "from now on prioritize data sovereignty in India",
            "remember that our brand voice is engineering-centric",
            "we prefer long-term stability over spot discounts",
        ]
        for text in preferences:
            verdict = gate.admit(ns, "user", text)
            self.assertTrue(verdict["admitted"], f"Failed to admit preference: {text}")
            self.assertEqual(verdict["category"], "preference")

    def test_episodic_to_semantic_promotion_on_hit_count_threshold(self):
        """Validate episodic -> semantic promotion when hit_count >= 3."""
        ns = store.agent_ns("social")
        verdict = gate.admit(ns, "user", "remember that latency is our key differentiator")
        self.assertTrue(verdict["admitted"])
        mem_id = verdict["memory_id"]
        self.assertEqual(verdict["tier"], "episodic")

        # Initial check
        row = next(m for m in store.list_memories(ns) if m["id"] == mem_id)
        self.assertEqual(row["tier"], "episodic")
        self.assertEqual(row["hit_count"], 0)

        # Hit 1
        res1 = store.search_memories([ns], "latency")
        self.assertEqual(len(res1), 1)
        self.assertEqual(res1[0]["hit_count"], 1)
        self.assertEqual(res1[0]["tier"], "episodic")

        # Hit 2
        res2 = store.search_memories([ns], "latency")
        self.assertEqual(len(res2), 1)
        self.assertEqual(res2[0]["hit_count"], 2)
        self.assertEqual(res2[0]["tier"], "episodic")

        # Hit 3: must promote to semantic!
        res3 = store.search_memories([ns], "latency")
        self.assertEqual(len(res3), 1)
        self.assertEqual(res3[0]["hit_count"], 3)
        self.assertEqual(res3[0]["tier"], "semantic")

        # Verify persisted state in SQLite WAL
        row_final = next(m for m in store.list_memories(ns) if m["id"] == mem_id)
        self.assertEqual(row_final["tier"], "semantic")
        self.assertEqual(row_final["hit_count"], 3)

    def test_check_hit_count_promotion_helper(self):
        """Test gate.check_hit_count_promotion evaluates episodic rows properly."""
        ns = store.agent_ns("branding")
        mem_id = store.add_memory(ns, "sovereign enterprise priority", tier="episodic")

        conn = database.get_connection()
        conn.execute("UPDATE memories SET hit_count = 2 WHERE id = ?", (mem_id,))
        conn.commit()
        conn.close()

        # hit_count = 2 < 3 -> should NOT promote
        promoted = gate.check_hit_count_promotion(mem_id, threshold=3)
        self.assertFalse(promoted)
        self.assertEqual(store.list_memories(ns)[0]["tier"], "episodic")

        # hit_count = 3 >= 3 -> should promote
        conn = database.get_connection()
        conn.execute("UPDATE memories SET hit_count = 3 WHERE id = ?", (mem_id,))
        conn.commit()
        conn.close()

        promoted = gate.check_hit_count_promotion(mem_id, threshold=3)
        self.assertTrue(promoted)
        self.assertEqual(store.list_memories(ns)[0]["tier"], "semantic")

    def test_store_promote_on_hit_count_batch(self):
        """Test store.promote_on_hit_count batch updates all qualifying memories."""
        ns = store.agent_ns("events")
        m1 = store.add_memory(ns, "note 1 with low hits", tier="episodic")
        m2 = store.add_memory(ns, "note 2 with three hits", tier="episodic")
        m3 = store.add_memory(ns, "note 3 with four hits", tier="episodic")

        conn = database.get_connection()
        conn.execute("UPDATE memories SET hit_count = 1 WHERE id = ?", (m1,))
        conn.execute("UPDATE memories SET hit_count = 3 WHERE id = ?", (m2,))
        conn.execute("UPDATE memories SET hit_count = 4 WHERE id = ?", (m3,))
        conn.commit()
        conn.close()

        promoted_count = store.promote_on_hit_count(threshold=3, namespace=ns)
        self.assertEqual(promoted_count, 2)

        memories = {m["id"]: m for m in store.list_memories(ns)}
        self.assertEqual(memories[m1]["tier"], "episodic")
        self.assertEqual(memories[m2]["tier"], "semantic")
        self.assertEqual(memories[m3]["tier"], "semantic")

    def test_admit_validates_namespace_upfront(self):
        """Namespace validation must trigger immediately regardless of role or text."""
        bad_namespaces = ("invalid with spaces", "bad:prefix", "agent:'; DROP TABLE memories;--", "")
        for bad in bad_namespaces:
            with self.assertRaises(ValueError):
                gate.admit(bad, "agent", "Some prose")
            with self.assertRaises(ValueError):
                gate.admit(bad, "user", "ok thanks")
            with self.assertRaises(ValueError):
                gate.admit(bad, "user", "never frame this as a price war")

    def test_intent_classifiers_extended_punctuation_and_morphology(self):
        """Verify robust handling of punctuation (commas), multi-word phrases, and morphology."""
        ns = store.agent_ns("product_marketing")

        # Corrections with comma and multi-word phrase
        v1 = gate.admit(ns, "user", "not cheap, but sovereign and reliable")
        self.assertTrue(v1["admitted"])
        self.assertEqual(v1["category"], "correction")

        v2 = gate.admit(ns, "user", "not on raw price, but on data residency")
        self.assertTrue(v2["admitted"])
        self.assertEqual(v2["category"], "correction")

        # Preference with 3rd-person singular 'prefers'
        v3 = gate.admit(ns, "user", "the CMO prefers sovereign cloud infrastructure")
        self.assertTrue(v3["admitted"])
        self.assertEqual(v3["category"], "preference")

        # Decision with 'lock that in'
        v4 = gate.admit(ns, "user", "lock that in for the Q4 launch")
        self.assertTrue(v4["admitted"])
        self.assertEqual(v4["category"], "decision")


if __name__ == "__main__":
    unittest.main()
