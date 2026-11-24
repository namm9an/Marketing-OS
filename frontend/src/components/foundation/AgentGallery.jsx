import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { cursorRotation, dragRotation, focusTileRotation, projectTile, spherePoints } from './galleryGeometry';
import './agent-gallery.css';

function stopCursor(cursor) {
  if (cursor.frame !== null) window.cancelAnimationFrame(cursor.frame);
  cursor.frame = null;
  cursor.start = null;
  cursor.target = null;
}

export default function AgentGallery({ tiles, selectedId, onSelect, reduced = false, hidden = false }) {
  const [rotation, setRotation] = useState({ yaw: .15, pitch: -.12 });
  const [dragging, setDragging] = useState(false);
  const [focusId, setFocusId] = useState(null);
  const shell = useRef(null);
  const pendingFocus = useRef(null);
  const currentRotation = useRef(rotation);
  const cursor = useRef({ frame: null, start: null, target: null });
  const drag = useRef(null);
  const suppressClick = useRef(false);
  const points = useMemo(() => spherePoints(tiles.length), [tiles.length]);

  useLayoutEffect(() => {
    const tracking = cursor.current;
    drag.current = null;
    suppressClick.current = false;
    setDragging(false);
    return () => stopCursor(tracking);
  }, [hidden, reduced, selectedId]);

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

  function trackCursor() {
    const tracking = cursor.current;
    tracking.frame = null;
    const target = tracking.target;
    if (!target) return;
    const current = currentRotation.current;
    const yaw = target.yaw - current.yaw;
    const pitch = target.pitch - current.pitch;
    if (Math.max(Math.abs(yaw), Math.abs(pitch)) < .001) {
      updateRotation(target);
      return;
    }
    updateRotation({ yaw: current.yaw + yaw * .32, pitch: current.pitch + pitch * .32 });
    tracking.frame = window.requestAnimationFrame(trackCursor);
  }

  function endDrag(event) {
    if (drag.current?.pointerId !== event.pointerId) return;
    drag.current = null;
    setDragging(false);
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  }

  if (hidden || reduced) return null;

  const poses = points.map((point, index) => projectTile(point, rotation, tiles[index].id === selectedId));
  const focusedIndex = tiles.findIndex(tile => tile.id === focusId);
  const entryIndex = poses[focusedIndex]?.front ? focusedIndex
    : poses.reduce((front, pose, index) => pose.depth > poses[front].depth ? index : front, 0);

  return <div ref={shell} className="connected-orbit-shell" data-selected={selectedId || ''} data-dragging={String(dragging)}
    data-yaw={rotation.yaw.toFixed(4)} data-pitch={rotation.pitch.toFixed(4)}
    role="group" aria-label="Agent work images. Use arrow keys to browse the images."
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
      if (event.button !== 0 || selectedId) return;
      suppressClick.current = false;
      stopCursor(cursor.current);
      // Freezing the current pose on mouse down keeps the pressed tile under the pointer until click.
      if (event.pointerType === 'mouse') return;
      drag.current = {
        pointerId: event.pointerId, x: event.clientX, y: event.clientY,
        rotation: currentRotation.current, moved: false,
      };
    }}
    onPointerMove={event => {
      if (selectedId) return;
      if (event.pointerType === 'mouse') {
        if (event.buttons || drag.current) return;
        const focused = document.activeElement;
        if (event.currentTarget.contains(focused) && focused.matches('.connected-sphere-tile:focus-visible')) return;
        const tracking = cursor.current;
        tracking.start ??= currentRotation.current;
        tracking.target = cursorRotation(tracking.start, event.clientX, event.clientY, event.currentTarget.getBoundingClientRect());
        if (tracking.frame === null) tracking.frame = window.requestAnimationFrame(trackCursor);
        return;
      }
      const start = drag.current;
      if (!start || start.pointerId !== event.pointerId) return;
      const dx = event.clientX - start.x, dy = event.clientY - start.y;
      if (!start.moved) {
        if (Math.hypot(dx, dy) < 6 || (event.pointerType === 'touch' && Math.abs(dx) < Math.abs(dy) * 1.2)) return;
        start.moved = true;
        suppressClick.current = true;
        event.currentTarget.setPointerCapture?.(event.pointerId);
        setDragging(true);
      }
      updateRotation(dragRotation(start.rotation, dx, dy));
    }}
    onPointerLeave={event => {
      stopCursor(cursor.current);
      if (drag.current && !drag.current.moved) endDrag(event);
    }}
    onPointerUp={endDrag} onPointerCancel={event => { stopCursor(cursor.current); endDrag(event); }}
    onLostPointerCapture={endDrag}
    onClickCapture={event => {
      if (!suppressClick.current) return;
      suppressClick.current = false;
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
          onFocus={() => {
            stopCursor(cursor.current);
            setFocusId(tile.id);
          }}
          onDragStart={event => event.preventDefault()}
          onClick={event => {
            if (selectedId) return;
            stopCursor(cursor.current);
            onSelect(tile, event);
          }}>
          <img key={tile.image} src={tile.image} alt="" loading="lazy" decoding="async" draggable="false"
            onError={event => { event.currentTarget.style.visibility = 'hidden'; }}
            onLoad={event => { event.currentTarget.style.removeProperty('visibility'); }} />
          <span>{tile.label}</span>
        </button>;
      })}
    </div>
  </div>;
}
