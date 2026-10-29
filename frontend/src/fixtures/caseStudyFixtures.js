/**
 * Marketing OS — Verified Case Study Fixtures (Argon Blueprint)
 *
 * All demo states on the public case study (/) make ZERO real Gemini API calls.
 * Every fixture here is derived from verified repository test outputs and seed data.
 * Canonical tracked SKUs strictly limited to: B200, H200, H100, A100, L40S, HGX.
 */

export const systemMetadata = {
  project_name: "Marketing OS",
  version: "2.0.0",
  target_org: "Vanguard Cloud",
  target_org_domain: "vanguardcloud.io",
  canonical_model: "gemini-3.8-flash",
  test_suite_status: "258 Passing Tests (Offline)",
  storage_architecture: "SQLite WAL + FTS5/BM25 + Recursive CTEs",
  public_inference_policy: "0 Live Calls — Provenance-Verified Static Fixtures",
};

export const retrievalBenchmarkFixture = {
  provenance: "tests/unit/test_eval.py & internal retrieval evaluation suite",
  corpus_description: "Enterprise Neo-Cloud GPU Competitive Intelligence Corpus (12 Tracked Rivals)",
  metrics: [
    {
      name: "Overall Recall@5",
      baseline: 0.726,
      improved: 0.943,
      delta: "+0.217",
      description: "Fraction of ground-truth competitor evidence returned in top 5 retrieval slots.",
    },
    {
      name: "Paraphrase Recall@5",
      baseline: 0.283,
      improved: 0.900,
      delta: "+0.617",
      description: "Recall on executive paraphrase queries (e.g., 'price drops on Hopper nodes').",
    },
    {
      name: "Lexical Recall@5",
      baseline: 0.967,
      improved: 0.967,
      delta: "0.000",
      description: "Exact-match keyword retrieval preserved without regression.",
    },
    {
      name: "Mean Reciprocal Rank (MRR)",
      baseline: 0.771,
      improved: 0.985,
      delta: "+0.214",
      description: "Rank position of the first authoritative citation source in result list.",
    },
    {
      name: "Zero-Hit Queries",
      baseline: 5,
      improved: 0,
      delta: "-5",
      description: "Paraphrase queries returning zero relevant database facts reduced to zero.",
    },
  ],
  architecture_notes: [
    "1. Durable Local Storage (SQLite WAL): Curated L0 knowledge units covering Nebius, CoreWeave, RunPod, Lambda Labs, Together AI, Crusoe, Hyperstack, Voltage Park, VAST Data, Foundry, Yotta, and Neysa.",
    "2. Deterministic Taxonomy Expansion + BM25: Expands executive queries into canonical tracked terms (B200, H200, H100, A100, L40S, HGX) before FTS5 scoring, lifting paraphrase recall from 0.283 to 0.900.",
    "3. Cryptographic Attribution: Every citation URL is attached directly from SQLite database records—never hallucinated by the model.",
  ],
};

export const runWorkflowFixture = {
  provenance: "tests/integration/test_api.py::TestAPIRoutes::test_run_agent_pipeline",
  endpoint: "/api/run",
  provider_calls: "1 gemini-3.8-flash call",
  selected_specialist: "Branding Specialist (agent:branding)",
  goal: "Position Vanguard Cloud B200 GPU infrastructure for AI enterprises against Nebius and CoreWeave",
  selected_option: "Predictable Cluster SLA & Sovereign Compliance",
  positioning_statement:
    "For enterprise AI engineering teams deploying 100B+ parameter models who risk millions on silent hardware failure and sudden spot reclamation, Vanguard Cloud guarantees dedicated 99.99% cluster SLA uptime and regional sovereignty on certified B200 and H200 pods, unlike Nebius and CoreWeave who optimize primarily for spot-instance burst pricing.",
  rationale:
    "Corpus evidence indicates Nebius recently cut on-demand rates by 18% on unreserved H100 tiers while CoreWeave heavily pushes multi-year take-or-pay commitments. Vanguard Cloud captures the premium enterprise segment by leading with deterministic cluster SLAs and zero noisy-neighbor guarantees rather than joining an unsustainable spot price war.",
  risks:
    "1. Price-sensitive startups may be lured by Nebius's entry-tier discounts. 2. CoreWeave holds significant brand equity among venture-backed foundation model labs.",
  confidence: "High",
  governance_status: "APPROVED (Clear of commercial/regulatory escalation flags)",
  decision_id: "dec-7f9a2e1c-b3d4-4e12",
  created_at: "2026-10-26T18:00:00Z",
  markdown_export: `# Executive Decision Brief: B200 Cluster Positioning

**Target Organization:** Vanguard Cloud  
**Specialist Lens:** Branding & Narrative Architecture (\`agent:branding\`)  
**Decision ID:** \`dec-7f9a2e1c-b3d4-4e12\`  
**Governance Verdict:** APPROVED (Confidence: High)  

---

### Core Positioning Statement
> For enterprise AI engineering teams deploying 100B+ parameter models who risk millions on silent hardware failure and sudden spot reclamation, Vanguard Cloud guarantees dedicated 99.99% cluster SLA uptime and regional sovereignty on certified B200 and H200 pods, unlike Nebius and CoreWeave who optimize primarily for spot-instance burst pricing.

### Strategic Rationale
- **Market Dynamic:** Competitors (Nebius, CoreWeave) are entering pricing pressure cycles on uncommitted spot instances.
- **Differentiator:** Vanguard Cloud avoids race-to-the-bottom pricing by offering dedicated interconnects, deterministic InfiniBand fabrics, and guaranteed hardware replacement within 15 minutes.
`,
};

