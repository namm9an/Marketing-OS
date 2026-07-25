"""
Swarm Workflow Engine — a real LangGraph StateGraph (Milestone 5, Option 1).

Topology (supervisor pattern):

    START -> supervisor --(conditional route on active_agent)--> {branding|pr|social
             |product_marketing|events} -> governance -> END

The five worker nodes are generated from app.agents.base.AGENT_REGISTRY, so each
shows up as a distinct node in the LangSmith / LangFuse trace while sharing one
implementation (run_agent). Governance is a first-class node: it runs the CMO
escalation gate and persists the decision.

Observability:
- LangSmith: automatic. Set LANGSMITH_TRACING=true and LANGSMITH_API_KEY in the env;
  langgraph emits to it with zero code here.
- LangFuse: set LANGFUSE_PUBLIC_KEY / LANGFUSE_SECRET_KEY (+ LANGFUSE_HOST) and a
  CallbackHandler is attached per run. Absent keys -> no handler, no error.

ponytail: supervisor routes deterministically off the caller-supplied agent_type
(no LLM hop — there is nothing to decide for a single-agent request). The swarm
upgrade path (agents handing off to each other via Command(goto=...)) lands only
when a request must fan out across agents, e.g. the M5 CMO digest.
"""

import logging
import os
from typing import Dict, Any, Optional, Tuple

from langgraph.graph import StateGraph, START, END

from app.agents.base import run_agent, AGENT_REGISTRY, DEFAULT_PROVIDER
from app.graph.state import SwarmState
from app.db.database import save_decision
from app.core.primitives import new_id

log = logging.getLogger(__name__)

# Risk phrases that force human (CMO) ratification regardless of confidence.
_HIGH_RISK_TERMS = ("legal", "lawsuit", "compliance breach", "misleading", "defamation", "price war")


def _governance_check(confidence: str, risks: str) -> Tuple[bool, Optional[str]]:
    """Human-in-the-loop gate: escalate low-confidence or high-risk decisions to the CMO."""
    if (confidence or "").strip().lower() == "low":
        return True, "Low decision confidence — requires CMO ratification."
    risks_l = (risks or "").lower()
    for term in _HIGH_RISK_TERMS:
        if term in risks_l:
            return True, f"High-risk factor detected ('{term}') — requires CMO ratification."
    return False, None


def _langfuse_handler():
    """Return a LangFuse CallbackHandler if its keys are configured, else None."""
    if not (os.environ.get("LANGFUSE_PUBLIC_KEY") and os.environ.get("LANGFUSE_SECRET_KEY")):
        return None
    try:
        from langfuse.langchain import CallbackHandler
        return CallbackHandler()
    except Exception as err:  # pragma: no cover - tracing must never break a run
        log.warning(f"[LangFuse] handler unavailable, continuing without it: {err}")
        return None


# --- Graph nodes -----------------------------------------------------------------

def _supervisor(state: SwarmState) -> Dict[str, Any]:
    """Normalize the requested agent and hand off. Deterministic for single-agent runs."""
    active = (state.get("active_agent") or "branding").lower().strip()
    if active not in AGENT_REGISTRY:
        active = "branding"
    log.info(f"[Supervisor] routing to '{active}' agent node")
    return {"active_agent": active}


def _make_worker(agent_type: str):
    """One worker body per registry entry — distinct traced node, shared implementation."""
    def worker(state: SwarmState) -> Dict[str, Any]:
        parsed = run_agent(
            agent_type, state["goal_statement"], provider=state.get("provider", DEFAULT_PROVIDER)
        )
        return {
            "selected_option": parsed.get("selected_option"),
            "positioning_statement": parsed.get("statement"),
            "rationale": parsed.get("rationale"),
            "risks": parsed.get("risks"),
            "confidence": parsed.get("confidence", "High"),
        }
    worker.__name__ = f"{agent_type}_agent"
    return worker


