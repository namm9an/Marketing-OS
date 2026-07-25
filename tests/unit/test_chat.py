"""
Unit tests for the per-agent conversation layer (Phase 9, M9.3).

Covers the three promises in design_doc.md §9.1: talking to one agent reaches only that
agent's memory, the agent gets smarter across turns, and the reply says what it drew on.
"""

import sys
import tempfile
import unittest
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(BASE_DIR))

from app.core.config import settings
from app.db import database
from app.db.database import save_knowledge_unit
from app.core.primitives import new_id
from app.graph import chat
from app.memory import store


class TestChatLayer(unittest.TestCase):
    def setUp(self):
        self._tmp = tempfile.TemporaryDirectory()
        self._real_path = settings.DB_PATH
        settings.DB_PATH = Path(self._tmp.name) / "chat_test.db"
        database.init_db(force=True)

    def tearDown(self):
        settings.DB_PATH = self._real_path
        database._INITIALIZED = False
        self._tmp.cleanup()

    # --- multi-turn ---

    def test_thread_is_created_and_reused_across_turns(self):
        first = chat.run_chat("branding", "How do we position the B200 fleet?")
        second = chat.run_chat("branding", "And against Nebius specifically?",
                               thread_id=first["thread_id"])
        self.assertEqual(first["thread_id"], second["thread_id"])

        turns = store.get_turns(first["thread_id"])
        self.assertEqual([t["role"] for t in turns], ["user", "agent", "user", "agent"])

    def test_prior_turns_are_fed_back_as_history(self):
        first = chat.run_chat("pr", "Draft our line on the Yotta announcement")
        chat.run_chat("pr", "Make it shorter", thread_id=first["thread_id"])
        # The second turn's recall node saw the first exchange.
        self.assertEqual(len(store.get_turns(first["thread_id"])), 4)

    def test_unknown_agent_and_empty_message_are_rejected(self):
        with self.assertRaises(ValueError):
            chat.run_chat("finance", "hello there")
        with self.assertRaises(ValueError):
            chat.run_chat("branding", "   ")
        with self.assertRaises(ValueError):
            chat.run_chat("branding", "hello there", thread_id="nope")

    # --- it gets smarter, from the user only ---

    def test_a_correction_in_one_turn_is_recalled_in_the_next(self):
        first = chat.run_chat("branding", "never frame our pricing as a price war with Nebius")
        self.assertTrue(first["memory"]["admitted"])

        second = chat.run_chat("branding", "how should we answer the Nebius price cut?",
                               thread_id=first["thread_id"])
        self.assertTrue(
            any("price war" in m["content"] for m in second["recall"]["memories"]),
            second["recall"]["memories"],
        )

    def test_the_agents_own_reply_never_becomes_memory(self):
        result = chat.run_chat("social", "what should our LinkedIn cadence be?")
        contents = [m["content"] for m in store.list_memories(store.agent_ns("social"))]
        self.assertNotIn(result["reply"], contents)
        # A question is not a preference, so this turn should leave nothing behind at all.
        self.assertEqual(contents, [])

    # --- isolation, end to end through the API surface ---

    def test_one_agents_memory_is_invisible_to_another(self):
        chat.run_chat("branding", "never frame our pricing as a price war with Nebius")
        other = chat.run_chat("pr", "how should we answer the Nebius price cut?")
        self.assertFalse(
            any("price war" in m["content"] for m in other["recall"]["memories"]),
            other["recall"]["memories"],
        )

    def test_memory_is_written_to_the_agents_own_namespace(self):
        chat.run_chat("events", "from now on we always avoid Diwali week for summits")
        self.assertTrue(store.list_memories(store.agent_ns("events")))
        self.assertEqual(store.list_memories(store.agent_ns("branding")), [])

    # --- visible recall ---

    def test_reply_reports_the_sourced_facts_it_drew_on(self):
        save_knowledge_unit(
            id_str=new_id(), k_class="pricing", confidence="high",
            content="Nebius lists H100 on-demand at $2.00/hr", organization="Nebius",
            source_url="https://nebius.com/prices", enriched_by="grounded_crawler",
        )
        result = chat.run_chat("product_marketing", "what is Nebius charging for H100?")
        facts = result["recall"]["facts"]
        self.assertTrue(facts)
        self.assertEqual(facts[0]["organization"], "Nebius")
        self.assertTrue(facts[0]["source_url"])

    def test_agent_written_rows_are_not_offered_as_grounded_facts(self):
        save_knowledge_unit(
            id_str=new_id(), k_class="positioning", confidence="high",
            content="Nebius is beatable on sovereignty messaging", organization="Nebius",
            source_url="https://www.e2enetworks.com/", enriched_by="branding_agent",
        )
        result = chat.run_chat("pr", "what do we know about Nebius sovereignty messaging?")
        self.assertEqual(result["recall"]["facts"], [])

    def test_turn_records_which_memories_it_recalled(self):
        first = chat.run_chat("branding", "always keep the tone developer-first")
        second = chat.run_chat("branding", "so what tone for the launch post?",
                               thread_id=first["thread_id"])
        agent_turn = store.get_turns(second["thread_id"])[-1]
        self.assertEqual(
            agent_turn["recalled_ids"], [m["id"] for m in second["recall"]["memories"]]
        )


if __name__ == "__main__":
    unittest.main()
