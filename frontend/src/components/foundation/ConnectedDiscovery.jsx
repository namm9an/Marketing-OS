import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { AGENTS } from '../../lib/agents';
import { useMediaQuery } from '../../lib/useMediaQuery';
import { AGENT_COPY } from './agentCopy';
import { AgentExample } from './AgentExample';
import AgentGallery from './AgentGallery';

const workImages = {
  branding: ['Positioning map', 'Brand system', 'Audience segments', 'Message hierarchy', 'Brand applications'],
  pr: ['Claim review', 'Evidence ledger', 'Policy markup', 'Review checklist', 'Decision tree'],
  social: ['Community brief', 'Content storyboard', 'Thread outline', 'Weekly rhythm', 'Response map'],
  product_marketing: ['Product comparison', 'Evidence matrix', 'Feature hierarchy', 'Product story', 'Offer structure'],
  events: ['Event agenda', 'Session tracks', 'Journey map', 'Stage plan', 'Program grid'],
};

// Interleave roles so the presentation offers different kinds of work at its front.
const workTiles = workImages.branding.flatMap((_, index) => AGENTS.map(({ id: agent }) => {
  const id = `${agent}-${index + 1}`;
  return { id, agent, label: workImages[agent][index], image: `/assets/agent-gallery/${id}.webp` };
}));

function tileFromLocation() {
  const { hash, search } = window.location;
  if (hash && !['#dossier', '#agents'].includes(hash)) return null;
  const params = new URLSearchParams(search);
  const agent = params.get('agent');
  const id = params.get('tile');
  return workTiles.find(tile => tile.agent === agent && tile.id === id)
    ?? workTiles.find(tile => tile.agent === agent)
    ?? null;
}

function useArtReadiness(section, staticView) {
  const [near, setNear] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [status, setStatus] = useState('pending');
  const tiles = useMemo(() => attempt ? workTiles.map(tile => ({
    ...tile,
    image: `${tile.image}?retry=${attempt}`,
  })) : workTiles, [attempt]);

  useEffect(() => {
    if (staticView || near) return;
    if (!window.IntersectionObserver) {
      setNear(true);
      return;
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setNear(true);
        observer.disconnect();
      }
    }, { rootMargin: '220px' });
    observer.observe(section.current);
    return () => observer.disconnect();
  }, [near, section, staticView]);

  useEffect(() => {
    if (!near || staticView) return;
    let active = true;
    let remaining = tiles.length;
    let failed = false;
    setStatus('pending');

    function settle(loaded) {
      if (!active) return;
      remaining -= 1;
      failed ||= !loaded;
      if (!remaining) setStatus(failed ? 'unavailable' : 'ready');
    }

    const images = tiles.map(tile => {
      const image = new Image();
      image.onload = () => settle(true);
      image.onerror = () => settle(false);
      image.src = tile.image;
      return image;
    });
    return () => {
      active = false;
      images.forEach(image => {
        image.onload = null;
        image.onerror = null;
      });
    };
  }, [near, staticView, tiles]);

  return { tiles, near, status, retry: () => setAttempt(previous => previous + 1) };
}

