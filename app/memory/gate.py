"""
The promotion gate (Phase 9, M9.2) — design_doc.md §9.5.

Decides what a conversation turn is allowed to leave behind. Without this, an agent
writes its own prose back into its own memory and reads it next session as fact —
*temporal memory contamination*, where each decision made on poisoned memory produces
further poisoned memories. **This project has already hit that bug once:** M5 needed
`enriched_by NOT LIKE '%agent%'` in get_competitor_facts() to stop agent output being
cited back as grounded intelligence. The gate is the same guarantee for L1.

Two rules do the work:

1. **Only the user's own turns are candidates.** Model output is never a candidate,
   whatever it says. This one line is the whole contamination defence.
2. **Only three kinds of user signal are admitted** — corrections, stated preferences,
   and ratified decisions. Questions and chatter are discarded.

Promotion episodic -> semantic requires **repetition** (the standard 3-occurrence
heuristic), never a single mention.

ponytail: the classifier is deterministic keyword matching, not an LLM call. Two
reasons. An LLM deciding what to remember reintroduces exactly the non-determinism
the gate exists to remove, and the error costs are asymmetric — a missed memory is
recoverable (the user restates it), an admitted hallucination is not. So the patterns
are deliberately tight and it under-admits on purpose. Upgrade to a classifier call
only if real transcripts show it dropping signal the user then has to repeat.
"""

import re
from typing import Any, Dict, List, Optional

from app.db.database import _keywords as keywords
from app.memory import store

# Rule 2. Checked in this order — the first match wins, most specific first.
_CATEGORY_PATTERNS = (
    (
        "correction",
        re.compile(
            r"(^no\b|\b(don'?t|do not|never|stop|avoid|wrong|incorrect|"
            r"instead of|rather than|not\s+\w+\s+but)\b)",
            re.I,
        ),
    ),
    (
        "decision",
        re.compile(
            r"\b(approved?|ratified?|signed? off|go with|going with|"
            r"we(?:'ve| have) decided|decided on|ship it|lock (?:it|this) in)\b",
            re.I,
        ),
    ),
    (
        "preference",
        re.compile(
            r"\b(prefer(?:ence)?|always|from now on|going forward|remember that|"
            r"make sure|keep it|our (?:tone|voice|style|brand|line)|"
            r"we (?:want|like|need)|tone should|positioning should)\b",
            re.I,
        ),
    ),
)

# Corrections and ratified decisions are the CMO speaking; preferences are softer.
_CONFIDENCE = {"correction": "high", "decision": "high", "preference": "medium"}

_MIN_LENGTH = 12          # "ok", "thanks", "yes please" carry nothing
_PROMOTE_AFTER = 3        # occurrences before episodic -> semantic
_DUPLICATE_OVERLAP = 0.6  # share of the smaller keyword set
_MIN_SHARED_TERMS = 2


def _norm(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip().lower().rstrip(".!")


def classify(role: str, content: str) -> Optional[str]:
    """Return the admitted category, or None if this turn leaves no memory."""
    if role != "user":
        return None  # rule 1 — the contamination defence
    text = (content or "").strip()
    if len(text) < _MIN_LENGTH:
        return None
    for category, pattern in _CATEGORY_PATTERNS:
        if pattern.search(text):
            # A question mentioning a preference is asking about one, not stating one.
            # Corrections survive this: "no, don't we already avoid that?" is still a no.
            if text.endswith("?") and category != "correction":
                return None
            return category
    return None


def _near_duplicates(namespace: str, content: str) -> List[Dict[str, Any]]:
    """Prior memories in this namespace saying substantially the same thing."""
    terms = set(keywords(content))
    if not terms:
        return []
    out = []
    for row in store.list_memories(namespace, limit=200):
        other = set(keywords(row["content"]))
        shared = terms & other
        if len(shared) < _MIN_SHARED_TERMS:
            continue
        if len(shared) / min(len(terms), len(other)) >= _DUPLICATE_OVERLAP:
            out.append(row)
    return out


def admit(namespace: str, role: str, content: str, turn_id: str = "") -> Dict[str, Any]:
    """Run one turn past the gate. Writes at most one memory, only to `namespace`.

    Returns the verdict either way — the chat layer surfaces it, so the user can see
    what was remembered and what was not rather than guessing.
    """
    category = classify(role, content)
    if category is None:
        return {"admitted": False, "reason": "not user-sourced signal", "memory_id": None}

    dupes = _near_duplicates(namespace, content)
    exact = next((d for d in dupes if _norm(d["content"]) == _norm(content)), None)
    if exact:
        # Restating something verbatim IS the repetition signal — promote in place
        # rather than accumulating identical rows.
        if exact["tier"] != "semantic":
            store.promote_memory(exact["id"])
        return {
            "admitted": True, "reason": f"{category} restated — promoted to semantic",
            "memory_id": exact["id"], "tier": "semantic", "category": category,
        }

    tier = "semantic" if len(dupes) + 1 >= _PROMOTE_AFTER else "episodic"
    memory_id = store.add_memory(
        namespace,
        content.strip(),
        tier=tier,
        provenance=f"user:{category}:{turn_id}" if turn_id else f"user:{category}",
        confidence=_CONFIDENCE[category],
    )
    reason = f"{category} admitted"
    if tier == "semantic":
        reason += f" (recurring, {len(dupes) + 1} occurrences — promoted)"
    return {
        "admitted": True, "reason": reason, "memory_id": memory_id,
        "tier": tier, "category": category,
    }


if __name__ == "__main__":
    # ponytail self-check: rule 1 holds and repetition promotes. Throwaway DB — see store.py.
    import tempfile
    from pathlib import Path
    from app.core.config import settings
    from app.db import database

    _tmp = tempfile.TemporaryDirectory()
    settings.DB_PATH = Path(_tmp.name) / "gate_selfcheck.db"
    database.init_db(force=True)

    ns = store.agent_ns("branding")
    assert classify("agent", "Our positioning should always lead with sovereignty.") is None
    assert classify("user", "never frame this as a price war") == "correction"
    assert classify("user", "what tone should we use for the launch?") is None

    assert admit(ns, "agent", "I always recommend a developer-first tone.")["admitted"] is False
    for i in range(3):
        verdict = admit(ns, "user", f"always keep the B200 launch tone developer-first ({i})")
    assert verdict["tier"] == "semantic", verdict
    print("gate.py self-check OK:", verdict["reason"])
