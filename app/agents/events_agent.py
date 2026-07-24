"""
Events Agent Node — Events & Field Marketing Strategist
Dynamically retrieves and enriches Knowledge Units from app/data/marketing_os.db
"""

import json
from typing import Dict, Any
from app.services.llm_service import LLMService
from app.db.database import search_knowledge_units, save_knowledge_unit
from app.core.primitives import new_id

EVENTS_SYSTEM_PROMPT = """You are the Lead Events & Field Marketing Strategist for E2E Networks.

YOUR DOMAIN KNOWLEDGE:
1. EVENTS PORTFOLIO: Developer Hackathons, AI Summits, Enterprise Executive Roundtables, Indic AI Expos.
2. GOAL: Plan event keynotes, booth demos, sponsorship ROI, and developer activation strategies.

Return a JSON object with:
{
  "selected_option": "Event Activation Title",
  "statement": "Event Concept & Keynote Strategy",
  "rationale": "Field marketing breakdown, booth demo plan, and lead capture mechanics",
  "risks": "Logistical & attendance risks",
  "confidence": "High" | "Medium" | "Low"
}
Output valid JSON only.
"""

class EventsAgentNode:
    def process(self, goal_statement: str, provider: str = "gemini-3.6-flash") -> Dict[str, Any]:
        db_facts = search_knowledge_units(query=goal_statement, limit=5)
        facts_context = ""
        if db_facts:
            facts_context = "\n\nRELEVANT KNOWLEDGE UNITS FROM DB:\n" + "\n".join(
                [f"- [{f['organization']}]: {f['content']}" for f in db_facts]
            )

        result = LLMService.generate(
            system_prompt=EVENTS_SYSTEM_PROMPT,
            user_prompt=f"Goal: {goal_statement}{facts_context}\nDevelop an event and field marketing plan.",
            provider=provider
        )
        text = result["text"].strip()
        if text.startswith("```"):
            text = text.split("\n", 1)[1].rsplit("```", 1)[0].strip()

        try:
            parsed = json.loads(text)
        except Exception:
            parsed = {
                "selected_option": "Field Marketing Event Activation",
                "statement": text,
                "rationale": "Keynote & developer activation plan.",
                "risks": "Event logistics.",
                "confidence": "High"
            }

        try:
            save_knowledge_unit(
                id_str=new_id(),
                k_class="event_strategy",
                confidence=parsed.get("confidence", "High").lower(),
                content=f"Event Strategy: {parsed.get('selected_option')} - {parsed.get('statement')[:120]}",
                organization="E2E Networks",
                enriched_by="events_agent"
            )
        except Exception as err:
            print(f"[DB Warning] Could not enrich knowledge unit: {err}")

        return parsed
