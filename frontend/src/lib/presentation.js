import { AGENTS } from './agents';

const object = (value) => value && typeof value === 'object' && !Array.isArray(value) ? value : {};
const list = (value) => Array.isArray(value) ? value : [];
const string = (value) => typeof value === 'string' && value.trim() ? value : null;
const boolean = (value) => typeof value === 'boolean' ? value : null;
const number = (value) => typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : null;
const count = (value) => Number.isInteger(value) ? number(value) : null;
const clone = (value) => structuredClone(value);
const ids = new Set(AGENTS.map(({ id }) => id));

function sourceUrl(value) {
  if (!string(value)) return null;
  try { return ['http:', 'https:'].includes(new URL(value).protocol) ? value : null; }
  catch { return null; }
}

/** Missing measurements stay unknown. A configured model does not establish live execution. */
export function adaptExecution(value) {
  const raw = object(value);
  return {
    source: ['live', 'mock', 'mixed'].includes(raw.source) ? raw.source : 'unknown',
    model: string(raw.model), requestedModel: string(raw.requested_model),
    attempts: count(raw.attempts), latencyMs: number(raw.latency_ms), totalWallMs: number(raw.total_wall_ms),
    totalTokens: count(raw.total_tokens), promptTokens: count(raw.prompt_tokens),
    completionTokens: count(raw.completion_tokens), thoughtsTokens: count(raw.thoughts_tokens),
    finishReason: string(raw.finish_reason), fallbackUsed: boolean(raw.fallback_used),
    servedModelVerified: boolean(raw.served_model_verified),
    calls: list(raw.calls).map((call) => adaptExecution({ ...object(call), calls: [] })),
  };
}

function fact(value) {
  const raw = object(value);
  return { id: string(raw.id), organization: string(raw.organization),
    knowledgeClass: string(raw.knowledge_class), content: string(raw.content), sourceUrl: sourceUrl(raw.source_url) };
}

/** Keep source rows, reported excerpts, generated summaries and corpus links distinct. */
export function adaptEvidence(workflow, value, capturedRetrievals = []) {
  const raw = object(value);
  const evidence = { kind: 'unavailable', facts: [], summaries: [], citations: [], scopes: [], citedIds: [], note: null };
  if (workflow === 'run') {
    evidence.citedIds = list(raw.decision?.evidence_ids).filter((id) => string(id));
    evidence.summaries = list(raw.knowledge_units).filter((item) => string(object(item).content)).map((item) => clone(item));
    if (capturedRetrievals.length) {
      evidence.kind = 'captured-rows';
      evidence.scopes = capturedRetrievals.map((entry) => ({ agent: string(object(entry).agent),
        query: string(object(entry).query), facts: list(object(entry).facts).map(fact) }));
      evidence.facts = evidence.scopes.flatMap((scope) => scope.facts);
      evidence.note = 'Source rows captured during this request. Source linkage does not prove every generated claim.';
    } else {
      evidence.kind = evidence.summaries.length ? 'generated-summary-only' : 'unavailable';
      evidence.note = 'Original retrieved rows were not included. Generated knowledge summaries are not corpus facts.';
    }
  } else if (workflow === 'chat') {
    evidence.kind = Array.isArray(raw.recall?.facts) ? 'reported-excerpts' : 'unavailable';
    evidence.facts = list(raw.recall?.facts).map(fact);
    evidence.note = 'Fact excerpts reported by this reply; full source rows and fact IDs may be unavailable.';
  } else if (workflow === 'triage') {
    evidence.kind = Array.isArray(raw.views) ? 'per-agent-excerpts' : 'unavailable';
    evidence.scopes = list(raw.views).map((view) => ({ agent: string(object(view).agent),
      facts: list(object(view).recall?.facts).map(fact), memories: clone(list(object(view).recall?.memories)) }));
    evidence.note = 'Each specialist retains its own reported context; these scopes are not a shared private memory.';
  } else if (workflow === 'digest') {
    evidence.kind = Array.isArray(raw.citations) ? 'corpus-links' : 'unavailable';
    evidence.citations = list(raw.citations).map(fact);
    evidence.note = 'Source links from the corpus network, not a complete per-worker retrieval trace.';
  }
  return evidence;
}

function review(value) {
  const row = object(value);
  return { status: ['pending', 'unreviewed', 'approved', 'rejected'].includes(row.review_status) ? row.review_status : null,
    reviewedBy: string(row.reviewed_by), reviewedAt: string(row.reviewed_at), reviews: clone(list(row.reviews)) };
}

