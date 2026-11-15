import { createHash, webcrypto } from 'node:crypto';
import { expect, it, vi } from 'vitest';
import { createExampleCatalog } from './exampleCatalog';
import { recordingContractFixture } from '../test/recordingFixtures';

const agents = ['branding', 'pr', 'social', 'product_marketing', 'events'];
function files(change = () => {}) {
  const bodies = {};
  const manifest = { schema_version: 1, mode: 'live-recordings', status: 'ready', fictional_client: 'Vanguard Cloud', examples: [] };
  for (const agent of agents) {
    const { bundle, fixtureKind } = recordingContractFixture(agent);
    expect(fixtureKind).toBe('controlled-provider-contract');
    change(bundle);
    const body = JSON.stringify(bundle);
    bodies[`/examples/${agent}.json`] = body;
    manifest.examples.push({ agent, path: `${agent}.json`, sha256: createHash('sha256').update(body).digest('hex') });
  }
  const fetcher = vi.fn(async (url) => ({ ok: true,
    json: async () => structuredClone(manifest),
    arrayBuffer: async () => new TextEncoder().encode(bodies[url]).buffer,
  }));
  return { bodies, manifest, fetcher };
}

it('loads and checks all five contracts using only anonymous static reads, with request evidence and immutable projections', async () => {
  vi.stubGlobal('crypto', webcrypto);
  const { fetcher } = files();
  const catalog = createExampleCatalog({ fetcher });
  expect(await catalog.status()).toEqual({ state: 'ready', agents });
  for (const agent of agents) {
    const result = await catalog.load(agent);
    expect(result.state).toBe('available');
    expect(result.scene.available).toBe(true);
    expect(result.presentation.evidence.kind).toBe('captured-rows');
  }
  const first = await catalog.load('branding');
  first.presentation.raw.positioning.statement = 'Changed view';
  expect((await catalog.load('branding')).presentation.raw.positioning.statement).toBe('A controlled strategy statement.');
  expect(fetcher).toHaveBeenCalledTimes(6);
  expect(fetcher.mock.calls.every(([url, options]) => url.startsWith('/examples/') && options.credentials === 'omit' && !options.method)).toBe(true);
});

it('leaves missing/partial recordings unavailable without substituting controlled examples', async () => {
  const fetcher = vi.fn(async () => ({ ok: true, json: async () => ({ schema_version: 1, status: 'awaiting-live-capture', examples: [] }) }));
  const catalog = createExampleCatalog({ fetcher });
  expect((await catalog.status()).state).toBe('unavailable');
  expect((await catalog.load('branding')).reason).toBe('live-recordings-not-ready');
  expect(fetcher).toHaveBeenCalledTimes(1);
});

it.each([
  ['controlled fixture', (bundle) => { bundle.recording.kind = 'controlled-fixture'; }],
  ['mock response', (bundle) => { bundle.response.metrics.source = 'mock'; }],
  ['another agent', (bundle) => { bundle.request.agent_type = 'unexpected'; }],
  ['different retrieval query', (bundle) => { bundle.evidence.retrievals[0].query = 'A later unrelated search'; }],
  ['invented citation', (bundle) => { bundle.response.decision.evidence_ids = ['not-retrieved']; }],
])('rejects a %s even when its file checksum matches', async (_, change) => {
  vi.stubGlobal('crypto', webcrypto);
  const { fetcher } = files(change);
  expect((await createExampleCatalog({ fetcher }).load('branding')).state).toBe('unavailable');
});

it('detects file changes before presenting them as recorded output', async () => {
  vi.stubGlobal('crypto', webcrypto);
  const { fetcher, bodies } = files();
  bodies['/examples/branding.json'] += '\n';
  expect((await createExampleCatalog({ fetcher }).load('branding')).reason).toBe('recording-checksum-mismatch');
});

it('rejects incomplete specialist sets and paths outside the fixed catalogue', async () => {
  const { fetcher, manifest } = files();
  manifest.examples[1].agent = 'branding';
  expect((await createExampleCatalog({ fetcher }).status()).reason).toBe('incomplete-specialist-set');
  manifest.examples[1].agent = 'pr';
  manifest.examples[1].path = 'https://other-host.example/secret';
  expect((await createExampleCatalog({ fetcher }).status()).reason).toBe('invalid-recording-entry');
});
