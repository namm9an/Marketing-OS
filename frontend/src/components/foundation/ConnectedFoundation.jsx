import { useEffect, useMemo } from 'react';
import { ArrowDown, ArrowUpRight } from 'lucide-react';
import { createExampleCatalog } from '../../lib/exampleCatalog';
import { useHomepageScroll } from '../../lib/useHomepageScroll';
import VectorWordmark from './VectorWordmark';
import ConnectedDiscovery from './ConnectedDiscovery';
import { TopDock } from './TopDock';
import { InteractiveButton } from './InteractiveButton';
import './foundation.css';
import './connected.css';

const workingName = 'Marketing Helper';
const NAV_ITEMS = [
  { href: '#agents', label: 'Agents' },
  { href: '#results', label: 'Results' },
  { href: '#how-its-built', label: 'How it’s built' },
];

function ConsoleLink({ onOpenConsole, wrapperClassName = '' }) {
  function open(event) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button) return;
    event.preventDefault();
    onOpenConsole();
  }

  return (
    <InteractiveButton
      as="a"
      href="/console"
      label="Open console"
      icon={ArrowUpRight}
      variant="primary"
      spider
      className="connected-console"
      wrapperClassName={wrapperClassName}
      onClick={open}
    />
  );
}

function SpiderExplore() {
  return (
    <InteractiveButton
      as="a"
      href="#agents"
      label="Explore the agents"
      icon={ArrowDown}
      variant="secondary"
      spider
      className="connected-explore"
    />
  );
}

export default function ConnectedFoundation({ onOpenConsole }) {
  useHomepageScroll();
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
      <TopDock items={NAV_ITEMS} ariaLabel="Showcase" />
      <ConsoleLink onOpenConsole={onOpenConsole} wrapperClassName="connected-console-wrap" />
    </header>
    <main>
      <section className="connected-opening" aria-label="Opening">
        <div className="connected-hero">
          <VectorWordmark text={workingName} />
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
