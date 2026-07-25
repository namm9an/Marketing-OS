"""
Scoped knowledge graph (Phase 9, M9.4) — design_doc.md §9.6.

The graph is a **retrieval** structure, not an admission policy. It raises recall on
what already passed the promotion gate; it never lowers the bar for getting in. It buys
two things:

1. **Multi-hop retention.** Branding remembers "never price-war against Nebius" and,
   separately, "developer-first tone on H100 posts". Keyword search treats those as
   unrelated. The corpus knows `Nebius --offers--> H100`, so a question about Nebius
   now reaches the H100 note two hops out.
2. **Auditable recall.** A traversal path is evidence you can read — `Nebius > H100 >
   RunPod` — which a similarity score is not. For a CMO-facing product that has to
   defend where a recommendation came from, that is a governance property.

**Scoping.** Edges carry a namespace exactly like memories, and traversal filters on it
at *every hop*, not just the seed. An agent walks shared ∪ its own private ∪ its own
joint. Another agent's anchor edges are invisible in both directions, so the "walk from
your memory into a shared fact, never from a shared fact into someone else's memory"
rule falls out of the namespace filter rather than needing separate enforcement.

**Corpus extraction is deterministic** — organisation comes from the `organization`
column (authoritative, not inferred) and SKUs from a fixed taxonomy. No LLM. A
fabricated edge is worse than a missing one, because a graph path *looks* like
evidence. LLM extraction stays permitted only for L1 memory nodes, which are gated.

ponytail: SQLite recursive CTEs, no Neo4j. 94 corpus facts, 13 organisations, hundreds
of memories — a graph database here would be pure ceremony.
"""

import json
import logging
import re
from typing import Any, Dict, List, Optional

from app.core.primitives import new_id
from app.db.database import get_connection, init_db, search_knowledge_units
from app.memory.store import CORPUS_NS, validate_ns

log = logging.getLogger(__name__)

# The tracked taxonomy. Aliases map to the canonical entity name so "Yotta" and
# "Yotta Data Services" are one node.
_ORG_ALIASES = {
    "e2e": "E2E Networks", "yotta": "Yotta Data Services", "neysa": "Neysa AI",
    "coreweave": "CoreWeave", "nebius": "Nebius", "lambda labs": "Lambda Labs",
    "runpod": "RunPod", "together ai": "Together AI", "crusoe": "Crusoe Cloud",
    "vast data": "VAST Data", "voltage park": "Voltage Park",
    "hyperstack": "Hyperstack", "foundry": "Foundry",
}
_SKUS = ("B200", "H200", "H100", "A100", "L40S", "HGX")

# A pricing row says a rival *lists a price*; anything else says they merely offer it.
# Both are read straight off knowledge_class — nothing is inferred.
_REL_FOR_CLASS = {"pricing": "prices"}
_DEFAULT_REL = "offers"

MEMORY_PREFIX = "mem:"
ANCHOR_REL = "anchored_to"


# --- Deterministic entity extraction ------------------------------------------------

def extract_entities(text: str) -> List[str]:
    """Canonical entity names mentioned in free text, in a stable order.

    ponytail: plain alias matching. It will occasionally over-match ("Azure AI Foundry"
    reads as Foundry), and that is an acceptable cost here — a stray anchor only nudges
    recall ordering *inside the agent's own scope*. It can never fabricate a citation,
    because citations come from DB rows, never from the graph.
    """
    low = (text or "").lower()
    found = [canon for alias, canon in _ORG_ALIASES.items() if alias in low]
    found += [sku for sku in _SKUS if re.search(rf"\b{sku}\b", text or "", re.I)]
    return sorted(set(found), key=found.index)


def _add_edge(conn, src: str, rel: str, dst: str, namespace: str, provenance: str = "") -> None:
    conn.execute(
        "INSERT OR IGNORE INTO edges (id, src, rel, dst, namespace, provenance) VALUES (?, ?, ?, ?, ?, ?)",
        (new_id(), src, rel, dst, namespace, provenance),
    )


