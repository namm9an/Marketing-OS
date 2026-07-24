"""
Social Media Agent Node — Social Media & Viral Campaign Strategist
Dynamically retrieves and enriches Knowledge Units from app/data/marketing_os.db
"""

import json
from typing import Dict, Any
from app.services.llm_service import LLMService
from app.db.database import search_knowledge_units, save_knowledge_unit
from app.core.primitives import new_id

SOCIAL_SYSTEM_PROMPT = """You are the Lead Social Media Strategist for E2E Networks (NSE: E2E).

YOUR DOMAIN KNOWLEDGE:
1. ORGANISATION: E2E Networks & TIR AI Platform (B200 at ₹671/hr, H100 at ₹334/hr, MeitY Empaneled, 1-click model scaling).
2. PLATFORMS: LinkedIn (B2B tech decision makers, C-suite, VP of AI), X/Twitter (AI researchers, open-source developers, LLM engineers).
3. GOAL: Create high-impact social media campaign hooks, viral thread concepts, and executive thought leadership posts.

Return a JSON object with:
{
  "selected_option": "Campaign Angle Title",
  "statement": "Social Media Campaign Hook & Core Message",
  "rationale": "Platform breakdown (LinkedIn vs X) & viral hooks strategy",
  "risks": "Potential brand engagement risks",
  "confidence": "High" | "Medium" | "Low"
}
Output valid JSON only.
"""

class SocialAgentNode:
    def process(self, goal_statement: str, provider: str = "gemini-3.6-flash") -> Dict[str, Any]:
        db_facts = search_knowledge_units(query=goal_statement, limit=5)
        facts_context = ""
        if db_facts:
            facts_context = "\n\nRELEVANT KNOWLEDGE UNITS FROM DB:\n" + "\n".join(
                [f"- [{f['organization']}]: {f['content']}" for f in db_facts]
            )

        result = LLMService.generate(
            system_prompt=SOCIAL_SYSTEM_PROMPT,
            user_prompt=f"Goal: {goal_statement}{facts_context}\nDevelop a multi-platform social media strategy.",
            provider=provider
        )
        text = result["text"].strip()
        if text.startswith("```"):
            text = text.split("\n", 1)[1].rsplit("```", 1)[0].strip()

        try:
            parsed = json.loads(text)
        except Exception:
            parsed = {
                "selected_option": "Social Media Strategy",
                "statement": text,
                "rationale": "B2B LinkedIn & X/Twitter viral campaign plan.",
                "risks": "Audience reach variation.",
                "confidence": "High"
            }

        try:
            save_knowledge_unit(
                id_str=new_id(),
                k_class="social_campaign",
                confidence=parsed.get("confidence", "High").lower(),
                content=f"Social Strategy: {parsed.get('selected_option')} - {parsed.get('statement')[:120]}",
                organization="E2E Networks",
                enriched_by="social_agent"
            )
        except Exception as err:
            print(f"[DB Warning] Could not enrich knowledge unit: {err}")

        return parsed
