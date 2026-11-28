import { useEffect, useRef, useState } from 'react';
import { useMediaQuery } from '../../lib/useMediaQuery';
import './topDock.css';

const DEFAULT_CONFIG = {
  proximity: 210,
  spring: 0.19,
  damping: 0.70,
  widthGrowth: 38,
  heightGrowth: 16,
  drop: 4.5,
};

export function TopDock({ items, ariaLabel = 'Showcase', config = DEFAULT_CONFIG }) {
  const reduced = useMediaQuery('(prefers-reduced-motion: reduce)');
  const [activeHref, setActiveHref] = useState(() => window.location.hash || '');
  const dockRef = useRef(null);
  const itemRefs = useRef([]);
  const physicsRef = useRef({
    frame: null,
    pointerX: null,
    centers: [],
    nodes: [],
  });

  useEffect(() => {
    const syncHash = () => setActiveHref(window.location.hash || '');
    window.addEventListener('hashchange', syncHash);
    window.addEventListener('popstate', syncHash);

    const targets = items
      .map(item => document.getElementById(item.href.slice(1)))
      .filter(Boolean);
    let observer = null;
    if (targets.length && window.IntersectionObserver) {
      observer = new IntersectionObserver(entries => {
        const visible = entries
          .filter(entry => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target?.id) setActiveHref(`#${visible.target.id}`);
      }, { rootMargin: '-25% 0px -55% 0px', threshold: [0.05, 0.2, 0.5] });
      targets.forEach(target => observer.observe(target));
    }
    return () => {
      window.removeEventListener('hashchange', syncHash);
      window.removeEventListener('popstate', syncHash);
      observer?.disconnect();
    };
  }, [items]);

  useEffect(() => {
    const state = physicsRef.current;
    state.nodes = items.map(() => ({ v: 0, vel: 0 }));

    function resetStyles() {
      itemRefs.current.forEach(el => {
        if (!el) return;
        el.style.removeProperty('--dock-p');
      });
    }

    function stopLoop() {
      if (state.frame !== null) {
        window.cancelAnimationFrame(state.frame);
        state.frame = null;
      }
    }

    if (reduced) {
      stopLoop();
      state.pointerX = null;
      resetStyles();
      return undefined;
    }

    function onBlur() {
      state.pointerX = null;
      if (state.nodes.some(node => node.v > 0.001 || Math.abs(node.vel) > 0.001)) {
        startLoop();
      }
    }
    function onResize() {
      state.centers = [];
    }
    window.addEventListener('blur', onBlur);
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('resize', onResize);
      stopLoop();
      resetStyles();
    };
  }, [items, reduced]);

  function measureCenters() {
    physicsRef.current.centers = itemRefs.current.map(el => {
      if (!el) return 0;
      const rect = el.getBoundingClientRect();
      return rect.left + rect.width / 2;
    });
  }

  function startLoop() {
    const state = physicsRef.current;
    if (reduced || state.frame !== null) return;

    function tick() {
      let settled = true;
      const { proximity, spring, damping } = config;
      for (let i = 0; i < state.nodes.length; i += 1) {
        const node = state.nodes[i];
        const center = state.centers[i] ?? 0;
        let target = 0;
        if (state.pointerX !== null) {
          const dist = Math.abs(state.pointerX - center);
          if (dist < proximity) {
            target = Math.pow(Math.cos((dist / proximity) * (Math.PI / 2)), 1.5);
          }
        }
        const force = (target - node.v) * spring;
        node.vel = (node.vel + force) * damping;
        node.v += node.vel;
        if (node.v < 0) node.v = 0;
        if (Math.abs(target - node.v) > 0.0015 || Math.abs(node.vel) > 0.0015) {
          settled = false;
        } else {
          node.v = target;
          node.vel = 0;
        }
        const el = itemRefs.current[i];
        if (el) el.style.setProperty('--dock-p', node.v.toFixed(4));
      }

      if (settled) {
        state.frame = null;
        return;
      }
      state.frame = window.requestAnimationFrame(tick);
    }

    state.frame = window.requestAnimationFrame(tick);
  }

  function handlePointerEnter(event) {
    if (reduced || event.pointerType !== 'mouse') return;
    measureCenters();
    physicsRef.current.pointerX = event.clientX;
    startLoop();
  }

  function handlePointerMove(event) {
    if (reduced || event.pointerType !== 'mouse') return;
    if (!physicsRef.current.centers.length) measureCenters();
    physicsRef.current.pointerX = event.clientX;
    startLoop();
  }

  function handlePointerLeave() {
    if (reduced) return;
    physicsRef.current.pointerX = null;
    startLoop();
  }

  const dockVars = {
    '--dock-w-grow': `${(config.widthGrowth / 2).toFixed(1)}px`,
    '--dock-h-grow': `${(config.heightGrowth / 2).toFixed(1)}px`,
    '--dock-drop': `${config.drop}px`,
  };

  return (
    <nav
      ref={dockRef}
      className="top-dock"
      aria-label={ariaLabel}
      style={dockVars}
      onPointerEnter={handlePointerEnter}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      onPointerCancel={handlePointerLeave}
    >
      <div className="top-dock-capsule">
        {items.map((item, index) => {
          const isActive = activeHref === item.href;
          return (
            <a
              key={item.href}
              href={item.href}
              ref={node => { itemRefs.current[index] = node; }}
              className={`top-dock-item${isActive ? ' is-active' : ''}`}
              aria-current={isActive ? 'location' : undefined}
              onClick={() => setActiveHref(item.href)}
            >
              <span className="top-dock-dot" aria-hidden="true" />
              <span className="top-dock-label">{item.label}</span>
            </a>
          );
        })}
      </div>
    </nav>
  );
}
