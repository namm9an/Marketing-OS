import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import ExecutionDetails from './ExecutionDetails';

it('keeps unreported usage unavailable while showing an actual zero attempt count', () => {
  render(<ExecutionDetails metrics={{ source: 'mock', model: 'mock-fallback', attempts: 0, latency_ms: null, total_tokens: null }} />);
  fireEvent.click(screen.getByText('Execution: Mock response'));
  expect(screen.getByText('0')).toBeVisible();
  expect(screen.getAllByText('Unavailable')).toHaveLength(3);
  expect(screen.getByText(/provider latency and usage are unavailable/)).toBeVisible();
});
