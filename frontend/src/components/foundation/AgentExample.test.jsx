import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { AgentExample } from './AgentExample';
import { exampleFixture } from '../../test/exampleFixtures';

const available = agent => {
  const example = exampleFixture(agent);
  return { state: 'available', presentation: {
    input: { text: example.brief },
    output: { text: example.result, rationale: example.rationale, risks: example.considerations },
    governance: { escalated: example.review_required },
    evidence: { facts: example.sources.map(source => ({ id: source.id, title: source.title, content: source.statement, sourceUrl: source.url })) },
  } };
};

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

it('shows an honestly labelled demo brief, recommendation and titled source without operational metadata', async () => {
  const result = available('pr');
  const original = structuredClone(result);
  const catalog = { load: vi.fn(async () => result) };
  const { container } = render(<AgentExample agent="pr" catalog={catalog} />);
  await screen.findByText(result.presentation.output.text);
  expect(screen.getByRole('heading', { name: 'The brief' })).toBeInTheDocument();
  expect(screen.getByText('Flagged for human review')).toBeInTheDocument();
  expect(screen.getByText(/Illustrative demo/)).toBeInTheDocument();
  expect(screen.getByText(result.presentation.input.text)).toBeInTheDocument();
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

it('shows the reviewed primary-source title and does not mutate the view', async () => {
  const result = available('pr');
  const original = structuredClone(result);
  render(<AgentExample agent="pr" catalog={{ load: vi.fn(async () => result) }} inDossier />);
  fireEvent.click(await screen.findByText('Sources and rationale'));
  const source = result.presentation.evidence.facts[0];
  expect(screen.getByRole('link', { name: source.title })).toHaveAttribute('href', source.sourceUrl);
  expect(result).toEqual(original);
});