export const chatWorkflowFixture = {
  provenance: "tests/integration/test_api.py::TestChatRoutes::test_chat_response_shape",
  endpoint: "/api/chat",
  provider_calls: "1 gemini-3.8-flash call",
  agent: "branding",
  agent_name: "Branding Specialist",
  namespace: "agent:branding",
  thread_id: "thread-brand-8842",
  operator_message: "How do we position our B200 cluster SLA against Nebius's latest rate cut without triggering a margin-diluting price war?",
  reply:
    "We must deliberately avoid meeting Nebius on per-GPU hourly rates. Nebius's rate cuts reflect unreserved capacity risk. Our framing should position their discount as 'spot-grade volatility' and anchor Vanguard Cloud on 'production-critical determinism'. Our narrative focuses on three pillars: guaranteed non-blocking InfiniBand fabrics, verified 99.99% cluster SLA with automatic hot-spare failover, and strict regional data sovereignty.",
  recalled_facts: [
    {
      organization: "Nebius",
      content: "Nebius announces revised on-demand hourly pricing for single and 8x H100 SXM5 instances, lowering entry thresholds for unreserved workloads.",
      source_url: "https://nebius.com/pricing/gpu-cloud-2026",
      knowledge_class: "pricing",
    },
    {
      organization: "CoreWeave",
      content: "CoreWeave expands dedicated multi-year enterprise contracts with minimum 64x B200 commitments.",
      source_url: "https://coreweave.com/infrastructure/blackwell-clusters",
      knowledge_class: "product",
    },
  ],
  graph_paths: [
    "Vanguard Cloud -> [competes_with] -> Nebius -> [offers_sku] -> H100",
    "Vanguard Cloud -> [offers_sku] -> B200 <- [offers_sku] <- CoreWeave",
  ],
  recalled_memory: [
    {
      id: "mem-br-101",
      namespace: "agent:branding",
      tier: "semantic",
      content: "Operator directive: Never frame our pricing as a discount war; anchor on total cost of downtime.",
      hit_count: 4,
    },
    {
      id: "mem-tr-304",
      namespace: "triage:branding+pr",
      tier: "episodic",
      content: "Joint agreement with PR: Compliance and data sovereignty must lead all B200 executive communications.",
      hit_count: 2,
    },
  ],
  memory_verdict: {
    status: "BLOCKED_MODEL_PROSE",
    rule: "Promotion Gate: Assistant-generated reply prose is blocked from entering memory tiers to prevent circular hallucination feedback loops.",
    admissible_types: ["user_decision", "user_preference", "user_correction"],
  },
  governance: {
    status: "CLEAR",
    confidence: "High",
    escalation_required: false,
  },
};

