// Controlled inputs for tests. None is a genuine public provider recording.
export const fixtureProvenance = { kind: 'controlled-fixture', fictionalClient: 'Vanguard Cloud' };
export const mockMetrics = { source: 'mock', model: 'mock-fallback', requested_model: 'configured-test-model',
  attempts: 0, latency_ms: null, total_wall_ms: 0, total_tokens: null, prompt_tokens: null, completion_tokens: null,
  thoughts_tokens: null, fallback_used: false, served_model_verified: false, finish_reason: null };
export const factFixture = { id: 'fact-b200', organization: 'Vanguard Cloud', knowledge_class: 'pricing',
  content: 'B200 from Rs671/hr; H100 from Rs334/hr.', source_url: 'https://example.com/fictional-rate-card', enriched_by: 'grounded_crawler' };
export function runFixture(agent = 'branding') {
  return structuredClone({ success: true, goalStatement: 'Compare B200 pricing and reliability',
    positioning: { statement: 'A controlled strategy statement.', state: 'ACTIVE' },
    decision: { id: `run-${agent}`, selected_option: `${agent} example`, confidence: 'Medium',
      rationale: 'A controlled rationale.', risks: 'A controlled risk.', escalated: agent === 'pr',
      reasoning_source: `langgraph:${agent}:mock-fallback`, evidence_ids: ['fact-b200'] },
    metrics: mockMetrics, knowledge_units: [{ class: 'fact', confidence: 'medium', content: 'Generated decision summary; not a corpus row.' }],
  });
}
