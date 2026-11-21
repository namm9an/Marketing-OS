import React, { useEffect, useState } from 'react';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { AGENT_COPY } from './agentCopy';

export function AgentExample({ agent, catalog, inDossier = false }) {
  const [example, setExample] = useState(null);
  const [retry, setRetry] = useState(0);
  const copy = AGENT_COPY[agent];
  const SectionHeading = inDossier ? 'h3' : 'h4';
  useEffect(() => {
    let active = true;
    catalog.load(agent).then(result => { if (active) setExample({ ...result, agent }); });
    return () => { active = false; };
  }, [agent, catalog, retry]);
  const current = example?.agent === agent ? example : null;
  const view = current?.state === 'available' ? current.presentation : null;
  const sources = view?.evidence.facts ?? [];
  return <article className="agent-example" aria-label={`${copy.name} example`}>
    {!inDossier && <div className="agent-example-heading"><h3>{copy.name}</h3></div>}
    <p className="agent-purpose">{copy.purpose}</p>
    <div className="agent-brief"><SectionHeading>The brief</SectionHeading><p>{view?.input.text ?? copy.brief}</p><small>Illustrative demo · fictional repair and trade-in service</small></div>
    {!current && <p role="status" className="agent-result-state">
      <span className="connected-pixels" aria-hidden="true" />Loading example…
    </p>}
    {current?.state === 'unavailable' && <div role="alert" className="agent-result-state"><p>This example couldn’t load.</p>
      <button className="text-action" onClick={() => { setExample(null); setRetry(value => value + 1); }}>Try again <ArrowRight size={15} /></button>
    </div>}
    {view && <>
      <div className="agent-result"><SectionHeading>{copy.deliverable}</SectionHeading><p>{view.output.text}</p></div>
      {view.governance.escalated === true && <p className="agent-review-state">Flagged for human review</p>}
      {view.output.risks && <div className="agent-considerations"><SectionHeading>Considerations</SectionHeading><p>{view.output.risks}</p></div>}
      {(view.output.rationale || sources.length > 0) && <details className="agent-support"><summary>Sources and rationale</summary>
        {view.output.rationale && <p>{view.output.rationale}</p>}
        {sources.length > 0 && <ul>{sources.map(fact => <li key={fact.id}>
          <p>{fact.content}</p>{fact.sourceUrl && <a href={fact.sourceUrl} target="_blank" rel="noreferrer">{fact.title || new URL(fact.sourceUrl).hostname} <ArrowUpRight size={13} /></a>}
        </li>)}</ul>}
      </details>}
    </>}
  </article>;
}