/** Presentation only: never mutates, repairs, or writes the original workflow snapshot. */
export function adaptWorkflow(workflow, value, options = {}) {
  const raw = object(value);
  const decision = object(raw.decision);
  const request = object(options.request);
  const kind = ['run', 'chat', 'triage', 'digest', 'legacy'].includes(workflow) ? workflow : 'unsupported';
  const recordedAgent = /^langgraph:([^:]+):/.exec(string(decision.reasoning_source) || '')?.[1];
  const agents = kind === 'run' ? [string(request.agent_type) || recordedAgent].filter(Boolean)
    : kind === 'chat' ? [string(raw.agent)].filter(Boolean)
      : kind === 'triage' ? list(raw.agents).filter((id) => string(id))
        : kind === 'digest' ? list(raw.agent_briefs).map((brief) => string(object(brief).agent)).filter(Boolean) : [];
  const body = kind === 'run' ? string(raw.positioning?.statement)
    : kind === 'chat' ? string(raw.reply) : kind === 'triage' ? string(raw.answer)
      : kind === 'digest' ? string(raw.executive_summary) : null;
  const state = raw.error || raw.success === false ? 'error' : body ? 'available' : 'unavailable';
  const risk = boolean(decision.escalated) ?? boolean(raw.governance?.escalated) ?? boolean(raw.escalated)
    ?? boolean(options.reviewRow?.escalated);
  return {
    schemaVersion: 1, workflow: kind, state,
    id: string(decision.id) || string(raw.decision_id) || string(options.id),
    input: { text: string(raw.goalStatement) || string(request.goal) || string(request.message), agents },
    output: { title: string(decision.selected_option) || string(raw.headline), text: body,
      rationale: string(decision.rationale), risks: string(decision.risks), confidence: string(decision.confidence),
      recommendedAction: string(raw.recommended_action),
      views: list(raw.views).map((view) => ({ agent: string(object(view).agent), text: string(object(view).view), execution: adaptExecution(object(view).metrics) })),
      briefs: list(raw.agent_briefs).map((brief) => ({ agent: string(object(brief).agent), title: string(object(brief).headline),
        text: string(object(brief).finding), confidence: string(object(brief).confidence), execution: adaptExecution(object(brief).metrics) })),
      competitorMovements: clone(list(raw.competitor_movements)), recommendedActions: clone(list(raw.recommended_actions)),
    },
    execution: adaptExecution(raw.metrics),
    evidence: adaptEvidence(kind, raw, list(options.capturedRetrievals)),
    governance: { escalated: risk,
      reason: string(decision.escalation_reason) || string(raw.governance?.escalation_reason) || string(raw.escalation_reason),
      review: review(options.reviewRow), flaggedPhrase: null },
    context: { namespace: string(raw.namespace), threadId: string(raw.thread_id),
      memories: clone(list(raw.recall?.memories)), graph: clone(list(raw.recall?.graph)),
      memoryAdmission: clone(object(raw.memory)) },
    error: state === 'error' ? string(raw.message) || string(raw.error) || 'Workflow failed' : null,
    raw: clone(value ?? null),
  };
}

export function adaptSavedDecision(value) {
  const row = object(value);
  const available = row.result_available === true && row.result && !Array.isArray(row.result) && typeof row.result === 'object';
  const presentation = adaptWorkflow(available ? row.workflow_type : 'legacy', available ? row.result : null, {
    id: row.id, request: { goal: row.goal_statement }, reviewRow: row,
  });
  presentation.output.title ||= string(row.selected_option);
  presentation.savedAt = string(row.created_at);
  return presentation;
}

/** Data bindings for one future machine, not a timeline or a hidden-reasoning trace. */
export function adaptAgentScene(agent, presentation) {
  const known = ids.has(agent);
  const matches = known && presentation?.workflow === 'run' && list(presentation.input?.agents).length === 1
    && presentation.input.agents[0] === agent && presentation.state === 'available';
  if (!matches) return { schemaVersion: 1, agent, available: false, reason: 'No attributable one-shot example for this specialist.', stations: [] };
  const view = clone(presentation);
  return { schemaVersion: 1, agent, available: true, execution: view.execution,
    stations: [
      { id: 'input', state: view.input.text ? 'supported' : 'unavailable', data: view.input },
      { id: 'retrieve', state: view.evidence.kind === 'captured-rows' ? 'supported' : 'partial', data: view.evidence },
      { id: 'model', state: view.execution.source === 'unknown' ? 'unavailable' : 'supported', data: view.execution },
      { id: 'validate', state: view.raw?.success === true ? 'supported' : 'unavailable',
        data: { scope: 'One-shot API success establishes strategy-schema acceptance, not claim-entailment verification.' } },
      { id: 'govern', state: view.governance.escalated === null ? 'unavailable' : 'supported', data: view.governance },
      { id: 'output', state: 'supported', data: view.output },
    ], raw: view.raw,
  };
}
