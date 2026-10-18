"""
Unit Tests for Rolling Conversational Context Summarization
"""

import pytest
from app.graph.chat import _history_block, _condense_older_turns


def test_history_window_under_or_equal_to_12_turns():
    # 8 turns
    history = [
        {"role": "user" if i % 2 == 1 else "agent", "content": f"Turn {i} message"}
        for i in range(1, 9)
    ]
    block = _history_block(history)
    assert "<background_context>" not in block
    assert "CONVERSATION SO FAR:" in block
    assert "Turn 1 message" in block
    assert "Turn 8 message" in block

    # Exactly 12 turns
    history_12 = [
        {"role": "user" if i % 2 == 1 else "agent", "content": f"Turn {i} message"}
        for i in range(1, 13)
    ]
    block_12 = _history_block(history_12)
    assert "<background_context>" not in block_12
    assert "CONVERSATION SO FAR:" in block_12
    assert "Turn 1 message" in block_12
    assert "Turn 12 message" in block_12


def test_history_window_exceeding_12_turns_partitions_and_summarizes():
    # 16 turns: Turns 1..4 should be in <background_context>, Turns 5..16 in active window
    history_16 = [
        {"role": "user" if i % 2 == 1 else "agent", "content": f"Turn {i} statement"}
        for i in range(1, 17)
    ]
    block_16 = _history_block(history_16)

    # Must contain <background_context> block
    assert "<background_context>" in block_16
    assert "</background_context>" in block_16
    assert "Summary of prior conversation (Turns 1 to 4):" in block_16

    # Turns 1..4 must be summarized inside background_context
    assert "Turn 1 [CMO]: Turn 1 statement" in block_16
    assert "Turn 4 [YOU]: Turn 4 statement" in block_16

    # Active conversation window must contain recent 12 turns (Turns 5..16)
    assert "ACTIVE CONVERSATION (Recent 12 turns):" in block_16
    assert "Turn 5 statement" in block_16
    assert "Turn 16 statement" in block_16


def test_condense_older_turns_truncates_long_messages():
    long_msg = "X" * 300
    older = [{"role": "user", "content": long_msg}]
    condensed = _condense_older_turns(older)
    assert len(condensed) < 200
    assert "..." in condensed
