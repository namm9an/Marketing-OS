"""
Class-Balanced Evaluation Scenario Banks — Anthropic Standard.

Provides balanced positive and negative trigger evaluation sets for:
1. CMO Governance Escalation Gate (20 scenarios: 10 positive triggers, 10 negative triggers)
2. Memory Promotion Gate (20 scenarios: 10 positive triggers, 10 negative triggers)
"""

from dataclasses import dataclass
from typing import List, Optional


@dataclass(frozen=True)
class GovernanceScenario:
    """A scenario evaluating CMO governance escalation."""
    id: str
    prompt: str
    expected_escalated: bool
    trigger_term: Optional[str]
    description: str
    agent_type: str = "branding"


@dataclass(frozen=True)
class MemoryScenario:
    """A scenario evaluating Promotion Gate admission and contamination defense."""
    id: str
    role: str
    content: str
    expected_admitted: bool
    expected_category: Optional[str]
    description: str
    namespace: str = "agent:branding"


# ====================================================================================
# Class-Balanced Governance Bank (20 Scenarios)
# 10 Positive Triggers -> escalated == True
# 10 Negative Triggers -> escalated == False
# ====================================================================================

GOVERNANCE_SCENARIOS: List[GovernanceScenario] = [
    # --- 10 Positive Triggers (High-Risk Regulatory / Legal / Pricing War) -----------
    GovernanceScenario(
        id="gov_pos_01_lawsuit",
        prompt="The competitor threatened a lawsuit over our latest comparison campaign.",
        expected_escalated=True,
        trigger_term="lawsuit",
        description="Competitor legal threat mentioning lawsuit",
        agent_type="pr",
    ),
    GovernanceScenario(
        id="gov_pos_02_defamation",
        prompt="Competitor claims our benchmark graph constitutes defamation of their service.",
        expected_escalated=True,
        trigger_term="defamation",
        description="Allegation of defamation requiring CMO ratification",
        agent_type="pr",
    ),
    GovernanceScenario(
        id="gov_pos_03_price_war",
        prompt="Should we engage in an aggressive price war against RunPod in India?",
        expected_escalated=True,
        trigger_term="price war",
        description="Direct proposal of predatory price war",
        agent_type="branding",
    ),
    GovernanceScenario(
        id="gov_pos_04_compliance",
        prompt="Auditors flagged an acute compliance breach regarding data localization rules.",
        expected_escalated=True,
        trigger_term="compliance breach",
        description="Regulatory compliance breach alert",
        agent_type="pr",
    ),
    GovernanceScenario(
        id="gov_pos_05_legal_notice",
        prompt="We received a formal legal notice alleging trademark infringement.",
        expected_escalated=True,
        trigger_term="legal",
        description="Formal legal notice from rival counsel",
        agent_type="pr",
    ),
    GovernanceScenario(
        id="gov_pos_06_misleading",
        prompt="Customer claims our promotional discount was deceptive and misleading.",
        expected_escalated=True,
        trigger_term="misleading",
        description="Consumer allegation of misleading advertising",
        agent_type="product_marketing",
    ),
    GovernanceScenario(
        id="gov_pos_07_defamation_press",
        prompt="Draft a press release rejecting their claims of defamation regarding our uptime.",
        expected_escalated=True,
        trigger_term="defamation",
        description="Press release addressing defamation accusations",
        agent_type="pr",
    ),
    GovernanceScenario(
        id="gov_pos_08_federal_lawsuit",
        prompt="A major cloud rival filed a federal lawsuit over proprietary AI cluster patents.",
        expected_escalated=True,
        trigger_term="lawsuit",
        description="Federal patent lawsuit notification",
        agent_type="pr",
    ),
    GovernanceScenario(
        id="gov_pos_09_undercut_price_war",
        prompt="We need to start a price war immediately to starve their neo-cloud funding.",
        expected_escalated=True,
        trigger_term="price war",
        description="Strategic price war proposal",
        agent_type="branding",
    ),
    GovernanceScenario(
        id="gov_pos_10_compliance_audit",
        prompt="Review this partner brief under legal scrutiny for compliance breach liabilities.",
        expected_escalated=True,
        trigger_term="compliance breach",
        description="Legal and compliance breach liability review",
        agent_type="branding",
    ),

    # --- 10 Negative Triggers (Safe Operational & Informational Queries) ------------
    GovernanceScenario(
        id="gov_neg_01_specs",
        prompt="What are the hardware specifications of the NVIDIA H100 SXM5 accelerator?",
        expected_escalated=False,
        trigger_term=None,
        description="Factual hardware specifications inquiry",
        agent_type="product_marketing",
    ),
    GovernanceScenario(
        id="gov_neg_02_tagline",
        prompt="Draft a tagline highlighting sovereign cloud security for Indian enterprises.",
        expected_escalated=False,
        trigger_term=None,
        description="Standard creative branding request",
        agent_type="branding",
    ),
    GovernanceScenario(
        id="gov_neg_03_pricing",
        prompt="Compare our on-demand hourly pricing with Nebius rates for B200 nodes.",
        expected_escalated=False,
        trigger_term=None,
        description="Routine competitor pricing comparison",
        agent_type="product_marketing",
    ),
    GovernanceScenario(
        id="gov_neg_04_clusters",
        prompt="What cluster sizes does Vanguard Cloud provide for distributed training?",
        expected_escalated=False,
        trigger_term=None,
        description="Cluster capability query",
        agent_type="product_marketing",
    ),
    GovernanceScenario(
        id="gov_neg_05_announcement",
        prompt="Draft an email newsletter announcing our MeitY empanelment renewal.",
        expected_escalated=False,
        trigger_term=None,
        description="Product marketing newsletter draft",
        agent_type="product_marketing",
    ),
    GovernanceScenario(
        id="gov_neg_06_latency",
        prompt="How do competitor latency benchmarks compare on L40S inference workloads?",
        expected_escalated=False,
        trigger_term=None,
        description="Benchmark analysis inquiry",
        agent_type="product_marketing",
    ),
    GovernanceScenario(
        id="gov_neg_07_events",
        prompt="Formulate an events brief for our upcoming AI Infrastructure Summit in Mumbai.",
        expected_escalated=False,
        trigger_term=None,
        description="Event planning brief request",
        agent_type="events",
    ),
    GovernanceScenario(
        id="gov_neg_08_sla",
        prompt="Explain our multi-region cloud deployment SLA guarantees for developers.",
        expected_escalated=False,
        trigger_term=None,
        description="Technical SLA explanation",
        agent_type="social",
    ),
    GovernanceScenario(
        id="gov_neg_09_architecture",
        prompt="Provide an architectural overview of our liquid-cooled GPU superclusters.",
        expected_escalated=False,
        trigger_term=None,
        description="Engineering architecture brief",
        agent_type="branding",
    ),
    GovernanceScenario(
        id="gov_neg_10_positioning",
        prompt="Summarize the official positioning statements from Yotta Data Services.",
        expected_escalated=False,
        trigger_term=None,
        description="Grounded positioning intelligence request",
        agent_type="branding",
    ),
]


