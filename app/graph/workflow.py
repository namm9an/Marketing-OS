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
from app.core.exceptions import AppException
from app.core.primitives import new_id

log = logging.getLogger(__name__)

# Risk phrases that force human (CMO) ratification regardless of confidence.
_HIGH_RISK_TERMS = ("legal", "lawsuit", "compliance breach", "misleading", "defamation", "price war")


def _governance_check(
    confidence: str,
    risks: str = "",
    goal_statement: str = "",
    statement: str = "",
    rationale: str = "",
) -> Tuple[bool, Optional[str]]:
    """Human-in-the-loop gate: escalate low-confidence or high-risk decisions to the CMO."""
    if (confidence or "").strip().lower() == "low":
        return True, "Low decision confidence — requires CMO ratification."
    scan_text = f"{risks} {goal_statement} {statement} {rationale}".lower()
    for term in _HIGH_RISK_TERMS:
        if term in scan_text:
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
        try:
            parsed = run_agent(
                agent_type,
                state["goal_statement"],
                provider=state.get("provider", DEFAULT_PROVIDER),
                api_key=state.get("api_key"),
                client_ip=state.get("client_ip"),
                request_id=state.get("request_id"),
            )
            return {
                "selected_option": parsed.get("selected_option"),
                "positioning_statement": parsed.get("statement"),
                "rationale": parsed.get("rationale"),
                "risks": parsed.get("risks"),
                "confidence": parsed.get("confidence", "High"),
                "notice": parsed.get("notice"),
                "latency_ms": parsed.get("latency_ms", 0.0),
                "total_wall_ms": parsed.get("total_wall_ms", parsed.get("latency_ms", 0.0)),
                "retrieval_ms": parsed.get("retrieval_ms", 0.0),
                "attempts": parsed.get("attempts", 1),
                "prompt_tokens": parsed.get("prompt_tokens", 0),
                "completion_tokens": parsed.get("completion_tokens", 0),
                "thoughts_tokens": parsed.get("thoughts_tokens", 0),
                "facts_retrieved": parsed.get("facts_retrieved", 0),
                "source": parsed.get("source", "mock"),
                "model": parsed.get("model", "mock-fallback"),
                "requested_model": parsed.get("requested_model", "gemini-3.8-flash"),
                "fallback_used": parsed.get("fallback_used", False),
                "evidence_ids": parsed.get("evidence_ids", []),
                "invalid_evidence_ids_count": parsed.get("invalid_evidence_ids_count", 0),
            }
        except Exception as err:
            # If server API key is configured or explicit key provided, visibly report provider failures
            from app.core.config import settings
            if isinstance(err, AppException) or settings.GEMINI_API_KEY or state.get("api_key") or "quota reached" in str(err).lower():
                raise
            log.warning(f"[{agent_type}] worker error, generating fallback response: {err}")
            return {
                "selected_option": f"{agent_type.replace('_', ' ').title()} Strategy (Fallback)",
                "positioning_statement": f"Operational briefing fallback for {agent_type} under degraded mode.",
                "rationale": f"Execution fallback triggered due to: {err}",
                "risks": "Low-confidence fallback output.",
                "confidence": "Low",
            }
    worker.__name__ = f"{agent_type}_agent"
    return worker


