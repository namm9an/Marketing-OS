import React, { useEffect, useState } from 'react';
import { ArrowDown, ArrowRight, ArrowUpRight } from 'lucide-react';
import { AGENT_COPY } from './agentCopy';

export function AgentExample({ agent, catalog, compact = false, onReadFull }) {
  const [example, setExample] = useState(null);
  const [retry, setRetry] = useState(0);
  const copy = AGENT_COPY[agent];
  useEffect(() => {
    let active = true;
    catalog.load(agent).then(result => { if (active) setExample({ ...result, agent }); });
    return () => { active = false; };
  }, [agent, catalog, retry]);
  const current = example?.agent === agent ? example : null;
  const view = current?.state === 'available' ? current.presentation : null;
  return <article className={`f03-example${compact ? ' is-compact' : ''}`} aria-label={`${copy.name} example`}>
    {!compact && <><div className="f03-example-heading"><h3>{copy.name}</h3><span>Example</span></div>
    <p className="f03-purpose">{copy.purpose}</p>
    <div className="f03-brief"><h4>The brief</h4><p>{copy.brief}</p><small>Fictional launch for Vanguard Cloud</small></div></>}
    {!current && <p role="status" className="f03-result-state">{compact && <span className="connected-pixels" aria-hidden="true" />}Loading example…</p>}
    {current?.state === 'unavailable' && <div role="alert" className="f03-result-state"><p>This example couldn’t load.</p>
      <button className="f03-text-button" onClick={() => { setExample(null); setRetry(value => value + 1); }}>Try again <ArrowRight size={15} /></button>
    </div>}
    {view && <>
      <div className="f03-result"><h4>{copy.deliverable}</h4><p>{compact && view.output.text.length > 190
        ? `${view.output.text.slice(0, 190).replace(/\s+\S*$/, '')}…` : view.output.text}</p></div>
      {view.governance.escalated === true && <p className="f03-review-state">Flagged for human review</p>}
      {compact ? <a className="f03-text-button" href="#f03-full-result" onClick={onReadFull}>Read full recommendation <ArrowDown size={15} aria-hidden="true" /></a> : <>
      {view.output.risks && <div className="f03-risks"><h4>Considerations</h4><p>{view.output.risks}</p></div>}
      <details className="f03-support"><summary>Sources and rationale</summary>
        <p>{view.output.rationale}</p><ul>{view.evidence.facts.map(fact => <li key={fact.id}>
          <p>{fact.content}</p>{fact.sourceUrl && <a href={fact.sourceUrl} target="_blank" rel="noreferrer">{new URL(fact.sourceUrl).hostname} <ArrowUpRight size={13} /></a>}
        </li>)}</ul>
      </details>
      </>}
    </>}
  </article>;
}
