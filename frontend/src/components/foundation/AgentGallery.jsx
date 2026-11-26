import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { clamp, cursorRotation, dragRotation, edgeOrbitVelocity, focusTileRotation, ORBIT_PITCH_LIMIT, projectTile, spherePoints } from './galleryGeometry';
import PokemonHoloCard from './PokemonHoloCard';
import './agent-gallery.css';

const TILE_IMG_PROPS = {
  loading: 'lazy',
  decoding: 'async',
  draggable: false,
  onError: event => { event.currentTarget.style.visibility = 'hidden'; },
  onLoad: event => { event.currentTarget.style.removeProperty('visibility'); },
};

function stopCursor(cursor) {
  if (cursor.frame !== null) window.cancelAnimationFrame(cursor.frame);
  cursor.frame = null;
  cursor.start = null;
  cursor.target = null;
  cursor.bounds = null;
  cursor.x = 0;
  cursor.y = 0;
  cursor.edgeSpeed = 0;
  cursor.lastTs = null;
}

const IDLE_YAW_SPEED = 0.22;
const WAVE_PHASE_SPEED = 2.05;

export default function AgentGallery({ tiles, selectedId, onSelect, reduced = false, hidden = false }) {
  const [rotation, setRotation] = useState({ yaw: 1.05, pitch: .12 });
  const [wave, setWave] = useState({ phase: 0, strength: 0 });
  const [dragging, setDragging] = useState(false);
  const [inView, setInView] = useState(true);
  const [paused, setPaused] = useState(false);
  const [focusId, setFocusId] = useState(null);
  const shell = useRef(null);
  const pendingFocus = useRef(null);
  const currentRotation = useRef(rotation);
  const hovered = useRef(false);
  const focusedInside = useRef(false);
  const waveState = useRef({ phase: 0, strength: 0, resumeAt: 0 });
  const cursor = useRef({
    frame: null, start: null, target: null, bounds: null,
    x: 0, y: 0, edgeSpeed: 0, lastTs: null,
  });
  const drag = useRef(null);
  const suppressClick = useRef(false);
  const clearClickTimer = useRef(null);
  const points = useMemo(() => spherePoints(tiles.length), [tiles.length]);

  useLayoutEffect(() => {
    const tracking = cursor.current;
    drag.current = null;
    suppressClick.current = false;
    setDragging(false);
    return () => {
      stopCursor(tracking);
      if (clearClickTimer.current !== null) {
        window.clearTimeout(clearClickTimer.current);
        clearClickTimer.current = null;
      }
    };
  }, [hidden, reduced, selectedId]);

  useEffect(() => {
    function haltCursor() {
      stopCursor(cursor.current);
    }
    function onBlur() {
      hovered.current = false;
      focusedInside.current = false;
      haltCursor();
    }
    function onVisibility() {
      setPaused(document.hidden);
      if (document.hidden) haltCursor();
    }
    window.addEventListener('blur', onBlur);
    window.addEventListener('scroll', haltCursor, { passive: true });
    document.addEventListener('visibilitychange', onVisibility);

    let observer = null;
    if (shell.current && window.IntersectionObserver) {
      observer = new IntersectionObserver(([entry]) => {
        setInView(entry.isIntersecting);
        if (!entry.isIntersecting) haltCursor();
      }, { threshold: 0.05 });
      observer.observe(shell.current);
    }
    return () => {
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('scroll', haltCursor);
      document.removeEventListener('visibilitychange', onVisibility);
      observer?.disconnect();
    };
  }, [hidden, reduced]);

  useEffect(() => {
    const active = !hidden && !reduced && !selectedId && !dragging && inView && !paused;
    if (!active) {
      waveState.current.strength = 0;
      setWave(previous => (previous.strength === 0 ? previous : { ...previous, strength: 0 }));
      return;
    }

    let frame = null;
    let lastTs = null;
    function tick(now) {
      frame = window.requestAnimationFrame(tick);
      const dt = lastTs === null ? .016 : Math.min(.05, Math.max(.001, (now - lastTs) / 1000));
      lastTs = now;

      const state = waveState.current;
      const userBusy = hovered.current
        || focusedInside.current
        || cursor.current.frame !== null
        || drag.current !== null
        || now < state.resumeAt;

      if (!userBusy) {
        state.strength = Math.min(1, state.strength + dt * 2.4);
        updateRotation({
          yaw: currentRotation.current.yaw + dt * IDLE_YAW_SPEED,
          pitch: currentRotation.current.pitch,
        });
      } else {
        state.strength = Math.max(0, state.strength - dt * 4.5);
      }

      if (state.strength > 0.001) {
        state.phase = (state.phase + dt * WAVE_PHASE_SPEED) % (Math.PI * 200);
        setWave({ phase: state.phase, strength: state.strength });
      } else if (state.strength === 0) {
        setWave(previous => (previous.strength === 0 ? previous : { ...previous, strength: 0 }));
      }
    }

    frame = window.requestAnimationFrame(tick);
    return () => {
      if (frame !== null) window.cancelAnimationFrame(frame);
    };
  }, [dragging, hidden, inView, paused, reduced, selectedId]);

  useLayoutEffect(() => {
    const id = pendingFocus.current;
    if (!id) return;
    pendingFocus.current = null;
    Array.from(shell.current?.querySelectorAll('[data-tile-id]') ?? [])
      .find(button => button.dataset.tileId === id)?.focus({ preventScroll: true });
  }, [focusId, rotation]);

  function updateRotation(next) {
    currentRotation.current = next;
    setRotation(next);
  }

  function trackCursor(now) {
    const tracking = cursor.current;
    tracking.frame = null;
    const target = tracking.target;
    if (!target) return;
    const timestamp = typeof now === 'number' ? now : performance.now();
    const dt = tracking.lastTs === null ? .016 : Math.min(.05, Math.max(.001, (timestamp - tracking.lastTs) / 1000));
    tracking.lastTs = timestamp;

    if (tracking.edgeSpeed !== 0 && tracking.start && tracking.bounds) {
      const spin = tracking.edgeSpeed * dt;
      tracking.start = { ...tracking.start, yaw: tracking.start.yaw + spin };
      tracking.target = cursorRotation(tracking.start, tracking.x, tracking.y, tracking.bounds);
    }

    const activeTarget = tracking.target;
    const current = currentRotation.current;
    const yaw = activeTarget.yaw - current.yaw;
    const pitch = activeTarget.pitch - current.pitch;
    if (tracking.edgeSpeed === 0 && Math.max(Math.abs(yaw), Math.abs(pitch)) < .001) {
      tracking.lastTs = null;
      updateRotation(activeTarget);
      return;
    }
    updateRotation({
      yaw: current.yaw + yaw * .24,
      pitch: clamp(current.pitch + pitch * .24, ORBIT_PITCH_LIMIT),
    });
    tracking.frame = window.requestAnimationFrame(trackCursor);
  }

  function endDrag(event) {
    if (drag.current?.pointerId !== event.pointerId) return;
    const wasMoved = drag.current.moved;
    drag.current = null;
    waveState.current.resumeAt = performance.now() + 550;
    setDragging(false);
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    if (event.type === 'pointercancel') {
      suppressClick.current = false;
      return;
    }
    if (wasMoved) {
      if (clearClickTimer.current !== null) window.clearTimeout(clearClickTimer.current);
      clearClickTimer.current = window.setTimeout(() => {
        clearClickTimer.current = null;
        suppressClick.current = false;
      }, 0);
    }
  }

  if (hidden || reduced) return null;

  const poses = points.map((point, index) => projectTile(point, rotation, tiles[index].id === selectedId, wave));
  const selectedIndex = selectedId ? tiles.findIndex(tile => tile.id === selectedId) : -1;
  const frontMostIndex = selectedIndex >= 0
    ? selectedIndex
    : poses.reduce((best, pose, index) => (pose.depth > poses[best].depth ? index : best), 0);
  const focusedIndex = tiles.findIndex(tile => tile.id === focusId);
  const entryIndex = poses[focusedIndex]?.front ? focusedIndex : frontMostIndex;

  return <div ref={shell} className="connected-orbit-shell" data-selected={selectedId || ''} data-dragging={String(dragging)}
    data-yaw={rotation.yaw.toFixed(4)} data-pitch={rotation.pitch.toFixed(4)}
    data-wave={wave.strength.toFixed(2)}
    role="group" aria-label="Agent work images. Use arrow keys to browse the images."
    onBlur={event => {
      if (!event.currentTarget.contains(event.relatedTarget)) focusedInside.current = false;
    }}
    onPointerEnter={event => {
      if (event.pointerType === 'mouse') hovered.current = true;
    }}
    onKeyDown={event => {
      if (selectedId || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
      const forward = event.key === 'ArrowRight' || event.key === 'ArrowDown';
      const backward = event.key === 'ArrowLeft' || event.key === 'ArrowUp';
      const from = tiles.findIndex(tile => tile.id === event.target.dataset.tileId);
      if ((!forward && !backward) || from < 0 || tiles.length < 2) return;
      event.preventDefault();
      stopCursor(cursor.current);
      const next = (from + (forward ? 1 : -1) + tiles.length) % tiles.length;
      pendingFocus.current = tiles[next].id;
      setFocusId(tiles[next].id);
      updateRotation(focusTileRotation(points[next]));
    }}
    onPointerDown={event => {
      if (event.button !== 0 || selectedId || drag.current) return;
      suppressClick.current = false;
      if (clearClickTimer.current !== null) {
        window.clearTimeout(clearClickTimer.current);
        clearClickTimer.current = null;
      }
      stopCursor(cursor.current);
      const onTile = Boolean(event.target instanceof Element && event.target.closest('.connected-sphere-tile'));
      drag.current = {
        pointerId: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        rotation: currentRotation.current,
        moved: false,
        threshold: event.pointerType === 'mouse' && onTile ? 10 : 6,
      };
    }}
    onPointerMove={event => {
      if (selectedId) return;
      const start = drag.current;
      if (start && start.pointerId === event.pointerId) {
        const dx = event.clientX - start.x;
        const dy = event.clientY - start.y;
        if (!start.moved) {
          if (Math.hypot(dx, dy) < start.threshold || (event.pointerType === 'touch' && Math.abs(dx) < Math.abs(dy) * 1.2)) return;
          start.moved = true;
          suppressClick.current = true;
          try {
            event.currentTarget.setPointerCapture?.(event.pointerId);
          } catch {
            // Pointer may no longer be active before capture.
          }
          setDragging(true);
        }
        updateRotation(dragRotation(start.rotation, dx, dy));
        return;
      }

      if (event.pointerType === 'mouse') {
        hovered.current = true;
        if (event.buttons || drag.current) return;
        const focused = document.activeElement;
        if (event.currentTarget.contains(focused) && focused.matches('.connected-sphere-tile:focus-visible')) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        const tracking = cursor.current;
        const previousEdge = tracking.edgeSpeed;
        const nextEdge = edgeOrbitVelocity(event.clientX, bounds);

        // Keep initial entry responsive from current pose; only re-anchor when exiting an outer edge spin.
        if (tracking.start === null) {
          tracking.start = currentRotation.current;
        } else if (previousEdge !== 0 && nextEdge === 0) {
          const cur = currentRotation.current;
          const zeroed = cursorRotation({ yaw: 0, pitch: 0 }, event.clientX, event.clientY, bounds);
          tracking.start = { yaw: cur.yaw - zeroed.yaw, pitch: cur.pitch - zeroed.pitch };
        }

        tracking.bounds = bounds;
        tracking.x = event.clientX;
        tracking.y = event.clientY;
        tracking.edgeSpeed = nextEdge;
        tracking.target = cursorRotation(tracking.start, event.clientX, event.clientY, bounds);
        if (tracking.frame === null) tracking.frame = window.requestAnimationFrame(trackCursor);
      }
    }}
    onPointerLeave={event => {
      hovered.current = false;
      waveState.current.resumeAt = performance.now() + 450;
      stopCursor(cursor.current);
      if (drag.current && !drag.current.moved) endDrag(event);
    }}
    onPointerUp={endDrag} onPointerCancel={event => {
      hovered.current = false;
      stopCursor(cursor.current);
      endDrag(event);
    }}
    onLostPointerCapture={endDrag}
    onClickCapture={event => {
      if (!suppressClick.current) return;
      suppressClick.current = false;
      if (clearClickTimer.current !== null) {
        window.clearTimeout(clearClickTimer.current);
        clearClickTimer.current = null;
      }
      if (event.detail === 0) return;
      event.preventDefault();
      event.stopPropagation();
    }}>
    <div className="connected-orbit-viewport">
      {tiles.map((tile, index) => {
        const selected = tile.id === selectedId;
        const pose = poses[index];
        return <button key={tile.id} type="button" className={`connected-sphere-tile${selected ? ' is-selected' : ''}`}
          data-tile-id={tile.id} data-agent={tile.agent} data-front={String(pose.front)} data-depth={pose.depth.toFixed(4)}
          tabIndex={!selectedId && index === entryIndex ? 0 : -1} aria-label={`Explore ${tile.label}`} aria-pressed={selected}
          aria-hidden={!pose.front || undefined} disabled={!pose.front}
          style={{
            transform: `translate(-50%, -50%) translate(calc(${pose.x} * var(--orbit-radius)), calc(${pose.y} * var(--orbit-radius))) scale(${pose.scale}) rotateY(${pose.yaw}deg)`,
            opacity: pose.opacity * (selectedId && !selected ? .42 : 1), zIndex: pose.zIndex,
          }}
          onFocus={event => {
            stopCursor(cursor.current);
            if (event.currentTarget.matches?.(':focus-visible')) focusedInside.current = true;
            setFocusId(tile.id);
          }}
          onDragStart={event => event.preventDefault()}
          onClick={event => {
            stopCursor(cursor.current);
            onSelect(tile, event);
          }}>
          <PokemonHoloCard
            key={tile.id}
            src={tile.image}
            rearSrc={tile.rearImage}
            label={tile.label}
            variant="tile"
            interactive={!reduced && !dragging && pose.front}
            frontMost={index === frontMostIndex}
            imgProps={TILE_IMG_PROPS}
          />
          <span>{tile.label}</span>
        </button>;
      })}
    </div>
  </div>;
}
