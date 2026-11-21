import { describe, expect, it } from 'vitest';
import { adaptWorkflow, adaptSavedDecision, adaptAgentScene, adaptExecution } from './presentation';
import { factFixture, mockMetrics, runFixture } from '../test/workflowFixtures';

describe('workflow presentation contracts', () => {
  it('keeps generated summaries separate from actual captured retrieval and preserves exact units', () => {
    const raw = runFixture();
    const before = structuredClone(raw);
    const summary = adaptWorkflow('run', raw);
    expect(summary.evidence.kind).toBe('generated-summary-only');
    expect(summary.evidence.facts).toEqual([]);
    const captured = adaptWorkflow('run', raw, { capturedRetrievals: [{ agent: 'branding', query: raw.goalStatement, facts: [factFixture] }] });
    expect(captured.evidence.facts[0]).toMatchObject({ id: 'fact-service', content: 'The example service offers assessment before a repair quote.' });
    captured.raw.positioning.statement = 'Changed view copy';
    expect(raw).toEqual(before);
  });

  it('does not manufacture an original output for a legacy record', () => {
    const view = adaptSavedDecision({ id: 'legacy', selected_option: 'Title only', result_available: false,
      workflow_type: 'legacy', result: null, goal_statement: 'Original goal' });
    expect(view.state).toBe('unavailable');
    expect(view.output.title).toBe('Title only');
    expect(view.output.text).toBeNull();
    expect(view.execution.source).toBe('unknown');
  });

  it('overlays current saved review without altering the original risk flag or admitting memory', () => {
    const raw = runFixture('pr');
    const view = adaptSavedDecision({ id: 'pr', result_available: true, result: raw, workflow_type: 'run',
      review_status: 'approved', reviewed_by: 'operator', escalated: false });
    expect(view.governance.review.status).toBe('approved');
    expect(view.governance.escalated).toBe(true);
    expect(view.governance.flaggedPhrase).toBeNull();
    expect(view.context.memoryAdmission).toEqual({});
    expect(raw.decision).not.toHaveProperty('review_status');
  });

  it('treats chat context as reported excerpts and retains a missing fact ID honestly', () => {
    const view = adaptWorkflow('chat', { success: true, agent: 'branding', reply: 'Reply', metrics: mockMetrics,
      namespace: 'agent:branding', recall: { facts: [{ organization: 'Example service', content: 'An excerpt', source_url: 'https://example.com' }],
        memories: [{ id: 'private-note', namespace: 'agent:branding' }] } });
    expect(view.evidence.kind).toBe('reported-excerpts');
    expect(view.evidence.facts[0].id).toBeNull();
    expect(view.context.memories[0].namespace).toBe('agent:branding');
  });

  it('keeps triage recall attributable to each specialist instead of flattening private context', () => {
    const view = adaptWorkflow('triage', { success: true, agents: ['pr', 'branding'], answer: 'Merged answer',
      views: ['pr', 'branding'].map((agent) => ({ agent, view: agent, recall: { facts: [factFixture], memories: [{ namespace: `agent:${agent}` }] } })) });
    expect(view.evidence.facts).toEqual([]);
    expect(view.evidence.scopes.map((scope) => scope.agent)).toEqual(['pr', 'branding']);
    expect(view.evidence.scopes[0].memories[0].namespace).toBe('agent:pr');
    expect(view.context.memories).toEqual([]);
  });

  it('labels digest citations as corpus links, not per-worker retrieval records', () => {
    const view = adaptWorkflow('digest', { success: true, executive_summary: 'Digest', citations: [factFixture],
      agent_briefs: [{ agent: 'events', headline: 'Brief', finding: 'Recommendation' }] });
    expect(view.evidence.kind).toBe('corpus-links');
    expect(view.evidence.facts).toEqual([]);
    expect(view.output.briefs[0].agent).toBe('events');
  });

  it.each(['branding', 'pr', 'social', 'product_marketing', 'events'])('binds only the attributable %s scene and exposes no fabricated phrase editing', (agent) => {
    const view = adaptWorkflow('run', runFixture(agent));
    const scene = adaptAgentScene(agent, view);
    expect(scene.available).toBe(true);
    expect(scene.stations.map((station) => station.id)).toEqual(['input', 'retrieve', 'model', 'validate', 'govern', 'output']);
    expect(scene.stations.find((station) => station.id === 'retrieve').state).toBe('partial');
    expect(scene.stations.find((station) => station.id === 'govern').data.flaggedPhrase).toBeNull();
    expect(adaptAgentScene(agent === 'pr' ? 'branding' : 'pr', view).available).toBe(false);
  });

  it('preserves zero and unknown measurements without inferring live mode or summing parallel latency', () => {
    const view = adaptExecution({ requested_model: 'some-model', attempts: 0, total_tokens: null,
      calls: [{ source: 'live', latency_ms: 12 }, { source: 'live', latency_ms: 15 }] });
    expect(view.source).toBe('unknown');
    expect(view.attempts).toBe(0);
    expect(view.latencyMs).toBeNull();
    expect(view.totalTokens).toBeNull();
    expect(view.fallbackUsed).toBeNull();
  });

  it('maps malformed/error/missing input to honest states and declines unsafe source links', () => {
    expect(adaptWorkflow('run', null).state).toBe('unavailable');
    expect(adaptWorkflow('run', { error: 'upstream_error', message: 'Try later' })).toMatchObject({ state: 'error', error: 'Try later' });
    expect(adaptWorkflow('unexpected', runFixture()).state).toBe('unavailable');
    const view = adaptWorkflow('chat', { reply: 'Reply', recall: { facts: [{ content: 'Text', source_url: 'javascript:alert(1)' }] } });
    expect(view.evidence.facts[0].sourceUrl).toBeNull();
    expect(adaptWorkflow('triage', { answer: 'Partial', views: [null] }).output.views[0].text).toBeNull();
    expect(adaptWorkflow('digest', { executive_summary: 'Partial', agent_briefs: [null] }).input.agents).toEqual([]);
    expect(adaptWorkflow('run', null).raw).toBeNull();
  });
});
