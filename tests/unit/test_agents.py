"""
Unit Tests for Branding & PR Agent Nodes with Pydantic Schema Guardrails
"""

import sys
import unittest
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(BASE_DIR))

from app.agents.branding_agent import BrandingAgentNode
from app.agents.pr_agent import PRAgentNode
from app.core.primitives import new_id
from app.core.schemas import AgentResponseSchema
from app.db.database import save_knowledge_unit, search_knowledge_units
from app.graph.workflow import _governance_check

class TestGovernanceGate(unittest.TestCase):
    def test_low_confidence_escalates(self):
        self.assertTrue(_governance_check("Low", "minor")[0])

    def test_high_risk_term_escalates(self):
        self.assertTrue(_governance_check("High", "possible lawsuit here")[0])

    def test_normal_decision_does_not_escalate(self):
        self.assertFalse(_governance_check("High", "standard market risk")[0])

class TestAgentNodes(unittest.TestCase):
    def test_branding_agent_node_execution(self):
        node = BrandingAgentNode()
        res = node.process("Position E2E Networks B200 GPU cluster against Nebius")
        self.assertIn("selected_option", res)
        self.assertIn("statement", res)
        self.assertIn("rationale", res)
        self.assertIn("risks", res)
        # Validate Pydantic Schema
        validated = AgentResponseSchema(**res)
        self.assertIsNotNone(validated.selected_option)

    def test_pr_agent_node_execution(self):
        node = PRAgentNode()
        res = node.process("Formulate PR campaign for Yotta Shakti Cloud competition")
        self.assertIn("selected_option", res)
        self.assertIn("statement", res)
        # Validate Pydantic Schema
        validated = AgentResponseSchema(**res)
        self.assertIsNotNone(validated.statement)

class TestCorpusBoundary(unittest.TestCase):
    """L0 is crawler-sourced and read-only to agents (design_doc.md §9.3/§9.5)."""

    def test_running_an_agent_does_not_write_to_the_grounded_corpus(self):
        before = len(search_knowledge_units(limit=10_000))
        BrandingAgentNode().process("Position the B200 fleet against CoreWeave")
        self.assertEqual(len(search_knowledge_units(limit=10_000)), before)

    def test_sourced_only_retrieval_excludes_agent_written_rows(self):
        """Defence in depth for the 8 rows agents wrote before the boundary existed."""
        marker = f"zzsentinel{new_id()}"
        save_knowledge_unit(
            id_str=new_id(), k_class="positioning", confidence="high",
            content=f"{marker} synthesized branding prose", organization="Nebius",
            source_url="https://example.invalid/", enriched_by="branding_agent",
        )
        self.assertTrue(search_knowledge_units(query=marker, limit=5))
        self.assertEqual(search_knowledge_units(query=marker, limit=5, sourced_only=True), [])


if __name__ == "__main__":
    unittest.main()
