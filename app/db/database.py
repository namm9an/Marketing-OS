"""
SQLite Database Layer & Persistence Service
"""

import sqlite3
import json
import logging
from typing import List, Dict, Any, Optional
from app.core.config import settings

log = logging.getLogger(__name__)

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
    knowledge_class TEXT NOT NULL,
    confidence TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
"""

def get_connection():
    conn = sqlite3.connect(str(settings.DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    try:
        conn.executescript(SCHEMA)
        conn.commit()
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

def save_knowledge_unit(id_str: str, k_class: str, confidence: str, content: str):
    init_db()
    conn = get_connection()
    try:
        conn.execute(
            "INSERT OR REPLACE INTO knowledge_units (id, knowledge_class, confidence, content) VALUES (?, ?, ?, ?)",
            (id_str, k_class, confidence, content)
        )
        conn.commit()
    finally:
        conn.close()

def get_all_knowledge_units() -> List[Dict[str, Any]]:
    init_db()
    conn = get_connection()
    try:
        cursor = conn.execute("SELECT * FROM knowledge_units ORDER BY created_at DESC")
        rows = cursor.fetchall()
        return [dict(row) for row in rows]
    finally:
        conn.close()
