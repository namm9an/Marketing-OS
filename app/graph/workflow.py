"""
LangGraph Swarm Workflow Engine & Graph Compilation
"""

import logging
from typing import Dict, Any
from app.graph.state import SwarmState
from app.agents.branding_agent import BrandingAgentNode
from app.agents.pr_agent import PRAgentNode
from app.agents.social_agent import SocialAgentNode
from app.agents.product_marketing_agent import ProductMarketingAgentNode
from app.agents.events_agent import EventsAgentNode
from app.db.database import save_decision, save_knowledge_unit
from app.core.primitives import new_id

log = logging.getLogger(__name__)

class SwarmWorkflowEngine:
    def __init__(self):
        self.branding_node = BrandingAgentNode()
        self.pr_node = PRAgentNode()
        self.social_node = SocialAgentNode()
        self.pmm_node = ProductMarketingAgentNode()
        self.events_node = EventsAgentNode()

    def run(self, goal_statement: str, agent_type: str = "branding", provider: str = "gemini-3.6-flash") -> Dict[str, Any]:
        agent_type_clean = agent_type.lower().strip()
        record_id = new_id()
        
        if agent_type_clean == "pr":
            log.info(f"[Swarm Engine] Executing PRAgentNode via {provider}")
            parsed = self.pr_node.process(goal_statement, provider=provider)
            source = f"agent:pr:{provider}"
        # --- FUTURE AGENTS (Preserved Architecture, Currently Commented Out) ---
        # elif agent_type_clean == "social":
        #     parsed = self.social_node.process(goal_statement, provider=provider)
        #     source = f"agent:social:{provider}"
        # elif agent_type_clean in ["product_marketing", "pmm"]:
        #     parsed = self.pmm_node.process(goal_statement, provider=provider)
        #     source = f"agent:product_marketing:{provider}"
        # elif agent_type_clean == "events":
        #     parsed = self.events_node.process(goal_statement, provider=provider)
        #     source = f"agent:events:{provider}"
        else:
            log.info(f"[Swarm Engine] Executing BrandingAgentNode via {provider}")
            parsed = self.branding_node.process(goal_statement, provider=provider)
            source = f"agent:branding:{provider}"

        selected_option = parsed.get("selected_option", "Strategy Brief")
        statement = parsed.get("statement", "")
        rationale = parsed.get("rationale", "")
        risks = parsed.get("risks", "")
        confidence = parsed.get("confidence", "High")

        # Save to SQLite WAL Database
        try:
            save_decision(
                decision_id=record_id,
                goal_statement=goal_statement,
                selected_option=selected_option,
                confidence=confidence,
                escalated=False,
                reasoning_source=source,
                rationale=rationale,
                risks=risks
            )
            save_knowledge_unit(
                id_str=new_id(),
                k_class="fact",
                confidence=confidence.lower(),
                content=f"{agent_type_clean.capitalize()} Agent Analysis: {selected_option} - {statement[:100]}"
            )
        except Exception as db_err:
            log.warning(f"[DB Warning] Could not persist decision: {db_err}")

        return {
            "success": True,
            "positioning": {
                "statement": statement,
                "differentiation_basis": "Sovereign Neo-Cloud Platform",
                "state": "ACTIVE"
            },
            "decision": {
                "id": record_id,
                "selected_option": selected_option,
                "confidence": confidence,
                "escalated": False,
                "escalation_reason": None,
                "reasoning_source": source,
                "rationale": rationale,
                "risks": risks
            },
            "knowledge_units": [
                {"class": "fact", "confidence": confidence.lower(), "content": f"{agent_type_clean.capitalize()} Agent Decision: {selected_option}"}
            ]
        }

swarm_engine = SwarmWorkflowEngine()
