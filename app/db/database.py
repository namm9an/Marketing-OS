"""
SQLite Database Layer & Persistence Service
"""

import re
import sqlite3
import json
import logging
from typing import List, Dict, Any, Optional
from app.core.config import settings

log = logging.getLogger(__name__)

# Words too generic to help retrieval — dropped before matching.
_STOPWORDS = {
    "the", "and", "for", "our", "with", "into", "from", "that", "this", "your",
    "against", "formulate", "develop", "create", "plan", "strategy", "goal",
    "position", "positioning", "marketing", "campaign", "brief", "about", "using",
    "make", "build", "help", "need", "want", "how", "what", "why", "give",
}


def _keywords(text: str) -> List[str]:
    """Extract meaningful search terms from a goal sentence.

    The old code did `content LIKE '%<entire goal sentence>%'`, which almost never
    matched a stored fact. We tokenize instead and match on individual terms
    (GPU names, competitor names, 'pricing', 'B200', ...).
    """
    words = re.findall(r"[A-Za-z0-9]+", text.lower())
    seen, out = set(), []
    for w in words:
        if len(w) > 2 and w not in _STOPWORDS and w not in seen:
            seen.add(w)
            out.append(w)
    return out

SCHEMA = """
PRAGMA journal_mode=WAL;

CREATE TABLE IF NOT EXISTS decisions (
    id TEXT PRIMARY KEY,
    goal_statement TEXT NOT NULL,
    selected_option TEXT NOT NULL,
    confidence TEXT NOT NULL,
    escalated INTEGER NOT NULL DEFAULT 0,
    reasoning_source TEXT NOT NULL,
    rationale TEXT NOT NULL,
    risks TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS knowledge_units (
    id TEXT PRIMARY KEY,
    organization TEXT NOT NULL DEFAULT 'E2E Networks',
    knowledge_class TEXT NOT NULL,
    confidence TEXT NOT NULL,
    content TEXT NOT NULL,
    source_url TEXT,
    enriched_by TEXT NOT NULL DEFAULT 'system',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Phase 9 (M9.1): per-agent memory. Additive — nothing above changes.
-- `namespace` is the isolation boundary: 'agent:branding', 'triage:branding+pr',
-- 'corpus:global'. Every read is scoped by it; see app/memory/store.py.
CREATE TABLE IF NOT EXISTS memories (
    id TEXT PRIMARY KEY,
    namespace TEXT NOT NULL,
    tier TEXT NOT NULL DEFAULT 'episodic',      -- episodic | semantic
    content TEXT NOT NULL,
    provenance TEXT NOT NULL DEFAULT '',        -- which turn/user action produced it
    confidence TEXT NOT NULL DEFAULT 'medium',
    source_turn_id TEXT,
    hit_count INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    last_used_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_memories_ns ON memories(namespace);

CREATE TABLE IF NOT EXISTS threads (
    id TEXT PRIMARY KEY,
    namespace TEXT NOT NULL,
    title TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_threads_ns ON threads(namespace);

CREATE TABLE IF NOT EXISTS turns (
    id TEXT PRIMARY KEY,
    thread_id TEXT NOT NULL,
    role TEXT NOT NULL,                         -- user | agent
    content TEXT NOT NULL,
    recalled_ids TEXT NOT NULL DEFAULT '[]',    -- JSON list: what this turn recalled (visible recall)
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_turns_thread ON turns(thread_id);
"""

