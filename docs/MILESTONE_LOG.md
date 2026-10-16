# 🏛️ Marketing OS v2.0 Enterprise: Master Milestone Progress Log

**Governance:** Lead Multi-Agent Systems Engineer & Parent Architect  
**Standard Commit Author:** `namm9an <naman.moudgill77@gmail.com>`  
**Verification Protocol:** 100% Offline, Deterministic SQLite WAL, Real Pytest Assertions (Zero Mocking)

---

## Milestone 1: Sanitization, Environment Config & Pydantic v2 Domain Schemas

### Status: Approved & Ratified by Parent Architect

### 1. Systems Accomplishments & Scope
- **Parameterizable Enterprise Identity:** Decoupled legacy hardcoded vendor strings (`E2E Networks`, `NSE: E2E`) in favor of dynamic `settings.TARGET_ORGANIZATION = "Vanguard Cloud"` and `settings.TARGET_INDUSTRY = "Enterprise AI & GPU Cloud"` using `pydantic-settings.BaseSettings`.
- **Pydantic v2 Domain Schemas:** Implemented strict domain validation schemas in `app/core/schemas.py`:
  - `KnowledgeUnitSchema`: Verified empirical facts with source URL provenance.
  - `DecisionRecordSchema`: Governance decision logging with rationale and risk assessment.
  - `ChatTurnSchema`, `TriageResponseSchema`, `AgentResponseSchema`, `DigestSchema`, `RunRequestSchema`, `ThreadSchema`, `GraphEdgeSchema`.
- **Persona Prompt De-Identification:** Dynamic injection of target organization and industry across all five specialist agents (`branding`, `pr`, `social`, `product_marketing`, `events`).
- **Dynamic Eval Parameterization:** Refactored gold queries in `app/eval/gold.py` to evaluate positioning and platform facts dynamically against `settings.TARGET_ORGANIZATION`.

### 2. Granular Commits
- `8106bcc` `config(core): parameterize enterprise identity as Vanguard Cloud via BaseSettings`
- `a62ac42` `schema(core): introduce Pydantic v2 domain schemas for knowledge, decisions, and triage`
- `a4e0bfc` `refactor(agents): de-identify persona prompts and parameterize target organization`

### 3. Files Modified
- `app/core/config.py`
- `app/core/schemas.py`
- `app/agents/base.py`
- `app/eval/gold.py`
- `tests/unit/test_config.py`
- `tests/unit/test_schemas.py`

### 4. Verification Record & Test Suite Outputs
- Total Tests: **122 passed in 6.83s**
- Zero schema validation errors across API contracts.

---

## Milestone 2: Deterministic Storage, SQLite WAL, FTS5 & Cryptographic Attribution

### Status: Complete | Ready for Parent Architect Review

### 1. Systems Accomplishments & Scope
- **Cryptographic Attribution & Entropy Restoration:**
  - Upgraded entity and decision identifiers from 32-bit truncated strings (`[:8]`) to full 128-bit hex UUID4 (`uuid.uuid4().hex`) in `app/core/primitives.py`.
  - Introduced `content_hash(text: str) -> str` generating SHA-256 digests for grounded facts (L0), ensuring deterministic idempotency across database reseeds.
- **Corpus 404 Purge & Hygiene Validation:**
  - Implemented multi-field pre-ingestion filter `is_valid_corpus_content(text, min_len)` with `JUNK_SIGNATURES` in `app/db/grounded_seed.py`.
  - Purged 12 error page rows across snippets and positioning headings, reducing corpus defect rate from 13.2% to **0.0%**.
- **Preserved GPU SKU Tokens in Pricing Facts:**
  - Preserved sorted SKU tokens (`for A100, B200, H100, H200: ...`) in `grounded_seed.py` pricing facts.
  - Eliminated the orphan graph edge defect where zero pricing relationships were bound.
- **SQLite FTS5 BM25 Search Engine:**
  - Added `knowledge_units_fts` virtual table using Porter stemming (`tokenize = 'porter unicode61 remove_diacritics 2'`) with unindexed ID joining on `knowledge_units.id`.
  - Added automatic synchronization triggers (`trg_ku_ai`, `trg_ku_ad`, `trg_ku_au`) with duplicate protection on `INSERT OR REPLACE`.
- **Deterministic Hardware & Market Taxonomy Expansion:**
  - Engineered `_TAXONOMY_EXPANSIONS` dictionary mapping architectural codenames (`blackwell`, `hopper`, `ada`, `lovelace`, `consumer`), market qualifiers (`india`, `indian`, `residency`), and pricing synonyms (`rupee`, `hourly`, `cost`, `cheapest`, `rental`, `capacity`, `sells`, `tagline`).
  - Implemented quote-safe FTS5 token formatting `_format_fts5_token` and query builder `_expand_query_terms` producing disjunctive `OR` match expressions immune to syntax injection.
