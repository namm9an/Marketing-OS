"""
Product Marketing Agent Node — Product Positioning & GTM Strategist
Dynamically retrieves and enriches Knowledge Units from app/data/marketing_os.db
"""

import json
from typing import Dict, Any
from app.services.llm_service import LLMService
from app.db.database import search_knowledge_units, save_knowledge_unit
from app.core.primitives import new_id

PMM_SYSTEM_PROMPT = """You are the Lead Product Marketing Manager (PMM) for E2E Networks & TIR AI Platform.

YOUR DOMAIN KNOWLEDGE:
1. PRODUCTS: TIR AI Platform, B200 / H200 / H100 GPU Clusters, Fast InfiniBand Storage, RAG Engine, Indic Voice AI.
2. TARGET SEGMENTS: Enterprise CTOs, AI Founders, ML Engineers, Sovereign Govt Agencies.
3. GOAL: Formulate feature messaging, competitive battlecards, tier pricing, and Go-To-Market (GTM) launch plans.

Return a JSON object with:
{
  "selected_option": "Product Launch Title",
  "statement": "GTM Value Proposition & Core Feature Messaging",
  "rationale": "Competitive battlecard synthesis against Yotta, Nebius, and RunPod",
  "risks": "GTM execution & adoption risks",
  "confidence": "High" | "Medium" | "Low"
}
Output valid JSON only.
"""

class ProductMarketingAgentNode:
    def process(self, goal_statement: str, provider: str = "gemini-3.6-flash") -> Dict[str, Any]:
        db_facts = search_knowledge_units(query=goal_statement, limit=5)
        facts_context = ""
        if db_facts:
            facts_context = "\n\nRELEVANT KNOWLEDGE UNITS FROM DB:\n" + "\n".join(
                [f"- [{f['organization']}]: {f['content']}" for f in db_facts]
            )

        result = LLMService.generate(
            system_prompt=PMM_SYSTEM_PROMPT,
            user_prompt=f"Goal: {goal_statement}{facts_context}\nFormulate product marketing positioning and GTM strategy.",
            provider=provider
        )
        text = result["text"].strip()
        if text.startswith("```"):
            text = text.split("\n", 1)[1].rsplit("```", 1)[0].strip()

        try:
            parsed = json.loads(text)
        except Exception:
            parsed = {
                "selected_option": "Product Marketing Launch Strategy",
                "statement": text,
                "rationale": "Feature battlecard & GTM positioning plan.",
                "risks": "Market adoption timeline.",
                "confidence": "High"
            }

        try:
            save_knowledge_unit(
                id_str=new_id(),
                k_class="gtm_strategy",
                confidence=parsed.get("confidence", "High").lower(),
                content=f"PMM Strategy: {parsed.get('selected_option')} - {parsed.get('statement')[:120]}",
                organization="E2E Networks",
                enriched_by="product_marketing_agent"
            )
        except Exception as err:
            print(f"[DB Warning] Could not enrich knowledge unit: {err}")

        return parsed
