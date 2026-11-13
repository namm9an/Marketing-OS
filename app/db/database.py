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
    "do", "does", "did", "their", "theirs", "them", "themselves", "which", "who",
    "whom", "whose", "rather", "than", "are", "is", "was", "were", "been", "being",
    "have", "has", "had", "providers", "provider", "vendors", "vendor", "on", "per",
}


def _keywords(text: str) -> List[str]:
    """Extract meaningful search terms from a goal sentence."""
    words = re.findall(r"[A-Za-z0-9]+", text.lower())
    seen, out = set(), []
    for w in words:
        if len(w) > 2 and w not in _STOPWORDS and w not in seen:
            seen.add(w)
            out.append(w)
    return out


_TAXONOMY_EXPANSIONS = {
    "blackwell": ["b200", "gb200", "gb300"],
    "hopper": ["h100", "h200", "gh200"],
    "ada": ["l40s", "l4", "rtx 4090"],
    "lovelace": ["l40s", "l4", "rtx 4090"],
    "consumer": ["rtx 4090", "l40", "l40s"],
    "rupee": ["inr", "rs", "pricing", "rate"],
    "rupees": ["inr", "rs", "pricing", "rate"],
    "hourly": ["hr", '"/hr"', "pricing", "rate"],
    "hour": ["hr", '"/hr"', "pricing", "rate"],
    "cost": ["pricing", "rate", "rate card"],
    "cheapest": ["pricing", "rate", "rate card"],
    "rental": ["pricing", "cloud", "instance"],
    "capacity": ["pricing", "cloud"],
    "sells": ["pricing", "rate"],
    "india": ["sovereign", "meity", "india"],
    "indian": ["sovereign", "meity", "india"],
    "residency": ["sovereign", "india", "meity", "compliance"],
    "tagline": ["positioning", "official"],
    "describe": ["positioning", "official"],
    "enterprise": ["positioning", "official"],
    "buyers": ["positioning"],
    "buyer": ["positioning"],
    "target": ["positioning"],
    "rivals": ["positioning", "official"],
    "rival": ["positioning", "official"],
    "markets": ["positioning", "official"],
    "our": [settings.TARGET_ORGANIZATION.lower()],
    "own": [settings.TARGET_ORGANIZATION.lower()],
}


def _format_fts5_token(term: str) -> str:
    """Format a term or phrase into a quote-safe FTS5 token."""
    t = term.strip(" \"'")
    if not t:
        return ""
    escaped = t.replace('"', '""')
    return f'"{escaped}"'


def _expand_query_terms(query: str, expand_taxonomy: bool = True) -> str:
    """Expand user query into a quote-safe disjunctive FTS5 MATCH expression."""
    raw_words = re.findall(r"[A-Za-z0-9_]+", (query or "").lower())
    terms: List[str] = []
    seen = set()
    for w in raw_words:
        if expand_taxonomy and w in _TAXONOMY_EXPANSIONS:
            for exp in _TAXONOMY_EXPANSIONS[w]:
                clean = exp.strip(" \"'")
                if clean and clean not in seen:
                    seen.add(clean)
                    terms.append(clean)
        if w not in _STOPWORDS and len(w) >= 2 and w not in seen:
            seen.add(w)
            terms.append(w)
    if not terms:
        return ""
    formatted = [_format_fts5_token(t) for t in terms]
    return " OR ".join(f for f in formatted if f)


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
    latency_ms REAL DEFAULT 0.0,
    total_wall_ms REAL DEFAULT 0.0,
    retrieval_ms REAL DEFAULT 0.0,
    attempts INTEGER DEFAULT 1,
    prompt_tokens INTEGER DEFAULT 0,
    completion_tokens INTEGER DEFAULT 0,
    thoughts_tokens INTEGER DEFAULT 0,
    facts_retrieved INTEGER DEFAULT 0,
    source TEXT DEFAULT 'mock',
    model TEXT DEFAULT 'mock-fallback',
    requested_model TEXT DEFAULT 'gemini-3.8-flash',
    fallback_used INTEGER DEFAULT 0,
    evidence_ids TEXT DEFAULT '[]',
    invalid_evidence_ids_count INTEGER DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_decisions_created ON decisions(created_at DESC);

