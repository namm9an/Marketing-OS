import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import InteractiveConsole from './InteractiveConsole';

vi.mock('../ShaderCanvas', () => ({ default: () => null }));

const result = {
  success: true, goalStatement: 'Original goal',
  positioning: { statement: 'The complete original positioning statement.', state: 'ACTIVE' },
  decision: { id: 'run-1', selected_option: 'Saved strategy title', confidence: 'Medium',
    rationale: 'Original reasoning', risks: 'Original risks', reasoning_source: 'langgraph:branding:mock-fallback' },
  knowledge_units: [{ content: 'Original generated summary', class: 'fact', confidence: 'medium' }],
};

function installApi(rows) {
  vi.stubGlobal('fetch', vi.fn(async (url) => {
    const data = url === '/api/me' ? { authenticated: true, username: 'operator' }
      : url === '/api/history' ? { success: true, history: rows } : {};
    return { ok: true, status: 200, json: async () => data };
  }));
}

describe('persistent result history', () => {
  it('reopens the original response after login instead of reconstructing it from its title', async () => {
    installApi([{ id: 'run-1', selected_option: 'Saved strategy title', goal_statement: 'Original goal',
      workflow_type: 'run', result_available: true, result, created_at: '2026-11-15T10:00:00Z' }]);
    render(<InteractiveConsole />);
    fireEvent.click(await screen.findByRole('button', { name: /Saved strategy title/ }));
    expect(await screen.findByText(result.positioning.statement)).toBeVisible();
    expect(screen.getByText('Original generated summary')).toBeVisible();
  });

  it('shows an honest unavailable state for a legacy record', async () => {
    installApi([{ id: 'old', selected_option: 'Legacy title', goal_statement: 'Old goal',
      workflow_type: 'legacy', result_available: false, result: null }]);
    render(<InteractiveConsole />);
    fireEvent.click(await screen.findByRole('button', { name: /Legacy title/ }));
    expect(await screen.findByText(/Original result unavailable/)).toBeVisible();
    expect(screen.queryByTitle('Download Markdown Report')).not.toBeInTheDocument();
  });

  it.each([
    ['chat', { reply: 'Original chat reply', recall: { memories: [], facts: [], graph: [] } }, 'Original chat reply'],
    ['triage', { answer: 'Original pair answer', views: [], recommended_action: 'Review both views' }, 'Original pair answer'],
  ])('reopens a saved %s without treating it as a positioning brief', async (kind, snapshot, text) => {
    installApi([{ id: kind, selected_option: `Saved ${kind} turn`, goal_statement: 'Original question',
      workflow_type: kind, result_available: true, result: snapshot }]);
    render(<InteractiveConsole />);
    fireEvent.click(await screen.findByRole('button', { name: new RegExp(`Saved ${kind} turn`) }));
    expect(await screen.findByText(text)).toBeVisible();
  });
});

it('discards a pending run when switching agents and allows the newly selected agent to run', async () => {
  let finish;
  let signal;
  vi.stubGlobal('fetch', vi.fn((url, options) => {
    if (url === '/api/run') {
      signal = options.signal;
      return new Promise((resolve) => { finish = resolve; });
    }
    const data = url === '/api/me' ? { authenticated: true, username: 'operator' } : { history: [] };
    return Promise.resolve({ ok: true, json: async () => data });
  }));
  render(<InteractiveConsole />);
  fireEvent.click(await screen.findByRole('button', { name: 'Run Agent', exact: true }));
  await waitFor(() => expect(finish).toBeTypeOf('function'));
  fireEvent.click(screen.getByRole('button', { name: /PR.*Agent/ }));
  expect(screen.getByRole('button', { name: 'Run Agent', exact: true })).toBeEnabled();
  await act(async () => finish({ ok: true, json: async () => result }));
  expect(screen.queryByText(result.positioning.statement)).not.toBeInTheDocument();
  expect(signal.aborted).toBe(true);
});

