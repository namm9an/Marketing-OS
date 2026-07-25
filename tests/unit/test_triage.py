"""
Unit tests for the /triage bridge (Phase 9, M9.5) — design_doc.md §9.7.

The guarantee under test is step 4: the turn is written to `triage:a+b` and to **neither
private namespace**. Writing back into both would look like a feature and would re-create
the cross-contamination /triage exists to prevent, one turn later — so it is asserted
directly, from both ends, rather than inferred from the code shape.
"""

import sys
import tempfile
import unittest
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(BASE_DIR))

from app.core.config import settings
from app.core.primitives import new_id
from app.db import database
from app.db.database import save_knowledge_unit
from app.graph import chat, triage
from app.memory import store


class TestTriageBridge(unittest.TestCase):
    def setUp(self):
        self._tmp = tempfile.TemporaryDirectory()
        self._real_path = settings.DB_PATH
        settings.DB_PATH = Path(self._tmp.name) / "triage_test.db"
        database.init_db(force=True)

    def tearDown(self):
        settings.DB_PATH = self._real_path
        database._INITIALIZED = False
        self._tmp.cleanup()

    # --- the load-bearing guarantee ---

    def test_the_turn_is_written_to_the_pair_and_to_neither_private_namespace(self):
        res = triage.run_triage(["branding", "pr"], "never concede on price when Nebius cuts")
        self.assertTrue(res["memory"]["admitted"])
        self.assertEqual(res["namespace"], "triage:branding+pr")

        self.assertTrue(store.list_memories("triage:branding+pr"))
        self.assertEqual(store.list_memories(store.agent_ns("branding")), [])
        self.assertEqual(store.list_memories(store.agent_ns("pr")), [])

    def test_neither_agent_reads_the_others_private_memory_during_triage(self):
        chat.run_chat("branding", "always keep our Nebius tone developer-first")
        chat.run_chat("pr", "never lead a Nebius response with a rebuttal")

        res = triage.run_triage(["branding", "pr"], "how do we answer the Nebius price cut?")
        seen = {v["agent"]: [m["content"] for m in v["recall"]["memories"]] for v in res["views"]}

        self.assertTrue(any("developer-first" in c for c in seen["branding"]), seen)
        self.assertFalse(any("rebuttal" in c for c in seen["branding"]), seen)
        self.assertTrue(any("rebuttal" in c for c in seen["pr"]), seen)
        self.assertFalse(any("developer-first" in c for c in seen["pr"]), seen)

    def test_joint_memory_is_readable_by_both_members_and_by_nobody_else(self):
        """The pair accumulates shared history — that is the point of writing it somewhere."""
        triage.run_triage(["branding", "pr"], "always cite the sovereignty angle against Nebius")

        for agent in ("branding", "pr"):
            recalled = chat.run_chat(agent, "what is our line on Nebius?")["recall"]["memories"]
            self.assertTrue(any("sovereignty" in m["content"] for m in recalled), agent)

        outsider = chat.run_chat("events", "what is our line on Nebius?")["recall"]["memories"]
        self.assertFalse(any("sovereignty" in m["content"] for m in outsider), outsider)

    def test_a_solo_turn_after_triage_does_not_inherit_the_other_agents_voice(self):
        """The contamination this prevents, stated as the behaviour a user would notice."""
        chat.run_chat("pr", "never lead a Nebius response with a rebuttal")
        triage.run_triage(["branding", "pr"], "how do we answer the Nebius price cut?")

        solo = chat.run_chat("branding", "draft the Nebius response")["recall"]["memories"]
        self.assertFalse(any("rebuttal" in m["content"] for m in solo), solo)

    # --- shape and attribution ---

    def test_both_views_are_returned_attributed_and_in_the_order_asked(self):
        res = triage.run_triage(["pr", "branding"], "how do we answer the Nebius price cut?")
        self.assertEqual([v["agent"] for v in res["views"]], ["pr", "branding"])
        for view in res["views"]:
            self.assertTrue(view["view"].strip())
            self.assertIn("memories", view["recall"])
            self.assertIn("facts", view["recall"])
        for key in ("answer", "agreements", "tensions", "recommended_action"):
            self.assertIn(key, res)
        self.assertTrue(res["answer"].strip())

    def test_the_pair_tag_is_stable_whichever_order_the_agents_are_named(self):
        a = triage.run_triage(["pr", "branding"], "first question about Nebius pricing")
        b = triage.run_triage(["branding", "pr"], "second question about Nebius pricing")
        self.assertEqual(a["namespace"], b["namespace"])
        self.assertEqual(a["namespace"], "triage:branding+pr")

    def test_each_view_is_grounded_in_the_sourced_corpus(self):
        save_knowledge_unit(
            id_str=new_id(), k_class="pricing", confidence="high",
            content="Nebius lists H100 on-demand at $2.00/hr", organization="Nebius",
            source_url="https://nebius.com/prices", enriched_by="grounded_crawler",
        )
        res = triage.run_triage(["branding", "pr"], "what is Nebius charging for H100?")
        for view in res["views"]:
            self.assertEqual(view["recall"]["facts"][0]["organization"], "Nebius")
            self.assertTrue(view["recall"]["facts"][0]["source_url"])

    # --- threads ---

    def test_a_triage_thread_is_reused_and_belongs_to_one_pair(self):
        first = triage.run_triage(["branding", "pr"], "how do we answer the Nebius cut?")
        second = triage.run_triage(["branding", "pr"], "and the follow-up post?",
                                   thread_id=first["thread_id"])
        self.assertEqual(first["thread_id"], second["thread_id"])
        self.assertEqual([t["role"] for t in store.get_turns(first["thread_id"])],
                         ["user", "agent", "user", "agent"])

        # Continuing it as a different pair would file this pair's history under another's.
        with self.assertRaises(ValueError):
            triage.run_triage(["branding", "social"], "hijack", thread_id=first["thread_id"])

    def test_the_user_question_is_recorded_once_not_once_per_agent(self):
        res = triage.run_triage(["branding", "pr"], "how do we answer the Nebius cut?")
        turns = store.get_turns(res["thread_id"])
        self.assertEqual([t["role"] for t in turns], ["user", "agent"])

    # --- rejected input ---

    def test_triage_requires_exactly_two_different_known_agents(self):
        for agents in (["branding"], ["branding", "pr", "social"], ["branding", "branding"],
                       ["branding", "finance"], []):
            with self.assertRaises(ValueError, msg=agents):
                triage.run_triage(agents, "how do we answer the Nebius cut?")
        with self.assertRaises(ValueError):
            triage.run_triage(["branding", "pr"], "   ")
        with self.assertRaises(ValueError):
            triage.run_triage(["branding", "pr"], "valid question", thread_id="nope")


if __name__ == "__main__":
    unittest.main()
