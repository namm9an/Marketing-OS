import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import CompetitorNetwork from './CompetitorNetwork';

it('opens and closes a competitor source disclosure from the keyboard', () => {
  render(<CompetitorNetwork network={{ nodes: [
    { id: 'Vanguard Cloud', group: 'us' },
    { id: 'Nebius', group: 'competitor', fact_count: 1, classes: ['pricing'], citations: [
      { content: 'The stored pricing source.', source_url: 'https://nebius.com/prices' },
    ] },
  ] }} />);
  const node = screen.getByRole('button', { name: 'Inspect Nebius source facts' });
  fireEvent.keyDown(node, { key: 'Enter' });
  expect(screen.getByText('The stored pricing source.')).toBeVisible();
  expect(screen.getByRole('link')).toHaveAttribute('href', 'https://nebius.com/prices');
  expect(node).toHaveAttribute('aria-pressed', 'true');
  fireEvent.keyDown(node, { key: ' ' });
  expect(screen.queryByText('The stored pricing source.')).not.toBeInTheDocument();
});
