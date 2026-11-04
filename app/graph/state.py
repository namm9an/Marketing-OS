"""
LangGraph Swarm State Definition
"""

from typing import TypedDict, List, Dict, Any, Optional

class SwarmState(TypedDict, total=False):
    goal_statement: str
    active_agent: str  # 'branding' | 'pr' | 'crawler' | 'governance'
    provider: str
    messages: List[Dict[str, str]]
    positioning_statement: Optional[str]
    selected_option: Optional[str]
    rationale: Optional[str]
    risks: Optional[str]
    confidence: Optional[str]
    knowledge_units: List[Dict[str, Any]]
    trace_id: Optional[str]
    # Written by the governance node.
    escalated: Optional[bool]
    escalation_reason: Optional[str]
    decision_id: Optional[str]
    api_key: Optional[str]
    client_ip: Optional[str]
    request_id: Optional[str]
    notice: Optional[str]
    # Telemetry and provenance citations
    latency_ms: Optional[float]
    retrieval_ms: Optional[float]
    prompt_tokens: Optional[int]
    completion_tokens: Optional[int]
    facts_retrieved: Optional[int]
    source: Optional[str]
    model: Optional[str]
    evidence_ids: Optional[List[str]]
    invalid_evidence_ids_count: Optional[int]
