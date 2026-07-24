"""
LangGraph Decentralized Swarm Handoff Tools
"""

from typing import Dict, Any
from app.graph.state import SwarmState

def transfer_to_branding(state: SwarmState) -> SwarmState:
    state["active_agent"] = "branding"
    state["messages"].append({
        "role": "system",
        "content": "Routing task to Branding & Design Thinking Agent Node."
    })
    return state

def transfer_to_pr(state: SwarmState) -> SwarmState:
    state["active_agent"] = "pr"
    state["messages"].append({
        "role": "system",
        "content": "Routing task to Unified PR & Competitive Intelligence Agent Node."
    })
    return state

def transfer_to_governance(state: SwarmState) -> SwarmState:
    state["active_agent"] = "governance"
    state["messages"].append({
        "role": "system",
        "content": "Routing to CMO Governance Reviewer for escalation policy evaluation."
    })
    return state