CREATE TABLE IF NOT EXISTS decision_reviews (
    id TEXT PRIMARY KEY,
    decision_id TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('approved', 'rejected')),
    reviewed_by TEXT NOT NULL,
    reason TEXT NOT NULL,
    reviewed_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_reviews_decision ON decision_reviews(decision_id);

CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    username TEXT NOT NULL,
    created_at REAL NOT NULL,
    expires_at REAL NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);

CREATE TABLE IF NOT EXISTS quota_visitor_actions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    identity TEXT NOT NULL,
    quota_day REAL NOT NULL,
    created_at REAL NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_quota_visitor_identity ON quota_visitor_actions(identity, quota_day);
CREATE INDEX IF NOT EXISTS idx_quota_visitor_day ON quota_visitor_actions(quota_day);

CREATE TABLE IF NOT EXISTS quota_ip_actions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ip TEXT NOT NULL,
    quota_day REAL NOT NULL,
    created_at REAL NOT NULL,
    request_id TEXT
);
CREATE INDEX IF NOT EXISTS idx_quota_ip_day ON quota_ip_actions(ip, quota_day);
CREATE INDEX IF NOT EXISTS idx_quota_ip_created ON quota_ip_actions(ip, created_at);

CREATE TABLE IF NOT EXISTS quota_global_gemini_calls (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    quota_day REAL NOT NULL,
    created_at REAL NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_quota_global_day ON quota_global_gemini_calls(quota_day);

CREATE TABLE IF NOT EXISTS quota_reservations (
    reservation_id TEXT PRIMARY KEY,
    quota_day REAL NOT NULL,
    units_reserved INTEGER NOT NULL,
    units_consumed INTEGER NOT NULL DEFAULT 0,
    created_at REAL NOT NULL,
    expires_at REAL NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_quota_res_day ON quota_reservations(quota_day, expires_at);

CREATE TABLE IF NOT EXISTS quota_host_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at REAL NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_quota_host_created ON quota_host_requests(created_at);

CREATE TABLE IF NOT EXISTS login_failures (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ip TEXT NOT NULL,
    attempted_at REAL NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_login_failures_ip ON login_failures(ip, attempted_at);

CREATE TABLE IF NOT EXISTS knowledge_units (
    id TEXT PRIMARY KEY,
    organization TEXT NOT NULL DEFAULT 'Vanguard Cloud',
    knowledge_class TEXT NOT NULL,
    confidence TEXT NOT NULL,
    content TEXT NOT NULL,
    source_url TEXT,
    enriched_by TEXT NOT NULL DEFAULT 'system',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_ku_org_class ON knowledge_units(organization, knowledge_class);

CREATE VIRTUAL TABLE IF NOT EXISTS knowledge_units_fts USING fts5(
    id UNINDEXED,
    organization,
    knowledge_class,
    content,
    tokenize = 'porter unicode61 remove_diacritics 2'
);

CREATE TRIGGER IF NOT EXISTS trg_ku_ai AFTER INSERT ON knowledge_units BEGIN
    DELETE FROM knowledge_units_fts WHERE id = new.id;
    INSERT INTO knowledge_units_fts(id, organization, knowledge_class, content)
    VALUES (new.id, new.organization, new.knowledge_class, new.content);
END;


CREATE TRIGGER IF NOT EXISTS trg_ku_ad AFTER DELETE ON knowledge_units BEGIN
    DELETE FROM knowledge_units_fts WHERE id = old.id;
END;

CREATE TRIGGER IF NOT EXISTS trg_ku_au AFTER UPDATE ON knowledge_units BEGIN
    DELETE FROM knowledge_units_fts WHERE id = old.id;
    INSERT INTO knowledge_units_fts(id, organization, knowledge_class, content)
    VALUES (new.id, new.organization, new.knowledge_class, new.content);
END;

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

-- Phase 9 (M9.4): the knowledge graph. `namespace` carries the same isolation rule as
-- memories — 'corpus:global' edges are shared, 'agent:*' / 'triage:*' edges are scoped,
-- and traversal filters on it at every hop. See app/memory/graph.py.
CREATE TABLE IF NOT EXISTS edges (
    id TEXT PRIMARY KEY,
    src TEXT NOT NULL,
    rel TEXT NOT NULL,
    dst TEXT NOT NULL,
    namespace TEXT NOT NULL,
    provenance TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
-- Extraction is deterministic and re-runnable, so re-deriving the corpus graph must be a
-- no-op rather than a duplicate.
CREATE UNIQUE INDEX IF NOT EXISTS idx_edges_unique ON edges(src, rel, dst, namespace);
CREATE INDEX IF NOT EXISTS idx_edges_ns ON edges(namespace);
"""

def get_connection(timeout: float = 10.0, isolation_level: Optional[str] = ""):
    conn = sqlite3.connect(str(settings.DB_PATH), timeout=timeout, isolation_level=isolation_level)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode = WAL;")
    conn.execute("PRAGMA busy_timeout = 5000;")
    conn.execute("PRAGMA synchronous = NORMAL;")
    return conn

_INITIALIZED = False


def reset_db_state():
    """Clear the _INITIALIZED singleton flag for test fixture hermeticity."""
    global _INITIALIZED
    _INITIALIZED = False


import functools
import random
import time


def retry_on_locked(max_retries: int = 5, base_delay: float = 0.05, backoff_factor: float = 2.0):
    """
    Decorator adding exponential backoff retry on SQLite write transactions
    to eliminate 'database is locked' operational errors during concurrent bursts.
    """
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            delay = base_delay
            last_exc = None
            for attempt in range(max_retries):
                try:
                    return func(*args, **kwargs)
                except sqlite3.OperationalError as e:
                    err_msg = str(e).lower()
                    if "locked" in err_msg or "busy" in err_msg:
                        last_exc = e
                        if attempt < max_retries - 1:
                            jitter = random.uniform(0.01, 0.05)
                            time.sleep(delay + jitter)
                            delay *= backoff_factor
                            continue
                    raise
            if last_exc:
                raise last_exc
        return wrapper
    return decorator


@retry_on_locked()
def init_db(force: bool = False):
    global _INITIALIZED
    if _INITIALIZED and not force:
        return
    conn = get_connection()
    try:
        with conn:
            conn.executescript(SCHEMA)
            # Serialize inspection and ALTERs across workers, preserving all-or-nothing upgrades.
            conn.execute("BEGIN IMMEDIATE")
            cursor = conn.execute("PRAGMA table_info(decisions)")
            existing_cols = {row["name"] for row in cursor.fetchall()}
            telemetry_cols = {
                "total_tokens": "INTEGER",
                "finish_reason": "TEXT",
                "served_model_verified": "INTEGER DEFAULT 0",
                "workflow_type": "TEXT NOT NULL DEFAULT 'legacy'",
                "result_json": "TEXT",
                "review_status": "TEXT NOT NULL DEFAULT 'unreviewed'",
                "reviewed_by": "TEXT",
                "reviewed_at": "TEXT",
                "latency_ms": "REAL DEFAULT 0.0",
                "total_wall_ms": "REAL DEFAULT 0.0",
                "retrieval_ms": "REAL DEFAULT 0.0",
                "attempts": "INTEGER DEFAULT 1",
                "prompt_tokens": "INTEGER DEFAULT 0",
                "completion_tokens": "INTEGER DEFAULT 0",
                "thoughts_tokens": "INTEGER DEFAULT 0",
                "facts_retrieved": "INTEGER DEFAULT 0",
                "source": "TEXT DEFAULT 'mock'",
                "model": "TEXT DEFAULT 'mock-fallback'",
                "requested_model": "TEXT DEFAULT 'gemini-3.8-flash'",
                "fallback_used": "INTEGER DEFAULT 0",
                "evidence_ids": "TEXT DEFAULT '[]'",
                "invalid_evidence_ids_count": "INTEGER DEFAULT 0",
            }
            for col, col_type in telemetry_cols.items():
                if col not in existing_cols:
                    conn.execute(f"ALTER TABLE decisions ADD COLUMN {col} {col_type}")
            conn.execute(
                """
                INSERT OR IGNORE INTO knowledge_units_fts(id, organization, knowledge_class, content)
                SELECT id, organization, knowledge_class, content FROM knowledge_units
                WHERE id NOT IN (SELECT id FROM knowledge_units_fts)
                """
            )
        _INITIALIZED = True
        log.info(f"[SQLite DB] Initialized at {settings.DB_PATH}")
    finally:
        conn.close()


@retry_on_locked()
def save_decision(
    decision_id: str,
    goal_statement: str,
    selected_option: str,
    confidence: str,
    escalated: bool,
    reasoning_source: str,
    rationale: str,
    risks: str,
    latency_ms: float = 0.0,
    total_wall_ms: float = 0.0,
    retrieval_ms: float = 0.0,
    attempts: int = 1,
    prompt_tokens: int = 0,
    completion_tokens: int = 0,
    thoughts_tokens: int = 0,
    facts_retrieved: int = 0,
    source: str = "mock",
    model: str = "mock-fallback",
    requested_model: str = "gemini-3.8-flash",
    fallback_used: bool = False,
    evidence_ids: Optional[List[str]] = None,
    invalid_evidence_ids_count: int = 0,
    total_tokens: Optional[int] = None,
    finish_reason: Optional[str] = None,
    served_model_verified: bool = False,
):
    from app.services.llm_service import redact_credentials

    init_db()
    conn = get_connection()
    evidence_ids_str = json.dumps(evidence_ids or [])
    try:
        with conn:
            conn.execute(
                """
                INSERT INTO decisions
                (id, goal_statement, selected_option, confidence, escalated, reasoning_source, rationale, risks,
                 latency_ms, total_wall_ms, retrieval_ms, attempts, prompt_tokens, completion_tokens, thoughts_tokens,
                 facts_retrieved, source, model, requested_model, fallback_used, evidence_ids, invalid_evidence_ids_count,
                 review_status, total_tokens, finish_reason, served_model_verified)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    decision_id,
                    redact_credentials(goal_statement),
                    redact_credentials(selected_option),
                    confidence,
                    1 if escalated else 0,
                    reasoning_source,
                    redact_credentials(rationale),
                    redact_credentials(risks),
                    float(latency_ms) if latency_ms is not None else None,
                    float(total_wall_ms) if total_wall_ms is not None else None,
                    float(retrieval_ms or 0.0),
                    int(attempts) if attempts is not None else None,
                    int(prompt_tokens) if prompt_tokens is not None else None,
                    int(completion_tokens) if completion_tokens is not None else None,
                    int(thoughts_tokens) if thoughts_tokens is not None else None,
                    int(facts_retrieved or 0),
                    str(source or "mock"),
                    str(model or "mock-fallback"),
                    str(requested_model or "gemini-3.8-flash"),
                    1 if fallback_used else 0,
                    evidence_ids_str,
                    int(invalid_evidence_ids_count or 0),
                    "pending" if escalated else "unreviewed",
                    total_tokens,
                    finish_reason,
                    int(served_model_verified),
                )
            )
    finally:
        conn.close()

def get_all_decisions(limit: Optional[int] = None, offset: int = 0) -> List[Dict[str, Any]]:
    init_db()
    conn = get_connection()
    try:
        if limit is not None:
            cursor = conn.execute(
                "SELECT * FROM decisions ORDER BY created_at DESC LIMIT ? OFFSET ?",
                (limit, offset)
            )
        else:
            cursor = conn.execute("SELECT * FROM decisions ORDER BY created_at DESC")
        return [_decode_decision(row) for row in cursor.fetchall()]
    finally:
        conn.close()


def _decode_decision(row) -> Dict[str, Any]:
    decision = dict(row)
    decision["fallback_used"] = bool(decision["fallback_used"])
    decision["served_model_verified"] = bool(decision["served_model_verified"])
    decision["evidence_ids"] = json.loads(decision["evidence_ids"] or "[]")
    snapshot = decision.pop("result_json", None)
    decision["result"] = json.loads(snapshot) if snapshot else None
    decision["result_available"] = snapshot is not None
    return decision


@retry_on_locked()
def save_workflow_result(decision_id: str, workflow_type: str, result: Dict[str, Any]) -> None:
    """Persist the returned contract, rather than inventing a reconstruction from a title."""
    from app.core.exceptions import PersistenceError
    from app.services.llm_service import redact_credentials

    def redact_value(value):
        # Redact values before encoding; regexes on JSON can remove escaped quotes.
        if isinstance(value, str):
            return redact_credentials(value)
        if isinstance(value, dict):
            return {key: redact_value(item) for key, item in value.items()}
        if isinstance(value, (list, tuple)):
            return [redact_value(item) for item in value]
        return value

    conn = get_connection()
    try:
        with conn:
            cursor = conn.execute(
                "UPDATE decisions SET workflow_type = ?, result_json = ? WHERE id = ? AND result_json IS NULL",
                (workflow_type, json.dumps(redact_value(result)), decision_id),
            )
            if cursor.rowcount != 1:
                raise PersistenceError("The workflow result could not be stored")
    except sqlite3.Error as exc:
        raise PersistenceError("The workflow result could not be stored") from exc
    finally:
        conn.close()


def get_decision(decision_id: str) -> Optional[Dict[str, Any]]:
    init_db()
    conn = get_connection()
    try:
        row = conn.execute("SELECT * FROM decisions WHERE id = ?", (decision_id,)).fetchone()
        if row is None:
            return None
        decision = _decode_decision(row)
        decision["reviews"] = [dict(r) for r in conn.execute(
            "SELECT * FROM decision_reviews WHERE decision_id = ? ORDER BY rowid", (decision_id,),
        )]
        return decision
    finally:
        conn.close()


@retry_on_locked()
def review_decision(decision_id: str, status: str, reviewed_by: str, reason: str = "") -> bool:
    """Append an operator review; preserve the generated decision and original risk flag."""
    from app.core.primitives import new_id, now_iso
    from app.services.llm_service import redact_credentials

    if status not in ("approved", "rejected"):
        raise ValueError("review status must be approved or rejected")
    init_db()
    conn = get_connection()
    try:
        with conn:
            conn.execute("BEGIN IMMEDIATE")
            if conn.execute("SELECT id FROM decisions WHERE id = ?", (decision_id,)).fetchone() is None:
                return False
            reviewed_at = now_iso()
            conn.execute(
                "INSERT INTO decision_reviews VALUES (?, ?, ?, ?, ?, ?)",
                (new_id(), decision_id, status, reviewed_by, redact_credentials(reason), reviewed_at),
            )
            conn.execute(
                "UPDATE decisions SET review_status = ?, reviewed_by = ?, reviewed_at = ? WHERE id = ?",
                (status, reviewed_by, reviewed_at, decision_id),
            )
        return True
    finally:
        conn.close()

@retry_on_locked()
def save_knowledge_unit(
    id_str: str,
    k_class: str,
    confidence: str,
    content: str,
    organization: Optional[str] = None,
    source_url: Optional[str] = None,
    enriched_by: str = "system"
):
    from app.services.llm_service import redact_credentials

    if organization is None:
        organization = settings.TARGET_ORGANIZATION
    init_db()
    conn = get_connection()
    try:
        with conn:
            conn.execute(
                """
                INSERT OR REPLACE INTO knowledge_units
                (id, organization, knowledge_class, confidence, content, source_url, enriched_by)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    id_str,
                    organization,
                    k_class,
                    confidence,
                    redact_credentials(content),
                    source_url,
                    enriched_by,
                )
            )
    finally:
        conn.close()

def search_knowledge_units(
    query: str = "",
    limit: int = 15,
    sourced_only: bool = False,
    expand_taxonomy: bool = False,
) -> List[Dict[str, Any]]:
    """Search knowledge units using SQLite FTS5 BM25 engine-level ranking.

    `sourced_only` restricts results to the crawled corpus (L0).
    `expand_taxonomy` applies deterministic domain expansion before FTS5 search.
    """
    init_db()
    agent_filter = " AND enriched_by NOT LIKE '%agent%'" if sourced_only else ""
    conn = get_connection()
    try:
        match_query = _expand_query_terms(query, expand_taxonomy=expand_taxonomy) if query else ""
        if not match_query:
            cursor = conn.execute(
                f"SELECT * FROM knowledge_units WHERE 1=1{agent_filter} ORDER BY created_at DESC LIMIT ?",
                (limit,),
            )
            return [dict(row) for row in cursor.fetchall()]

        agent_filter_k = " AND k.enriched_by NOT LIKE '%agent%'" if sourced_only else ""
        sql = f"""
        SELECT k.id, k.organization, k.knowledge_class, k.confidence, k.content, k.source_url, k.enriched_by, k.created_at,
               bm25(knowledge_units_fts) AS rank
        FROM knowledge_units_fts fts
        JOIN knowledge_units k ON fts.id = k.id
        WHERE knowledge_units_fts MATCH ?{agent_filter_k}
        ORDER BY rank ASC
        LIMIT ?
        """
        try:
            cursor = conn.execute(sql, (match_query, limit))
            return [dict(row) for row in cursor.fetchall()]
        except sqlite3.OperationalError as e:
            log.warning(f"[FTS5] MATCH failed on {match_query!r}: {e}, falling back to table scan")
            cursor = conn.execute(
                f"SELECT * FROM knowledge_units WHERE 1=1{agent_filter} ORDER BY created_at DESC LIMIT ?",
                (limit,),
            )
            return [dict(row) for row in cursor.fetchall()]
    finally:
        conn.close()


def add_memory(*args, **kwargs):
    from app.memory.store import add_memory as _add_memory
    return _add_memory(*args, **kwargs)


def add_turn(*args, **kwargs):
    from app.memory.store import add_turn as _add_turn
    return _add_turn(*args, **kwargs)



def get_all_knowledge_units() -> List[Dict[str, Any]]:
    return search_knowledge_units(limit=100)


def get_competitor_facts(limit: int = 200, target_org: Optional[str] = None) -> List[Dict[str, Any]]:
    """The digest's 'Competitor Movement Filter': rival facts only, no internal target org or legacy noise.

    Agent-enriched rows are excluded too — the digest must cite scraped, sourced
    competitor intelligence, not our own model's earlier output (that would let a
    synthesized claim re-enter as a 'grounded' citation).

    ponytail: no time window. A real weekly delta needs Phase 7 (narrative-shift detection)
    adding the SCD Type 2 columns and writing dated re-crawl rows first; filtering the
    one-shot seed by created_at would return noise.
    """
    if target_org is None:
        target_org = settings.TARGET_ORGANIZATION
    init_db()
    conn = get_connection()
    try:
        cursor = conn.execute(
            """
            SELECT * FROM knowledge_units
            WHERE organization != ?
              AND organization NOT LIKE ?
              AND organization NOT LIKE '%E2E%'
              AND organization NOT LIKE '%(Us)%'
              AND enriched_by NOT LIKE '%agent%'
              AND source_url IS NOT NULL AND source_url != ''
            ORDER BY organization, knowledge_class
            LIMIT ?
            """,
            (target_org, f"%{target_org}%", limit),
        )
        return [dict(row) for row in cursor.fetchall()]
    finally:
        conn.close()
