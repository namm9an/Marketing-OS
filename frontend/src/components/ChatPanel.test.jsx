import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ChatPanel from './ChatPanel';

const response = (data, status = 200) => ({ ok: status < 400, status, json: async () => data });
const memory = (content) => ({ memories: [{ id: content, tier: 'episodic', content }] });
beforeEach(() => { HTMLElement.prototype.scrollIntoView = vi.fn(); });
const send = (text) => {
  const input = screen.getByRole('textbox');
  fireEvent.change(input, { target: { value: text } });
  fireEvent.keyDown(input, { key: 'Enter' });
};

describe('agent and namespace request isolation', () => {
  it('ignores a late old-agent response and starts the new agent without its thread', async () => {
    let finish;
    let oldSignal;
    const fetch = vi.fn((url, options) => {
      if (url.startsWith('/api/memory')) return Promise.resolve(response({ memories: [] }));
      const body = JSON.parse(options.body);
      if (body.agent === 'branding') {
        oldSignal = options.signal;
        return new Promise((resolve) => { finish = resolve; }); // Simulate an upstream that ignores cancellation.
      }
      return Promise.resolve(response({ agent: 'pr', thread_id: 'pr-thread', reply: 'The PR reply' }));
    });
    vi.stubGlobal('fetch', fetch);
    render(<ChatPanel />);
    send('Old branding question');
    await waitFor(() => expect(finish).toBeTypeOf('function'));
    fireEvent.click(screen.getByRole('button', { name: 'PR', exact: true }));
    send('New PR question');
    expect(await screen.findByText('The PR reply')).toBeVisible();
    await act(async () => finish(response({ agent: 'branding', thread_id: 'old-thread', reply: 'Late branding reply' })));
    expect(screen.queryByText('Late branding reply')).not.toBeInTheDocument();
    expect(oldSignal.aborted).toBe(true);
    send('Follow up with PR');
    await waitFor(() => expect(fetch.mock.calls.filter(([url]) => url === '/api/chat')).toHaveLength(3));
    const bodies = fetch.mock.calls.filter(([url]) => url === '/api/chat').map(([, options]) => JSON.parse(options.body));
    expect(bodies[1]).toMatchObject({ agent: 'pr', thread_id: null });
    expect(bodies[2]).toMatchObject({ agent: 'pr', thread_id: 'pr-thread' });
  });

  it('does not display a previous scope response under the newly selected memory namespace', async () => {
    let finish;
    vi.stubGlobal('fetch', vi.fn((url) => url.includes('agents=')
      ? Promise.resolve(response(memory('Joint note')))
      : new Promise((resolve) => { finish = resolve; })));
    render(<ChatPanel />);
    await waitFor(() => expect(finish).toBeTypeOf('function'));
    fireEvent.click(screen.getByRole('button', { name: 'triage:branding+pr', exact: true }));
    expect(await screen.findByText('Joint note')).toBeVisible();
    await act(async () => finish(response(memory('Private note'))));
    expect(screen.queryByText('Private note')).not.toBeInTheDocument();
    expect(screen.getByText('Joint note')).toBeVisible();
  });

  it('shows memory API failure as an error rather than an empty namespace', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => response({ error: 'unavailable', message: 'Memory database unavailable' }, 503)));
    render(<ChatPanel />);
    expect(await screen.findByRole('alert')).toHaveTextContent('Memory database unavailable');
    expect(screen.queryByText(/empty — nothing/)).not.toBeInTheDocument();
  });

  it('rejects duplicate triage agents locally without submitting generation', async () => {
    const fetch = vi.fn(async () => response({ memories: [] }));
    vi.stubGlobal('fetch', fetch);
    render(<ChatPanel />);
    send('/triage branding branding What should we do?');
    expect(await screen.findByText(/two different agents/)).toBeVisible();
    expect(fetch.mock.calls.some(([url]) => url === '/api/triage')).toBe(false);
  });
});
