import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useMotionValueEvent, useTransform } from 'framer-motion';
import { AGENTS } from '../../lib/agents';
import { useMediaQuery } from '../../lib/useMediaQuery';
import { AGENT_COPY } from './agentCopy';
import { AgentExample } from './AgentExample';
import { agentForProgress, cardPose, clampProgress, expansionFor, GALLERY_START, progressForAgent } from './discoveryGeometry';

const indexFromLocation = () => AGENTS.findIndex(({ id }) => id === new URLSearchParams(window.location.search).get('agent'));
const normalClick = event => !event || (!event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey && !event.button);

function SpatialCard({ index, progress, width, selectedIndex, selected, renderArtifact, onSelect }) {
  const pose = useTransform(() => cardPose(index, progress.get(), width.get(), selectedIndex.get()));
  const x = useTransform(pose, value => value.x);
  const y = useTransform(pose, value => value.y);
  const scale = useTransform(pose, value => value.scale);
  const rotateY = useTransform(pose, value => value.yaw);
  const opacity = useTransform(pose, value => value.opacity);
  const zIndex = useTransform(pose, value => value.zIndex);
  const { id } = AGENTS[index];
  return <motion.div className={`connected-card ${selected ? 'is-selected' : ''}`} style={{ x, y, scale, rotateY, opacity, zIndex }} data-agent={id}>
    <div aria-hidden="true">{renderArtifact(id)}</div>
    <button type="button" tabIndex={-1} className="connected-card-select" aria-label={`Explore ${AGENT_COPY[id].name}`}
      onClick={() => onSelect(index)} />
  </motion.div>;
}

