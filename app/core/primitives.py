"""
Core primitives. (The State enum and Goal/KnowledgeUnit/DecisionRecord/PositioningBrief
dataclasses were defined but never used — the DB layer works in dicts — and were removed
in the audit remediation. Reintroduce a dataclass only when something actually consumes it.)
"""

import uuid
import datetime


def new_id() -> str:
    return str(uuid.uuid4())[:8]


def now_iso() -> str:
    return datetime.datetime.now(datetime.timezone.utc).isoformat()
