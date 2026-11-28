import { Fragment, useRef, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { AGENT_COPY } from './agentCopy';
import { AgentExample } from './AgentExample';
import { InteractiveButton } from './InteractiveButton';
import { SpecialistDropdown } from './SpecialistDropdown';
import './specialistComparison.css';

export function SpecialistComparison({ catalog, activeExplanation, explanationNode, onExplain, onPairChange }) {
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
        const labelId = 'compare-specialist-label-' + index;
        const isExplaining = Boolean(agent && activeExplanation?.agent === agent);
        return <div className="comparison-position" key={position}
          role="group" aria-label={position + ' comparison position'}>
          <div className="comparison-control">
            <label id={labelId} htmlFor={'compare-specialist-' + index}>{position} specialist</label>
            {agent && <button type="button" className="comparison-remove" aria-label={'Remove ' + name}
              onClick={() => {
                replace(index, '');
                selects.current[index]?.focus();
              }}>Remove</button>}
            <SpecialistDropdown
              id={'compare-specialist-' + index}
              labelId={labelId}
              value={agent}
              disabledId={pair[1 - index]}
              onChange={next => replace(index, next)}
              buttonRef={node => { selects.current[index] = node; }}
            />
          </div>
          {agent ? <Fragment key={agent}>
            <AgentExample agent={agent} catalog={catalog} inComparison />
            <InteractiveButton
              as="button"
              label="How it works"
              icon={ArrowRight}
              variant="explain"
              spider
              className="comparison-explain"
              wrapperClassName="comparison-explain-wrap"
              aria-expanded={isExplaining}
              aria-label={'How it works for ' + name}
              onClick={event => onExplain(agent, event.currentTarget)}
            />
            {isExplaining && explanationNode && (
              <div className="comparison-explanation-slot">{explanationNode}</div>
            )}
          </Fragment> : <p className="comparison-empty">Choose a specialist to see their brief and recommendation.</p>}
        </div>;
      })}
    </div>
    <a className="text-action comparison-return" href="#agents">Back to agents</a>
  </section>;
}