- **SQL Pre-Scoring Truncation Bug Fix:**
  - Replaced the brittle Python-side scoring and `LIMIT 15` pre-truncation query with engine-level `bm25(knowledge_units_fts)` ranking in SQLite.
- **Knowledge Graph Prices Edge Reconciliation & Rate Provenance:**
  - Extended `rebuild_corpus_graph()` in `app/memory/graph.py` to extract rates, amounts, and units after the colon, populating structured JSON provenance in `edges`.
- **Comprehensive Database Unit Test Suite:**
  - Expanded `tests/unit/test_database.py` with 8 new rigorous test cases covering sync triggers, BM25 rank accuracy, Porter stemming, hardware/market taxonomy expansion, quote safety, pre-scoring fix, and L0 isolation.

### 2. Granular Commits
- `a6032b0` `feat(crypto): restore 128-bit UUID4 entropy and deterministic SHA-256 content hashing`
- `aa6cf9d` `fix(seed): implement multi-field 404 validation filter purging error page facts`
- `9af5b51` `feat(seed): preserve SKU tokens in pricing facts for graph edge reconciliation`
- `17d1448` `feat(db): create SQLite FTS5 virtual table with Porter stemming for BM25 search`
- `45161bd` `feat(db): implement deterministic taxonomy expansion dictionary with quote-safe tokens`
- `66e425c` `fix(db): resolve SQL LIMIT 15 pre-scoring truncation bug with engine-level BM25 ranking`
- `480539f` `feat(graph): reconcile prices edge binding linking organizations to GPU SKUs with rates`
- `703ffcb` `test(db): add comprehensive unit tests for FTS5 BM25 search and taxonomy expansion`

### 3. Files Modified
- `app/core/primitives.py`
- `app/db/grounded_seed.py`
- `app/db/database.py`
- `app/memory/graph.py`
- `app/eval/retrieval.py`
- `tests/unit/test_database.py`

### 4. Verification Metrics & System State
- **Full Test Suite:** **132 passed in 17.29s** (100% green across all unit and integration test suites).
- **Corpus Hygiene:**
  - Total Seeded Facts: **75 facts** across 13 Neo-Cloud providers.
  - Junk Rows: **0 / 75 (0.0%)** (eradicated from 12 / 91, 13.2%).
- **Knowledge Graph Structure:**
  - Total Corpus Edges: **50 edges**.
  - `offers` edges: **38 edges**.
  - `prices` edges: **12 edges** (reconciled from 0).
  - Provenance: Structured JSON containing `knowledge_unit_id`, `source_fact_id`, `amount`, `rates`, `currency`, and `unit`.
- **Retrieval Engine Performance:**
  - Engine-level FTS5 BM25 Baseline (`python -m app.eval.retrieval`): Lexical Recall@5 = **0.967**, MRR = **1.000**, Zero-hit = **0**; Overall Recall@5 = **0.726**.
  - Taxonomy Expansion Enabled (`python -m app.eval.retrieval --expand-taxonomy`): Overall Recall@5 = **0.905**, Paraphrase Recall@5 = **0.792**, Zero-hit = **0**.

---

## Milestone 3: Memory Isolation Engine (L0–L2) & Promotion Gate

### Status: Complete | Ready for Parent Architect Review

### 1. Systems Accomplishments & Scope
- **Strict Namespace Schema & Exact-Match Algebra:**
  - Hardened `_NAMESPACE_RE` to enforce strict anchored format `^(corpus:[a-zA-Z0-9_-]+|agent:[a-zA-Z0-9_-]+|triage:[a-zA-Z0-9_-]+(?:\+[a-zA-Z0-9_-]+)+)$` across all memory entry points.
  - Added strict parameter validation to `agent_ns()` and `triage_ns()`, rejecting whitespace, SQL injection payloads, and self-triage attempts (`a == b`).
  - Enforced exact set membership algebra in `ns_members()` and `readable_namespaces(agent_type)`, querying `memories`, `edges`, and `threads` tables and ensuring agent membership is evaluated via `agent_type in ns_members(ns)` (eradicating the substring collision vulnerability where `pr` collided with `product_marketing`).
  - Added non-empty content validation in `add_memory()`, preventing blank memory row insertion.
  - Resolved premature `LIMIT` truncation in `search_memories()` so that older relevant memories beyond `limit * 10` are not pruned prior to keyword scoring.
  - Scoped automatic promotion in `search_memories()` strictly to recalled memory IDs within authorized namespaces (`WHERE id IN ({id_placeholders})`), preventing cross-namespace memory tier mutation.
  - Enforced delimiter-flanked cycle detection in recursive CTE traversal (`graph.py`) to eliminate false-positive cycle pruning on substring node names.