def rebuild_corpus_graph() -> int:
    """Re-derive corpus:global edges from the grounded facts. Idempotent — safe on every boot.

    Organisation is taken from the row's own column rather than matched out of the prose,
    so the `org --offers/prices--> SKU` edge is as sourced as the fact it came from.

    Replace, not top-up. `seed_grounded_knowledge()` DROPs knowledge_units and reinserts
    with fresh ids, so surviving edges would cite knowledge_unit ids that no longer exist
    — provenance pointing at nothing is worse than no edge. Only `corpus:global` is
    cleared: agent and triage anchors are memory, and a corpus reseed must not touch them.
    """
    init_db()
    facts = search_knowledge_units(limit=10_000, sourced_only=True)
    conn = get_connection()
    try:
        conn.execute("DELETE FROM edges WHERE namespace = ?", (CORPUS_NS,))
        for fact in facts:
            org = (fact.get("organization") or "").strip()
            if not org:
                continue
            rel = _REL_FOR_CLASS.get(fact.get("knowledge_class"), _DEFAULT_REL)
            for sku in extract_entities(fact.get("content", "")):
                if sku in _SKUS:
                    _add_edge(conn, org, rel, sku, CORPUS_NS,
                              provenance=f"knowledge_unit:{fact['id']}")
        conn.commit()
        total = conn.execute(
            "SELECT COUNT(*) AS n FROM edges WHERE namespace = ?", (CORPUS_NS,)
        ).fetchone()["n"]
    finally:
        conn.close()
    log.info(f"[Graph] corpus graph holds {total} edges over {len(facts)} sourced facts")
    return total


def anchor_memory(memory_id: str, namespace: str, content: str) -> List[str]:
    """Link a memory to the entities it names, inside its own namespace.

    Direction is memory -> entity. The edge lives in the memory's namespace, so no other
    agent can traverse it from either end.
    """
    validate_ns(namespace)
    entities = extract_entities(content)
    if not entities:
        return []
    init_db()
    conn = get_connection()
    try:
        for entity in entities:
            _add_edge(conn, f"{MEMORY_PREFIX}{memory_id}", ANCHOR_REL, entity, namespace,
                      provenance=f"memory:{memory_id}")
        conn.commit()
    finally:
        conn.close()
    return entities


# --- Scoped traversal ---------------------------------------------------------------

# Undirected walk (Nebius -> H100 -> RunPod needs to traverse the second edge backwards),
# depth-bounded, and `instr(w.path, s.b) = 0` stops it revisiting a node already on the
# path — which both kills cycles and keeps the path readable as evidence.
_TRAVERSE_SQL = """
WITH RECURSIVE
  scoped(a, rel, b) AS (
      SELECT src, rel, dst FROM edges WHERE namespace IN ({ns})
      UNION ALL
      SELECT dst, rel, src FROM edges WHERE namespace IN ({ns})
  ),
  walk(node, depth, path) AS (
      SELECT value, 0, value FROM json_each(?)
      UNION ALL
      SELECT s.b, w.depth + 1, w.path || ' > ' || s.b
      FROM walk w JOIN scoped s ON s.a = w.node
      WHERE w.depth < ? AND instr(w.path, s.b) = 0
  )
SELECT node, MIN(depth) AS depth, path FROM walk WHERE depth > 0 GROUP BY node
"""


def traverse(namespaces: List[str], seeds: List[str], depth: int = 2) -> List[Dict[str, Any]]:
    """Nodes reachable from `seeds` within `depth` hops, restricted to `namespaces`.

    Each result carries the path that reached it — that path is the auditable evidence.
    """
    if not namespaces or not seeds:
        return []
    for ns in namespaces:
        validate_ns(ns)
    init_db()
    placeholders = ",".join("?" * len(namespaces))
    sql = _TRAVERSE_SQL.format(ns=placeholders)
    conn = get_connection()
    try:
        rows = conn.execute(
            sql, (*namespaces, *namespaces, json.dumps(seeds), depth)
        ).fetchall()
    finally:
        conn.close()
    return sorted((dict(r) for r in rows), key=lambda r: (r["depth"], r["node"]))


