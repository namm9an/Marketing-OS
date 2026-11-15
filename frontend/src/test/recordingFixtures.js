import { runFixture, factFixture } from './workflowFixtures';

/** Controlled live-shaped contract input ONLY. Never a genuine public recording. */
export function recordingContractFixture(agent) {
  const response = runFixture(agent);
  response.metrics = { ...response.metrics, source: 'live', model: 'controlled-test-version',
    attempts: 1, finish_reason: 'STOP', latency_ms: 1, served_model_verified: true };
  return { fixtureKind: 'controlled-provider-contract', bundle: {
    schema_version: 1,
    recording: { kind: 'live-recording', captured_at: '2026-11-15T12:00:00Z',
      repository_revision: 'controlled-test-input', transport: 'flask-test-client',
      fictional_client: 'Vanguard Cloud', signal_kind: 'supplied-simulated' },
    request: { workflow: 'run', agent_type: agent, goal: response.goalStatement },
    response, evidence: { retrievals: [{ agent, query: response.goalStatement, facts: [structuredClone(factFixture)] }] },
  } };
}