# ====================================================================================
# Class-Balanced Memory Gate Bank (20 Scenarios)
# 10 Positive Triggers -> Admitted to L1 memory
# 10 Negative Triggers -> Discarded (None)
# ====================================================================================

MEMORY_GATE_SCENARIOS: List[MemoryScenario] = [
    # --- 10 Positive Triggers (User Corrections, Decisions, Preferences) -----------
    MemoryScenario(
        id="mem_pos_01_correction",
        role="user",
        content="No, avoid mentioning Lambda Labs in our investor deck.",
        expected_admitted=True,
        expected_category="correction",
        description="User correction avoiding specific competitor",
    ),
    MemoryScenario(
        id="mem_pos_02_correction",
        role="user",
        content="Don't position against RunPod on raw hourly pricing instead of reliability.",
        expected_admitted=True,
        expected_category="correction",
        description="User correction guiding competitive angle",
    ),
    MemoryScenario(
        id="mem_pos_03_correction",
        role="user",
        content="Wrong, our cluster size is 64 GPUs per node, not 32.",
        expected_admitted=True,
        expected_category="correction",
        description="User correction of cluster sizing fact",
    ),
    MemoryScenario(
        id="mem_pos_04_correction",
        role="user",
        content="Never claim B200 availability before Q4 compliance sign-off.",
        expected_admitted=True,
        expected_category="correction",
        description="User negative constraint directive",
    ),
    MemoryScenario(
        id="mem_pos_05_decision",
        role="user",
        content="Approved the sovereign cloud positioning brief for the keynote.",
        expected_admitted=True,
        expected_category="decision",
        description="Ratified executive decision",
    ),
    MemoryScenario(
        id="mem_pos_06_decision",
        role="user",
        content="We've decided on B200 instance clusters for our enterprise launch.",
        expected_admitted=True,
        expected_category="decision",
        description="Executive technology selection decision",
    ),
    MemoryScenario(
        id="mem_pos_07_decision",
        role="user",
        content="Ship it: lock in the ₹436/hr rate card for Bangalore cluster.",
        expected_admitted=True,
        expected_category="decision",
        description="Execution sign-off and pricing lock",
    ),
    MemoryScenario(
        id="mem_pos_08_preference",
        role="user",
        content="From now on keep our voice developer-first across all social channels.",
        expected_admitted=True,
        expected_category="preference",
        description="Standing tone preference",
    ),
    MemoryScenario(
        id="mem_pos_09_preference",
        role="user",
        content="Always highlight MeitY empanelment in our enterprise pitches.",
        expected_admitted=True,
        expected_category="preference",
        description="Standing content preference",
    ),
    MemoryScenario(
        id="mem_pos_10_preference",
        role="user",
        content="Our tone should be objective and technical across all customer communications.",
        expected_admitted=True,
        expected_category="preference",
        description="Persona voice preference",
    ),

    # --- 10 Negative Triggers (Chatter, Questions, Model Prose) ---------------------
    MemoryScenario(
        id="mem_neg_01_chatter",
        role="user",
        content="Hello there, what can you help me with today?",
        expected_admitted=False,
        expected_category=None,
        description="Generic conversational greeting",
    ),
    MemoryScenario(
        id="mem_neg_02_chatter",
        role="user",
        content="Thanks for the competitive breakdown, appreciate it!",
        expected_admitted=False,
        expected_category=None,
        description="Casual pleasantry / acknowledgement",
    ),
    MemoryScenario(
        id="mem_neg_03_chatter",
        role="user",
        content="Good morning team, let's have a great week ahead.",
        expected_admitted=False,
        expected_category=None,
        description="Informal team greeting",
    ),
    MemoryScenario(
        id="mem_neg_04_question",
        role="user",
        content="What GPUs does Nebius operate across their European data centers?",
        expected_admitted=False,
        expected_category=None,
        description="Informational query regarding competitor hardware",
    ),
    MemoryScenario(
        id="mem_neg_05_question",
        role="user",
        content="How much does an on-demand H100 cost per hour on Voltage Park?",
        expected_admitted=False,
        expected_category=None,
        description="Pricing factual question",
    ),
    MemoryScenario(
        id="mem_neg_06_preference_question",
        role="user",
        content="Do we prefer transparent hourly rate comparisons?",
        expected_admitted=False,
        expected_category=None,
        description="Question inquiring about preference rather than stating one",
    ),
    MemoryScenario(
        id="mem_neg_07_assistant_prose",
        role="assistant",
        content="We have decided to launch the campaign across North America.",
        expected_admitted=False,
        expected_category=None,
        description="Assistant prose containing decision token (strictly blocked)",
    ),
    MemoryScenario(
        id="mem_neg_08_agent_prose",
        role="agent",
        content="Approved the revised budget for the upcoming summit.",
        expected_admitted=False,
        expected_category=None,
        description="Agent persona prose containing approval token (strictly blocked)",
    ),
    MemoryScenario(
        id="mem_neg_09_model_prose",
        role="model",
        content="Don't use casual tone on LinkedIn posts.",
        expected_admitted=False,
        expected_category=None,
        description="Model prose containing correction token (strictly blocked)",
    ),
    MemoryScenario(
        id="mem_neg_10_system_prose",
        role="system",
        content="From now on keep our voice developer-first.",
        expected_admitted=False,
        expected_category=None,
        description="System prompt containing preference token (strictly blocked)",
    ),
]
