import { useEffect, useMemo, useRef, useState } from 'react';
import { dragRotation, projectTile, spherePoints } from './galleryGeometry';
import './agent-gallery.css';

export default function AgentGallery({ tiles, selectedId, onSelect, reduced = false, hidden = false }) {
  const [rotation, setRotation] = useState({ yaw: .15, pitch: -.12 });
  const [dragging, setDragging] = useState(false);
  const drag = useRef(null);
  const suppressClick = useRef(false);
  const points = useMemo(() => spherePoints(tiles.length), [tiles.length]);

  useEffect(() => {
    drag.current = null;
    suppressClick.current = false;
    setDragging(false);
  }, [hidden, reduced, selectedId]);

  function endDrag(event) {
    if (drag.current?.pointerId !== event.pointerId) return;
    drag.current = null;
    setDragging(false);
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  }

  if (hidden || reduced) return null;

  return <div className="connected-orbit-shell" data-selected={selectedId || ''} data-dragging={String(dragging)}
    data-yaw={rotation.yaw.toFixed(4)} data-pitch={rotation.pitch.toFixed(4)}
    role="group" aria-label="Agent work images; use the agent controls to choose a specialist"
    onPointerDown={event => {
      if (event.button !== 0 || selectedId) return;
      suppressClick.current = false;
      drag.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, rotation, moved: false };
    }}
    onPointerMove={event => {
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
      setRotation(dragRotation(start.rotation, dx, dy));
    }}
    onPointerLeave={event => {
      if (drag.current && !drag.current.moved) endDrag(event);
    }}
    onPointerUp={endDrag} onPointerCancel={endDrag} onLostPointerCapture={endDrag}
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
        const pose = projectTile(points[index], rotation, selected);
        return <button key={tile.id} type="button" className={`connected-sphere-tile${selected ? ' is-selected' : ''}`}
          data-tile-id={tile.id} data-agent={tile.agent} data-front={String(pose.front)} data-depth={pose.depth.toFixed(4)}
          tabIndex={-1} aria-label={`Explore ${tile.label}`} aria-pressed={selected}
          aria-hidden={!pose.front || undefined} disabled={!pose.front}
          style={{
            transform: `translate(-50%, -50%) translate(calc(${pose.x} * var(--orbit-radius)), calc(${pose.y} * var(--orbit-radius))) scale(${pose.scale}) rotateY(${pose.yaw}deg)`,
            opacity: pose.opacity * (selectedId && !selected ? .42 : 1), zIndex: pose.zIndex,
          }}
          onDragStart={event => event.preventDefault()}
          onClick={event => onSelect(tile, event)}>
          <img key={tile.image} src={tile.image} alt="" loading="lazy" decoding="async" draggable="false"
            onError={event => { event.currentTarget.style.visibility = 'hidden'; }}
            onLoad={event => { event.currentTarget.style.removeProperty('visibility'); }} />
          <span>{tile.label}</span>
        </button>;
      })}
    </div>
  </div>;
}
