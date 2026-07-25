"""
Unit tests for the scoped knowledge graph (Phase 9, M9.4).

Two things have to hold. The graph must *raise recall* — reach a memory that shares
subject matter with the question but not wording — and it must stop dead at the
namespace boundary while doing it. A traversal that hops into another agent's private
memory is the exact leak Phase 9 exists to prevent, and it would be invisible from the
outside because the answer would simply look better informed.
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
from app.graph.digest import build_network
from app.memory import gate, graph, store


class TestMemoryGraph(unittest.TestCase):
    def setUp(self):
        self._tmp = tempfile.TemporaryDirectory()
        self._real_path = settings.DB_PATH
        settings.DB_PATH = Path(self._tmp.name) / "graph_test.db"
        database.init_db(force=True)

    def tearDown(self):
        settings.DB_PATH = self._real_path
        database._INITIALIZED = False
        self._tmp.cleanup()

    def _fact(self, org, content, k_class="pricing", enriched_by="grounded_crawler"):
        save_knowledge_unit(
            id_str=new_id(), k_class=k_class, confidence="high", content=content,
            organization=org, source_url="https://example.com/prices", enriched_by=enriched_by,
        )

    # --- deterministic extraction ---

    def test_entities_are_canonical_and_alias_folded(self):
        found = graph.extract_entities("Yotta and Nebius both list H100 and A100")
        self.assertEqual(set(found), {"Yotta Data Services", "Nebius", "H100", "A100"})
        self.assertEqual(graph.extract_entities("no tracked names here"), [])

    def test_corpus_edges_use_the_organization_column_not_the_prose(self):
        """The org on the edge is the row's own column — nothing is inferred from text."""
        self._fact("Nebius", "H100 on-demand at $2.00/hr, cheaper than CoreWeave")
        graph.rebuild_corpus_graph()
        edges = graph.traverse([graph.CORPUS_NS], ["Nebius"], depth=1)
        self.assertEqual([e["node"] for e in edges], ["H100"])
        # CoreWeave is *named in the content* but owns no fact here, so it gets no edge.
        self.assertEqual(graph.traverse([graph.CORPUS_NS], ["CoreWeave"], depth=1), [])

    def test_rebuild_is_idempotent(self):
        self._fact("Nebius", "Nebius H100 pricing")
        self.assertEqual(graph.rebuild_corpus_graph(), 1)
        self.assertEqual(graph.rebuild_corpus_graph(), 1)

    def test_rebuild_replaces_corpus_edges_but_spares_memory_anchors(self):
        """A reseed DROPs knowledge_units, so a stale corpus edge would cite a dead row.
        Agent anchors are memory, not corpus, and must survive."""
        self._fact("Nebius", "Nebius H100 on-demand")
        graph.rebuild_corpus_graph()
        ns = store.agent_ns("branding")
        mem = store.add_memory(ns, "H100 tone note")
        graph.anchor_memory(mem, ns, "H100 tone note")

        conn = database.get_connection()
        conn.execute("DELETE FROM knowledge_units")   # what the seeder does
        conn.commit()
        conn.close()
        self._fact("RunPod", "RunPod A100 pods")
        graph.rebuild_corpus_graph()

        self.assertEqual(graph.traverse([graph.CORPUS_NS], ["Nebius"], depth=1), [])
        self.assertEqual([e["node"] for e in graph.traverse([graph.CORPUS_NS], ["RunPod"], depth=1)],
                         ["A100"])
        self.assertEqual(graph.recall_by_graph([ns], "H100 posts?")["memory_ids"], [mem])

    def test_agent_written_rows_never_enter_the_corpus_graph(self):
        self._fact("Nebius", "Nebius H100 is beatable", enriched_by="branding_agent")
        self.assertEqual(graph.rebuild_corpus_graph(), 0)

    def test_relation_reflects_the_knowledge_class(self):
        self._fact("Nebius", "Nebius H100 rate card", k_class="pricing")
        self._fact("RunPod", "RunPod H100 hardware fleet", k_class="hardware")
        graph.rebuild_corpus_graph()
        conn = database.get_connection()
        rels = dict(conn.execute("SELECT src, rel FROM edges").fetchall())
        conn.close()
        self.assertEqual(rels, {"Nebius": "prices", "RunPod": "offers"})

    # --- the isolation rule, which is the whole point ---

    def test_traversal_cannot_reach_another_agents_private_memory(self):
        self._fact("Nebius", "Nebius H100 on-demand")
        self._fact("RunPod", "RunPod H100 pods")
        graph.rebuild_corpus_graph()

        theirs = store.add_memory(store.agent_ns("pr"), "our H100 counter-narrative angle")
        graph.anchor_memory(theirs, store.agent_ns("pr"), "our H100 counter-narrative angle")

        # Branding asks about the same SKU the PR note is anchored to — the shortest
        # possible path into someone else's memory — and still cannot see it.
        hit = graph.recall_by_graph(store.readable_namespaces("branding"), "what about H100?")
        self.assertEqual(hit["memory_ids"], [])
        reached = [e["node"] for e in graph.traverse(store.readable_namespaces("branding"), ["H100"])]
        self.assertNotIn(f"{graph.MEMORY_PREFIX}{theirs}", reached)

    def test_get_memories_re_applies_the_namespace_filter(self):
        """Belt and braces: even handed a valid id, the store will not cross scopes."""
        theirs = store.add_memory(store.agent_ns("pr"), "PR only")
        self.assertEqual(store.get_memories([theirs], store.readable_namespaces("branding")), [])
        self.assertTrue(store.get_memories([theirs], store.readable_namespaces("pr")))

    def test_a_joint_namespace_is_reachable_by_its_members_only(self):
        joint = store.triage_ns("branding", "pr")
        mem = store.add_memory(joint, "agreed Nebius line for the pair")
        graph.anchor_memory(mem, joint, "agreed Nebius line for the pair")

        for agent in ("branding", "pr"):
            hit = graph.recall_by_graph(store.readable_namespaces(agent), "our Nebius line?")
            self.assertEqual(hit["memory_ids"], [mem], agent)
        self.assertEqual(
            graph.recall_by_graph(store.readable_namespaces("events"), "our Nebius line?")["memory_ids"],
            [],
        )

    # --- the retention win ---

    def test_a_memory_surfaces_two_hops_out_through_a_shared_sku(self):
        """The reason the graph exists: no keyword overlap, still recalled."""
        self._fact("Nebius", "Nebius H100 on-demand at $2.00/hr")
        graph.rebuild_corpus_graph()

        ns = store.agent_ns("branding")
        mem = store.add_memory(ns, "keep the tone developer-first on H100 posts")
        graph.anchor_memory(mem, ns, "keep the tone developer-first on H100 posts")

        question = "how should we answer Nebius?"
        self.assertEqual(store.search_memories(store.readable_namespaces("branding"), question), [])

        hit = graph.recall_by_graph(store.readable_namespaces("branding"), question)
        self.assertEqual(hit["memory_ids"], [mem])
        self.assertEqual(hit["paths"][0]["path"], f"Nebius > H100 > {graph.MEMORY_PREFIX}{mem}")

    def test_depth_bounds_the_walk(self):
        self._fact("Nebius", "Nebius H100 on-demand")
        graph.rebuild_corpus_graph()
        ns = store.agent_ns("branding")
        mem = store.add_memory(ns, "H100 tone note")
        graph.anchor_memory(mem, ns, "H100 tone note")

        scope = store.readable_namespaces("branding")
        self.assertEqual(graph.recall_by_graph(scope, "Nebius?", depth=1)["memory_ids"], [])
        self.assertEqual(graph.recall_by_graph(scope, "Nebius?", depth=2)["memory_ids"], [mem])

    def test_traversal_terminates_on_a_cycle(self):
        """A > B > A must not recurse forever — `instr(path, node)` is the guard."""
        self._fact("Nebius", "Nebius H100 and A100")
        self._fact("RunPod", "RunPod H100 and A100")
        graph.rebuild_corpus_graph()
        reached = {e["node"] for e in graph.traverse([graph.CORPUS_NS], ["Nebius"], depth=6)}
        self.assertEqual(reached, {"H100", "A100", "RunPod"})

    # --- anchoring runs off admission, not off every turn ---

    def test_the_gate_anchors_what_it_admits_and_nothing_else(self):
        ns = store.agent_ns("branding")
        admitted = gate.admit(ns, "user", "never price-war against Nebius on H100")
        self.assertEqual(admitted["anchors"], ["Nebius", "H100"])

        # The agent's own prose names the same entities and still leaves no trace.
        rejected = gate.admit(ns, "agent", "Nebius H100 pricing is worth undercutting")
        self.assertFalse(rejected["admitted"])
        conn = database.get_connection()
        anchors = conn.execute(
            "SELECT COUNT(*) AS n FROM edges WHERE rel = ?", (graph.ANCHOR_REL,)
        ).fetchone()["n"]
        conn.close()
        self.assertEqual(anchors, 2)

    # --- the M5 network ceiling, lifted ---

    def test_rival_links_are_derived_from_shared_skus_and_name_them(self):
        self._fact("Nebius", "Nebius H100 and A100 on-demand")
        self._fact("RunPod", "RunPod H100 pods")
        self._fact("CoreWeave", "CoreWeave B200 clusters")
        graph.rebuild_corpus_graph()

        links = graph.shared_sku_links()
        self.assertEqual(len(links), 1)
        self.assertEqual((links[0]["source"], links[0]["target"]), ("Nebius", "RunPod"))
        self.assertEqual(links[0]["shared"], ["H100"])  # not A100 — RunPod has no A100 row

    def test_build_network_keeps_its_hub_links_and_adds_rival_links(self):
        self._fact("Nebius", "Nebius H100 on-demand")
        self._fact("RunPod", "RunPod H100 pods")
        graph.rebuild_corpus_graph()

        links = build_network()["links"]
        hub = [l for l in links if l["kind"] == "hub"]
        rival = [l for l in links if l["kind"] == "shared_sku"]
        self.assertEqual({l["target"] for l in hub}, {"Nebius", "RunPod"})
        self.assertEqual(len(rival), 1)
        self.assertEqual(rival[0]["shared"], ["H100"])


if __name__ == "__main__":
    unittest.main()
