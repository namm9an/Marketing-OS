"""
Branding Agent Node — Neo-Cloud Design Systems & Tech Stack Specialist
Dynamically retrieves and enriches Knowledge Units from app/data/marketing_os.db
"""

import json
from typing import Dict, Any
from app.services.llm_service import LLMService
from app.db.database import search_knowledge_units, save_knowledge_unit
from app.core.primitives import new_id

BRANDING_SYSTEM_PROMPT = """You are the Lead Branding & Positioning Strategist for E2E Networks (NSE: E2E).

YOUR DOMAIN KNOWLEDGE:
1. ORGANISATION (E2E Networks):
   - Products: TIR AI Platform (fine-tuning, RAG, no-code AI agents, Indic Voice AI, HuggingFace & W&B integrations).
   - Infrastructure: NVIDIA B200 (starting ₹671/hr / $6.99/hr), H200, H100, L40S, HGX clusters.
   - Certifications: MeitY Empaneled, 99.95% SLA Uptime, SOC2 Compliant, 16+ years experience.

2. COMPETITOR TAXONOMY:
   - Global Top 10: CoreWeave, Nebius, Lambda Labs, RunPod, Together AI, Crusoe Cloud, VAST Data, Voltage Park, Hyperstack, Foundry.
   - India Top 3: E2E Networks (Us), Yotta Data Services, Neysa AI.

3. CLOUD BRANDING ARCHETYPES:
   - Enterprise-Centric: Heavy SOC2/FINRA messaging, MeitY empanelment, SLA guarantees.
   - Developer-Focused: Sub-50ms instance launch, self-serve CLI, transparent per-hour pricing.
   - Research-Focused: Massive batch cluster compute, paper benchmarks, raw Slurm access.

Return a JSON object with:
{
  "selected_option": "Short strategy title",
  "statement": "Positioning statement",
  "rationale": "Strategic reasoning based on tech stack & visual design",
  "risks": "Identified risks",
  "confidence": "High" | "Medium" | "Low"
}
Output valid JSON only.
"""

class BrandingAgentNode:
    def process(self, goal_statement: str, provider: str = "gemini-3.6-flash") -> Dict[str, Any]:
        # 1. Retrieve relevant facts from SQLite Database Knowledge Base
        db_facts = search_knowledge_units(query=goal_statement, limit=5)
        facts_context = ""
        if db_facts:
            facts_context = "\n\nRELEVANT KNOWLEDGE UNITS FROM SQLITE DB:\n" + "\n".join(
                [f"- [{f['organization']} / {f['knowledge_class']}]: {f['content']}" for f in db_facts]
            )

        user_prompt = f"Goal: {goal_statement}{facts_context}\nFormulate a branding strategy, design system alignment, and narrative pivot plan."

        # 2. Call LLM Engine
        result = LLMService.generate(
            system_prompt=BRANDING_SYSTEM_PROMPT,
            user_prompt=user_prompt,
            provider=provider
        )
        text = result["text"].strip()
        if text.startswith("```"):
            text = text.split("\n", 1)[1].rsplit("```", 1)[0].strip()

        try:
            parsed = json.loads(text)
        except Exception:
            parsed = {
                "selected_option": "Branding Strategy Brief",
                "statement": text,
                "rationale": "Neo-cloud design system & tech stack analysis.",
                "risks": "Market positioning trade-offs.",
                "confidence": "High"
            }

        # 3. Dynamic Knowledge Enrichment back into SQLite DB
        try:
            save_knowledge_unit(
                id_str=new_id(),
                k_class="positioning",
                confidence=parsed.get("confidence", "High").lower(),
                content=f"Branding Strategy: {parsed.get('selected_option')} - {parsed.get('statement')[:120]}",
                organization="E2E Networks",
                enriched_by="branding_agent"
            )
        except Exception as err:
            print(f"[DB Warning] Could not enrich knowledge unit: {err}")

        return parsed