def _governance(state: SwarmState) -> Dict[str, Any]:
    """CMO governance gate + decision persistence."""
    confidence = state.get("confidence", "High")
    risks = state.get("risks", "")
    escalated, reason = _governance_check(confidence, risks)
    record_id = new_id()
    source = f"langgraph:{state.get('active_agent')}:{state.get('provider')}"
    try:
        save_decision(
            decision_id=record_id,
            goal_statement=state["goal_statement"],
            selected_option=state.get("selected_option") or "Strategy Brief",
            confidence=confidence,
            escalated=escalated,
            reasoning_source=source,
            rationale=state.get("rationale") or "",
            risks=risks,
        )
    except Exception as db_err:  # pragma: no cover - persistence is best-effort
        log.warning(f"[DB Warning] Could not persist decision: {db_err}")
    return {"escalated": escalated, "escalation_reason": reason, "decision_id": record_id}


def _build_graph():
    builder = StateGraph(SwarmState)
    builder.add_node("supervisor", _supervisor)
    for agent_type in AGENT_REGISTRY:
        builder.add_node(agent_type, _make_worker(agent_type))
    builder.add_node("governance", _governance)

    builder.add_edge(START, "supervisor")
    builder.add_conditional_edges(
        "supervisor", lambda s: s["active_agent"], {at: at for at in AGENT_REGISTRY}
    )
    for agent_type in AGENT_REGISTRY:
        builder.add_edge(agent_type, "governance")
    builder.add_edge("governance", END)
    return builder.compile()


# Compiled once — the graph is stateless and reusable across requests.
_GRAPH = _build_graph()


class SwarmWorkflowEngine:
    """Public entry point. Same signature/response as the old router; now graph-backed."""

    graph = _GRAPH  # exposed for tests / visualization (graph.get_graph().draw_mermaid())

    def run(
        self, goal_statement: str, agent_type: str = "branding", provider: str = DEFAULT_PROVIDER
    ) -> Dict[str, Any]:
        initial: SwarmState = {
            "goal_statement": goal_statement,
            "active_agent": agent_type,
            "provider": provider,
            "messages": [],
            "knowledge_units": [],
        }
        config: Dict[str, Any] = {}
        handler = _langfuse_handler()
        if handler is not None:
            config["callbacks"] = [handler]

        final = _GRAPH.invoke(initial, config=config)

        selected_option = final.get("selected_option") or "Strategy Brief"
        confidence = final.get("confidence") or "High"
        active = final.get("active_agent", agent_type)
        return {
            "success": True,
            "positioning": {
                "statement": final.get("positioning_statement") or "",
                "differentiation_basis": "Sovereign Neo-Cloud Platform",
                "state": "ACTIVE",
            },
            "decision": {
                "id": final.get("decision_id"),
                "selected_option": selected_option,
                "confidence": confidence,
                "escalated": final.get("escalated", False),
                "escalation_reason": final.get("escalation_reason"),
                "reasoning_source": f"langgraph:{active}:{provider}",
                "rationale": final.get("rationale") or "",
                "risks": final.get("risks") or "",
            },
            "knowledge_units": [
                {
                    "class": "fact",
                    "confidence": confidence.lower(),
                    "content": f"{active} agent decision: {selected_option}",
                }
            ],
        }


swarm_engine = SwarmWorkflowEngine()


if __name__ == "__main__":
    # ponytail self-check: graph compiles, routes to the named agent, governance runs.
    out = swarm_engine.run("Position B200 against Nebius on price", agent_type="pr")
    assert out["success"] and out["decision"]["id"], out
    assert out["decision"]["reasoning_source"].startswith("langgraph:pr:"), out
    # Escalation gate is exercised directly (mock LLM output is neither low-conf nor high-risk).
    assert _governance_check("Low", "")[0] is True
    assert _governance_check("High", "possible lawsuit")[0] is True
    assert _governance_check("High", "ordinary market risk")[0] is False
    print("workflow.py self-check OK:", out["decision"]["selected_option"])
