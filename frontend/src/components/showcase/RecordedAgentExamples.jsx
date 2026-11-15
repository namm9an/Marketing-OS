import React, { useEffect, useMemo, useState } from 'react';
import { createExampleCatalog } from '../../lib/exampleCatalog';
import { AGENTS } from '../../lib/agents';
import ExecutionDetails from '../ExecutionDetails';

export default function RecordedAgentExamples() {
  const catalog = useMemo(() => createExampleCatalog(), []);
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  const [agent, setAgent] = useState('branding');
  const [example, setExample] = useState(null);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    let active = true;
    catalog.status().then((result) => { if (active) setReady(result.state === 'ready'); });
    return () => { active = false; };
  }, [catalog]);
  useEffect(() => {
    if (!ready || !open) return;
    let active = true;
    setLoading(true);
    setExample(null);
    catalog.load(agent).then((result) => {
      if (active) { setExample(result); setLoading(false); }
    });
    return () => { active = false; };
  }, [catalog, ready, open, agent]);
  if (!ready) return null; // Existing illustrative tabs remain labelled; no synthetic live substitute.
  const view = example?.presentation?.input.agents[0] === agent ? example.presentation : null;
  return (
    <details className="p-6 border-t border-[#D4D1C7] text-sm text-[#111315]"
      onToggle={(event) => { if (event.target === event.currentTarget) setOpen(event.currentTarget.open); }}>
      <summary>Inspect a recorded agent example</summary>
      <div className="mt-4 space-y-3">
        <div>
          <label htmlFor="recorded-specialist" className="block">Recorded specialist</label>
          <select id="recorded-specialist" value={agent} onChange={(event) => setAgent(event.target.value)} className="block border p-2 mt-1 bg-white">
            {AGENTS.map(({ id, label }) => <option value={id} key={id}>{label}</option>)}
          </select>
        </div>
        {loading && <p role="status">Loading recorded example…</p>}
        {example?.state === 'unavailable' && <p role="alert">This recorded example could not be loaded. Close and reopen to retry.</p>}
        {view && <>
          <p>Recorded provider response · fictional Vanguard Cloud · supplied scenario</p>
          <p>Captured <time dateTime={example.recording.captured_at}>{example.recording.captured_at}</time></p>
          <p><strong>Supplied goal:</strong> {view.input.text}</p>
          <h3 className="font-semibold">{view.output.title}</h3>
          <p className="whitespace-pre-wrap">{view.output.text}</p>
          <p><strong>Rationale:</strong> {view.output.rationale}</p>
          <p><strong>Risks:</strong> {view.output.risks}</p>
          <p>Risk escalation: {view.governance.escalated ? 'flagged' : 'not flagged'}. Human review: not recorded in this example.</p>
          <ExecutionDetails metrics={view.raw.metrics} />
          <details>
            <summary>Sources captured during this request ({view.evidence.facts.length})</summary>
            <p className="mt-2">{view.evidence.note}</p>
            <ul className="space-y-2 mt-2">{view.evidence.facts.map((fact) => <li key={fact.id}>
              <p>{fact.content}</p>
              {fact.sourceUrl && <a href={fact.sourceUrl} target="_blank" rel="noreferrer" className="underline break-all">{fact.sourceUrl}</a>}
            </li>)}</ul>
          </details>
        </>}
      </div>
    </details>
  );
}
