import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { AgentExample } from './PageFoundation';
import { adaptWorkflow } from '../../lib/presentation';
import { runFixture, factFixture } from '../../test/workflowFixtures';

const available = agent => ({ state: 'available', recording: { captured_at: '2026-11-16T00:00:00Z' },
  presentation: adaptWorkflow('run', runFixture(agent), { capturedRetrievals: [{ agent, facts: [factFixture] }] }) });

it('renders template and HTML-like model text as data without creating executable elements', async () => {
  const result = available('pr');
  result.presentation.output.text = '<img src=x onerror="window.polluted=true"> {{7*7}}';
  const catalog = { load: vi.fn(async () => result) };
  const { container } = render(<AgentExample agent="pr" catalog={catalog} />);
  await screen.findByText(result.presentation.output.text);
  expect(container.querySelector('img')).toBeNull();
  expect(container.querySelector('script')).toBeNull();
  expect(Object.prototype.polluted).toBeUndefined();
});

it('shows the task and untouched recommendation with optional support, without capture/operational metadata', async () => {
  const result = available('pr');
  const original = structuredClone(result);
  const catalog = { load: vi.fn(async () => result) };
  const { container } = render(<AgentExample agent="pr" catalog={catalog} />);
  await screen.findByText(result.presentation.output.text);
  expect(screen.getByRole('heading', { name: 'The brief' })).toBeInTheDocument();
  expect(screen.getByText('Flagged for human review')).toBeInTheDocument();
  expect(container.querySelector('time')).toBeNull();
  expect(screen.queryByText(/Captured|Execution:|quota|2026-11-16/)).not.toBeInTheDocument();
  fireEvent.click(screen.getByText('Sources and rationale'));
  expect(screen.getByText(result.presentation.output.rationale)).toBeInTheDocument();
  expect(result).toEqual(original);
});

it('a delayed example cannot replace a newly selected specialist', async () => {
  let release;
  const held = new Promise(resolve => { release = resolve; });
  const catalog = { load: vi.fn(agent => agent === 'branding' ? held : Promise.resolve(available(agent))) };
  const { rerender } = render(<AgentExample agent="branding" catalog={catalog} />);
  rerender(<AgentExample agent="pr" catalog={catalog} />);
  await screen.findByRole('heading', { name: 'A communication recommendation' });
  await act(async () => release(available('branding')));
  expect(screen.getByRole('heading', { name: 'PR & Policy' })).toBeInTheDocument();
  expect(screen.queryByRole('heading', { name: 'A positioning recommendation' })).not.toBeInTheDocument();
});

it('can retry a failed static read without submitting a model request', async () => {
  const catalog = { load: vi.fn().mockResolvedValueOnce({ state: 'unavailable' }).mockResolvedValueOnce(available('pr')) };
  render(<AgentExample agent="pr" catalog={catalog} />);
  await screen.findByRole('alert');
  fireEvent.click(screen.getByRole('button', { name: /Try again/ }));
  await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
  expect(catalog.load.mock.calls).toEqual([['pr'], ['pr']]);
});
