import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { AGENT_COPY } from './agentCopy';
import { usePublicExample } from './usePublicExample';

export function AgentExample({ agent, catalog, inDossier = false, inComparison = false }) {
  const { current, retry } = usePublicExample(catalog, agent);
  const copy = AGENT_COPY[agent];
  const SectionHeading = inDossier || inComparison ? 'h3' : 'h4';
  const view = current?.state === 'available' ? current.presentation : null;
  const sources = view?.evidence.facts ?? [];
  return <article className="agent-example" aria-label={`${copy.name} example`}>
    {!inDossier && !inComparison && <div className="agent-example-heading"><h3>{copy.name}</h3></div>}
    <p className="agent-purpose">{copy.purpose}</p>
    {(view || !inComparison) && <div className="agent-brief"><SectionHeading>The brief</SectionHeading><p>{view?.input.text ?? copy.brief}</p>
      {!inComparison && <small>Illustrative demo · fictional repair and trade-in service</small>}
    </div>}
    {!current && <p role="status" className="agent-result-state">
      <span className="connected-pixels" aria-hidden="true" />Loading example…
    </p>}
    {current?.state === 'unavailable' && <div role="alert" className="agent-result-state"><p>This example couldn’t load.</p>
      <button className="text-action" onClick={retry}>Try again <ArrowRight size={15} /></button>
    </div>}
    {view && <>
      <div className="agent-result"><SectionHeading>{copy.deliverable}</SectionHeading><p>{view.output.text}</p></div>
      {view.governance.escalated === true && <p className="agent-review-state">Flagged for human review</p>}
      {!inComparison && view.output.risks && <div className="agent-considerations"><SectionHeading>Considerations</SectionHeading><p>{view.output.risks}</p></div>}
      {(view.output.rationale || sources.length > 0 || (inComparison && view.output.risks)) && <details className="agent-support"><summary>Sources and rationale</summary>
        {view.output.rationale && <p>{view.output.rationale}</p>}
        {inComparison && view.output.risks && <p>{view.output.risks}</p>}
        {sources.length > 0 && <ul>{sources.map(fact => <li key={fact.id}>
          <p>{fact.content}</p>{fact.sourceUrl && <a href={fact.sourceUrl} target="_blank" rel="noreferrer">{fact.title || new URL(fact.sourceUrl).hostname} <ArrowUpRight size={13} /></a>}
        </li>)}</ul>}
      </details>}
    </>}
  </article>;
}