def get_connection():
    conn = sqlite3.connect(str(settings.DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn

_INITIALIZED = False


def init_db(force: bool = False):
    global _INITIALIZED
    if _INITIALIZED and not force:
        return
    conn = get_connection()
    try:
        conn.executescript(SCHEMA)
        conn.commit()
        _INITIALIZED = True
        log.info(f"[SQLite DB] Initialized at {settings.DB_PATH}")
    finally:
        conn.close()

def save_decision(
    decision_id: str,
    goal_statement: str,
    selected_option: str,
    confidence: str,
    escalated: bool,
    reasoning_source: str,
    rationale: str,
    risks: str
):
    init_db()
    conn = get_connection()
    try:
        conn.execute(
            """
            INSERT OR REPLACE INTO decisions 
            (id, goal_statement, selected_option, confidence, escalated, reasoning_source, rationale, risks)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                decision_id,
                goal_statement,
                selected_option,
                confidence,
                1 if escalated else 0,
                reasoning_source,
                rationale,
                risks
            )
        )
        conn.commit()
    finally:
        conn.close()

def get_all_decisions() -> List[Dict[str, Any]]:
    init_db()
    conn = get_connection()
    try:
        cursor = conn.execute("SELECT * FROM decisions ORDER BY created_at DESC")
        rows = cursor.fetchall()
        return [dict(row) for row in rows]
    finally:
        conn.close()

def save_knowledge_unit(
    id_str: str,
    k_class: str,
    confidence: str,
    content: str,
    organization: str = "E2E Networks",
    source_url: Optional[str] = None,
    enriched_by: str = "system"
):
    init_db()
    conn = get_connection()
    try:
        conn.execute(
            """
            INSERT OR REPLACE INTO knowledge_units 
            (id, organization, knowledge_class, confidence, content, source_url, enriched_by) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (id_str, organization, k_class, confidence, content, source_url, enriched_by)
        )
        conn.commit()
    finally:
        conn.close()

def search_knowledge_units(
    query: str = "", limit: int = 15, sourced_only: bool = False
) -> List[Dict[str, Any]]:
    """`sourced_only` restricts results to the crawled corpus (L0).

    Agent-written rows are excluded when it is set, so a model's own earlier prose can
    never come back as a grounded fact. Retrieval paths pass True; the knowledge browser
    leaves it False, because it should show what is actually in the table.
    """
    init_db()
    keywords = _keywords(query) if query else []
    agent_filter = " AND enriched_by NOT LIKE '%agent%'" if sourced_only else ""
    conn = get_connection()
    try:
        if not keywords:
            cursor = conn.execute(
                f"SELECT * FROM knowledge_units WHERE 1=1{agent_filter} ORDER BY created_at DESC LIMIT ?",
                (limit,),
            )
            return [dict(row) for row in cursor.fetchall()]

        # Match ANY keyword, then rank by how many keywords each fact hits.
        # ponytail: substring OR-match is fine at this volume; move to SQLite FTS5 if the KB grows large.
        where = " OR ".join(["content LIKE ? OR organization LIKE ?"] * len(keywords))
        params: List[Any] = []
        for k in keywords:
            params.extend([f"%{k}%", f"%{k}%"])
        params.append(limit * 3)
        cursor = conn.execute(
            f"SELECT * FROM knowledge_units WHERE ({where}){agent_filter} "
            f"ORDER BY created_at DESC LIMIT ?",
            params,
        )
        rows = [dict(row) for row in cursor.fetchall()]

        def score(row: Dict[str, Any]) -> int:
            blob = f"{row['content']} {row['organization']}".lower()
            return sum(1 for k in keywords if k in blob)

        rows.sort(key=score, reverse=True)
        return rows[:limit]
    finally:
        conn.close()

def get_all_knowledge_units() -> List[Dict[str, Any]]:
    return search_knowledge_units(limit=100)


def get_competitor_facts(limit: int = 200) -> List[Dict[str, Any]]:
    """The digest's 'Competitor Movement Filter': rival facts only, no internal E2E noise.

    Agent-enriched rows are excluded too — the digest must cite scraped, sourced
    competitor intelligence, not our own model's earlier output (that would let a
    synthesized claim re-enter as a 'grounded' citation).

    ponytail: no time window. A real weekly delta needs Phase 7 (CompTrack) writing
    dated re-crawl rows first; filtering the one-shot seed by date would return noise.
    """
    init_db()
    conn = get_connection()
    try:
        cursor = conn.execute(
            """
            SELECT * FROM knowledge_units
            WHERE organization NOT LIKE '%E2E%'
              AND enriched_by NOT LIKE '%agent%'
              AND source_url IS NOT NULL AND source_url != ''
            ORDER BY organization, knowledge_class
            LIMIT ?
            """,
            (limit,),
        )
        return [dict(row) for row in cursor.fetchall()]
    finally:
        conn.close()
