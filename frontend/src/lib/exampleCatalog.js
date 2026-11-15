import { AGENTS } from './agents';
import { adaptWorkflow, adaptAgentScene } from './presentation';

const agents = AGENTS.map(({ id }) => id);
const fail = (code) => { const error = new Error(code); error.code = code; throw error; };

function validateManifest(manifest) {
  if (manifest?.schema_version !== 1) fail('unsupported-manifest');
  if (manifest.status !== 'ready') return false;
  if (manifest.mode !== 'live-recordings' || manifest.fictional_client !== 'Vanguard Cloud') fail('not-public-live-recordings');
  const entries = manifest.examples;
  if (!Array.isArray(entries) || entries.length !== agents.length
      || new Set(entries.map((entry) => entry?.agent)).size !== agents.length) fail('incomplete-specialist-set');
  for (const entry of entries) {
    if (!agents.includes(entry.agent) || entry.path !== `${entry.agent}.json` || !/^[a-f0-9]{64}$/.test(entry.sha256)) fail('invalid-recording-entry');
  }
  return true;
}

function validateBundle(bundle, agent) {
  const { recording, request, response, evidence } = bundle || {};
  if (bundle?.schema_version !== 1 || recording?.kind !== 'live-recording'
      || recording.fictional_client !== 'Vanguard Cloud' || recording.signal_kind !== 'supplied-simulated'
      || !Number.isFinite(Date.parse(recording.captured_at))) fail('invalid-recording-provenance');
  if (request?.workflow !== 'run' || request.agent_type !== agent || typeof request.goal !== 'string'
      || response?.goalStatement !== request.goal || response.success !== true
      || typeof response.positioning?.statement !== 'string' || !response.positioning.statement.trim()
      || !response.decision?.reasoning_source?.startsWith(`langgraph:${agent}:`)) fail('recording-attribution-mismatch');
  const metrics = response.metrics;
  if (metrics?.source !== 'live' || !Number.isInteger(metrics.attempts) || metrics.attempts < 1
      || metrics.finish_reason !== 'STOP' || metrics.model === 'mock-fallback') fail('missing-live-execution-evidence');
  const retrievals = evidence?.retrievals;
  if (!Array.isArray(retrievals) || retrievals.length !== 1 || retrievals[0]?.agent !== agent
      || retrievals[0].query !== request.goal || !Array.isArray(retrievals[0].facts) || !retrievals[0].facts.length) fail('missing-request-retrieval');
  const factIds = new Set();
  for (const fact of retrievals[0].facts) {
    if (typeof fact?.id !== 'string' || typeof fact.content !== 'string' || fact.enriched_by !== 'grounded_crawler') fail('invalid-captured-source');
    try { if (!['http:', 'https:'].includes(new URL(fact.source_url).protocol)) fail('invalid-source-url'); }
    catch { fail('invalid-source-url'); }
    factIds.add(fact.id);
  }
  const cited = response.decision.evidence_ids;
  if (!Array.isArray(cited) || !cited.length || cited.some((id) => !factIds.has(id))
      || response.decision.invalid_evidence_ids_count) fail('invalid-citation-attribution');
}

async function checksum(bytes) {
  if (!globalThis.crypto?.subtle) fail('integrity-check-unavailable');
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map((value) => value.toString(16).padStart(2, '0')).join('');
}

/** Static, read-only data access. No API generation, review or memory endpoint is used. */
export function createExampleCatalog({ fetcher = globalThis.fetch } = {}) {
  let manifestPromise;
  const bundles = new Map();
  const manifest = () => {
    if (!manifestPromise) {
      manifestPromise = (async () => {
        const response = await fetcher('/examples/manifest.json', { credentials: 'omit', cache: 'no-cache' });
        if (!response.ok) fail('manifest-unavailable');
        const value = await response.json();
        return { value, ready: validateManifest(value) };
      })().catch((error) => { manifestPromise = null; throw error; });
    }
    return manifestPromise;
  };
  return {
    async status() {
      try {
        const result = await manifest();
        return { state: result.ready ? 'ready' : 'unavailable', agents: result.ready ? [...agents] : [] };
      } catch (error) { return { state: 'unavailable', agents: [], reason: error.code || 'manifest-unavailable' }; }
    },
    async load(agent) {
      if (!agents.includes(agent)) return { state: 'unavailable', reason: 'unknown-specialist' };
      try {
        const result = await manifest();
        if (!result.ready) return { state: 'unavailable', reason: 'live-recordings-not-ready' };
        const entry = result.value.examples.find((item) => item.agent === agent);
        if (!bundles.has(agent)) {
          bundles.set(agent, (async () => {
            const response = await fetcher(`/examples/${entry.path}`, { credentials: 'omit' });
            if (!response.ok) fail('recording-file-unavailable');
            const bytes = await response.arrayBuffer();
            if (await checksum(bytes) !== entry.sha256) fail('recording-checksum-mismatch');
            const value = JSON.parse(new TextDecoder().decode(bytes));
            validateBundle(value, agent);
            return value;
          })().catch((error) => { bundles.delete(agent); throw error; }));
        }
        const bundle = structuredClone(await bundles.get(agent));
        const presentation = adaptWorkflow('run', bundle.response, { request: bundle.request,
          capturedRetrievals: bundle.evidence.retrievals });
        return { state: 'available', recording: bundle.recording, presentation, scene: adaptAgentScene(agent, presentation) };
      } catch (error) { return { state: 'unavailable', reason: error.code || 'recording-file-unavailable' }; }
    },
  };
}