- **Promotion Gate Hardening & Contamination Defense:**
  - Enforced strict user-turn invariant in `app/memory/gate.py`: `role == "user"` is mandatory for admission. Model prose, agent outputs, and assistant messages are unconditionally blocked, eliminating temporal memory contamination.
  - Added upfront namespace validation in `gate.admit()`, immediately rejecting invalid namespace strings with `ValueError` regardless of turn role or content.
  - Hardened deterministic regex intent classifiers across all three admitted categories:
    - `correction`: `r"(^no\b|\b(don'?t|do not|never|stop|avoid|wrong|incorrect|instead of|rather than|not\s+[^,.!?\n]+\s*,?\s*but)\b)"` (high confidence, handles commas and multi-word phrases).
    - `decision`: `r"\b(approved?|ratified?|signed? off|go with|going with|we(?:'ve| have) decided|decided|decided on|ship it|lock\s+(?:it|this|that\s+)?in|lock in)\b"` (high confidence, handles phrase variants).
    - `preference`: `r"\b(prefer(?:s|ence)?|always|from now on|going forward|remember that|make sure|keep it|our (?:tone|voice|style|brand|line)|we (?:want|like|need)|tone should|positioning should|developer-first)\b"` (medium confidence, handles inflections like `prefers`).
- **Episodic-to-Semantic Promotion Heuristics:**
  - Embedded automatic episodic-to-semantic promotion in `store.search_memories()`: when an episodic memory is retrieved and reaches `hit_count >= 3`, SQLite promotes it directly to `semantic`. Returned row dicts reflect the updated tier and counter.
  - Implemented `store.promote_on_hit_count(threshold=3, namespace=None)` with strict threshold validation (`threshold >= 1`) for batch evaluation of qualifying episodic memories.
  - Implemented connection-safe `gate.check_hit_count_promotion(memory_id, threshold=3)` to evaluate memory promotion readiness without SQLite WAL lock contention.
  - In `gate.admit()`, verbatim restatement increments `hit_count` and promotes the existing memory in place without duplicate row accumulation.
- **Comprehensive Isolation & Gate Unit Test Suites:**
  - Expanded `tests/unit/test_memory_store.py` to 20 tests covering regex schema validation, agent/triage name guards, self-triage rejection, empty content rejection, threshold validation, cross-namespace promotion isolation, older memory retrieval without premature truncation, and thread discovery.
  - Expanded `tests/unit/test_memory_gate.py` to 16 tests covering mandatory user role enforcement across 7 non-user roles, upfront namespace validation, intent classification verification across standard and extended punctuation/morphology phrases, step-by-step episodic-to-semantic promotion on hit count thresholds, and batch promotion.
  - Expanded `tests/unit/test_memory_graph.py` to 16 tests confirming scoped recursive CTE traversal and cycle detection without substring collisions.

### 2. Granular Commits
- Commit 12: `refactor(memory): enforce strict regex validation and exact-match namespace algebra`
- Commit 13: `feat(memory): harden promotion gate with episodic-to-semantic promotion heuristics`

### 3. Files Modified
- `app/memory/store.py`
- `app/memory/gate.py`
- `app/memory/graph.py`
- `tests/unit/test_memory_store.py`
- `tests/unit/test_memory_gate.py`
- `tests/unit/test_memory_graph.py`
- `docs/MILESTONE_LOG.md`

### 4. Verification Metrics & System State
- **Full Test Suite:** **150 passed in 12.03s** (100% green across all unit and integration test suites).
- **Memory Isolation Tests:** **52 passed in 5.23s** (`test_memory_store.py`: 20 passed, `test_memory_gate.py`: 16 passed, `test_memory_graph.py`: 16 passed).
- **Namespace Isolation:**
  - Substring collision leak (`pr` $\subset$ `product_marketing`): 0.0% leak rate.
  - Non-user prose rejection: 100% blocked across `agent`, `assistant`, `model`, `system`, and empty roles.
- **Promotion Integrity:**
  - Verbatim restatement: promotes in-place, increments `hit_count`, 0 duplicates.
  - Retrieval repetition: `hit_count >= 3` triggers automatic transition from `episodic` to `semantic` scoped strictly to recalled rows.

---

## Milestone 4: LangGraph Deterministic State Machine & Universal Governance

### Status: Complete | Ready for Parent Architect Review

### 1. Systems Accomplishments & Scope
- **Full 5-Agent Specialist Swarm Activation:**
  - Activated all five specialist agents (`branding`, `pr`, `social`, `product_marketing`, `events`) across `ACTIVE_AGENTS` and `AGENT_REGISTRY` in `app/agents/base.py`.
  - Supervisor routing in `app/graph/workflow.py` normalized to dispatch requests cleanly across all 5 specialist nodes in the state graph.
  - Implemented worker-level exception handling in `_make_worker` in `workflow.py`, returning structured fallback strategy briefs (`confidence="Low"`) under degraded execution rather than crashing the StateGraph.
