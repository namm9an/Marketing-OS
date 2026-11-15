import React from 'react';

export default function ExecutionDetails({ metrics }) {
  if (!metrics) return <p className="text-xs text-[#44403C]">Model configured by server. Execution mode appears with each result.</p>;
  const mode = metrics.source === 'live' ? 'Live provider response'
    : metrics.source === 'mock' ? 'Mock response' : 'Unknown or mixed execution';
  const measured = (value, unit = '') => typeof value === 'number' && Number.isFinite(value) ? `${value}${unit}` : 'Unavailable';
  return (
    <details aria-label="Execution details" className="text-xs text-[#44403C] break-words">
      <summary>Execution: {mode}</summary>
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 mt-2">
        <dt>Requested model</dt><dd>{metrics.requested_model || 'Unavailable'}</dd>
        <dt>Reported model</dt><dd>{metrics.model || 'Unavailable'}</dd>
        <dt>Provider attempts</dt><dd>{measured(metrics.attempts)}</dd>
        <dt>Provider latency</dt><dd>{measured(metrics.latency_ms, ' ms')}</dd>
        <dt>Reported total tokens</dt><dd>{measured(metrics.total_tokens)}</dd>
      </dl>
      {metrics.source === 'mock' && <p className="mt-2">Mock output; provider latency and usage are unavailable.</p>}
    </details>
  );
}
