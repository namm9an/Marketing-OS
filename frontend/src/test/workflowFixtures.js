// Controlled inputs for tests. None is a genuine public provider recording.
export const fixtureProvenance = { kind: 'controlled-fixture', fictionalClient: 'Example service' };
export const mockMetrics = { source: 'mock', model: 'mock-fallback', requested_model: 'configured-test-model',
  attempts: 0, latency_ms: null, total_wall_ms: 0, total_tokens: null, prompt_tokens: null, completion_tokens: null,
  thoughts_tokens: null, fallback_used: false, served_model_verified: false, finish_reason: null };
export const factFixture = { id: 'fact-service', organization: 'Example service', knowledge_class: 'service',
  content: 'The example service offers assessment before a repair quote.', source_url: 'https://example.com/service-terms', enriched_by: 'grounded_crawler' };
export function runFixture(agent = 'branding') {
  return structuredClone({ success: true, goalStatement: 'Compare service positioning using the available evidence',
    positioning: { statement: 'A controlled strategy statement.', state: 'ACTIVE' },
    decision: { id: `run-${agent}`, selected_option: `${agent} example`, confidence: 'Medium',
      rationale: 'A controlled rationale.', risks: 'A controlled risk.', escalated: agent === 'pr',
      reasoning_source: `langgraph:${agent}:mock-fallback`, evidence_ids: ['fact-service'] },
    metrics: mockMetrics, knowledge_units: [{ class: 'fact', confidence: 'medium', content: 'Generated decision summary; not a corpus row.' }],
  });
}
