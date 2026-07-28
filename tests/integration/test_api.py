"""
Integration Tests for Flask REST API Routers
"""

import sys
import json
import tempfile
import unittest
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(BASE_DIR))

from app.core.config import settings
from app.db import database
from app.main import app
from app.agents.base import ACTIVE_AGENTS

class TestAPIRoutes(unittest.TestCase):
    def setUp(self):
        self.client = app.test_client()
        # Protected routes now require the session cookie; the test client persists it.
        self.client.post(
            '/api/login',
            data=json.dumps({"username": "admin", "password": "marketing2026"}),
            content_type='application/json',
        )

    def test_run_requires_auth(self):
        anon = app.test_client()
        res = anon.post('/api/run', data=json.dumps({"goal": "x"}), content_type='application/json')
        self.assertEqual(res.status_code, 401)

    def test_health_check(self):
        res = self.client.get('/api/health')
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)
        self.assertEqual(data.get("status"), "healthy")

    def test_run_agent_pipeline(self):
        payload = {
            "goal": "Position E2E Networks B200 GPU infrastructure for Indian AI startups",
            "provider": "gemini-3.6-flash",
            "agent_type": "branding"
        }
        res = self.client.post('/api/run', data=json.dumps(payload), content_type='application/json')
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)
        self.assertTrue(data.get("success"))
        self.assertIn("decision", data)

    def test_decision_history_endpoint(self):
        res = self.client.get('/api/history')
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)
        self.assertIn("history", data)

    def test_digest_network_endpoint(self):
        """Shape must match what CompetitorNetwork.jsx reads — a contract break here
        renders an empty graph silently (the B3/B4 failure mode)."""
        res = self.client.get('/api/digest/network')
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)
        self.assertIn("nodes", data)
        self.assertIn("links", data)
        self.assertIn("total_facts", data)
        competitor = next(n for n in data["nodes"] if n["group"] == "competitor")
        for key in ("id", "fact_count", "classes", "citations"):
            self.assertIn(key, competitor)
        for key in ("content", "source_url"):
            self.assertIn(key, competitor["citations"][0])

    def test_digest_endpoint(self):
        res = self.client.post(
            '/api/digest', data=json.dumps({"provider": "gemini-3.6-flash"}),
            content_type='application/json',
        )
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)
        # Every field the Weekly Digest tab renders.
        for key in ("headline", "executive_summary", "competitor_movements",
                    "recommended_actions", "agent_briefs", "network", "citations",
                    "generated_at"):
            self.assertIn(key, data)
        self.assertEqual(len(data["agent_briefs"]), len(ACTIVE_AGENTS))
        for key in ("agent", "headline", "finding", "confidence"):
            self.assertIn(key, data["agent_briefs"][0])

    def test_digest_requires_auth(self):
        anon = app.test_client()
        self.assertEqual(anon.get('/api/digest/network').status_code, 401)
        self.assertEqual(
            anon.post('/api/digest', data=json.dumps({}), content_type='application/json').status_code,
            401,
        )

class TestChatRoutes(unittest.TestCase):
    """Phase 9 M9.3. Runs on a throwaway DB — these routes write real conversations and
    real memories, which have no business landing in the CMO's actual knowledge base."""

    def setUp(self):
        self._tmp = tempfile.TemporaryDirectory()
        self._real_path = settings.DB_PATH
        settings.DB_PATH = Path(self._tmp.name) / "api_chat_test.db"
        database.init_db(force=True)
        self.client = app.test_client()
        self.client.post(
            '/api/login',
            data=json.dumps({"username": "admin", "password": "marketing2026"}),
            content_type='application/json',
        )

    def tearDown(self):
        settings.DB_PATH = self._real_path
        database._INITIALIZED = False
        self._tmp.cleanup()

    def _chat(self, **payload):
        return self.client.post('/api/chat', data=json.dumps(payload), content_type='application/json')

    def test_chat_requires_auth(self):
        anon = app.test_client()
        for path in ('/api/chat/threads', '/api/memory'):
            self.assertEqual(anon.get(path).status_code, 401, path)
        self.assertEqual(
            anon.post('/api/chat', data=json.dumps({}), content_type='application/json').status_code,
            401,
        )

    def test_chat_response_shape(self):
        """Every field the chat panel renders — a break here empties the UI silently."""
        res = self._chat(agent="branding", message="How do we position B200 against Nebius?")
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)
        for key in ("success", "agent", "namespace", "thread_id", "reply", "recall", "memory"):
            self.assertIn(key, data)
        self.assertEqual(data["namespace"], "agent:branding")
        self.assertIn("memories", data["recall"])
        self.assertIn("facts", data["recall"])

    def test_bad_request_is_400_not_500(self):
        self.assertEqual(self._chat(agent="finance", message="hi there").status_code, 400)
        self.assertEqual(self._chat(agent="branding", message="").status_code, 400)
        self.assertEqual(self.client.get('/api/chat/threads?agent=finance').status_code, 400)
        self.assertEqual(self.client.get('/api/chat/thread/nope').status_code, 404)

    def test_threads_and_transcript_are_listed_per_agent(self):
        thread_id = json.loads(self._chat(agent="pr", message="Draft our Yotta line").data)["thread_id"]

        listed = json.loads(self.client.get('/api/chat/threads?agent=pr').data)
        self.assertEqual([t["id"] for t in listed["threads"]], [thread_id])
        self.assertEqual(json.loads(self.client.get('/api/chat/threads?agent=events').data)["threads"], [])

        transcript = json.loads(self.client.get(f'/api/chat/thread/{thread_id}').data)
        self.assertEqual([t["role"] for t in transcript["turns"]], ["user", "agent"])

    def test_memory_endpoint_shows_only_that_agents_memory(self):
        self._chat(agent="branding", message="never frame our pricing as a price war")

        mine = json.loads(self.client.get('/api/memory?agent=branding').data)
        self.assertEqual(mine["namespace"], "agent:branding")
        self.assertTrue(any("price war" in m["content"] for m in mine["memories"]))

        theirs = json.loads(self.client.get('/api/memory?agent=pr').data)
        self.assertEqual(theirs["memories"], [])


