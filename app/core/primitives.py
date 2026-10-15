"""
Core primitives. (The State enum and Goal/KnowledgeUnit/DecisionRecord/PositioningBrief
dataclasses were defined but never used — the DB layer works in dicts — and were removed
in the audit remediation. Reintroduce a dataclass only when something actually consumes it.)
"""

import uuid
import datetime
import hashlib


def new_id() -> str:
    return uuid.uuid4().hex


def content_hash(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def now_iso() -> str:
    return datetime.datetime.now(datetime.timezone.utc).isoformat()