export default function ConnectedDiscovery({ heading, explore, catalog, renderArtifact, backdrop }) {
  const reduced = useMediaQuery('(prefers-reduced-motion: reduce)');
  const narrow = useMediaQuery('(max-width: 900px)');
  const staticView = Boolean(reduced || narrow);
  const track = useRef(null);
  const stage = useRef(null);
  const picker = useRef(null);
  const fullResult = useRef(null);
  const focusFrame = useRef(0);
  const initialIndex = Math.max(0, indexFromLocation());
  const [selected, setSelected] = useState(initialIndex);
  const selectedRef = useRef(initialIndex);
  const selectedIndex = useMotionValue(initialIndex);
  const progress = useMotionValue(0);
  const width = useMotionValue(1100);
  const expand = useTransform(progress, expansionFor);
  const introOpacity = useTransform(progress, [.08, .18], [1, 0]);
  const introY = useTransform(progress, [0, .18], [0, -90]);
  const [phase, setPhase] = useState('arrival');
  const [introHidden, setIntroHidden] = useState(false);
  const copy = AGENT_COPY[AGENTS[selected].id];

  const setAgent = useCallback(index => {
    selectedRef.current = index;
    selectedIndex.set(index);
    setSelected(index);
  }, [selectedIndex]);

  const writeLocation = useCallback((index, mode = 'replace', hash) => {
    const url = new URL(window.location.href);
    url.searchParams.set('agent', AGENTS[index].id);
    if (hash !== undefined) url.hash = hash;
    if (`${url.pathname}${url.search}${url.hash}` !== `${window.location.pathname}${window.location.search}${window.location.hash}`) {
      window.history[mode === 'push' ? 'pushState' : 'replaceState'](window.history.state, '', `${url.pathname}${url.search}${url.hash}`);
    }
  }, []);

  useMotionValueEvent(progress, 'change', value => {
    if (staticView) return;
    const index = agentForProgress(value, selectedRef.current);
    if (index !== selectedRef.current) {
      setAgent(index);
      if (value >= GALLERY_START) writeLocation(index);
    }
    const nextPhase = value >= .76 ? 'expanded' : value >= .17 ? 'exploring' : 'arrival';
    setPhase(previous => previous === nextPhase ? previous : nextPhase);
    setIntroHidden(value >= .18);
  });

  const focusChoice = useCallback(index => {
    cancelAnimationFrame(focusFrame.current);
    focusFrame.current = requestAnimationFrame(() => {
      picker.current?.querySelector(`[data-agent="${AGENTS[index].id}"]`)?.focus({ preventScroll: true });
    });
  }, []);

  const moveToAgent = useCallback((index, { historyMode = 'push', focus = true } = {}) => {
    setAgent(index);
    writeLocation(index, historyMode, 'f03-agents');
    if (staticView) {
      picker.current?.scrollIntoView({ block: 'start', behavior: 'instant' });
    } else if (track.current) {
      const value = progressForAgent(index);
      progress.set(value);
      const top = track.current.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top: top + value * Math.max(1, track.current.offsetHeight - window.innerHeight), behavior: 'instant' });
    }
    if (focus) focusChoice(index);
  }, [focusChoice, progress, setAgent, staticView, writeLocation]);

  const readFull = useCallback(event => {
    if (!normalClick(event)) return;
    event?.preventDefault();
    writeLocation(selectedRef.current, 'push', 'f03-full-result');
    fullResult.current?.scrollIntoView({ block: 'start', behavior: 'instant' });
    fullResult.current?.focus({ preventScroll: true });
  }, [writeLocation]);

  const onExplore = event => {
    if (!normalClick(event)) return;
    event?.preventDefault();
    moveToAgent(selectedRef.current);
  };

  useEffect(() => {
    let frame = 0;
    let disposed = false;
    const measure = () => {
      frame = 0;
      if (document.hidden || !track.current) return;
      width.set(stage.current?.clientWidth || window.innerWidth);
      if (staticView) return;
      const value = clampProgress(-track.current.getBoundingClientRect().top / Math.max(1, track.current.offsetHeight - window.innerHeight));
      track.current.dataset.progress = value.toFixed(4);
      progress.set(value);
    };
    const schedule = () => { if (!disposed && !frame) frame = requestAnimationFrame(measure); };
    const resize = () => {
      if (!staticView && track.current) {
        const rect = track.current.getBoundingClientRect();
        if (rect.top <= 0 && rect.bottom >= window.innerHeight) {
          const top = rect.top + window.scrollY;
          window.scrollTo({ top: top + progress.get() * Math.max(1, track.current.offsetHeight - window.innerHeight), behavior: 'instant' });
        }
      }
      schedule();
    };
    const restore = () => {
      const index = indexFromLocation();
      const { hash } = window.location;
      if (index >= 0) setAgent(index);
      if (hash === '#f03-full-result') {
        fullResult.current?.scrollIntoView({ block: 'start', behavior: 'instant' });
      } else if (hash === '#f03-agents' || (!hash && index >= 0)) {
        moveToAgent(Math.max(0, index), { historyMode: 'replace', focus: false });
      } else {
        schedule();
      }
    };
    const interrupt = () => cancelAnimationFrame(focusFrame.current);
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', resize);
    window.addEventListener('popstate', restore);
    window.addEventListener('hashchange', restore);
    window.addEventListener('wheel', interrupt, { passive: true });
    window.addEventListener('touchstart', interrupt, { passive: true });
    document.addEventListener('visibilitychange', schedule);
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(schedule);
    if (track.current) observer?.observe(track.current);
    if (stage.current) observer?.observe(stage.current);
    document.fonts?.ready.then(schedule);
    restore();
    schedule();
    return () => {
      disposed = true;
      observer?.disconnect();
      cancelAnimationFrame(frame);
      cancelAnimationFrame(focusFrame.current);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', resize);
      window.removeEventListener('popstate', restore);
      window.removeEventListener('hashchange', restore);
      window.removeEventListener('wheel', interrupt);
      window.removeEventListener('touchstart', interrupt);
      document.removeEventListener('visibilitychange', schedule);
    };
  }, [moveToAgent, progress, setAgent, staticView, width]);

  const exploring = staticView || phase !== 'arrival';
  const hideIntro = !staticView && introHidden;
  return <>
    <motion.section ref={track} className={`connected-track ${staticView ? 'connected-static is-static' : ''} is-${phase} ${hideIntro ? 'is-intro-hidden' : ''}`}
      aria-label="Meet the marketing specialists" data-agent={AGENTS[selected].id} data-progress="0"
      style={{ '--discovery-progress': progress, '--discovery-expand': expand }}>
      <div ref={stage} className="connected-stage">
        {backdrop}
        <motion.div className="connected-intro" aria-hidden={hideIntro || undefined} inert={hideIntro || undefined}
          style={staticView ? undefined : { opacity: introOpacity, y: introY }}>
          {heading}<div>{explore(onExplore)}</div>
        </motion.div>
        {!staticView && <div className="connected-orbit" aria-label="Agent artwork" inert={!exploring || undefined}>
          {AGENTS.map(({ id }, index) => <SpatialCard key={id} index={index} progress={progress} width={width}
            selectedIndex={selectedIndex} selected={selected === index} renderArtifact={renderArtifact}
            onSelect={moveToAgent} />)}
        </div>}
        <section id="f03-agents" className="connected-exploration" hidden={!exploring} inert={!exploring || undefined}
          aria-label="Explore the specialists">
          <div ref={picker} className="connected-picker" role="group" aria-label="Choose a specialist">
            {AGENTS.map(({ id }, index) => <button key={id} type="button" data-agent={id} aria-pressed={selected === index}
              onClick={() => moveToAgent(index)}>{AGENT_COPY[id].name}</button>)}
          </div>
          <div className="connected-brief"><p className="connected-role">{copy.name}</p>
            <h2>{copy.purpose}</h2><p>{copy.brief}</p></div>
          <div className="connected-result"><AgentExample agent={AGENTS[selected].id} catalog={catalog} compact onReadFull={readFull} /></div>
        </section>
      </div>
    </motion.section>
    <section id="f03-full-result" ref={fullResult} tabIndex={-1} className="connected-full-result" aria-label="Complete selected example">
      <h2>The complete recommendation</h2>
      <AgentExample agent={AGENTS[selected].id} catalog={catalog} />
      <a href="#f03-agents" className="f03-text-button" onClick={event => {
        if (!normalClick(event)) return;
        event.preventDefault();
        moveToAgent(selectedRef.current);
      }}>Back to {copy.name}</a>
    </section>
  </>;
}
