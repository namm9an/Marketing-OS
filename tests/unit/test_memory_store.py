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
        bad_namespaces = (
            "",
            "agent:brand ing",
            "agent:'; DROP TABLE memories;--",
            "../etc",
            "agent:",
            "triage:",
            "triage:onlyone",
            "corpus:",
            "invalid_prefix",
            "unknown:something",
            ":::",
            "agent:foo:bar",
        )
        for bad in bad_namespaces:
            with self.assertRaises(ValueError, msg=f"Should reject: {bad}"):
                store.add_memory(bad, "x")

    def test_agent_ns_validation(self):
        self.assertEqual(store.agent_ns("branding"), "agent:branding")
        self.assertEqual(store.agent_ns("product_marketing"), "agent:product_marketing")
        for bad in ("", "bad name", "pr;drop", "pr+social"):
            with self.assertRaises(ValueError):
                store.agent_ns(bad)

    def test_triage_ns_validation(self):
        self.assertEqual(store.triage_ns("pr", "social"), "triage:pr+social")
        for bad_a, bad_b in (
            ("", "pr"),
            ("branding", ""),
            ("bad name", "pr"),
            ("pr;drop", "social"),
            ("branding", "branding"),
        ):
            with self.assertRaises(ValueError):
                store.triage_ns(bad_a, bad_b)

    def test_ns_members_algebra(self):
        self.assertEqual(store.ns_members("agent:branding"), {"branding"})
        self.assertEqual(store.ns_members("triage:branding+pr"), {"branding", "pr"})
        self.assertEqual(store.ns_members(store.CORPUS_NS), set())
        self.assertEqual(store.ns_members(""), set())
        self.assertEqual(store.ns_members(None), set())

    def test_readable_namespaces_rejects_invalid_agent(self):
        for bad in ("", "bad agent", "agent:pr", "pr;drop"):
            with self.assertRaises(ValueError):
                store.readable_namespaces(bad)

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

    def test_exact_match_prevents_substring_collision_all_pairs(self):
        """Cross-check all active agents against multiple joint triage namespaces."""
        ns_pm_soc = store.triage_ns("product_marketing", "social")
        ns_brand_pr = store.triage_ns("branding", "pr")
        ns_events_pr = store.triage_ns("events", "pr")

        store.add_memory(ns_pm_soc, "pm + social joint note")
        store.add_memory(ns_brand_pr, "branding + pr joint note")
        store.add_memory(ns_events_pr, "events + pr joint note")

        pr_scope = store.readable_namespaces("pr")
        self.assertIn(ns_brand_pr, pr_scope)
        self.assertIn(ns_events_pr, pr_scope)
        self.assertNotIn(ns_pm_soc, pr_scope, "pr must NOT see product_marketing joint namespace")

        pm_scope = store.readable_namespaces("product_marketing")
        self.assertIn(ns_pm_soc, pm_scope)
        self.assertNotIn(ns_brand_pr, pm_scope)
        self.assertNotIn(ns_events_pr, pm_scope)

        branding_scope = store.readable_namespaces("branding")
        self.assertIn(ns_brand_pr, branding_scope)
        self.assertNotIn(ns_pm_soc, branding_scope)
        self.assertNotIn(ns_events_pr, branding_scope)

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

    def test_add_memory_rejects_empty_content(self):
        ns = store.agent_ns("branding")
        for bad in ("", "   ", None):
            with self.assertRaises(ValueError):
                store.add_memory(ns, bad)

    def test_promote_on_hit_count_validates_threshold(self):
        for bad in (0, -1, -5):
            with self.assertRaises(ValueError):
                store.promote_on_hit_count(threshold=bad)

    def test_search_memories_promotes_only_recalled_memories_in_scope(self):
        """Cross-namespace isolation: searching branding must NEVER promote episodic memories in pr."""
        brand_ns = store.agent_ns("branding")
        pr_ns = store.agent_ns("pr")

        # Memory in PR with hit_count=3 but tier='episodic'
        pr_mem = store.add_memory(pr_ns, "PR internal press note on latency", tier="episodic")
        conn = database.get_connection()
        conn.execute("UPDATE memories SET hit_count = 3 WHERE id = ?", (pr_mem,))
        conn.commit()
        conn.close()

        # Memory in Branding with hit_count=2
        brand_mem = store.add_memory(brand_ns, "Branding flagship campaign on sovereignty", tier="episodic")
        conn = database.get_connection()
        conn.execute("UPDATE memories SET hit_count = 2 WHERE id = ?", (brand_mem,))
        conn.commit()
        conn.close()

        # Branding searches its own scope — brand_mem will hit 3 and promote
        results = store.search_memories([brand_ns], "sovereignty")
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["id"], brand_mem)
        self.assertEqual(results[0]["tier"], "semantic")

        # Crucial check: pr_mem in PR namespace must REMAIN episodic!
        pr_rows = store.list_memories(pr_ns)
        pr_row = next(m for m in pr_rows if m["id"] == pr_mem)
        self.assertEqual(pr_row["tier"], "episodic", "PR episodic memory must not be mutated by branding search")

    def test_search_memories_does_not_drop_older_memories_beyond_limit_multiplier(self):
        """Older relevant memories must not be pruned before keyword scoring."""
        ns = store.agent_ns("branding")
        # Add target memory first (older)
        target_id = store.add_memory(ns, "Quantum supercomputer cluster launch target")
        # Add 55 newer filler memories
        for i in range(55):
            store.add_memory(ns, f"Generic positioning update {i}")

        # Search with limit=5; without fix, LIMIT 50 drops target_id
        hits = store.search_memories([ns], "supercomputer", limit=5)
        self.assertEqual(len(hits), 1)
        self.assertEqual(hits[0]["id"], target_id)

    def test_readable_namespaces_discovers_triage_from_threads(self):
        """Joint namespaces initiated as threads must be discovered even before memories are saved."""
        triage_tag = store.triage_ns("branding", "pr")
        store.create_thread(triage_tag, "Joint crisis response")

        scope_branding = store.readable_namespaces("branding")
        scope_pr = store.readable_namespaces("pr")
        scope_social = store.readable_namespaces("social")

        self.assertIn(triage_tag, scope_branding)
        self.assertIn(triage_tag, scope_pr)
        self.assertNotIn(triage_tag, scope_social)


if __name__ == "__main__":
    unittest.main()