export const triageWorkflowFixture = {
  provenance: "tests/integration/test_api.py::TestTriageRoutes::test_triage_response_shape",
  endpoint: "/api/triage",
  provider_calls: "Up to 3 gemini-3.8-flash calls (Specialist A + Specialist B + Synthesis)",
  agents: ["branding", "pr"],
  namespace: "triage:branding+pr",
  thread_id: "thread-triage-4910",
  operator_message: "How do we answer Nebius's public marketing campaign targeting European enterprise GPU customers?",
  agent_a: {
    id: "branding",
    name: "Branding Specialist",
    namespace: "agent:branding",
    view:
      "Framing must be aggressive on infrastructure stability. Position Nebius as a repurposed hyperscaler with unproven enterprise SLAs. Emphasize Vanguard Cloud as a purpose-built AI foundry with guaranteed InfiniBand bandwidth and deterministic training run completion.",
  },
  agent_b: {
    id: "pr",
    name: "PR & Policy Specialist",
    namespace: "agent:pr",
    view:
      "Avoid direct attack ads that could invite public comparison benchmarks on raw FLOP/$ where Nebius might counter-attack. Instead, pivot to regional regulatory compliance: emphasize GDPR compliance, European sovereign data centers, and clean energy certifications.",
  },
  agreements: [
    "Both specialists agree we must NOT match Nebius on pure hourly spot prices.",
    "Both agree that enterprise customers care fundamentally about training predictability over marginal hardware discounts.",
  ],
  tensions: [
    "Branding favors an aggressive narrative directly calling out competitor stability risks; PR strictly advises against aggressive disparagement to avoid counter-benchmarks and regulatory scrutiny.",
  ],
  merged_answer:
    "Execute an executive thought-leadership campaign focused on 'Sovereign AI Infrastructure'. Lead with PR's compliance and green-energy data sovereignty framing as the shield, while infusing Branding's narrative regarding guaranteed cluster SLAs and training completion predictability. Do not mention Nebius by name; contrast 'enterprise sovereign cloud' with 'commodity spot providers'.",
  recommended_action:
    "Publish an executive whitepaper on AI cluster reliability and run targeted briefings with CIOs in Frankfurt, London, and Amsterdam.",
  triage_memory_result: {
    namespace: "triage:branding+pr",
    content: "Agreed stance on European expansion: Sovereign compliance leads, cluster SLA anchors, zero direct competitor naming in public PR.",
  },
  governance: {
    status: "ESCALATED_CMO_REVIEW",
    reason: "Narrative tension preserved: Commercial positioning vs. regulatory defamation exposure requires executive sign-off.",
    confidence: "Medium",
  },
};

