import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import WorkflowReplaysSection from './WorkflowReplaysSection';

it('labels hand-written examples and never submits inference when switching workflow examples', () => {
  const fetch = vi.fn();
  vi.stubGlobal('fetch', fetch);
  render(<WorkflowReplaysSection />);
  expect(screen.getByText(/These hand-written examples/)).toHaveTextContent('not captured provider responses or production records');
  for (const name of [/Specialist Chat/, /Dialectic Triage/, /Executive Digest/]) {
    fireEvent.click(screen.getByRole('button', { name }));
  }
  expect(fetch).not.toHaveBeenCalled();
});
