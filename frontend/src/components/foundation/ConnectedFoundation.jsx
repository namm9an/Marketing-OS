import { Fragment, useEffect, useMemo, useRef } from 'react';
import { ArrowDown, ArrowUpRight } from 'lucide-react';
import { createExampleCatalog } from '../../lib/exampleCatalog';
import { useMediaQuery } from '../../lib/useMediaQuery';
import ConnectedDiscovery from './ConnectedDiscovery';
import './foundation.css';
import './connected.css';

const workingName = 'Marketing Helper';

function clearGuides(heading) {
  heading?.querySelectorAll('[data-guide]').forEach(letter => letter.removeAttribute('data-guide'));
}

function VectorIdentity() {
  const heading = useRef(null);
  const reduced = useMediaQuery('(prefers-reduced-motion: reduce)');

  useEffect(() => {
    if (reduced) clearGuides(heading.current);
  }, [reduced]);

  function showGuides(event) {
    if (event.pointerType !== 'mouse' || reduced) return;
    const node = event.currentTarget;
    const bounds = node.getBoundingClientRect();
    const glyphs = Array.from(node.querySelectorAll('[data-letter]'), letter => ({
      letter,
      rect: letter.getBoundingClientRect(),
    }));
    for (const { letter, rect } of glyphs) {
      const near = event.clientY >= rect.top && event.clientY <= rect.bottom
        && Math.abs(event.clientX - rect.left - rect.width / 2) < rect.width * .85;
      if (near) {
        const x = Math.round(rect.left - bounds.left);
        const y = Math.round(rect.top - bounds.top);
        letter.setAttribute('data-guide', `${x} / ${y}`);
      } else {
        letter.removeAttribute('data-guide');
      }
    }
  }

  return <h1 ref={heading} className="connected-identity" aria-label={workingName}
    onPointerMove={showGuides}
    onPointerLeave={() => clearGuides(heading.current)}
    onPointerCancel={() => clearGuides(heading.current)}>
    {workingName.split(' ').map((word, wordIndex) => <Fragment key={word}>
      {wordIndex > 0 && ' '}
      <span className="connected-word" aria-hidden="true">
        {Array.from(word, (letter, index) => <span key={index} data-letter={letter}>{letter}</span>)}
      </span>
    </Fragment>)}
  </h1>;
}

function ConsoleLink({ onOpenConsole }) {
  function open(event) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button) return;
    event.preventDefault();
    onOpenConsole();
  }

  return <a className="connected-action connected-console" href="/console" onClick={open}>
    Open console <ArrowUpRight size={16} aria-hidden="true" />
  </a>;
}

function SpiderExplore() {
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
    <a ref={anchor} className="connected-action connected-explore" href="#agents">
      Explore the agents <ArrowDown size={18} aria-hidden="true" />
    </a>
  </div>;
}

export default function ConnectedFoundation({ onOpenConsole }) {
  const catalog = useMemo(() => createExampleCatalog(), []);
  useEffect(() => {
    const id = window.location.hash.slice(1);
    if (!['top', 'introduction', 'agents', 'results', 'how-its-built'].includes(id)) return;
    const frame = requestAnimationFrame(() => {
      if (!document.querySelector('.connected-dossier[open]')) document.getElementById(id)?.scrollIntoView();
    });
    return () => cancelAnimationFrame(frame);
  }, []);
  return <div className="marketing-page connected-page with-grain" data-treatment="type" id="top">
    <header className="connected-header">
      <a className="connected-brand" href="#top">{workingName}</a>
      <nav aria-label="Showcase">
        <a href="#agents">Agents</a>
        <a href="#results">Results</a>
        <a href="#how-its-built">How it’s built</a>
      </nav>
      <ConsoleLink onOpenConsole={onOpenConsole} />
    </header>
    <main>
      <section className="connected-opening" aria-label="Opening">
        <div className="connected-hero">
          <VectorIdentity />
          <div className="connected-pitch">
            <p>Bring a brief. See five specialist perspectives.</p>
            <div className="connected-actions">
              <ConsoleLink onOpenConsole={onOpenConsole} />
              <SpiderExplore />
            </div>
          </div>
          <figure className="connected-hero-brief">
            <figcaption>Example brief</figcaption>
            <p>How should we position a new launch?</p>
            <p>Audience, competitor evidence and launch goals</p>
          </figure>
        </div>
      </section>
      <section id="introduction" className="connected-introduction" aria-labelledby="introduction-title">
        <div>
          <h2 id="introduction-title">Follow the recommendation back to the evidence</h2>
          <p>Each specialist makes a different decision about the launch. Open a dossier to see what influenced it.</p>
        </div>
        <figure className="connected-brief-path">
          <figcaption>What you can inspect</figcaption>
          <ol><li>Brief</li><li>Evidence</li><li>Recommendation</li></ol>
        </figure>
      </section>
      <ConnectedDiscovery catalog={catalog} />
      <section id="how-its-built" tabIndex={-1} className="connected-engineering" aria-labelledby="connected-engineering-title">
        <h2 id="connected-engineering-title">How it’s built</h2>
        <dl>
          <div><dt>Shared sources</dt><dd>Each specialist retrieves source-linked context for the brief. You can inspect that context alongside the recommendation.</dd></div>
          <div><dt>Separate specialist contexts</dt><dd>A single run uses one specialist. Triage combines two, and a digest brings together all five. Chat keeps each specialist’s permitted context.</dd></div>
          <div><dt>Human review</dt><dd>A risk flag can send a recommendation for review. That decision and admission to memory are separate steps.</dd></div>
        </dl>
        <a className="text-action" href="https://github.com/namm9an/Marketing-OS" rel="noreferrer" target="_blank">
          View the code <ArrowUpRight size={16} aria-hidden="true" />
        </a>
      </section>
    </main>
    <footer className="connected-footer">
      <div>
        <p>Bring a brief</p>
        <ConsoleLink onOpenConsole={onOpenConsole} />
      </div>
      <a href="#top">Back to top</a>
    </footer>
  </div>;
}
