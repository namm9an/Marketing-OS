import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import WorkflowReplaysSection from './WorkflowReplaysSection';

it('labels hand-written examples and never submits inference when switching workflow examples', async () => {
  const fetch = vi.fn(async () => ({ ok: true, json: async () => ({ schema_version: 1, status: 'awaiting-live-capture', examples: [] }) }));
  vi.stubGlobal('fetch', fetch);
  render(<WorkflowReplaysSection />);
  expect(screen.getByText(/These hand-written examples/)).toHaveTextContent('not captured provider responses or production records');
  for (const name of [/Specialist Chat/, /Dialectic Triage/, /Executive Digest/]) {
    fireEvent.click(screen.getByRole('button', { name }));
  }
  await waitFor(() => expect(fetch).toHaveBeenCalled());
  expect(fetch.mock.calls.every(([url]) => url === '/examples/manifest.json')).toBe(true);
});
