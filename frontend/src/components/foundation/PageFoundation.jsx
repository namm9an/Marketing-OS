import React, { useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowRight, ArrowUpRight } from 'lucide-react';
import { AGENTS } from '../../lib/agents';
import { createExampleCatalog } from '../../lib/exampleCatalog';
import { AGENT_COPY } from './agentCopy';
import AgentAssembly from './AgentAssembly';
import './foundation.css';

export function FoundationHeader({ onOpenConsole }) {
  return <header className="f03-header"><a className="f03-wordmark" href="#f03-top">Marketing OS</a>
    <nav aria-label="Showcase"><a href="#f03-agents">The specialists</a><a href="#f03-engineering">How it’s built</a></nav>
    <button className="f03-text-button" onClick={onOpenConsole}>Open console <ArrowUpRight size={16} /></button>
  </header>;
}

export function DossierCover({ compact = false }) {
  return <div className={`f03-cover-scene ${compact ? 'is-compact' : ''}`} aria-hidden="true">
    <div className="f03-back-sheet sheet-one" /><div className="f03-back-sheet sheet-two" />
    <div className="f03-cover"><div className="f03-tab">The launch brief</div>
      <p className="f03-cover-client">Vanguard Cloud</p><strong>B200<br />launch</strong>
      <div className="f03-cover-rule" /><p>A direction for the next conversation</p>
      <div className="f03-cover-footer"><span>Five specialist perspectives</span><ArrowRight size={24} /></div>
    </div>
  </div>;
}

export function AgentExample({ agent, catalog }) {
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
  return <article className="f03-example" aria-label={`${copy.name} example`}>
    <div className="f03-example-heading"><h3>{copy.name}</h3><span>Example</span></div>
    <p className="f03-purpose">{copy.purpose}</p>
    <div className="f03-brief"><h4>The brief</h4><p>{copy.brief}</p><small>Fictional launch for Vanguard Cloud</small></div>
    {!current && <p role="status" className="f03-result-state">Loading example…</p>}
    {current?.state === 'unavailable' && <div role="alert" className="f03-result-state"><p>This example couldn’t load.</p>
      <button className="f03-text-button" onClick={() => { setExample(null); setRetry(value => value + 1); }}>Try again <ArrowRight size={15} /></button>
    </div>}
    {view && <>
      <div className="f03-result"><h4>{copy.deliverable}</h4><p>{view.output.text}</p></div>
      {view.governance.escalated === true && <p className="f03-review-state">Flagged for human review</p>}
      {view.output.risks && <div className="f03-risks"><h4>Considerations</h4><p>{view.output.risks}</p></div>}
      <details className="f03-support"><summary>Sources and rationale</summary>
        <p>{view.output.rationale}</p><ul>{view.evidence.facts.map(fact => <li key={fact.id}>
          <p>{fact.content}</p>{fact.sourceUrl && <a href={fact.sourceUrl} target="_blank" rel="noreferrer">{new URL(fact.sourceUrl).hostname} <ArrowUpRight size={13} /></a>}
        </li>)}</ul>
      </details>
    </>}
  </article>;
}

export default function PageFoundation({ onOpenConsole }) {
  const [agent, setAgent] = useState('pr');
  const [grain, setGrain] = useState(() => new URLSearchParams(window.location.search).get('surface') !== 'plain');
  const catalog = useMemo(() => createExampleCatalog({ basePath: '/examples/f03-reviewed' }), []);
  const frame = new URLSearchParams(window.location.search).get('frame');
  const pose = frame === 'anticipation' ? 1 : frame === 'exploration' ? 2 : 0;
  const preview = window.location.pathname.startsWith('/preview/');
  return <div className={`f03-page ${grain ? 'with-grain' : ''}`}>
    {preview && <aside className="f03-review-tools" aria-label="Design review controls"><span>Composition review</span>
      <button onClick={() => setGrain(value => !value)} aria-pressed={grain}>Subtle grain {grain ? 'on' : 'off'}</button>
      <a href="/preview/f03/motion">Open motion study <ArrowUpRight size={13} /></a>
    </aside>}
    <div className="f03-inner"><FoundationHeader onOpenConsole={onOpenConsole} />
      <main id="f03-top">
        {frame === 'exploration' ? <section className="f03-expanded-frame" aria-label="Expanded agent composition">
          <div className="f03-expanded-intro"><span>PR & Policy</span><h1>Consider the message<br />before the launch</h1><p>{AGENT_COPY.pr.brief}</p>
            <a className="f03-text-button" href="#f03-agents">Explore the agents <ArrowDown size={17} /></a></div>
          <AgentAssembly pose={2} focused /><AgentExample agent="pr" catalog={catalog} />
        </section> : <section className={`f03-hero pose-${pose}`} aria-labelledby="f03-heading"><div className="f03-hero-copy">
          <h1 id="f03-heading">One brief<br /><span>Five marketing specialists</span></h1>
          <p>Explore a launch through five different perspectives.<br className="f03-desktop-break" /> Read the recommendations. Inspect what supports them.</p>
          <a className="f03-button" href="#f03-agents">Explore the agents <ArrowDown size={17} /></a>
        </div><AgentAssembly pose={pose} />
        <div className="f03-hero-caption"><span>One shared launch brief</span><span>Five distinct jobs</span></div></section>}
        <section id="f03-agents" className="f03-agents" aria-labelledby="f03-agents-heading">
          <div className="f03-section-heading"><h2 id="f03-agents-heading">Choose by the work<br />you need to do</h2>
            <p>One launch brief, five different jobs. Explore a specialist’s recommendation.</p></div>
          <div className="f03-agent-layout"><div className="f03-agent-index" role="group" aria-label="Choose a specialist">
            {AGENTS.map(({ id, Icon }) => <button key={id} aria-pressed={agent === id} onClick={() => setAgent(id)}>
              <Icon size={20} strokeWidth={2} /><span><strong>{AGENT_COPY[id].name}</strong><small>{AGENT_COPY[id].action}</small></span><ArrowRight size={17} />
            </button>)}
          </div><AgentExample agent={agent} catalog={catalog} /></div>
        </section>
        <section id="f03-engineering" className="f03-engineering" aria-labelledby="f03-engineering-heading">
          <div className="f03-section-heading"><h2 id="f03-engineering-heading">How it’s built</h2><p>A shared foundation, with different jobs and distinct conversation scopes.</p></div>
          <div className="f03-engineering-grid"><div><h3>A shared source corpus</h3><p>Specialists retrieve source-linked context for the brief. Recommendations retain their supporting references.</p></div>
            <div><h3>Workflows that fit the task</h3><p>A run uses one specialist. Triage combines two perspectives. A digest brings together all five and a synthesis.</p></div>
            <div><h3>Memory and human review</h3><p>Chat keeps each specialist’s permitted context. Risk flags, human review and memory admission are separate steps.</p></div>
          </div><a className="f03-text-button" href="https://github.com/namm9an/Marketing-OS" target="_blank" rel="noreferrer">Explore the implementation <ArrowUpRight size={16} /></a>
        </section>
        <section className="f03-console-entry"><div><h2>Start with your brief</h2><p>Choose a specialist and explore the working console.</p></div>
          <button className="f03-button" onClick={onOpenConsole}>Open console <ArrowUpRight size={17} /></button>
        </section>
      </main><footer className="f03-footer"><span>Marketing OS</span><a href="#f03-top">Back to the beginning ↑</a></footer>
    </div>
  </div>;
}
