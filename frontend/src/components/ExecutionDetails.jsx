import React from 'react';
import { adaptExecution } from '../lib/presentation';

export default function ExecutionDetails({ metrics }) {
  if (!metrics) return <p className="text-xs text-[#44403C]">Model configured by server. Execution mode appears with each result.</p>;
  const execution = adaptExecution(metrics);
  const mode = execution.source === 'live' ? 'Live provider response'
    : execution.source === 'mock' ? 'Mock response' : 'Unknown or mixed execution';
  const measured = (value, unit = '') => typeof value === 'number' && Number.isFinite(value) ? `${value}${unit}` : 'Unavailable';
  return (
    <details aria-label="Execution details" className="text-xs text-[#44403C] break-words">
      <summary>Execution: {mode}</summary>
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 mt-2">
        <dt>Requested model</dt><dd>{execution.requestedModel || 'Unavailable'}</dd>
        <dt>Reported model</dt><dd>{execution.model || 'Unavailable'}</dd>
        <dt>Provider attempts</dt><dd>{measured(execution.attempts)}</dd>
        <dt>Provider latency</dt><dd>{measured(execution.latencyMs, ' ms')}</dd>
        <dt>Reported total tokens</dt><dd>{measured(execution.totalTokens)}</dd>
      </dl>
      {execution.source === 'mock' && <p className="mt-2">Mock output; provider latency and usage are unavailable.</p>}
    </details>
  );
}
