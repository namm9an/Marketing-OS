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
from app.db.database import get_connection, init_db, retry_on_locked
from app.db.database import _keywords as keywords  # same tokenizer the corpus retrieval uses

CORPUS_NS = "corpus:global"
TIERS = ("episodic", "semantic")

# design_doc.md §9.4. Strict namespace schema: corpus:<name>, agent:<name>, or triage:<a_name>+<b_name>
_NAMESPACE_RE = re.compile(
    r"^(corpus:[a-zA-Z0-9_-]+|agent:[a-zA-Z0-9_-]+|triage:[a-zA-Z0-9_-]+(?:\+[a-zA-Z0-9_-]+)+)$"
)


# --- Namespace algebra -------------------------------------------------------------

def agent_ns(agent_type: str) -> str:
    if not agent_type or not re.match(r"^[a-zA-Z0-9_-]+$", agent_type):
        raise ValueError(f"invalid agent_type: {agent_type!r}")
    return f"agent:{agent_type}"


def triage_ns(a: str, b: str) -> str:
    """Members are sorted so the pair tag is stable whichever order they were named."""
    if not a or not b or not re.match(r"^[a-zA-Z0-9_-]+$", a) or not re.match(r"^[a-zA-Z0-9_-]+$", b):
        raise ValueError(f"invalid agent names in triage_ns: {a!r}, {b!r}")
    if a == b:
        raise ValueError(f"triage requires two distinct agents, got {a!r} and {b!r}")
    return "triage:" + "+".join(sorted([a, b]))


def ns_members(namespace: str) -> set:
    """Which agents own this namespace. Empty for the shared corpus."""
    if not namespace or not isinstance(namespace, str):
        return set()
    if namespace.startswith("agent:"):
        member = namespace[len("agent:"):]
        return {member} if member else set()
    if namespace.startswith("triage:"):
        return {m for m in namespace[len("triage:"):].split("+") if m}
    return set()


def validate_ns(namespace: str) -> str:
    if not namespace or not isinstance(namespace, str) or not _NAMESPACE_RE.match(namespace):
        raise ValueError(f"invalid namespace: {namespace!r}")
    return namespace


def readable_namespaces(agent_type: str) -> List[str]:
    """The scope one agent may read: shared ∪ own private ∪ own joint.

    Joint namespaces are matched by *exact membership*, never by substring. A
    `LIKE '%pr%'` would hand the PR agent `triage:product_marketing+social`, which is
    precisely the leak /triage exists to prevent.
    """
    if not agent_type or not re.match(r"^[a-zA-Z0-9_-]+$", agent_type):
        raise ValueError(f"invalid agent_type: {agent_type!r}")
    own = agent_ns(agent_type)
    validate_ns(own)
    init_db()
    conn = get_connection()
    try:
        mem_rows = conn.execute(
            "SELECT DISTINCT namespace FROM memories WHERE namespace LIKE 'triage:%'"
        ).fetchall()
        edge_rows = conn.execute(
            "SELECT DISTINCT namespace FROM edges WHERE namespace LIKE 'triage:%'"
        ).fetchall()
        thread_rows = conn.execute(
            "SELECT DISTINCT namespace FROM threads WHERE namespace LIKE 'triage:%'"
        ).fetchall()
        all_triage = (
            {r["namespace"] for r in mem_rows}
            | {r["namespace"] for r in edge_rows}
            | {r["namespace"] for r in thread_rows}
        )
    finally:
        conn.close()
    joint = [ns for ns in all_triage if agent_type in ns_members(ns)]
    return [CORPUS_NS, own] + sorted(joint)


# --- Memories ----------------------------------------------------------------------

