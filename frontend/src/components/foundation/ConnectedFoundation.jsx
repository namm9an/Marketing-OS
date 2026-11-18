import { useMemo, useRef, useState } from 'react';
import { ArrowDown, ArrowUpRight } from 'lucide-react';
import { createExampleCatalog } from '../../lib/exampleCatalog';
import { AGENT_COPY } from './agentCopy';
import ConnectedDiscovery from './ConnectedDiscovery';
import './foundation.css';
import './connected.css';

const artRoot = '/showcase/phase-3';

function VectorIdentity() {
  return <div className="connected-identity" onPointerMove={event => {
    if (event.pointerType !== 'mouse') return;
    const { left, top, width, height } = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty('--tilt-x', `${(0.5 - (event.clientY - top) / height) * 9}deg`);
    event.currentTarget.style.setProperty('--tilt-y', `${((event.clientX - left) / width - 0.5) * 10}deg`);
  }} onPointerLeave={event => {
    event.currentTarget.style.removeProperty('--tilt-x');
    event.currentTarget.style.removeProperty('--tilt-y');
  }}>
    <h1><span>Marketing OS</span></h1>
    <p>Five marketing specialists take one launch brief and turn it into recommendations you can inspect.</p>
  </div>;
}

function SpiderExplore({ onClick }) {
  const canvas = useRef(null);
  const anchor = useRef(null);

  function draw(event) {
    const layer = canvas.current;
    const context = layer.getContext('2d');
    if (!context) return;
    const bounds = layer.getBoundingClientRect();
    const scale = Math.min(2, window.devicePixelRatio || 1);
    const width = Math.round(bounds.width * scale);
    const height = Math.round(bounds.height * scale);
    if (layer.width !== width || layer.height !== height) {
      layer.width = width;
      layer.height = height;
    }
    context.setTransform(scale, 0, 0, scale, 0, 0);
    context.clearRect(0, 0, bounds.width, bounds.height);
    if (!event || event.pointerType !== 'mouse' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const button = anchor.current.getBoundingClientRect();
    const x = event.clientX - bounds.left;
    const y = event.clientY - bounds.top;
    const edge = (event.clientX > button.left + button.width / 2 ? button.right : button.left) - bounds.left;
    const middle = button.top + button.height / 2 - bounds.top;
    const attachment = edge + (x < edge ? -7 : 7);
    context.strokeStyle = getComputedStyle(anchor.current).color;
    context.globalAlpha = 0.48;
    context.lineWidth = 0.8;
    context.beginPath();
    for (let offset = -18; offset <= 18; offset += 9) {
      context.moveTo(edge, middle + offset);
      context.quadraticCurveTo(attachment, (middle + offset + y) / 2, x, y);
    }
    for (const fraction of [0.24, 0.42, 0.66]) {
      const webX = edge + (x - edge) * fraction;
      const webY = middle + (y - middle) * fraction;
      const span = 18 * (1 - fraction);
      context.moveTo(webX, webY - span);
      context.quadraticCurveTo(webX + (edge - x) * 0.12, webY, webX, webY + span);
    }
    context.stroke();
  }

  return <div className="connected-spider" onPointerMove={draw} onPointerLeave={() => draw()}>
    <canvas ref={canvas} aria-hidden="true" />
    <a ref={anchor} className="connected-explore" href="#f03-agents" onClick={onClick}>
      Explore the agents <ArrowDown size={18} aria-hidden="true" />
    </a>
  </div>;
}

function SurfaceArt({ treatment }) {
  const [state, setState] = useState('pending');
  const [attempt, setAttempt] = useState(0);
  const imagePath = `${artRoot}/${treatment === 'plain' ? 'instrument-plain' : 'instrument-dither'}.webp`;
  return <>
    <div className="connected-surface" data-art-state={state}>
      <img key={attempt} src={attempt ? `${imagePath}?retry=${attempt}` : imagePath} width="1440" height="960" alt=""
        onLoad={() => setState('ready')} onError={() => setState('unavailable')} />
    </div>
    {state === 'pending' && <span role="status" className="connected-art-status">
      <span className="connected-pixels" aria-hidden="true" /> Loading artwork…
    </span>}
    {state === 'unavailable' && <div className="connected-art-status">
      <span role="status">Artwork unavailable.</span>{' '}
      <button className="f03-text-button" type="button" onClick={() => {
        setState('pending');
        setAttempt(previous => previous + 1);
      }}>Retry artwork</button>
    </div>}
  </>;
}

function Artifact({ agent }) {
  const [failed, setFailed] = useState(false);
  const { name } = AGENT_COPY[agent];
  return <div className="connected-artifact">
    <div className="connected-artifact-image">
      {!failed && <img src={`${artRoot}/${agent}.webp`} alt="" width="420" height="320" decoding="async"
        onError={() => setFailed(true)} />}
    </div>
    <strong>{name}</strong>
  </div>;
}

export default function ConnectedFoundation({ onOpenConsole }) {
  const [treatment] = useState(() => {
    const requested = new URLSearchParams(window.location.search).get('treatment');
    return requested === 'focal' || requested === 'plain' ? requested : 'field';
  });
  const catalog = useMemo(() => createExampleCatalog({ basePath: '/examples/f03-reviewed' }), []);
  return <div className={`f03-page connected-page${treatment === 'plain' ? '' : ' with-grain'}`} data-treatment={treatment}>
    <header className="connected-header">
      <a className="connected-brand" href="#f03-top">Marketing OS</a>
      <nav aria-label="Showcase">
        <a href="#f03-agents">Agents</a>
        <a href="#f03-engineering">How it’s built</a>
      </nav>
      <button type="button" className="f03-text-button" onClick={onOpenConsole}>
        Open console <ArrowUpRight size={16} aria-hidden="true" />
      </button>
    </header>
    <main id="f03-top">
      <ConnectedDiscovery backdrop={<SurfaceArt treatment={treatment} />} heading={<VectorIdentity />}
        explore={onClick => <SpiderExplore onClick={onClick} />} catalog={catalog}
        renderArtifact={agent => <Artifact key={agent} agent={agent} />} />
      <section id="f03-engineering" className="connected-engineering" aria-labelledby="connected-engineering-title">
        <h2 id="connected-engineering-title">How it’s built</h2>
        <dl>
          <div><dt>Shared sources</dt><dd>Each specialist retrieves source-linked context for the brief. You can inspect that context alongside the recommendation.</dd></div>
          <div><dt>Separate specialist contexts</dt><dd>A single run uses one specialist. Triage combines two, and a digest brings together all five. Chat keeps each specialist’s permitted context.</dd></div>
          <div><dt>Human review</dt><dd>A risk flag can send a recommendation for review. That decision and admission to memory are separate steps.</dd></div>
        </dl>
        <a className="f03-text-button" href="https://github.com/namm9an/Marketing-OS" rel="noreferrer" target="_blank">
          View the code <ArrowUpRight size={16} aria-hidden="true" />
        </a>
      </section>
    </main>
    <footer className="connected-footer">
      <a className="connected-brand" href="#f03-top">Marketing OS</a>
      <a href="#f03-top">Back to top</a>
    </footer>
  </div>;
}
