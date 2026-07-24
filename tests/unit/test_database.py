"""
Unit Tests for SQLite Persistence Layer & Grounded Knowledge Database
"""

import sys
import unittest
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(BASE_DIR))

from app.db.database import init_db, save_decision, get_all_decisions, save_knowledge_unit, search_knowledge_units
from app.db.grounded_seed import seed_grounded_knowledge
from app.core.primitives import new_id

class TestDatabaseLayer(unittest.TestCase):
    def setUp(self):
        init_db()

    def test_database_seeding_and_search(self):
        seed_grounded_knowledge()
        facts = search_knowledge_units(query="B200", limit=10)
        self.assertTrue(len(facts) > 0, "Database should return grounded facts for B200 query")
        for f in facts:
            self.assertIn("organization", f)
            self.assertIn("source_url", f)
            self.assertIsNotNone(f["source_url"])

    def test_decision_record_persistence(self):
        dec_id = new_id()
        save_decision(
            decision_id=dec_id,
            goal_statement="Test GPU Positioning Goal",
            selected_option="Sovereign AI Infrastructure Strategy",
            confidence="High",
            escalated=False,
            reasoning_source="test_runner",
            rationale="Test strategic rationale",
            risks="Test risks"
        )
        decisions = get_all_decisions()
        self.assertTrue(any(d["id"] == dec_id for d in decisions), "Saved decision record should exist in SQLite database")

if __name__ == "__main__":
    unittest.main()