it.each([
  ['branding', 'Branding Agent'], ['pr', 'PR Agent'], ['social', 'Social Agent'],
  ['product_marketing', 'Product Marketing Agent'], ['events', 'Field Events Agent'],
])('submits the actual %s specialist without a pretend client-selected model', async (agent, name) => {
  const fetch = vi.fn(async (url) => ({ ok: true, status: 200, json: async () =>
    url === '/api/me' ? { authenticated: true, username: 'operator' }
      : url === '/api/history' ? { history: [] }
      : url === '/api/run' ? { ...result, metrics: { source: 'mock', model: 'mock-fallback', total_tokens: null } }
      : { decision: { id: 'run-1', review_status: 'unreviewed', reviews: [] } },
  }));
  vi.stubGlobal('fetch', fetch);
  render(<InteractiveConsole />);
  fireEvent.click(await screen.findByRole('button', { name, exact: true }));
  fireEvent.click(screen.getByRole('button', { name: 'Run Agent', exact: true }));
  expect(await screen.findByText(result.positioning.statement)).toBeVisible();
  const [, options] = fetch.mock.calls.find(([url]) => url === '/api/run');
  expect(JSON.parse(options.body)).toEqual({ agent_type: agent, goal: expect.any(String) });
  expect(screen.getByText('Execution: Mock response')).toBeVisible();
  expect(screen.queryByText(/Gemini 3.8 Flash Active/)).not.toBeInTheDocument();
  expect(screen.queryByTitle('Attach PDF or Image for Analysis')).not.toBeInTheDocument();
});

it('reports a rejected export instead of downloading an error document', async () => {
  const row = { id: 'run-1', workflow_type: 'run', result_available: true, result };
  vi.stubGlobal('fetch', vi.fn(async (url) => ({
    ok: url !== '/api/export/markdown', status: url === '/api/export/markdown' ? 503 : 200,
    json: async () => url === '/api/me' ? { authenticated: true }
      : url === '/api/history' ? { history: [row] }
      : url === '/api/export/markdown' ? { message: 'Export unavailable', error: 'unavailable' }
      : { decision: { ...row, review_status: 'unreviewed', reviews: [] } },
  })));
  render(<InteractiveConsole />);
  fireEvent.click(await screen.findByRole('button', { name: /Saved strategy title/ }));
  fireEvent.click(screen.getByTitle('Download Markdown Report'));
  expect(await screen.findByRole('alert')).toHaveTextContent('Export unavailable');
});

it('clears the previous operator result when logging out and authenticating again', async () => {
  let historyRequests = 0;
  const row = { id: 'run-1', workflow_type: 'run', result_available: true, result };
  vi.stubGlobal('fetch', vi.fn(async (url) => ({ ok: true, status: 200, json: async () =>
    url === '/api/me' || url === '/api/login' ? { authenticated: true, username: 'operator' }
      : url === '/api/history' ? { history: historyRequests++ === 0 ? [row] : [] }
      : url.startsWith('/api/decisions/') ? { decision: { ...row, review_status: 'unreviewed', reviews: [] } }
      : { success: true },
  })));
  render(<InteractiveConsole />);
  fireEvent.click(await screen.findByRole('button', { name: /Saved strategy title/ }));
  fireEvent.click(screen.getByTitle('Sign out'));
  await screen.findByRole('button', { name: 'Authenticate Operator' });
  fireEvent.change(screen.getByLabelText('Operator Username'), { target: { value: 'other' } });
  fireEvent.change(screen.getByLabelText('Access Password'), { target: { value: 'test-password' } });
  fireEvent.click(screen.getByRole('button', { name: 'Authenticate Operator' }));
  await screen.findByRole('button', { name: 'Run Agent', exact: true });
  expect(screen.queryByText(result.positioning.statement)).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /Saved strategy title/ })).not.toBeInTheDocument();
});
