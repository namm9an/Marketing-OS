"""
Unit tests for the LangGraph supervisor workflow (Milestone 5, Option 1).

Exercises the compiled StateGraph end to end with the mock LLM (no API keys):
supervisor routes to the requested agent node, the agent produces a decision,
and the governance node persists it. Also asserts the graph topology so a
regression that drops a node/edge fails loudly.
"""

import sys
import unittest
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(BASE_DIR))

from app.db.database import init_db
from app.agents.base import AGENT_REGISTRY
from app.graph.workflow import swarm_engine, _GRAPH


class TestWorkflowGraph(unittest.TestCase):
    def setUp(self):
        init_db()

    def test_graph_has_all_nodes(self):
        nodes = set(_GRAPH.get_graph().nodes)
        self.assertIn("supervisor", nodes)
        self.assertIn("governance", nodes)
        for agent_type in AGENT_REGISTRY:
            self.assertIn(agent_type, nodes)

    def test_routes_to_requested_agent_and_persists(self):
        out = swarm_engine.run("Formulate a PR counter-narrative vs Yotta", agent_type="pr")
        self.assertTrue(out["success"])
        self.assertIsNotNone(out["decision"]["id"], "governance node must persist a decision id")
        self.assertTrue(out["decision"]["reasoning_source"].startswith("langgraph:pr:"))
        self.assertIn("selected_option", out["decision"])

    def test_unknown_agent_falls_back_to_branding(self):
        out = swarm_engine.run("Generic goal", agent_type="does_not_exist")
        self.assertTrue(out["decision"]["reasoning_source"].startswith("langgraph:branding:"))


if __name__ == "__main__":
    unittest.main()
