"""
Namespace-scoped memory store (Phase 9, M9.1) — design_doc.md §9.4, §9.10.

This module is the isolation boundary. Everything else in Phase 9 (the promotion
gate, the chat layer, the graph, /triage) reads and writes through it, so the rule
"an agent sees shared ∪ its own private ∪ its own joint, and never another agent's
private memory" is enforced in exactly one place instead of at every call site.

Namespaces are deterministic strings derived from IDs we already hold, so the right
namespace is always reconstructible at query time without a lookup:

    corpus:global           shared grounded layer (L0)
    agent:branding          one agent's private memory (L1)
    triage:branding+pr      one agent *pair's* joint memory (L2), members sorted

Shaped after supermemory's containerTag deliberately: the backend stays SQLite, but
`add(namespace, ...)` / `search(namespaces, ...)` is the same interface an external
memory engine exposes, so adopting one later is a backend swap, not a redesign.

ponytail: keyword scoring reuses the retrieval already written for knowledge_units.
No embeddings — add vectors (or FTS5 first) only when keyword recall measurably fails.
"""

import json
import re
from typing import Any, Dict, List, Optional

from app.core.primitives import new_id
from app.db.database import get_connection, init_db
from app.db.database import _keywords as keywords  # same tokenizer the corpus retrieval uses

CORPUS_NS = "corpus:global"
TIERS = ("episodic", "semantic")

# design_doc.md §9.4. Anchored, so a namespace can never carry SQL/path characters.
_NAMESPACE_RE = re.compile(r"^[a-zA-Z0-9_:+-]+$")


# --- Namespace algebra -------------------------------------------------------------

def agent_ns(agent_type: str) -> str:
    return f"agent:{agent_type}"


def triage_ns(a: str, b: str) -> str:
    """Members are sorted so the pair tag is stable whichever order they were named."""
    return "triage:" + "+".join(sorted([a, b]))


def ns_members(namespace: str) -> set:
    """Which agents own this namespace. Empty for the shared corpus."""
    if namespace.startswith("agent:"):
        return {namespace[len("agent:"):]}
    if namespace.startswith("triage:"):
        return set(namespace[len("triage:"):].split("+"))
    return set()


def validate_ns(namespace: str) -> str:
    if not namespace or not _NAMESPACE_RE.match(namespace):
        raise ValueError(f"invalid namespace: {namespace!r}")
    return namespace


def readable_namespaces(agent_type: str) -> List[str]:
    """The scope one agent may read: shared ∪ own private ∪ own joint.

    Joint namespaces are matched by *exact membership*, never by substring. A
    `LIKE '%pr%'` would hand the PR agent `triage:product_marketing+social`, which is
    precisely the leak /triage exists to prevent.
    """
    own = agent_ns(agent_type)
    validate_ns(own)
    init_db()
    conn = get_connection()
    try:
        rows = conn.execute(
            "SELECT DISTINCT namespace FROM memories WHERE namespace LIKE 'triage:%'"
        ).fetchall()
    finally:
        conn.close()
    joint = [r["namespace"] for r in rows if agent_type in ns_members(r["namespace"])]
    return [CORPUS_NS, own] + sorted(joint)


# --- Memories ----------------------------------------------------------------------

