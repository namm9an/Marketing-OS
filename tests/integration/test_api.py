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

if __name__ == "__main__":
    unittest.main()