- **Universal Governance Node Across Chat & Triage Graphs:**
  - Hardened state graph execution across all three pathways (`workflow.py`, `chat.py`, `triage.py`) by embedding a first-class `governance` node prior to memory persistence:
    - Chat topology: `START -> recall -> respond -> governance -> remember -> END`.
    - Triage topology: `START -> prepare -> { view_0 || view_1 } -> merge -> governance -> remember -> END`.
  - Implemented `_governance_check` evaluating confidence gates (`confidence.lower() == "low"`) and high-risk regulatory/legal lexicon `("legal", "lawsuit", "compliance breach", "misleading", "defamation", "price war")` across prompts, model responses, and specialist views.
  - Recorded 100% auditable decisions with 128-bit hex UUID identifiers into SQLite WAL `decisions` table via `save_decision()`.
  - Enriched both `ChatState` and `TriageState` to return structured governance metadata (`governance: {"escalated": bool, "escalation_reason": str | None, "decision_id": str}`), as well as direct top-level escalation attributes.
- **Resilient 5-Agent Parallel Digest Fan-Out with Fallback Merge:**
  - Extended `_build_digest_graph` in `app/graph/digest.py` to concurrently fan out across all 5 active specialist workers (`digest_branding`, `digest_pr`, `digest_social`, `digest_product_marketing`, `digest_events`).
  - Wrapped `_make_digest_worker` execution in `try / except` blocks with structured fallback briefs (`confidence="Low"`, `headline="... Movement Signal (Fallback)"`), ensuring worker timeouts or LLM failures degrade gracefully without interrupting synthesis.
  - Parameterized radial network center node in `build_network()` to `settings.TARGET_ORGANIZATION`, setting `center_name`, `name`, `label`, and hub links dynamically.
- **Comprehensive Unit & Integration Test Expansion:**
  - Expanded `tests/unit/test_workflow_graph.py` to 5 tests covering full 5-agent routing and worker exception fallback simulation.
  - Expanded `tests/unit/test_chat.py` to 12 tests validating decision persistence, non-escalation on normal turns, and immediate escalation on high-risk queries.
  - Expanded `tests/unit/test_triage.py` to 12 tests confirming joint decision persistence and price war risk escalation.
  - Expanded `tests/unit/test_digest.py` to 10 tests confirming 5-agent fan-out, worker failure resilience, and dynamic center node parameterization.

### 2. Granular Commits
- Commit 14: `3eb700f` `feat(agents): activate full 5-agent parallel specialist swarm in supervisor registry`
- Commit 15: `049c6fa` `fix(graph): wire universal governance node across chat and triage execution graphs`
- Commit 16: `feat(digest): implement resilient 5-agent parallel digest fan-out with fallback merge`

### 3. Files Modified
- `app/agents/base.py`
- `app/graph/workflow.py`
- `app/graph/chat.py`
- `app/graph/triage.py`
- `app/graph/digest.py`
- `app/core/schemas.py`
- `tests/unit/test_workflow_graph.py`
- `tests/unit/test_chat.py`
- `tests/unit/test_triage.py`
- `tests/unit/test_digest.py`
- `tests/unit/test_schemas.py`
- `docs/MILESTONE_LOG.md`

### 4. Verification Metrics & System State
- **Full Test Suite:** **162 passed in 16.73s** (100% green across unit and integration test suites, up from 150).
- **Swarm Specialist Coverage:**
  - Active Specialist Agents: **5 / 5** (`branding`, `pr`, `social`, `product_marketing`, `events`).
  - Supervisor Graph Nodes: 7 nodes (`START`, `supervisor`, 5 workers, `governance`, `END`).
  - Weekly Digest Fan-Out: 5 concurrent worker nodes producing 5 attributed domain briefs.
- **Universal Governance Audit:**
  - Supervisor Workflow Pathway: Evaluated and logged to `decisions` table with audit UUID. High-risk terms in goals, positioning, and risks escalate (`escalated=True`).
  - Chat Pathway: Evaluated and logged to `decisions` table with audit UUID. High-risk terms (`lawsuit`) escalate (`escalated=True`), and worker exceptions degrade with `confidence="Low"` and escalate.
  - Triage Pathway: Evaluated and logged to `decisions` table with audit UUID. Price war terms escalate (`escalated=True`), and view worker exceptions degrade with `confidence="Low"` and escalate.
- **Resilience Guarantees:**
  - Workflow worker failure: degrades to fallback brief with `confidence="Low"`, triggers CMO ratification.
  - Digest worker failure: degrades to fallback movement signal, synthesis succeeds without crash.
  - Chat & Triage view worker failure: degrades to structured fallback view with `confidence="Low"`, triggers CMO ratification without throwing unhandled exceptions.