def add_memory(
    namespace: str,
    content: str,
    tier: str = "episodic",
    provenance: str = "",
    confidence: str = "medium",
    source_turn_id: Optional[str] = None,
) -> str:
    validate_ns(namespace)
    if tier not in TIERS:
        raise ValueError(f"invalid tier: {tier!r}")
    init_db()
    mem_id = new_id()
    conn = get_connection()
    try:
        conn.execute(
            """
            INSERT INTO memories
                (id, namespace, tier, content, provenance, confidence, source_turn_id)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (mem_id, namespace, tier, content, provenance, confidence, source_turn_id),
        )
        conn.commit()
    finally:
        conn.close()
    return mem_id


def search_memories(namespaces: List[str], query: str = "", limit: int = 5) -> List[Dict[str, Any]]:
    """Recall within an explicit namespace list — callers pass readable_namespaces().

    Semantic memories outrank episodic ones at equal keyword score: a distilled
    preference is worth more at recall time than the raw turn it came from.
    """
    if not namespaces:
        return []
    for ns in namespaces:
        validate_ns(ns)
    init_db()
    terms = keywords(query) if query else []
    placeholders = ",".join("?" * len(namespaces))
    conn = get_connection()
    try:
        rows = [
            dict(r)
            for r in conn.execute(
                f"""SELECT * FROM memories WHERE namespace IN ({placeholders})
                    ORDER BY created_at DESC LIMIT ?""",
                (*namespaces, limit * 10),
            ).fetchall()
        ]
        if terms:
            def score(row: Dict[str, Any]) -> tuple:
                blob = row["content"].lower()
                return (sum(1 for t in terms if t in blob), row["tier"] == "semantic")
            rows = [r for r in rows if score(r)[0] > 0]
            rows.sort(key=score, reverse=True)
        rows = rows[:limit]

        if rows:  # recall is itself the usage signal the decay/promotion logic reads
            conn.executemany(
                "UPDATE memories SET hit_count = hit_count + 1, last_used_at = datetime('now') WHERE id = ?",
                [(r["id"],) for r in rows],
            )
            conn.commit()
        return rows
    finally:
        conn.close()


def list_memories(namespace: str, limit: int = 100) -> List[Dict[str, Any]]:
    """Everything in one namespace, newest first. For the UI's memory inspector."""
    validate_ns(namespace)
    init_db()
    conn = get_connection()
    try:
        return [
            dict(r)
            for r in conn.execute(
                "SELECT * FROM memories WHERE namespace = ? ORDER BY created_at DESC LIMIT ?",
                (namespace, limit),
            ).fetchall()
        ]
    finally:
        conn.close()


# --- Threads & turns ---------------------------------------------------------------

def create_thread(namespace: str, title: str = "") -> str:
    validate_ns(namespace)
    init_db()
    thread_id = new_id()
    conn = get_connection()
    try:
        conn.execute(
            "INSERT INTO threads (id, namespace, title) VALUES (?, ?, ?)",
            (thread_id, namespace, title[:120]),
        )
        conn.commit()
    finally:
        conn.close()
    return thread_id


def get_thread(thread_id: str) -> Optional[Dict[str, Any]]:
    init_db()
    conn = get_connection()
    try:
        row = conn.execute("SELECT * FROM threads WHERE id = ?", (thread_id,)).fetchone()
        return dict(row) if row else None
    finally:
        conn.close()


def list_threads(namespace: str, limit: int = 50) -> List[Dict[str, Any]]:
    validate_ns(namespace)
    init_db()
    conn = get_connection()
    try:
        return [
            dict(r)
            for r in conn.execute(
                "SELECT * FROM threads WHERE namespace = ? ORDER BY created_at DESC LIMIT ?",
                (namespace, limit),
            ).fetchall()
        ]
    finally:
        conn.close()


def add_turn(
    thread_id: str, role: str, content: str, recalled_ids: Optional[List[str]] = None
) -> str:
    """`recalled_ids` is what made this turn's context — the audit trail behind visible recall."""
    init_db()
    turn_id = new_id()
    conn = get_connection()
    try:
        conn.execute(
            "INSERT INTO turns (id, thread_id, role, content, recalled_ids) VALUES (?, ?, ?, ?, ?)",
            (turn_id, thread_id, role, content, json.dumps(recalled_ids or [])),
        )
        conn.commit()
    finally:
        conn.close()
    return turn_id


def get_turns(thread_id: str, limit: int = 40) -> List[Dict[str, Any]]:
    """Chronological — this is the conversation history fed back to the LLM."""
    init_db()
    conn = get_connection()
    try:
        rows = conn.execute(
            "SELECT * FROM turns WHERE thread_id = ? ORDER BY created_at DESC, rowid DESC LIMIT ?",
            (thread_id, limit),
        ).fetchall()
    finally:
        conn.close()
    out = []
    for r in reversed(rows):
        turn = dict(r)
        turn["recalled_ids"] = json.loads(turn["recalled_ids"] or "[]")
        out.append(turn)
    return out


if __name__ == "__main__":
    # ponytail self-check: the isolation rule holds, including the pr ⊂ product_marketing trap.
    # Runs against a throwaway DB — memories are user-facing, so a self-check must not seed
    # the real one. Full coverage lives in tests/unit/test_memory_store.py.
    import tempfile
    from pathlib import Path
    from app.core.config import settings
    from app.db import database

    _tmp = tempfile.TemporaryDirectory()
    settings.DB_PATH = Path(_tmp.name) / "selfcheck.db"
    database.init_db(force=True)

    assert triage_ns("pr", "branding") == triage_ns("branding", "pr") == "triage:branding+pr"
    add_memory(triage_ns("product_marketing", "social"), "joint note")
    assert "triage:product_marketing+social" not in readable_namespaces("pr")
    assert "triage:product_marketing+social" in readable_namespaces("social")
    assert readable_namespaces("branding")[:2] == [CORPUS_NS, "agent:branding"]

    add_memory(agent_ns("branding"), "CMO rejected price-war framing for Nebius", tier="semantic")
    assert not search_memories(readable_namespaces("pr"), "price-war Nebius")
    assert search_memories(readable_namespaces("branding"), "price-war Nebius")
    print("store.py self-check OK")
