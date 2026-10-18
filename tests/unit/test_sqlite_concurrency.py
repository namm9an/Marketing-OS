"""
Unit Tests for SQLite WAL Concurrency, Busy Timeout, and Lock Resilience
"""

import concurrent.futures
import sqlite3
import pytest
from pathlib import Path

from app.core.config import settings
from app.core.primitives import new_id
from app.db.database import (
    get_connection,
    init_db,
    save_decision,
    get_all_decisions,
    reset_db_state,
)
from app.memory.store import add_memory, list_memories


def test_sqlite_pragmas_configured():
    conn = get_connection()
    try:
        journal_mode = conn.execute("PRAGMA journal_mode;").fetchone()[0].upper()
        busy_timeout = conn.execute("PRAGMA busy_timeout;").fetchone()[0]
        synchronous = conn.execute("PRAGMA synchronous;").fetchone()[0]

        assert journal_mode == "WAL"
        assert busy_timeout >= 5000
        # NORMAL is synchronous mode 1
        assert synchronous == 1
    finally:
        conn.close()


def test_reset_db_state_clears_singleton():
    init_db()
    import app.db.database as db_mod
    assert db_mod._INITIALIZED is True
    reset_db_state()
    assert db_mod._INITIALIZED is False


def test_concurrent_sqlite_writes_under_load():
    """
    Simulate high-concurrency burst of 20 parallel threads writing decisions
    and memories to ensure exponential backoff and busy_timeout prevent
    'database is locked' errors.
    """
    num_threads = 20
    errors = []

    def write_worker(idx: int):
        try:
            d_id = f"test-conc-dec-{idx}-{new_id()[:8]}"
            save_decision(
                decision_id=d_id,
                goal_statement=f"Concurrent test goal {idx}",
                selected_option=f"Option {idx}",
                confidence="High",
                escalated=False,
                reasoning_source="test_concurrency",
                rationale="Concurrency testing under load",
                risks="None",
            )
            # Also write a memory entry
            add_memory(
                namespace="agent:branding",
                content=f"Concurrent memory note from thread {idx}",
                tier="episodic",
            )
        except Exception as e:
            errors.append((idx, e))

    with concurrent.futures.ThreadPoolExecutor(max_workers=num_threads) as executor:
        futures = [executor.submit(write_worker, i) for i in range(num_threads)]
        concurrent.futures.wait(futures)

    assert len(errors) == 0, f"Encountered {len(errors)} concurrency errors: {errors}"

    # Verify rows were persisted
    decisions = get_all_decisions(limit=50)
    assert len(decisions) >= num_threads
    memories = list_memories("agent:branding", limit=50)
    assert len(memories) >= num_threads
