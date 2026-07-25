"""
Integration Tests for Flask REST API Routers
"""

import sys
import json
import unittest
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(BASE_DIR))

from app.main import app

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
        self.assertEqual(len(data["agent_briefs"]), 5)
        for key in ("agent", "headline", "finding", "confidence"):
            self.assertIn(key, data["agent_briefs"][0])

    def test_digest_requires_auth(self):
        anon = app.test_client()
        self.assertEqual(anon.get('/api/digest/network').status_code, 401)
        self.assertEqual(
            anon.post('/api/digest', data=json.dumps({}), content_type='application/json').status_code,
            401,
        )

if __name__ == "__main__":
    unittest.main()
