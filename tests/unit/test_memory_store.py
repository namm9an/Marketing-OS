"""
Unit tests for the namespace-scoped memory store (Phase 9, M9.1).

These run against a throwaway SQLite file rather than the real marketing_os.db:
readable_namespaces() scans every triage namespace that exists, so assertions would
be at the mercy of whatever earlier runs left behind.
"""

import sys
import tempfile
import unittest
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(BASE_DIR))

from app.core.config import settings
from app.db import database
from app.memory import store


class TestMemoryStore(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls._tmp = tempfile.TemporaryDirectory()
        cls._real_path = settings.DB_PATH
        settings.DB_PATH = Path(cls._tmp.name) / "memory_test.db"
        database.init_db(force=True)

    @classmethod
    def tearDownClass(cls):
        settings.DB_PATH = cls._real_path
        database._INITIALIZED = False
        cls._tmp.cleanup()

    # --- namespace algebra ---

    def test_triage_tag_is_order_stable(self):
        self.assertEqual(store.triage_ns("pr", "branding"), "triage:branding+pr")
        self.assertEqual(store.triage_ns("branding", "pr"), "triage:branding+pr")

    def test_invalid_namespace_rejected(self):
        for bad in ("", "agent:brand ing", "agent:'; DROP TABLE memories;--", "../etc"):
            with self.assertRaises(ValueError):
                store.add_memory(bad, "x")

    # --- the isolation rule ---

    def test_agent_cannot_read_another_agents_private_memory(self):
        store.add_memory(store.agent_ns("branding"), "CMO rejected price-war framing on Nebius")
        self.assertTrue(store.search_memories(store.readable_namespaces("branding"), "Nebius"))
        self.assertEqual(store.search_memories(store.readable_namespaces("pr"), "Nebius"), [])

    def test_joint_namespace_membership_is_exact_not_substring(self):
        """'pr' is a substring of 'product_marketing'. A LIKE-based scope check would hand
        the PR agent triage:product_marketing+social — the exact leak /triage prevents."""
        ns = store.triage_ns("product_marketing", "social")
        store.add_memory(ns, "joint launch narrative agreed")
        self.assertNotIn(ns, store.readable_namespaces("pr"))
        self.assertIn(ns, store.readable_namespaces("social"))
        self.assertIn(ns, store.readable_namespaces("product_marketing"))

    def test_scope_is_shared_plus_own_private_plus_own_joint(self):
        scope = store.readable_namespaces("events")
        self.assertEqual(scope[:2], [store.CORPUS_NS, "agent:events"])
        self.assertFalse([ns for ns in scope if ns.startswith("agent:") and ns != "agent:events"])

    def test_corpus_is_readable_by_every_agent(self):
        store.add_memory(store.CORPUS_NS, "Yotta operates a Shakti GPU cloud in Hyderabad")
        for agent in ("branding", "pr", "social", "product_marketing", "events"):
            self.assertTrue(
                store.search_memories(store.readable_namespaces(agent), "Shakti Hyderabad"),
                f"{agent} must be able to read the shared corpus",
            )

    # --- recall behaviour ---

    def test_semantic_outranks_episodic_at_equal_keyword_score(self):
        ns = store.agent_ns("social")
        store.add_memory(ns, "LinkedIn thread idea about B200 benchmarks", tier="episodic")
        store.add_memory(ns, "tone preference: B200 posts stay developer-first", tier="semantic")
        top = store.search_memories([ns], "B200", limit=2)[0]
        self.assertEqual(top["tier"], "semantic")

    def test_recall_increments_hit_count(self):
        ns = store.agent_ns("product_marketing")
        mem_id = store.add_memory(ns, "battlecard framing versus CoreWeave InfiniBand")
        store.search_memories([ns], "CoreWeave InfiniBand")
        row = next(m for m in store.list_memories(ns) if m["id"] == mem_id)
        self.assertEqual(row["hit_count"], 1)
        self.assertIsNotNone(row["last_used_at"])

    # --- conversation persistence ---

    def test_thread_and_turns_round_trip_in_order(self):
        thread_id = store.create_thread(store.agent_ns("branding"), "Nebius response")
        store.add_turn(thread_id, "user", "How do we answer the Nebius price cut?")
        store.add_turn(thread_id, "agent", "Lead on sovereignty, not price.", recalled_ids=["m1", "m2"])

        turns = store.get_turns(thread_id)
        self.assertEqual([t["role"] for t in turns], ["user", "agent"])
        self.assertEqual(turns[1]["recalled_ids"], ["m1", "m2"])
        self.assertEqual(store.get_thread(thread_id)["namespace"], "agent:branding")

    def test_threads_are_listed_per_namespace(self):
        store.create_thread(store.agent_ns("events"), "Hackathon Q3")
        self.assertTrue(store.list_threads(store.agent_ns("events")))
        self.assertEqual(store.list_threads(store.agent_ns("pr")), [])


if __name__ == "__main__":
    unittest.main()