def _governance(state: SwarmState) -> Dict[str, Any]:
    """CMO governance gate + decision persistence."""
    confidence = state.get("confidence", "High")
    risks = state.get("risks", "")
    goal_statement = state.get("goal_statement", "")
    statement = state.get("positioning_statement", "")
    rationale = state.get("rationale", "")
    escalated, reason = _governance_check(
        confidence,
        risks=risks,
        goal_statement=goal_statement,
        statement=statement,
        rationale=rationale,
    )
    record_id = new_id()
    source = f"langgraph:{state.get('active_agent')}:{state.get('provider')}"
    try:
        save_decision(
            decision_id=record_id,
            goal_statement=goal_statement,
            selected_option=state.get("selected_option") or "Strategy Brief",
            confidence=confidence,
            escalated=escalated,
            reasoning_source=source,
            rationale=rationale,
            risks=reason or risks or "None identified",
            latency_ms=state.get("latency_ms", 0.0),
            total_wall_ms=state.get("total_wall_ms", state.get("latency_ms", 0.0)),
            retrieval_ms=state.get("retrieval_ms", 0.0),
            attempts=state.get("attempts", 1),
            prompt_tokens=state.get("prompt_tokens", 0),
            completion_tokens=state.get("completion_tokens", 0),
            thoughts_tokens=state.get("thoughts_tokens", 0),
            facts_retrieved=state.get("facts_retrieved", 0),
            source=state.get("source", "mock"),
            model=state.get("model", "mock-fallback"),
            requested_model=state.get("requested_model", "gemini-3.8-flash"),
            fallback_used=state.get("fallback_used", False),
            evidence_ids=state.get("evidence_ids", []),
            invalid_evidence_ids_count=state.get("invalid_evidence_ids_count", 0),
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
        self,
        goal_statement: str,
        agent_type: str = "branding",
        provider: str = DEFAULT_PROVIDER,
        api_key: Optional[str] = None,
        client_ip: Optional[str] = None,
        request_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        initial: SwarmState = {
            "goal_statement": goal_statement,
            "active_agent": agent_type,
            "provider": provider,
            "messages": [],
            "knowledge_units": [],
            "api_key": api_key,
            "client_ip": client_ip,
            "request_id": request_id,
        }
        config: Dict[str, Any] = {}
        handler = _langfuse_handler()
        if handler is not None:
            config["callbacks"] = [handler]

        final = _GRAPH.invoke(initial, config=config)

        selected_option = final.get("selected_option") or "Strategy Brief"
        confidence = final.get("confidence") or "High"
        active = final.get("active_agent", agent_type)
        decision_payload = {
            "id": final.get("decision_id"),
            "selected_option": selected_option,
            "confidence": confidence,
            "escalated": final.get("escalated", False),
            "escalation_reason": final.get("escalation_reason"),
            "reasoning_source": f"langgraph:{active}:{provider}",
            "rationale": final.get("rationale") or "",
            "risks": final.get("risks") or "",
            "latency_ms": final.get("latency_ms", 0.0),
            "total_wall_ms": final.get("total_wall_ms", final.get("latency_ms", 0.0)),
            "retrieval_ms": final.get("retrieval_ms", 0.0),
            "attempts": final.get("attempts", 1),
            "prompt_tokens": final.get("prompt_tokens", 0),
            "completion_tokens": final.get("completion_tokens", 0),
            "thoughts_tokens": final.get("thoughts_tokens", 0),
            "facts_retrieved": final.get("facts_retrieved", 0),
            "source": final.get("source", "mock"),
            "model": final.get("model", "mock-fallback"),
            "requested_model": final.get("requested_model", "gemini-3.8-flash"),
            "fallback_used": final.get("fallback_used", False),
            "evidence_ids": final.get("evidence_ids", []),
            "invalid_evidence_ids_count": final.get("invalid_evidence_ids_count", 0),
        }
        res = {
            "success": True,
            "positioning": {
                "statement": final.get("positioning_statement") or "",
                "differentiation_basis": "Sovereign Neo-Cloud Platform",
                "state": "ACTIVE",
            },
            "decision": decision_payload,
            "metrics": {
                "latency_ms": decision_payload["latency_ms"],
                "total_wall_ms": decision_payload["total_wall_ms"],
                "retrieval_ms": decision_payload["retrieval_ms"],
                "attempts": decision_payload["attempts"],
                "prompt_tokens": decision_payload["prompt_tokens"],
                "completion_tokens": decision_payload["completion_tokens"],
                "thoughts_tokens": decision_payload["thoughts_tokens"],
                "total_tokens": decision_payload["prompt_tokens"] + decision_payload["completion_tokens"] + decision_payload["thoughts_tokens"],
                "facts_retrieved": decision_payload["facts_retrieved"],
                "source": decision_payload["source"],
                "model": decision_payload["model"],
                "requested_model": decision_payload["requested_model"],
                "fallback_used": decision_payload["fallback_used"],
                "evidence_ids": decision_payload["evidence_ids"],
                "invalid_evidence_ids_count": decision_payload["invalid_evidence_ids_count"],
            },
            "knowledge_units": [
                {
                    "class": "fact",
                    "confidence": confidence.lower(),
                    "content": f"{active} agent decision: {selected_option}",
                }
            ],
        }
        if final.get("notice"):
            res["notice"] = final["notice"]
        return res


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
