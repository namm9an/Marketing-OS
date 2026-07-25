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


if __name__ == "__main__":
    unittest.main()
