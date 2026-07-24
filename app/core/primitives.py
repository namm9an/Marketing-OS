"""
Core Operating System Primitives & Data Contracts
"""

import uuid
import datetime
from dataclasses import dataclass, field
from enum import Enum
from typing import Optional, List


class State(Enum):
    DRAFT = "draft"
    VALIDATED = "validated"
    APPROVED = "approved"
    ACTIVE = "active"
    REJECTED = "rejected"


def new_id() -> str:
    return str(uuid.uuid4())[:8]


def now_iso() -> str:
    return datetime.datetime.now(datetime.timezone.utc).isoformat()


@dataclass
class KnowledgeUnit:
    id: str
    knowledge_class: str
    confidence: str
    content: str
    created_at: str = field(default_factory=now_iso)


@dataclass
class Goal:
    id: str
    statement: str
    state: State = State.ACTIVE
    created_at: str = field(default_factory=now_iso)


@dataclass
class DecisionRecord:
    id: str
    goal_id: str
    selected_option: str
    confidence: str
    escalated: bool
    escalation_reason: Optional[str]
    reasoning_source: str
    rationale: str
    risks: str
    created_at: str = field(default_factory=now_iso)


@dataclass
class PositioningBrief:
    statement: str
    differentiation_basis: str
    state: State = State.ACTIVE
    target_segment: Optional[str] = None
