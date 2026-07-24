"""
Pydantic Data Schemas & Input/Output Validation Contracts
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

class KnowledgeUnitSchema(BaseModel):
    id: str = Field(..., description="Unique ID for knowledge unit")
    organization: str = Field(default="E2E Networks", description="Target organization name")
    knowledge_class: str = Field(..., description="Classification category: pricing, hardware, compliance, etc.")
    confidence: str = Field(default="high", description="Confidence rating: high, medium, low")
    content: str = Field(..., description="Empirical fact snippet")
    source_url: Optional[str] = Field(default=None, description="Verifiable primary source URL")
    enriched_by: str = Field(default="system", description="Provenance agent or crawler tag")
    created_at: Optional[str] = Field(default=None, description="ISO timestamp")

class AgentResponseSchema(BaseModel):
    selected_option: str = Field(..., description="Short title of strategy option")
    statement: str = Field(..., description="Core positioning or strategic statement")
    rationale: str = Field(..., description="Strategic reasoning backed by facts")
    risks: str = Field(..., description="Identified risks or counter-actions")
    confidence: str = Field(default="High", description="Confidence rating: High, Medium, Low")

class DecisionRecordSchema(BaseModel):
    id: str = Field(..., description="Unique decision record ID")
    goal_statement: str = Field(..., description="Original user business goal")
    selected_option: str = Field(..., description="Selected strategic option title")
    confidence: str = Field(default="High", description="Decision confidence level")
    escalated: bool = Field(default=False, description="Whether escalated to CMO ratification")
    reasoning_source: str = Field(..., description="Agent and LLM provider source tag")
    rationale: str = Field(..., description="Detailed strategic rationale")
    risks: str = Field(..., description="Identified risks")
    created_at: Optional[str] = Field(default=None, description="ISO timestamp")

class RunRequestSchema(BaseModel):
    goal: str = Field(..., min_length=5, description="Business goal statement")
    provider: str = Field(default="gemini-3.6-flash", description="LLM provider model name")
    agent_type: str = Field(default="branding", description="Agent role: branding, pr")
