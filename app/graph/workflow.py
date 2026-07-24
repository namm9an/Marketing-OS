"""
Swarm Workflow Engine — agent router + governance gate.

NOTE: this is a deterministic router, not a compiled LangGraph StateGraph. See the
"Audit & Remediation" section of docs/knowledge_base.md for the pending decision on
whether to adopt a real LangGraph supervisor graph (Milestone 5+) or keep this router.
"""

import logging
from typing import Dict, Any, Optional, Tuple

from app.agents.base import run_agent, AGENT_REGISTRY, DEFAULT_PROVIDER
from app.db.database import save_decision, save_knowledge_unit
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


class SwarmWorkflowEngine:
    def run(self, goal_statement: str, agent_type: str = "branding", provider: str = DEFAULT_PROVIDER) -> Dict[str, Any]:
        agent_type_clean = agent_type.lower().strip()
        if agent_type_clean not in AGENT_REGISTRY:
            agent_type_clean = "branding"
        record_id = new_id()
        source = f"agent:{agent_type_clean}:{provider}"
        log.info(f"[Swarm Engine] Executing {agent_type_clean} agent via {provider}")

        parsed = run_agent(agent_type_clean, goal_statement, provider=provider)

        selected_option = parsed.get("selected_option", "Strategy Brief")
        statement = parsed.get("statement", "")
        rationale = parsed.get("rationale", "")
        risks = parsed.get("risks", "")
        confidence = parsed.get("confidence", "High")
        escalated, escalation_reason = _governance_check(confidence, risks)

        try:
            save_decision(
                decision_id=record_id,
                goal_statement=goal_statement,
                selected_option=selected_option,
                confidence=confidence,
                escalated=escalated,
                reasoning_source=source,
                rationale=rationale,
                risks=risks,
            )
            save_knowledge_unit(
                id_str=new_id(),
                k_class="fact",
                confidence=confidence.lower(),
                content=f"{agent_type_clean} agent analysis: {selected_option} - {statement[:100]}",
                organization="E2E Networks",
                source_url="https://www.e2enetworks.com/",
                enriched_by=f"agent_{agent_type_clean}",
            )
        except Exception as db_err:
            log.warning(f"[DB Warning] Could not persist decision: {db_err}")

        return {
            "success": True,
            "positioning": {
                "statement": statement,
                "differentiation_basis": "Sovereign Neo-Cloud Platform",
                "state": "ACTIVE",
            },
            "decision": {
                "id": record_id,
                "selected_option": selected_option,
                "confidence": confidence,
                "escalated": escalated,
                "escalation_reason": escalation_reason,
                "reasoning_source": source,
                "rationale": rationale,
                "risks": risks,
            },
            "knowledge_units": [
                {"class": "fact", "confidence": confidence.lower(), "content": f"{agent_type_clean} agent decision: {selected_option}"}
            ],
        }


swarm_engine = SwarmWorkflowEngine()
