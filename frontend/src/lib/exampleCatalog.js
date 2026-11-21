import { AGENTS } from './agents';

const agents = AGENTS.map(({ id }) => id);
const fail = code => { const error = new Error(code); error.code = code; throw error; };
const text = value => typeof value === 'string' && value.trim().length > 0;
const primarySources = new Set([
  'https://www.ftc.gov/business-guidance/resources/environmental-claims-summary-green-guides',
  'https://www.epa.gov/recycle/electronics-donation-and-recycling',
  'https://support.google.com/business/answer/7342169?hl=en',
]);

function validateManifest(manifest) {
  if (manifest?.schema_version !== 2 || manifest.mode !== 'reviewed-demo') fail('unsupported-catalog');
  if (manifest.status !== 'ready') return false;
  const entries = manifest.examples;
  if (!Array.isArray(entries) || entries.length !== agents.length
      || new Set(entries.map(entry => entry?.agent)).size !== agents.length) fail('incomplete-specialist-set');
  for (const entry of entries) {
    if (!agents.includes(entry.agent) || entry.path !== `${entry.agent.replaceAll('_', '-')}.json`
        || !/^[a-f0-9]{64}$/.test(entry.sha256)) fail('invalid-example-entry');
  }
  return true;
}

function validateExample(example, agent) {
  const allowed = ['schema_version', 'kind', 'agent', 'brief', 'result', 'rationale', 'considerations', 'review_required', 'sources'];
  if (!example || Object.keys(example).some(key => !allowed.includes(key))
      || example.schema_version !== 2 || example.kind !== 'illustrative-demo' || example.agent !== agent
      || !['brief', 'result', 'rationale', 'considerations'].every(key => text(example[key]))
      || typeof example.review_required !== 'boolean') fail('invalid-demo-example');
  if (!Array.isArray(example.sources) || !example.sources.length
      || new Set(example.sources.map(source => source?.id)).size !== example.sources.length) fail('invalid-demo-sources');
  for (const source of example.sources) {
    if (!source || Object.keys(source).some(key => !['id', 'title', 'url', 'statement'].includes(key))
        || !['id', 'title', 'url', 'statement'].every(key => text(source[key]))
        || !primarySources.has(source.url)) fail('invalid-demo-sources');
  }
}

async function checksum(bytes) {
  if (!globalThis.crypto?.subtle) fail('integrity-check-unavailable');
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map(value => value.toString(16).padStart(2, '0')).join('');
}

/** Reviewed illustrative views only. No requests, provider records or API writes. */
export function createExampleCatalog({ fetcher = globalThis.fetch } = {}) {
  let manifestPromise;
  const examples = new Map();
  const manifest = () => {
    if (!manifestPromise) {
      manifestPromise = (async () => {
        const response = await fetcher('/examples/manifest.json', { credentials: 'omit', cache: 'no-cache' });
        if (!response.ok) fail('manifest-unavailable');
        const value = await response.json();
        return { value, ready: validateManifest(value) };
      })().catch(error => { manifestPromise = null; throw error; });
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
        if (!result.ready) return { state: 'unavailable', reason: 'examples-not-ready' };
        const entry = result.value.examples.find(item => item.agent === agent);
        if (!examples.has(agent)) {
          examples.set(agent, (async () => {
            const response = await fetcher(`/examples/${entry.path}`, { credentials: 'omit' });
            if (!response.ok) fail('example-unavailable');
            const bytes = await response.arrayBuffer();
            if (await checksum(bytes) !== entry.sha256) fail('example-checksum-mismatch');
            const value = JSON.parse(new TextDecoder().decode(bytes));
            validateExample(value, agent);
            return value;
          })().catch(error => { examples.delete(agent); throw error; }));
        }
        const example = structuredClone(await examples.get(agent));
        return { state: 'available', presentation: {
          input: { text: example.brief, agents: [agent] },
          output: { text: example.result, rationale: example.rationale, risks: example.considerations },
          governance: { escalated: example.review_required },
          evidence: { kind: 'reviewed-primary-sources', facts: example.sources.map(source => ({
            id: source.id, title: source.title, content: source.statement, sourceUrl: source.url,
          })) },
        } };
      } catch (error) { return { state: 'unavailable', reason: error.code || 'example-unavailable' }; }
    },
  };
}
