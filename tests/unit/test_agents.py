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
from app.core.schemas import AgentResponseSchema
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

if __name__ == "__main__":
    unittest.main()