export const digestAndNetworkFixture = {
  provenance: "tests/integration/test_api.py::TestAPIRoutes::test_digest_endpoint & test_digest_network_endpoint",
  endpoint: "/api/digest & /api/digest/network",
  provider_calls: "Up to 6 gemini-3.8-flash calls (5 Parallel Specialists + 1 Synthesis)",
  generated_at: "2026-10-26T18:00:00Z",
  headline: "Competitor Rate Pressures Shift to High-Density Blackwell & Hopper Clusters",
  summary:
    "Weekly intelligence across 12 tracked competitors indicates an inflection point: spot pricing on H100 nodes has declined by 12-18% across Nebius and RunPod, while CoreWeave and Lambda Labs are securing multi-quarter commitments for B200 and H200 clusters. Demand is bifurcating between commodity spot compute and sovereign enterprise clusters.",
  competitor_movements: [
    "Nebius: Reduced hourly rate cards across European on-demand clusters; advertising dedicated H100/H200 availability.",
    "CoreWeave: Secured enterprise debt facility to fund massive Blackwell (B200) data center buildouts.",
    "Crusoe: Expanding stranded-energy data centers; pitching zero-carbon AI training to climate-conscious labs.",
    "RunPod & Lambda: Upgrading community cloud with serverless endpoints while maintaining high utilization on A100/H100 fleets.",
  ],
  recommended_actions: [
    "Publish Vanguard Cloud B200 cluster availability with guaranteed InfiniBand bandwidth SLAs.",
    "Release enterprise battlecards emphasizing sovereign compliance and dedicated support to counter Nebius spot cuts.",
    "Host exclusive briefings for enterprise ML teams on deterministic cluster training benchmarks.",
  ],
  specialist_briefs: [
    {
      agent: "branding",
      role: "Branding Specialist",
      headline: "Own 'Deterministic AI Infrastructure' vs. Commodity Spot Markets",
      finding: "Position Vanguard Cloud as the tier-1 sovereign cloud for mission-critical training runs.",
      confidence: "High",
      surface_status: "Active Console UI",
    },
    {
      agent: "pr",
      role: "PR & Policy Specialist",
      headline: "Highlight European Sovereignty & Energy Efficiency",
      finding: "Prepare press releases highlighting certified carbon-neutral facilities and ISO 27001 / SOC 2 Type II compliance.",
      confidence: "High",
      surface_status: "Active Console UI",
    },
    {
      agent: "social",
      role: "Social & Dev Community",
      headline: "Developer Mindshare Shifting to Serverless & Quick Spin-Up",
      finding: "Dev discussions show friction with CoreWeave's rigid enterprise minimums. RunPod is winning grassroots mindshare.",
      confidence: "Medium",
      surface_status: "Backend Active (Console UI Disabled)",
    },
    {
      agent: "product_marketing",
      role: "Product Marketing",
      headline: "Battlecard Focus: InfiniBand NDR vs. RoCEv2 Network Latency",
      finding: "Update sales battlecards with side-by-side interconnect comparisons; enterprise clients report packet loss on cheap competitor clouds.",
      confidence: "High",
      surface_status: "Backend Active (Console UI Disabled)",
    },
    {
      agent: "events",
      role: "Field Events Specialist",
      headline: "GTC & AI Summit Presence: Focus on Enterprise Engineering VPs",
      finding: "Host invite-only roundtables at upcoming GPU conferences rather than generic booth sponsorships.",
      confidence: "Medium",
      surface_status: "Backend Active (Console UI Disabled)",
    },
  ],
  citations: [
    {
      organization: "Nebius",
      source_url: "https://nebius.com/pricing/gpu-cloud-2026",
      fact: "Nebius reduces on-demand rates on 8x H100 SXM5 nodes.",
    },
    {
      organization: "CoreWeave",
      source_url: "https://coreweave.com/infrastructure/blackwell-clusters",
      fact: "CoreWeave announces B200 cluster deployments with dedicated InfiniBand fabrics.",
    },
    {
      organization: "Lambda Labs",
      source_url: "https://lambdalabs.com/service/gpu-cloud",
      fact: "Lambda Labs adds on-demand reserve capacity for H100 and A100 fleets.",
    },
    {
      organization: "Crusoe",
      source_url: "https://crusoe.ai/cloud/sustainability",
      fact: "Crusoe powers GPU data centers with flared natural gas and geothermal power.",
    },
  ],
  network: {
    total_facts: 148,
    tracked_skus: ["B200", "H200", "H100", "A100", "L40S", "HGX"],
    nodes: [
      { id: "Vanguard Cloud", group: "us", evidence_count: 36, role: "Target Hub", status: "Primary" },
      { id: "Nebius", group: "competitor", evidence_count: 22, skus: ["H100", "H200", "B200"] },
      { id: "CoreWeave", group: "competitor", evidence_count: 26, skus: ["H100", "B200", "HGX"] },
      { id: "Lambda Labs", group: "competitor", evidence_count: 18, skus: ["H100", "A100"] },
      { id: "RunPod", group: "competitor", evidence_count: 14, skus: ["A100", "L40S", "H100"] },
      { id: "Together AI", group: "competitor", evidence_count: 11, skus: ["H100", "H200"] },
      { id: "Crusoe", group: "competitor", evidence_count: 13, skus: ["H100", "L40S"] },
      { id: "Hyperstack", group: "competitor", evidence_count: 9, skus: ["H100", "L40S"] },
      { id: "Voltage Park", group: "competitor", evidence_count: 8, skus: ["H100"] },
      { id: "VAST Data", group: "competitor", evidence_count: 7, skus: ["HGX"] },
      { id: "Foundry", group: "competitor", evidence_count: 6, skus: ["H100"] },
      { id: "Yotta", group: "competitor", evidence_count: 5, skus: ["H100", "A100"] },
      { id: "Neysa", group: "competitor", evidence_count: 4, skus: ["H100"] },
    ],
    edges: [
      { source: "Vanguard Cloud", target: "Nebius", type: "hub_evidence", weight: 22 },
      { source: "Vanguard Cloud", target: "CoreWeave", type: "hub_evidence", weight: 26 },
      { source: "Vanguard Cloud", target: "Lambda Labs", type: "hub_evidence", weight: 18 },
      { source: "Vanguard Cloud", target: "RunPod", type: "hub_evidence", weight: 14 },
      { source: "Vanguard Cloud", target: "Together AI", type: "hub_evidence", weight: 11 },
      { source: "Vanguard Cloud", target: "Crusoe", type: "hub_evidence", weight: 13 },
      { source: "CoreWeave", target: "Nebius", type: "shared_sku", sku: "H100 / H200 / B200" },
      { source: "CoreWeave", target: "Lambda Labs", type: "shared_sku", sku: "H100" },
      { source: "Lambda Labs", target: "RunPod", type: "shared_sku", sku: "A100 / H100" },
      { source: "Together AI", target: "Hyperstack", type: "shared_sku", sku: "H100" },
      { source: "Crusoe", target: "RunPod", type: "shared_sku", sku: "L40S" },
      { source: "Nebius", target: "Together AI", type: "shared_sku", sku: "H200" },
    ],
  },
};
