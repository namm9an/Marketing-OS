"""
Unified PR Agent Node — Press Releases, Newsletters, Social Media, & Founder PR Specialist
"""

import json
from typing import Dict, Any
from app.services.llm_service import LLMService

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

Return a JSON object with:
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
        result = LLMService.generate(
            system_prompt=PR_SYSTEM_PROMPT,
            user_prompt=f"PR Goal: {goal_statement}\nSynthesize competitor press, newsletters, social media, and founder PR to formulate counter-strategy.",
            provider=provider
        )
        text = result["text"].strip()
        if text.startswith("```"):
            text = text.split("\n", 1)[1].rsplit("```", 1)[0].strip()
        try:
            return json.loads(text)
        except Exception:
            return {
                "selected_option": "Unified PR Strategy Brief",
                "statement": text,
                "rationale": "Synthesized competitor press releases, social media, and founder discourse.",
                "risks": "Media counter-response.",
                "confidence": "High"
            }