def recall_by_graph(
    namespaces: List[str], message: str, depth: int = 2, limit: int = 4
) -> Dict[str, Any]:
    """Memories reachable from the entities named in `message`, and how they were reached.

    This is the retention win: a note anchored to H100 surfaces for a question about
    Nebius, because the corpus knows Nebius offers H100.
    """
    seeds = extract_entities(message)
    if not seeds:
        return {"seeds": [], "memory_ids": [], "paths": []}

    reached = traverse(namespaces, seeds, depth=depth)
    memory_ids, paths = [], []
    for row in reached:
        if row["node"].startswith(MEMORY_PREFIX):
            memory_ids.append(row["node"][len(MEMORY_PREFIX):])
            paths.append({"memory_id": row["node"][len(MEMORY_PREFIX):],
                          "hops": row["depth"], "path": row["path"]})
    return {"seeds": seeds, "memory_ids": memory_ids[:limit], "paths": paths[:limit]}


# --- Corpus projection (completes the M5 hub-and-spoke ceiling) ----------------------

def shared_sku_links(min_shared: int = 1) -> List[Dict[str, Any]]:
    """Rival <-> rival links, derived rather than asserted.

    M5's network was hub-and-spoke because inventing a `competes_with` edge would have
    been fabrication. This is the honest version: two organisations are linked because
    the corpus graph shows both offering the same SKU, and the shared SKUs are named so
    the link can be checked.
    """
    init_db()
    conn = get_connection()
    try:
        rows = conn.execute(
            """
            SELECT a.src AS org_a, b.src AS org_b, a.dst AS sku
            FROM edges a JOIN edges b
              ON a.dst = b.dst AND a.src < b.src
            WHERE a.namespace = ? AND b.namespace = ?
            """,
            (CORPUS_NS, CORPUS_NS),
        ).fetchall()
    finally:
        conn.close()

    pairs: Dict[tuple, set] = {}
    for r in rows:
        pairs.setdefault((r["org_a"], r["org_b"]), set()).add(r["sku"])
    return sorted(
        (
            {"source": a, "target": b, "shared": sorted(skus), "weight": len(skus)}
            for (a, b), skus in pairs.items()
            if len(skus) >= min_shared
        ),
        key=lambda link: (-link["weight"], link["source"], link["target"]),
    )


if __name__ == "__main__":
    # ponytail self-check: multi-hop recall works, and it stops at the namespace boundary.
    import tempfile
    from pathlib import Path
    from app.core.config import settings
    from app.db import database
    from app.memory import store

    _tmp = tempfile.TemporaryDirectory()
    settings.DB_PATH = Path(_tmp.name) / "graph_selfcheck.db"
    database.init_db(force=True)

    for org, content in (("Nebius", "Nebius H100 on-demand"), ("RunPod", "RunPod H100 pods")):
        database.save_knowledge_unit(
            id_str=new_id(), k_class="pricing", confidence="high", content=content,
            organization=org, source_url="https://example.com/", enriched_by="grounded_crawler",
        )
    assert rebuild_corpus_graph() == 2

    mine = store.add_memory(store.agent_ns("branding"), "developer-first tone on H100 posts")
    anchor_memory(mine, store.agent_ns("branding"), "developer-first tone on H100 posts")
    theirs = store.add_memory(store.agent_ns("pr"), "H100 counter-narrative angle")
    anchor_memory(theirs, store.agent_ns("pr"), "H100 counter-narrative angle")

    hit = recall_by_graph(store.readable_namespaces("branding"), "how do we answer Nebius?")
    assert hit["memory_ids"] == [mine], hit          # reached Nebius > H100 > mem
    assert theirs not in hit["memory_ids"], hit      # PR's anchor is out of scope
    assert shared_sku_links()[0]["shared"] == ["H100"]
    print("graph.py self-check OK:", hit["paths"])
