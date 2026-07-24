"""Unified PR Agent Node — see app/agents/base.py for the shared pipeline and prompt registry."""

from app.agents.base import AgentNode


class PRAgentNode(AgentNode):
    def __init__(self):
        super().__init__("pr")