export default function ConnectedDiscovery({ catalog }) {
  const narrow = useMediaQuery('(max-width: 860px)');
  const reduced = useMediaQuery('(prefers-reduced-motion: reduce)');
  const mouse = useMediaQuery('(hover: hover) and (pointer: fine)');
  const staticView = narrow || reduced;
  const gallery = useRef(null);
  const dialog = useRef(null);
  const opener = useRef(null);
  const restoreFocus = useRef(false);
  const revealDirectEntry = useRef(true);
  const [selected, setSelected] = useState(tileFromLocation);
  const [featured, setFeatured] = useState(() => tileFromLocation()?.agent ?? AGENTS[0].id);
  const { tiles, near, status, retry } = useArtReadiness(gallery, staticView);
  const activeTile = selected && tiles.find(tile => tile.id === selected.id);
  const activeAgent = activeTile?.agent;
  const activeCopy = activeAgent && AGENT_COPY[activeAgent];

  useEffect(() => {
    function syncSelection() {
      const next = tileFromLocation();
      revealDirectEntry.current = Boolean(next);
      setSelected(next);
      if (next) setFeatured(next.agent);
    }
    window.addEventListener('popstate', syncSelection);
    window.addEventListener('hashchange', syncSelection);
    return () => {
      window.removeEventListener('popstate', syncSelection);
      window.removeEventListener('hashchange', syncSelection);
    };
  }, []);

  useLayoutEffect(() => {
    const panel = dialog.current;
    if (selected) {
      if (revealDirectEntry.current) gallery.current.scrollIntoView();
      revealDirectEntry.current = false;
      restoreFocus.current = true;
      if (!panel.open) panel.showModal();
      return;
    }
    if (panel.open) panel.close();
    if (restoreFocus.current) {
      restoreFocus.current = false;
      const origin = opener.current;
      const target = origin?.element;
      opener.current = null;
      // A runtime motion or viewport change may have removed the original tile.
      const frame = requestAnimationFrame(() => {
        if (origin && window.location.href !== origin.href) return;
        if (origin) window.scrollTo({ top: origin.y, behavior: 'instant' });
        (target?.isConnected && target.getClientRects().length
          ? target : gallery.current?.querySelector(`.connected-picker [data-agent="${featured}"]`))?.focus({ preventScroll: true });
      });
      return () => cancelAnimationFrame(frame);
    }
  }, [featured, selected]);

  function selectTile(tile, event) {
    const url = new URL(window.location.href);
    url.searchParams.set('agent', tile.agent);
    url.searchParams.set('tile', tile.id);
    url.hash = 'dossier';
    opener.current = { element: event.currentTarget, href: window.location.href, y: window.scrollY };
    revealDirectEntry.current = false;
    window.history.pushState({ ...window.history.state, showcaseDossier: true }, '', url);
    setSelected(tile);
    setFeatured(tile.agent);
  }

  function closeDossier() {
    if (window.history.state?.showcaseDossier) {
      window.history.back();
      return;
    }
    const url = new URL(window.location.href);
    url.searchParams.delete('agent');
    url.searchParams.delete('tile');
    url.hash = 'agents';
    window.history.replaceState(window.history.state, '', url);
    setSelected(null);
  }

  return <>
    <section id="agents" ref={gallery} className="connected-gallery" aria-labelledby="agents-title" tabIndex={-1}>
      <div className="connected-gallery-heading">
        <h2 id="agents-title">Agent gallery</h2>
        <p>{staticView
          ? 'Choose a specialist to see their brief and recommendation.'
          : mouse
            ? 'Move your pointer to turn the gallery. Choose an image to open its dossier.'
            : 'Swipe to turn the gallery. Choose an image to open its dossier.'}</p>
      </div>
      {!staticView && <div className="connected-gallery-stage">
        <AgentGallery tiles={tiles} selectedId={activeTile?.id ?? null} onSelect={selectTile}
          reduced={reduced} hidden={!near} />
        {near && status === 'pending' && <p className="connected-art-status" role="status">
          <span className="connected-pixels" aria-hidden="true" />Loading agent artwork…
        </p>}
        {near && status === 'unavailable' && <div className="connected-art-status">
          <span role="status">Artwork unavailable.</span>{' '}
          <button className="text-action" type="button" onClick={retry}>Retry artwork</button>
        </div>}
      </div>}
      <div className="connected-picker" role="group" aria-label="Choose a specialist">
        {AGENTS.map(({ id }) => <button key={id} type="button" data-agent={id}
          aria-pressed={activeAgent === id} onClick={event => selectTile(tiles.find(tile => tile.agent === id), event)}>
          {AGENT_COPY[id].name}
        </button>)}
      </div>
    </section>

    <dialog id="dossier" ref={dialog} className="connected-dossier" aria-labelledby="dossier-title"
      onCancel={event => { event.preventDefault(); closeDossier(); }}>
      {activeTile && <div key={activeTile.id} className="connected-dossier-content">
        <div className="connected-dossier-toolbar">
          <button className="text-action" type="button" onClick={closeDossier}>Close dossier</button>
        </div>
        <h2 id="dossier-title">{activeCopy.name}</h2>
        <figure className="connected-selected-art">
          <img key={activeTile.image} src={activeTile.image} alt="" width="360" height="260" decoding="async"
            onError={event => { event.currentTarget.hidden = true; }} />
          <figcaption>{activeTile.label}</figcaption>
        </figure>
        <AgentExample agent={activeAgent} catalog={catalog} inDossier />
        <details className="connected-explanation">
          <summary>How it works</summary>
          <ol>{activeCopy.steps.map(step => <li key={step}>{step}</li>)}</ol>
        </details>
      </div>}
    </dialog>

    <section id="results" className="connected-results" aria-labelledby="results-title" tabIndex={-1}>
      <div className="connected-results-lead">
        <h2 id="results-title">See what each specialist recommends</h2>
        <p>Explore an illustrative recommendation, its brief and supporting sources.</p>
        <a className="text-action" href="#agents">Back to agents</a>
      </div>
      <AgentExample agent={featured} catalog={catalog} />
    </section>
  </>;
}
