import React, { useEffect, useRef, useState } from 'react';
import { apiJson } from '../../lib/api';

export default function DecisionReview({ decisionId, onUpdated }) {
  const [record, setRecord] = useState(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState(null);
  const [reason, setReason] = useState('');
  const [reload, setReload] = useState(0);
  const generation = useRef(0);

  useEffect(() => {
    const version = ++generation.current;
    const controller = new AbortController();
    setRecord(null);
    setReason('');
    setError(null);
    setBusy(true);
    apiJson(`/api/decisions/${decisionId}`, { signal: controller.signal })
      .then(({ decision }) => {
        if (version === generation.current) setRecord(decision);
      })
      .catch((err) => {
        if (version === generation.current && err.name !== 'AbortError') setError(err.message);
      })
      .finally(() => { if (version === generation.current) setBusy(false); });
    return () => { generation.current += 1; controller.abort(); };
  }, [decisionId, reload]);

  const current = record?.id === decisionId ? record : null;
  const review = async (status) => {
    if (busy || !current) return;
    const version = generation.current;
    setBusy(true);
    setError(null);
    try {
      const { decision } = await apiJson(`/api/decisions/${decisionId}/review`, {
        method: 'POST', body: JSON.stringify({ status, reason: reason.trim() }),
      });
      if (version !== generation.current) return;
      setRecord(decision);
      onUpdated?.(decision);
    } catch (err) {
      if (version === generation.current) setError(err.message);
    } finally {
      if (version === generation.current) setBusy(false);
    }
  };

  return (
    <section aria-label="Decision review" className="border border-[#E7E2D8] rounded-xl p-4 space-y-3 text-xs">
      <div role="status" aria-live="polite">
        {current ? <>
          <strong>Review status: {current.review_status}</strong>
          {current.reviewed_by && <span> · {current.reviewed_by} · <time dateTime={current.reviewed_at}>{current.reviewed_at}</time></span>}
        </> : busy ? 'Loading review status…' : 'Review status unavailable.'}
      </div>
      {current?.escalated ? <p>Risk escalation remains flagged. {current.result?.decision?.escalation_reason || current.risks}</p> : null}
      {error && <p role="alert">{error}</p>}
      {!current && !busy && <button onClick={() => setReload((n) => n + 1)}>Retry loading review</button>}
      {current && <>
        <label className="block space-y-1">
          <span>Review reason (optional)</span>
          <textarea value={reason} onChange={(e) => setReason(e.target.value)} maxLength={4000}
            disabled={busy} rows={2} className="block border border-[#D4D1C7] rounded p-2 w-full" />
        </label>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => review('approved')} disabled={busy || current.review_status === 'approved'}
            className="px-3 py-2 rounded border border-[#D4D1C7] disabled:opacity-50">Approve decision</button>
          <button onClick={() => review('rejected')} disabled={busy || current.review_status === 'rejected'}
            className="px-3 py-2 rounded border border-[#D4D1C7] disabled:opacity-50">Reject decision</button>
          {busy && <span>Saving review…</span>}
        </div>
        {current.reviews?.length > 0 && <details>
          <summary>Review history ({current.reviews.length})</summary>
          <ol className="mt-2 space-y-2">{current.reviews.map((item) => <li key={item.id}>
            {item.status} · {item.reviewed_by} · {item.reviewed_at}{item.reason && ` · ${item.reason}`}
          </li>)}</ol>
        </details>}
      </>}
    </section>
  );
}