@retry_on_locked()
def add_memory(
    namespace: str,
    content: str,
    tier: str = "episodic",
    provenance: str = "",
    confidence: str = "medium",
    source_turn_id: Optional[str] = None,
) -> str:
    from app.services.llm_service import redact_credentials

    validate_ns(namespace)
    if tier not in TIERS:
        raise ValueError(f"invalid tier: {tier!r}")
    if not content or not isinstance(content, str) or not content.strip():
        raise ValueError("memory content must be non-empty text")
    init_db()
    mem_id = new_id()
    conn = get_connection()
    try:
        with conn:
            conn.execute(
                """
                INSERT INTO memories
                    (id, namespace, tier, content, provenance, confidence, source_turn_id)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    mem_id,
                    namespace,
                    tier,
                    redact_credentials(content.strip()),
                    provenance,
                    confidence,
                    source_turn_id,
                ),
            )
    finally:
        conn.close()
    return mem_id


@retry_on_locked()
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
        if terms:
            rows = [
                dict(r)
                for r in conn.execute(
                    f"SELECT * FROM memories WHERE namespace IN ({placeholders})",
                    namespaces,
                ).fetchall()
            ]
            def score(row: Dict[str, Any]) -> tuple:
                blob = row["content"].lower()
                return (sum(1 for t in terms if t in blob), row["tier"] == "semantic")
            rows = [r for r in rows if score(r)[0] > 0]
            rows.sort(key=score, reverse=True)
        else:
            rows = [
                dict(r)
                for r in conn.execute(
                    f"""SELECT * FROM memories WHERE namespace IN ({placeholders})
                        ORDER BY created_at DESC LIMIT ?""",
                    (*namespaces, limit),
                ).fetchall()
            ]
        rows = rows[:limit]

        if rows:  # recall is itself the usage signal the decay/promotion logic reads
            row_ids = [r["id"] for r in rows]
            id_placeholders = ",".join("?" * len(row_ids))
            with conn:
                conn.executemany(
                    "UPDATE memories SET hit_count = hit_count + 1, last_used_at = datetime('now') WHERE id = ?",
                    [(rid,) for rid in row_ids],
                )
                # Automatic promotion heuristic: episodic -> semantic when hit_count >= 3
                # Strictly scoped to recalled rows in authorized namespaces
                conn.execute(
                    f"UPDATE memories SET tier = 'semantic' WHERE tier = 'episodic' AND hit_count >= 3 AND id IN ({id_placeholders})",
                    row_ids,
                )
            for r in rows:
                r["hit_count"] = r.get("hit_count", 0) + 1
                if r.get("tier") == "episodic" and r["hit_count"] >= 3:
                    r["tier"] = "semantic"
        return rows
    finally:
        conn.close()


@retry_on_locked()
def promote_on_hit_count(threshold: int = 3, namespace: Optional[str] = None) -> int:
    """Promotes episodic memories to semantic tier when hit_count >= threshold.
    Returns the number of memories promoted.
    """
    if threshold < 1:
        raise ValueError(f"threshold must be >= 1, got {threshold}")
    init_db()
    conn = get_connection()
    try:
        if namespace:
            validate_ns(namespace)
            cursor = conn.execute(
                "UPDATE memories SET tier = 'semantic' WHERE tier = 'episodic' AND hit_count >= ? AND namespace = ?",
                (threshold, namespace),
            )
        else:
            cursor = conn.execute(
                "UPDATE memories SET tier = 'semantic' WHERE tier = 'episodic' AND hit_count >= ?",
                (threshold,),
            )
        count = cursor.rowcount
        conn.commit()
        return count
    finally:
        conn.close()


def get_memories(memory_ids: List[str], namespaces: List[str]) -> List[Dict[str, Any]]:
    """Fetch memories by id, **still restricted to `namespaces`**.

    The graph layer reaches memories by traversal rather than by keyword, so it hands
    back ids. Re-applying the namespace filter here means the isolation rule is enforced
    on the way out too, and a bug in traversal scoping cannot turn into a leak.
    """
    if not memory_ids or not namespaces:
        return []
    for ns in namespaces:
        validate_ns(ns)
    init_db()
    conn = get_connection()
    try:
        rows = conn.execute(
            f"""SELECT * FROM memories
                WHERE id IN ({','.join('?' * len(memory_ids))})
                  AND namespace IN ({','.join('?' * len(namespaces))})""",
            (*memory_ids, *namespaces),
        ).fetchall()
    finally:
        conn.close()
    by_id = {r["id"]: dict(r) for r in rows}
    return [by_id[m] for m in memory_ids if m in by_id]  # caller's order = relevance order


@retry_on_locked()
def promote_memory(memory_id: str, tier: str = "semantic") -> None:
    """Move a memory up a tier. Repetition is the only thing that triggers this (M9.2)."""
    if tier not in TIERS:
        raise ValueError(f"invalid tier: {tier!r}")
    init_db()
    conn = get_connection()
    try:
        with conn:
            conn.execute("UPDATE memories SET tier = ? WHERE id = ?", (tier, memory_id))
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

@retry_on_locked()
def create_thread(namespace: str, title: str = "") -> str:
    validate_ns(namespace)
    init_db()
    thread_id = new_id()
    conn = get_connection()
    try:
        with conn:
            conn.execute(
                "INSERT INTO threads (id, namespace, title) VALUES (?, ?, ?)",
                (thread_id, namespace, title[:120]),
            )
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


@retry_on_locked()
def add_turn(
    thread_id: str, role: str, content: str, recalled_ids: Optional[List[str]] = None
) -> str:
    """`recalled_ids` is what made this turn's context — the audit trail behind visible recall."""
    from app.services.llm_service import redact_credentials

    init_db()
    turn_id = new_id()
    conn = get_connection()
    try:
        with conn:
            conn.execute(
                "INSERT INTO turns (id, thread_id, role, content, recalled_ids) VALUES (?, ?, ?, ?, ?)",
                (turn_id, thread_id, role, redact_credentials(content), json.dumps(recalled_ids or [])),
            )
    finally:
        conn.close()
    return turn_id


def get_turns(thread_id: str, limit: Optional[int] = None) -> List[Dict[str, Any]]:
    """Chronological — this is the conversation history fed back to the LLM."""
    init_db()
    conn = get_connection()
    try:
        if limit is not None:
            total_turns = conn.execute(
                "SELECT COUNT(*) AS c FROM turns WHERE thread_id = ?", (thread_id,)
            ).fetchone()["c"]
            offset = max(0, total_turns - limit)
            rows = conn.execute(
                "SELECT * FROM turns WHERE thread_id = ? ORDER BY created_at ASC, rowid ASC LIMIT ? OFFSET ?",
                (thread_id, limit, offset),
            ).fetchall()
            start_num = offset + 1
        else:
            rows = conn.execute(
                "SELECT * FROM turns WHERE thread_id = ? ORDER BY created_at ASC, rowid ASC",
                (thread_id,),
            ).fetchall()
            start_num = 1
    finally:
        conn.close()
    out = []
    for idx, r in enumerate(rows):
        turn = dict(r)
        turn["turn_number"] = start_num + idx
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
