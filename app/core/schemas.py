"""
Pydantic Data Schemas & Input/Output Validation Contracts.

Only the agent-output contract is enforced at runtime. (KnowledgeUnit/DecisionRecord/
RunRequest models were defined but never imported — removed in the audit remediation.)
"""

from typing import List

from pydantic import BaseModel, Field


class AgentResponseSchema(BaseModel):
    selected_option: str = Field(..., description="Short title of strategy option")
    statement: str = Field(..., description="Core positioning or strategic statement")
    rationale: str = Field(..., description="Strategic reasoning backed by facts")
    risks: str = Field(..., description="Identified risks or counter-actions")
    confidence: str = Field(default="High", description="Confidence rating: High, Medium, Low")


class DigestSchema(BaseModel):
    """CMO weekly digest synthesis (prose only — citations come from the DB, not the LLM)."""

    headline: str = Field(..., description="One-line executive headline on competitor movement")
    executive_summary: str = Field(..., description="Short cross-agent summary for the CMO")
    competitor_movements: List[str] = Field(default_factory=list, description="Notable rival moves")
    recommended_actions: List[str] = Field(default_factory=list, description="What E2E should do")
