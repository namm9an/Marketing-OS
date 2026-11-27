import { createHash, webcrypto } from 'node:crypto';
import { expect, it, vi } from 'vitest';
import { createExampleCatalog } from './exampleCatalog';
import { exampleFixture } from '../test/exampleFixtures';

const agents = ['branding', 'pr', 'social', 'product_marketing', 'events'];
function files(change = () => {}) {
  const bodies = {};
  const manifest = { schema_version: 2, mode: 'reviewed-demo', status: 'ready', examples: [] };
  for (const agent of agents) {
    const example = exampleFixture(agent);
    change(example);
    const body = JSON.stringify(example), path = `${agent.replaceAll('_', '-')}.json`;
    bodies[`/examples/${path}`] = body;
    manifest.examples.push({ agent, path, sha256: createHash('sha256').update(body).digest('hex') });
  }
  const fetcher = vi.fn(async url => ({ ok: true,
    json: async () => structuredClone(manifest),
    arrayBuffer: async () => new TextEncoder().encode(bodies[url]).buffer,
  }));
  return { bodies, manifest, fetcher };
}

it('loads all five concise views using cached anonymous static reads and immutable projections', async () => {
  vi.stubGlobal('crypto', webcrypto);
  const { fetcher } = files();
  const catalog = createExampleCatalog({ fetcher });
  expect(await catalog.status()).toEqual({ state: 'ready', agents });
  for (const agent of agents) {
    const result = await catalog.load(agent);
    expect(result.state).toBe('available');
    expect(result.presentation.evidence.kind).toBe('reviewed-primary-sources');
    expect(result).not.toHaveProperty('recording');
    expect(result.presentation).not.toHaveProperty('raw');
  }
  const first = await catalog.load('branding');
  first.presentation.output.text = 'Changed view';
  first.presentation.evidence.facts[0].content = 'Changed citation';
  const second = await catalog.load('branding');
  expect(second.presentation.output.text).toBe('Controlled branding recommendation.');
  expect(second.presentation.evidence.facts[0].content).toBe('Environmental claims should be specific and qualified.');
  expect(fetcher).toHaveBeenCalledTimes(6);
  expect(fetcher.mock.calls.every(([url, options]) => url.startsWith('/examples/') && options.credentials === 'omit' && !options.method)).toBe(true);
});

it('keeps incomplete examples unavailable and rechecks the manifest on retry', async () => {
  vi.stubGlobal('crypto', webcrypto);
  const { fetcher, manifest } = files();
  manifest.status = 'unavailable';
  const catalog = createExampleCatalog({ fetcher });
  expect((await catalog.status()).state).toBe('unavailable');
  expect((await catalog.load('branding')).reason).toBe('examples-not-ready');
  manifest.status = 'ready';
  expect((await catalog.load('branding')).state).toBe('available');
  expect(fetcher).toHaveBeenCalledTimes(4);
});

it.each([
  ['a false live label', example => { example.kind = 'live-recording'; }],
  ['raw metadata', example => { example.request = { goal: 'Unnecessary raw request' }; }],
  ['another agent', example => { example.agent = 'unexpected'; }],
  ['an unsafe link', example => { example.sources[0].url = 'javascript:alert(1)'; }],
  ['an unreviewed source', example => { example.sources[0].url = 'https://example.com'; }],
  ['an absent source', example => { example.sources = []; }],
  ['nested metadata', example => { example.sources[0].provider = 'not-public'; }],
])('rejects %s even with a matching checksum', async (_, change) => {
  vi.stubGlobal('crypto', webcrypto);
  const { fetcher } = files(change);
  expect((await createExampleCatalog({ fetcher }).load('branding')).state).toBe('unavailable');
});

it('detects changed example bytes', async () => {
  vi.stubGlobal('crypto', webcrypto);
  const { fetcher, bodies } = files();
  bodies['/examples/branding.json'] += '\n';
  expect((await createExampleCatalog({ fetcher }).load('branding')).reason).toBe('example-checksum-mismatch');
});

it('rejects incomplete sets and paths outside the fixed public catalogue', async () => {
  const { fetcher, manifest } = files();
  manifest.examples[1].agent = 'branding';
  expect((await createExampleCatalog({ fetcher }).status()).reason).toBe('incomplete-specialist-set');
  manifest.examples[1].agent = 'pr';
  manifest.examples[1].path = 'https://other-host.example/secret';
  expect((await createExampleCatalog({ fetcher }).status()).reason).toBe('invalid-example-entry');
});

it('retries failed files and shares concurrent reads', async () => {
  vi.stubGlobal('crypto', webcrypto);
  const { fetcher } = files();
  const failing = vi.fn().mockImplementationOnce(() => ({ ok: false })).mockImplementation(fetcher);
  const catalog = createExampleCatalog({ fetcher: failing });
  expect((await catalog.load('pr')).state).toBe('unavailable');
  expect((await Promise.all([catalog.load('pr'), catalog.load('pr')])).every(view => view.state === 'available')).toBe(true);
  expect(fetcher).toHaveBeenCalledTimes(2);
});
