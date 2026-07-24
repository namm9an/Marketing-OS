"""Product Marketing Agent Node — see app/agents/base.py for the shared pipeline and prompt registry."""

from app.agents.base import AgentNode


class ProductMarketingAgentNode(AgentNode):
    def __init__(self):
        super().__init__("product_marketing")
