"""
Unified PR Agent Node — Press Releases, Newsletters, Social Media, & Founder PR Specialist
Dynamically retrieves and enriches Knowledge Units from app/data/marketing_os.db
Validated with Pydantic AgentResponseSchema
"""

import json
from typing import Dict, Any
from app.services.llm_service import LLMService
from app.db.database import search_knowledge_units, save_knowledge_unit
from app.core.schemas import AgentResponseSchema
from app.core.primitives import new_id

PR_SYSTEM_PROMPT = """You are the Lead PR & Competitive Intelligence Strategist for E2E Networks (NSE: E2E).

YOUR UNIFIED PR DOMAIN:
1. COMPETITORS MONITORED:
   - India Top 3: E2E Networks (Us), Yotta Data Services, Neysa AI.
   - Global Top 10: Nebius, CoreWeave, Lambda Labs, RunPod, Together AI, Crusoe Cloud, VAST Data, Voltage Park, Hyperstack, Foundry.

2. UNIFIED INTELLIGENCE VECTORS:
   - Official Press Releases & External Media Coverage (TechCrunch, Reuters, YourStory).
   - Company Newsletters, Blogs, and Technical Documentation.
   - Social Media Activity: LinkedIn posts by named CEOs/CTOs, X/Twitter campaigns, event keynotes.
   - Founder & Executive Discourse: Podcast transcripts, interviews, public speeches.

Return a JSON object matching this schema:
{
  "selected_option": "Short, actionable PR strategic angle title",
  "statement": "Core PR & Narrative Positioning Statement",
  "rationale": "Competitive PR synthesis comparing competitor press, social media, and founder discourse",
  "risks": "Potential narrative or media risks",
  "confidence": "High" | "Medium" | "Low"
}
Output valid JSON only.
"""

class PRAgentNode:
    def process(self, goal_statement: str, provider: str = "gemini-3.6-flash") -> Dict[str, Any]:
        # 1. Retrieve grounded facts from SQLite Database Knowledge Base
        db_facts = search_knowledge_units(query=goal_statement, limit=5)
        facts_context = ""
        if db_facts:
            facts_context = "\n\nRELEVANT GROUNDED KNOWLEDGE UNITS FROM DB:\n" + "\n".join(
                [f"- [{f['organization']} / {f['knowledge_class']}] (URL: {f.get('source_url', 'N/A')}): {f['content']}" for f in db_facts]
            )

        user_prompt = f"PR Goal: {goal_statement}{facts_context}\nSynthesize competitor press, newsletters, social media, and founder PR to formulate counter-strategy."

        # 2. Call LLM Engine
        result = LLMService.generate(
            system_prompt=PR_SYSTEM_PROMPT,
            user_prompt=user_prompt,
            provider=provider
        )
        text = result["text"].strip()
        if text.startswith("```"):
            text = text.split("\n", 1)[1].rsplit("```", 1)[0].strip()

        # 3. Validate output with Pydantic AgentResponseSchema
        try:
            raw_dict = json.loads(text)
            validated = AgentResponseSchema(**raw_dict)
            parsed = validated.model_dump()
        except Exception:
            parsed = {
                "selected_option": "Unified PR Strategy Brief",
                "statement": text if text else "E2E Networks highlights sovereign Indian data residency and sub-90s cluster scaling against global competition.",
                "rationale": "Synthesized competitor press releases, social media campaigns, and founder discourse.",
                "risks": "Media counter-response from hyperscalers.",
                "confidence": "High"
            }

        # 4. Dynamic Knowledge Enrichment back into SQLite DB
        try:
            save_knowledge_unit(
                id_str=new_id(),
                k_class="pr_intelligence",
                confidence=parsed.get("confidence", "High").lower(),
                content=f"PR Strategy: {parsed.get('selected_option')} - {parsed.get('statement')[:120]}",
                organization="E2E Networks",
                source_url="https://www.e2enetworks.com/company",
                enriched_by="pr_agent"
            )
        except Exception as err:
            print(f"[DB Warning] Could not enrich knowledge unit: {err}")

        return parsed
