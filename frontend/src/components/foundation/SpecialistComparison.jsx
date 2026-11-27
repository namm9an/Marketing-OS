import { Fragment, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { AGENTS } from '../../lib/agents';
import { AGENT_COPY } from './agentCopy';
import { AgentExample } from './AgentExample';
import './specialistComparison.css';

export function SpecialistComparison({ catalog, onExplain, onPairChange, children }) {
  const [pair, setPair] = useState(['branding', 'pr']);
  const selects = useRef([]);

  function replace(index, next) {
    onPairChange?.(pair[index]);
    setPair(current => current.map((agent, position) => position === index ? next : agent));
  }

  return <section id="results" className="connected-results" aria-labelledby="results-title" tabIndex={-1}>
    <header className="comparison-intro">
      <h2 id="results-title">See what each specialist recommends</h2>
      <p>Two specialists advise a fictional repair and trade-in service. Compare their different briefs and illustrative recommendations.</p>
    </header>
    <div className="comparison-pair">
      {pair.map((agent, index) => {
        const position = index === 0 ? 'First' : 'Second';
        const name = AGENT_COPY[agent]?.name;
        return <div className="comparison-position" key={position}
          role="group" aria-label={position + ' comparison position'}>
          <div className="comparison-control">
            <label htmlFor={'compare-specialist-' + index}>{position} specialist</label>
            {agent && <button type="button" className="comparison-remove" aria-label={'Remove ' + name}
              onClick={() => {
                replace(index, '');
                selects.current[index].focus();
              }}>Remove</button>}
            <div className="comparison-select-wrap">
              <select id={'compare-specialist-' + index} value={agent}
                ref={node => { selects.current[index] = node; }}
                onChange={event => replace(index, event.target.value)}>
                <option value="">Choose a specialist</option>
                {AGENTS.map(({ id }) => <option key={id} value={id} disabled={id === pair[1 - index]}>
                  {AGENT_COPY[id].name}
                </option>)}
              </select>
              <ChevronDown aria-hidden="true" size={20} />
            </div>
          </div>
          {agent ? <Fragment key={agent}>
            <AgentExample agent={agent} catalog={catalog} inComparison />
            <button type="button" className="comparison-explain" aria-label={'How it works for ' + name}
              onClick={event => onExplain(agent, event.currentTarget)}>How it works</button>
          </Fragment> : <p className="comparison-empty">Choose a specialist to see their brief and recommendation.</p>}
        </div>;
      })}
    </div>
    {children}
    <a className="text-action comparison-return" href="#agents">Back to agents</a>
  </section>;
}
