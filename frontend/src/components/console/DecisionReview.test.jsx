import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import DecisionReview from './DecisionReview';

const pending = (id) => ({ id, review_status: 'pending', escalated: true, risks: 'Risk retained', reviews: [] });
const approved = (id) => ({ ...pending(id), review_status: 'approved', reviewed_by: 'operator',
  reviewed_at: '2026-11-15T10:00:00Z', reviews: [{ id: 'review-1', status: 'approved', reviewed_by: 'operator', reason: 'Checked', reviewed_at: '2026-11-15T10:00:00Z' }] });
const response = (data, ok = true) => ({ ok, status: ok ? 200 : 503, json: async () => data });

describe('server-owned decision reviews', () => {
  it('waits for the server, records the selected decision, and preserves its risk flag', async () => {
    let finish;
    const updated = vi.fn();
    const fetch = vi.fn((url, options) => options?.method === 'POST'
      ? new Promise((resolve) => { finish = resolve; }) : Promise.resolve(response({ decision: pending('one') })));
    vi.stubGlobal('fetch', fetch);
    render(<DecisionReview decisionId="one" onUpdated={updated} />);
    const button = await screen.findByRole('button', { name: 'Approve decision' });
    fireEvent.change(screen.getByRole('textbox', { name: 'Review reason (optional)' }), { target: { value: 'Checked' } });
    fireEvent.click(button);
    expect(screen.getByText('Review status: pending')).toBeVisible();
    expect(updated).not.toHaveBeenCalled();
    expect(button).toBeDisabled();
    expect(fetch).toHaveBeenCalledWith('/api/decisions/one/review', expect.objectContaining({
      method: 'POST', body: JSON.stringify({ status: 'approved', reason: 'Checked' }),
    }));
    await act(async () => finish(response({ decision: approved('one') })));
    expect(await screen.findByText('Review status: approved')).toBeVisible();
    expect(screen.getByText(/Risk escalation remains flagged/)).toBeVisible();
    expect(updated).toHaveBeenCalledWith(approved('one'));
  });

  it('keeps pending state after a persistence error', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url, options) => options?.method === 'POST'
      ? response({ error: 'persistence_unavailable', message: 'Could not store review' }, false)
      : response({ decision: pending('one') })));
    render(<DecisionReview decisionId="one" />);
    fireEvent.click(await screen.findByRole('button', { name: 'Approve decision' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not store review');
    expect(screen.getByText('Review status: pending')).toBeVisible();
  });

  it('does not apply an earlier decision response to a newly selected decision', async () => {
    let finish;
    const updated = vi.fn();
    vi.stubGlobal('fetch', vi.fn((url, options) => options?.method === 'POST'
      ? new Promise((resolve) => { finish = resolve; })
      : Promise.resolve(response({ decision: pending(url.split('/').at(-1)) }))));
    const { rerender } = render(<DecisionReview decisionId="one" onUpdated={updated} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Approve decision' }));
    rerender(<DecisionReview decisionId="two" onUpdated={updated} />);
    await waitFor(() => expect(screen.getByRole('button', { name: 'Approve decision' })).toBeEnabled());
    await act(async () => finish(response({ decision: approved('one') })));
    expect(screen.getByText('Review status: pending')).toBeVisible();
    expect(updated).not.toHaveBeenCalled();
  });
});
