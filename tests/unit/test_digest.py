"""
Unit tests for the Milestone 5 CMO Weekly Digest fan-out graph.

The load-bearing guarantees here are (a) all five agents actually contribute — this is
the fan-out, not a single agent wearing five hats — and (b) the competitor filter and
citation path never leak internal E2E rows or model output into "grounded sources".
"""

import sys
import unittest
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(BASE_DIR))

from app.db.database import init_db, get_competitor_facts, save_knowledge_unit
from app.core.primitives import new_id
from app.db.grounded_seed import seed_grounded_knowledge
from app.graph.digest import run_digest, build_network, _DIGEST_GRAPH
from app.agents.base import ACTIVE_AGENTS, AGENT_REGISTRY


class TestCompetitorFilter(unittest.TestCase):
    def setUp(self):
        init_db()
        seed_grounded_knowledge()

    def test_excludes_internal_e2e_noise(self):
        for f in get_competitor_facts():
            self.assertNotIn("E2E", f["organization"])

    def test_excludes_agent_enriched_rows(self):
        # An agent's own output must not come back as a citable competitor "fact".
        save_knowledge_unit(
            id_str=new_id(), k_class="positioning", confidence="high",
            content="Synthesized claim about Nebius", organization="Nebius",
            source_url="https://example.com", enriched_by="branding_agent",
        )
        self.assertFalse(
            any("agent" in f["enriched_by"] for f in get_competitor_facts()),
            "model-generated rows must never be cited as grounded sources",
        )

    def test_every_fact_has_a_source_url(self):
        facts = get_competitor_facts()
        self.assertTrue(facts)
        for f in facts:
            self.assertTrue(f["source_url"], "grounded citation requires a source URL")


class TestDigestGraph(unittest.TestCase):
    def setUp(self):
        init_db()
        seed_grounded_knowledge()

    def test_graph_fans_out_to_active_agents_only(self):
        nodes = set(_DIGEST_GRAPH.get_graph().nodes)
        for agent in ACTIVE_AGENTS:
            self.assertIn(f"digest_{agent}", nodes)
        self.assertIn("synthesize", nodes)
        # Parked agents are still registered, but must not reach the CMO digest.
        for agent in set(AGENT_REGISTRY) - set(ACTIVE_AGENTS):
            self.assertNotIn(f"digest_{agent}", nodes)

    def test_digest_collects_a_brief_from_each_agent(self):
        out = run_digest()
        self.assertTrue(out["success"])
        self.assertEqual(
            {b["agent"] for b in out["agent_briefs"]},
            set(ACTIVE_AGENTS),
            "the aggregator must receive one brief per active agent",
        )
        self.assertTrue(out["headline"])
        self.assertTrue(out["executive_summary"])

    def test_citations_are_competitor_only(self):
        out = run_digest()
        self.assertTrue(out["citations"])
        for c in out["citations"]:
            self.assertNotIn("E2E", c["organization"])
            self.assertTrue(c["source_url"])


class TestNetworkMap(unittest.TestCase):
    def setUp(self):
        init_db()
        seed_grounded_knowledge()

    def test_hub_and_spoke_shape(self):
        net = build_network()
        hubs = [n for n in net["nodes"] if n["group"] == "us"]
        competitors = [n for n in net["nodes"] if n["group"] == "competitor"]
        self.assertEqual(len(hubs), 1)
        self.assertTrue(competitors)
        hub_links = [l for l in net["links"] if l["kind"] == "hub"]
        self.assertEqual(len(hub_links), len(competitors), "one hub edge per rival")
        for n in competitors:
            self.assertEqual(n["fact_count"], len(n["citations"]))

    def test_rival_links_are_derived_and_every_endpoint_is_a_real_node(self):
        """M9.4 added rival<->rival edges. They must be evidenced (a named shared SKU)
        and drawable — a link to a node the map does not contain renders as a dangling
        edge in CompetitorNetwork.jsx."""
        net = build_network()
        ids = {n["id"] for n in net["nodes"]}
        rival = [l for l in net["links"] if l["kind"] == "shared_sku"]
        self.assertTrue(rival)
        for link in rival:
            self.assertIn(link["source"], ids)
            self.assertIn(link["target"], ids)
            self.assertTrue(link["shared"], "a rival edge must name what it is based on")


if __name__ == "__main__":
    unittest.main()
