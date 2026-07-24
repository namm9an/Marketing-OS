"""
Branding Agent Node — Neo-Cloud Design Systems & Tech Stack Specialist
"""

import json
from typing import Dict, Any
from app.services.llm_service import LLMService

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
        result = LLMService.generate(
            system_prompt=BRANDING_SYSTEM_PROMPT,
            user_prompt=f"Goal: {goal_statement}\nFormulate a branding strategy, design system alignment, and narrative pivot plan.",
            provider=provider
        )
        text = result["text"].strip()
        if text.startswith("```"):
            text = text.split("\n", 1)[1].rsplit("```", 1)[0].strip()
        try:
            return json.loads(text)
        except Exception:
            return {
                "selected_option": "Branding Strategy Brief",
                "statement": text,
                "rationale": "Neo-cloud design system & tech stack analysis.",
                "risks": "Market positioning trade-offs.",
                "confidence": "High"
            }
