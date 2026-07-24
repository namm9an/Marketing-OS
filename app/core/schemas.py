"""
Pydantic Data Schemas & Input/Output Validation Contracts.

Only the agent-output contract is enforced at runtime. (KnowledgeUnit/DecisionRecord/
RunRequest models were defined but never imported — removed in the audit remediation.)
"""

from pydantic import BaseModel, Field


class AgentResponseSchema(BaseModel):
    selected_option: str = Field(..., description="Short title of strategy option")
    statement: str = Field(..., description="Core positioning or strategic statement")
    rationale: str = Field(..., description="Strategic reasoning backed by facts")
    risks: str = Field(..., description="Identified risks or counter-actions")
    confidence: str = Field(default="High", description="Confidence rating: High, Medium, Low")
