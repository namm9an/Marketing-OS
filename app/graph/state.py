"""
LangGraph Swarm State Definition
"""

from typing import TypedDict, List, Dict, Any, Optional

class SwarmState(TypedDict):
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
