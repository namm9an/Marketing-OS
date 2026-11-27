import { usePublicExample } from './usePublicExample';
import './claimMarkup.css';

function ProposedClaim({ brief }) {
  const quoted = brief.match(/^(.*?)(“[^”]+”)(.*)$/s);
  if (!quoted) return <p className="claim-quote">{brief}</p>;

  const [, before, claim, after] = quoted;
  // This example annotates the absolute claim. Preserve other wording as saved.
  const phrase = /\bzero-waste\b/i.exec(claim);
  return <>
    {before.trim() && <p className="claim-context">{before.trim()}</p>}
    <blockquote className="claim-quote">
      {phrase ? <>{claim.slice(0, phrase.index)}<mark>{phrase[0]}</mark>{claim.slice(phrase.index + phrase[0].length)}</> : claim}
    </blockquote>
    {after.trim() && <p className="claim-context">{after.trim()}</p>}
  </>;
}

function Recommendation({ text }) {
  const quoted = text.match(/^(.*?)(“[^”]+”)(.*)$/s);
  if (!quoted) return <p>{text}</p>;
  const [, before, wording, after] = quoted;
  return <p>{before}<strong>{wording}</strong>{after}</p>;
}

export function ClaimMarkup({ catalog, fallback, headingRef }) {
  const { current, retry } = usePublicExample(catalog, 'pr');
  if (current?.state !== 'available') {
    return <>
      {fallback}
      {current ? <div className="agent-result-state">
        <p role="alert">The PR &amp; Policy example couldn’t load.</p>
        <button type="button" className="text-action" onClick={() => {
          headingRef.current?.focus({ preventScroll: true });
          retry();
        }}>Try again</button>
      </div> : <p role="status" className="agent-result-state">
        <span className="connected-pixels" aria-hidden="true" />Loading example…
      </p>}
    </>;
  }

  const { input, output, governance, evidence } = current.presentation;
  return <article className="claim-markup" aria-label="Claim markup">
    <p className="claim-context">Illustrative PR &amp; Policy example for a fictional repair and trade-in service</p>
    <div className="claim-markup-grid">
      <div>
        <h4>Proposed claim</h4>
        <ProposedClaim brief={input.text} />
      </div>
      <div className="claim-checkpoint">
        <h4>Evidence checkpoint</h4>
        <p>{output.rationale}</p>
        <ul>
          {evidence.facts.map(fact => <li key={fact.id}>
            <p>{fact.content}</p>
            <a className="text-action" href={fact.sourceUrl} target="_blank" rel="noreferrer">{fact.title}</a>
          </li>)}
        </ul>
      </div>
    </div>
    <div className="claim-markup-grid claim-outcome">
      <div className="claim-recommendation">
        <h4>Recommendation</h4>
        <Recommendation text={output.text} />
      </div>
      <div className="claim-review">
        <h4>{governance.escalated ? <mark>Human review required</mark> : 'Human review'}</h4>
        <p>No reviewer decision is recorded in this example.</p>
        <p className="claim-context">{output.risks}</p>
      </div>
    </div>
  </article>;
}
