import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { AGENTS } from '../../lib/agents';
import { useMediaQuery } from '../../lib/useMediaQuery';
import { AGENT_COPY } from './agentCopy';
import { AgentExample } from './AgentExample';
import AgentGallery from './AgentGallery';
import PokemonHoloCard from './PokemonHoloCard';
import SpecialText from './SpecialText';

const workImages = {
  branding: ['Repair vs. replace brief', 'Positioning angle', 'Audience segments', 'Message hierarchy'],
  pr: ['Claim review', 'Evidence ledger', 'Policy markup', 'Review checklist'],
  social: ['Community brief', 'Content storyboard', 'Thread outline', 'Weekly rhythm'],
  product_marketing: ['Product comparison', 'Evidence matrix', 'Feature hierarchy', 'Product story'],
  events: ['Event agenda', 'Session tracks', 'Journey map', 'Stage plan'],
};

const CLOSE_DURATION_MS = 190;

const DOSSIER_HOLO_IMG_PROPS = {
  width: 360,
  height: 270,
  decoding: 'async',
  draggable: false,
  onError: event => { event.currentTarget.hidden = true; },
};

// Interleave roles so the presentation offers different kinds of work at its front.
const workTiles = workImages.branding.flatMap((_, index) => AGENTS.map(({ id: agent }) => {
  const id = `${agent}-${index + 1}`;
  return {
    id,
    agent,
    label: workImages[agent][index],
    image: `/assets/agent-gallery/${id}.svg`,
    rearImage: `/assets/agent-gallery/${id}-rear.svg`,
  };
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
    rearImage: tile.rearImage ? `${tile.rearImage}?retry=${attempt}` : '',
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
    const rearImages = tiles.filter(tile => tile.rearImage).map(tile => {
      const image = new Image();
      image.src = tile.rearImage;
      return image;
    });
    return () => {
      active = false;
      images.forEach(image => {
        image.onload = null;
        image.onerror = null;
      });
      rearImages.forEach(image => {
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
  const outsidePressTarget = useRef(null);
  const closeTimer = useRef(null);
  const focusFrame = useRef(null);
  const closingHistory = useRef(false);
  const lastScrollAgent = useRef(null);
  const wasOpen = useRef(false);

  const initialTile = tileFromLocation();
  const [selected, setSelected] = useState(initialTile);
  const [renderedTile, setRenderedTile] = useState(initialTile);
  const [closing, setClosing] = useState(false);
  const [featured, setFeatured] = useState(() => initialTile?.agent ?? AGENTS[0].id);

  const { tiles, near, status, retry } = useArtReadiness(gallery, staticView);
  const currentTile = selected ?? renderedTile;
  const activeTile = currentTile && tiles.find(tile => tile.id === currentTile.id);
  const activeAgent = activeTile?.agent;
  const activeCopy = activeAgent && AGENT_COPY[activeAgent];
  const agentTiles = useMemo(
    () => activeAgent ? tiles.filter(tile => tile.agent === activeAgent) : [],
    [activeAgent, tiles],
  );
  const activeTileIndex = activeTile ? agentTiles.findIndex(tile => tile.id === activeTile.id) : -1;

  const cancelFocusFrame = useCallback(() => {
    if (focusFrame.current !== null) {
      window.cancelAnimationFrame(focusFrame.current);
      focusFrame.current = null;
    }
  }, []);

  const finishClose = useCallback(() => {
    if (closeTimer.current !== null) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
    const panel = dialog.current;
    if (panel?.open) panel.close();
    closingHistory.current = false;
    wasOpen.current = false;
    lastScrollAgent.current = null;
    setClosing(false);
    setRenderedTile(null);
    if (restoreFocus.current) {
      restoreFocus.current = false;
      const origin = opener.current;
      const target = origin?.element;
      opener.current = null;
      cancelFocusFrame();
      focusFrame.current = window.requestAnimationFrame(() => {
        focusFrame.current = null;
        if (origin && window.location.href !== origin.href) return;
        if (origin) window.scrollTo({ top: origin.y, behavior: 'instant' });
        (target?.isConnected && target.getClientRects().length
          ? target : gallery.current?.querySelector(`.connected-picker [data-agent="${featured}"]`))?.focus({ preventScroll: true });
      });
    }
  }, [cancelFocusFrame, featured]);

  const closeDossier = useCallback(() => {
    if (!selected || closingHistory.current) return;
    if (window.history.state?.showcaseDossier) {
      closingHistory.current = true;
      window.history.back();
      return;
    }
    const url = new URL(window.location.href);
    url.searchParams.delete('agent');
    url.searchParams.delete('tile');
    url.hash = 'agents';
    window.history.replaceState(window.history.state, '', url);
    setSelected(null);
  }, [selected]);

  useEffect(() => cancelFocusFrame, [cancelFocusFrame]);

  useEffect(() => {
    function syncSelection() {
      closingHistory.current = false;
      const next = tileFromLocation();
      revealDirectEntry.current = Boolean(next);
      setSelected(next);
      if (next) {
        setRenderedTile(next);
        setFeatured(next.agent);
      }
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
      if (closeTimer.current !== null) {
        window.clearTimeout(closeTimer.current);
        closeTimer.current = null;
      }
      cancelFocusFrame();
      const fromDirectEntry = revealDirectEntry.current;
      if (fromDirectEntry) gallery.current.scrollIntoView();
      revealDirectEntry.current = false;
      restoreFocus.current = true;
      closingHistory.current = false;
      setClosing(false);

      const justOpening = !wasOpen.current;
      if (panel) {
        const isModalOpen = panel.open && Boolean(panel.matches?.(':modal'));
        const savedTop = panel.scrollTop;
        if (panel.open && isModalOpen !== narrow) panel.close();
        if (!panel.open) {
          if (narrow) panel.showModal();
          else panel.show();
        }
        if (justOpening || lastScrollAgent.current !== selected.agent) {
          panel.scrollTop = 0;
          lastScrollAgent.current = selected.agent;
        } else if (isModalOpen !== narrow) {
          panel.scrollTop = savedTop;
        }
        if (justOpening && !narrow && !fromDirectEntry) {
          panel.focus({ preventScroll: true });
        }
      }
      wasOpen.current = true;
      return;
    }

    if (!panel?.open) {
      closingHistory.current = false;
      wasOpen.current = false;
      lastScrollAgent.current = null;
      setClosing(false);
      setRenderedTile(null);
      return;
    }

    if (reduced) {
      finishClose();
      return;
    }

    setClosing(true);
    if (closeTimer.current !== null) window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => {
      finishClose();
    }, CLOSE_DURATION_MS + 45);

    return () => {
      if (closeTimer.current !== null) {
        window.clearTimeout(closeTimer.current);
        closeTimer.current = null;
      }
    };
  }, [cancelFocusFrame, finishClose, narrow, reduced, selected]);

  useEffect(() => {
    if (!selected) return;
    function onKeyDown(event) {
      if (event.key === 'Escape' && !event.defaultPrevented && !closing) {
        event.preventDefault();
        closeDossier();
      }
    }
    function isInsidePanelOrTrigger(target, clientX, clientY) {
      if (!(target instanceof Element)) return false;
      const panel = dialog.current;
      if (panel) {
        if (panel.contains(target) && target !== panel) return true;
        if (target === panel) {
          if (!narrow) return true;
          const rect = panel.getBoundingClientRect();
          const hasPoint = Number.isFinite(clientX) && Number.isFinite(clientY) && (clientX !== 0 || clientY !== 0);
          return hasPoint && clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom;
        }
      }
      return Boolean(target.closest(
        '.connected-sphere-tile, .connected-picker button, .connected-art-status button, #results button, #results details, a[href], summary, input',
      ));
    }
    function onPointerDown(event) {
      outsidePressTarget.current = isInsidePanelOrTrigger(event.target, event.clientX, event.clientY) ? null : event.target;
    }
    function onClick(event) {
      const pressed = outsidePressTarget.current;
      outsidePressTarget.current = null;
      if (!pressed || event.detail === 0 || isInsidePanelOrTrigger(event.target, event.clientX, event.clientY)) return;
      closeDossier();
    }
    window.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown, true);
    document.addEventListener('click', onClick);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown, true);
      document.removeEventListener('click', onClick);
      outsidePressTarget.current = null;
    };
  }, [closeDossier, closing, narrow, selected]);

  function selectTile(tile, event, { replace = false } = {}) {
    if (!tile) return;
    cancelFocusFrame();
    const url = new URL(window.location.href);
    url.searchParams.set('agent', tile.agent);
    url.searchParams.set('tile', tile.id);
    url.hash = 'dossier';
    const shouldPush = !replace && !selected;
    if (event?.currentTarget && (!selected || !dialog.current?.contains(event.currentTarget))) {
      let returnHref = opener.current?.href;
      if (!returnHref) {
        if (selected) {
          const fallback = new URL(window.location.href);
          fallback.searchParams.delete('agent');
          fallback.searchParams.delete('tile');
          fallback.hash = 'agents';
          returnHref = fallback.href;
        } else {
          returnHref = window.location.href;
        }
      }
      opener.current = {
        element: event.currentTarget,
        href: returnHref,
        y: opener.current?.y ?? window.scrollY,
      };
    }
    revealDirectEntry.current = false;
    if (shouldPush) {
      window.history.pushState({ ...window.history.state, showcaseDossier: true }, '', url);
    } else {
      window.history.replaceState(window.history.state, '', url);
    }
    setSelected(tile);
    setRenderedTile(tile);
    setFeatured(tile.agent);
  }

  function stepAgentTile(delta) {
    if (agentTiles.length < 2 || activeTileIndex < 0) return;
    const next = agentTiles[(activeTileIndex + delta + agentTiles.length) % agentTiles.length];
    selectTile(next, null, { replace: true });
  }

  return <>
    <section id="agents" ref={gallery}
      className={`connected-gallery${selected && !narrow ? ' has-open-dossier' : ''}`}
      aria-labelledby="agents-title" tabIndex={-1}>
      <div className="connected-gallery-heading">
        <h2 id="agents-title">Agent gallery</h2>
        <p>{staticView
          ? 'Choose a specialist to see their brief and recommendation.'
          : mouse
            ? 'Move your pointer or drag to turn the gallery. Choose an image to open its dossier.'
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
          aria-pressed={activeAgent === id}
          onClick={event => selectTile(tiles.find(tile => tile.agent === id), event, { replace: Boolean(selected) })}>
          {AGENT_COPY[id].name}
        </button>)}
      </div>
    </section>

    <dialog id="dossier" ref={dialog} tabIndex={-1}
      className={`connected-dossier${narrow ? ' is-modal' : ' is-panel'}`}
      data-closing={closing ? 'true' : undefined}
      aria-labelledby="dossier-title"
      onCancel={event => { event.preventDefault(); closeDossier(); }}
      onAnimationEnd={event => {
        if (event.target === dialog.current && closing) finishClose();
      }}>
      {activeTile && <div key={activeAgent} className="connected-dossier-content">
        <div className="connected-dossier-toolbar">
          <button className="text-action" type="button" onClick={closeDossier}>Close dossier</button>
          {agentTiles.length > 1 && <div className="connected-dossier-step" role="group" aria-label={`${activeCopy.name} artifacts`}>
            <button type="button" className="connected-step-btn" aria-label="Previous artifact" onClick={() => stepAgentTile(-1)}>
              <ChevronLeft size={16} aria-hidden="true" />
            </button>
            <span className="connected-step-count">{activeTileIndex + 1} / {agentTiles.length}</span>
            <button type="button" className="connected-step-btn" aria-label="Next artifact" onClick={() => stepAgentTile(1)}>
              <ChevronRight size={16} aria-hidden="true" />
            </button>
          </div>}
        </div>
        <div className="connected-dossier-body">
          <h2 id="dossier-title">{activeCopy.name}</h2>
          <figure className="connected-selected-art" data-agent={activeAgent}>
            <PokemonHoloCard
              key={activeTile.image}
              src={activeTile.image}
              label={activeTile.label}
              variant="dossier"
              interactive={!reduced}
              frontMost
              imgProps={DOSSIER_HOLO_IMG_PROPS}
            />
            <figcaption><SpecialText key={activeTile.id}>{activeTile.label}</SpecialText></figcaption>
          </figure>
          {agentTiles.length > 1 && <div className="connected-artifact-tabs" role="group" aria-label="Browse role images">
            {agentTiles.map(item => <button key={item.id} type="button"
              aria-pressed={item.id === activeTile.id}
              onClick={() => selectTile(item, null, { replace: true })}>
              {item.label}
            </button>)}
          </div>}
          <AgentExample agent={activeAgent} catalog={catalog} inDossier />
          <details className="connected-explanation">
            <summary>How it works</summary>
            <ol>{activeCopy.steps.map(step => <li key={step}>{step}</li>)}</ol>
          </details>
        </div>
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
