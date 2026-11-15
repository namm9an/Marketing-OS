import { expect, it, vi } from 'vitest';
import { apiJson } from './api';

it('preserves structured API guidance on a rejected request', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 429,
    json: async () => ({ error: 'rate_limited', message: 'Retry after 60 seconds' }) })));
  await expect(apiJson('/api/run')).rejects.toThrow('Retry after 60 seconds');
});

it('reports a wrong-origin HTML response as a connection problem', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => { throw new SyntaxError('HTML'); } })));
  await expect(apiJson('/api/me')).rejects.toThrow(/Check the server connection/);
});