class TestTriageRoutes(unittest.TestCase):
    """Phase 9 M9.5. Throwaway DB — same reason as TestChatRoutes."""

    def setUp(self):
        self._tmp = tempfile.TemporaryDirectory()
        self._real_path = settings.DB_PATH
        settings.DB_PATH = Path(self._tmp.name) / "api_triage_test.db"
        database.init_db(force=True)
        self.client = app.test_client()
        self.client.post(
            '/api/login',
            data=json.dumps({"username": "admin", "password": "marketing2026"}),
            content_type='application/json',
        )

    def tearDown(self):
        settings.DB_PATH = self._real_path
        database._INITIALIZED = False
        self._tmp.cleanup()

    def _triage(self, **payload):
        return self.client.post('/api/triage', data=json.dumps(payload),
                                content_type='application/json')

    def test_triage_requires_auth(self):
        anon = app.test_client()
        res = anon.post('/api/triage', data=json.dumps({}), content_type='application/json')
        self.assertEqual(res.status_code, 401)

    def test_triage_response_shape(self):
        res = self._triage(agents=["branding", "pr"], message="How do we answer the Nebius cut?")
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)
        for key in ("success", "agents", "namespace", "thread_id", "answer",
                    "agreements", "tensions", "recommended_action", "views", "memory"):
            self.assertIn(key, data)
        self.assertEqual(data["namespace"], "triage:branding+pr")
        self.assertEqual([v["agent"] for v in data["views"]], ["branding", "pr"])

    def test_bad_pair_is_400_not_500(self):
        for agents in (["branding"], ["branding", "finance"], ["branding", "branding"]):
            self.assertEqual(self._triage(agents=agents, message="hi there").status_code, 400, agents)
        self.assertEqual(self._triage(agents=["branding", "pr"], message="").status_code, 400)
        self.assertEqual(self.client.get('/api/memory?agents=branding').status_code, 400)

    def test_joint_memory_is_inspectable_without_exposing_either_private_side(self):
        self._triage(agents=["branding", "pr"], message="always cite sovereignty against Nebius")

        joint = json.loads(self.client.get('/api/memory?agents=pr,branding').data)
        self.assertEqual(joint["namespace"], "triage:branding+pr")
        self.assertTrue(any("sovereignty" in m["content"] for m in joint["memories"]))

        for agent in ("branding", "pr"):
            private = json.loads(self.client.get(f'/api/memory?agent={agent}').data)
            self.assertEqual(private["memories"], [], agent)

    def test_triage_threads_are_listed_under_the_pair_not_either_agent(self):
        thread_id = json.loads(
            self._triage(agents=["branding", "pr"], message="How do we answer Nebius?").data
        )["thread_id"]

        joint = json.loads(self.client.get('/api/chat/threads?agents=branding,pr').data)
        self.assertEqual([t["id"] for t in joint["threads"]], [thread_id])
        self.assertEqual(json.loads(self.client.get('/api/chat/threads?agent=branding').data)["threads"], [])


if __name__ == "__main__":
    unittest.main()
