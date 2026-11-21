import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import AgentGallery from './AgentGallery';
import { dragRotation, projectTile, spherePoints } from './galleryGeometry';

describe('spherical image projection', () => {
  it('distributes distinct image points on a finite unit shell', () => {
    for (const count of [0, 1, 5, 25]) {
      const points = spherePoints(count);
      expect(points).toHaveLength(count);
      expect(new Set(points.map(point => JSON.stringify(point))).size).toBe(count);
      for (const point of points) expect(Math.hypot(point.x, point.y, point.z)).toBeCloseTo(1);
    }
    expect(spherePoints(NaN)).toEqual([]);
  });

  it('rotates without a clock and keeps projection bounded through a full turn', () => {
    const start = { yaw: .15, pitch: -.12 };
    const rotated = dragRotation(start, 80, 30);
    expect(rotated).not.toEqual(start);
    expect(dragRotation(start, 0, 0)).toEqual(start);
    expect(dragRotation(start, 0, 10000).pitch).toBe(-.85);
    for (const point of spherePoints(25)) for (const yaw of [0, Math.PI, Math.PI * 2, 1000]) {
      const pose = projectTile(point, { yaw, pitch: .85 });
      for (const key of ['x', 'y', 'scale', 'yaw', 'opacity', 'depth']) expect(Number.isFinite(pose[key])).toBe(true);
      expect(pose.scale).toBeGreaterThan(0);
      expect(pose.opacity).toBeGreaterThanOrEqual(.25);
      expect(pose.opacity).toBeLessThanOrEqual(1);
    }
  });

  it('pulls only the chosen tile forward without mutating its underlying pose', () => {
    const point = spherePoints(5)[3], rotation = { yaw: .8, pitch: -.2 };
    const before = projectTile(point, rotation);
    expect(projectTile(point, rotation, true)).toMatchObject({ x: 0, y: 0, scale: 1.65, front: true, zIndex: 300 });
    expect(projectTile(point, rotation)).toEqual(before);
  });
});

const tiles = Array.from({ length: 5 }, (_, index) => ({ id: `work-${index}`, agent: `role-${index}`, label: `Role ${index}`, image: `/work-${index}.webp` }));

describe('sphere activation is separate from rotation', () => {
  it('explicit foreground activation preserves tile identity and the original event', () => {
    const onSelect = vi.fn();
    render(React.createElement(AgentGallery, { tiles, onSelect }));
    const tile = screen.getByRole('button', { name: 'Explore Role 0' });
    fireEvent.click(tile);
    expect(onSelect.mock.calls[0][0]).toBe(tiles[0]);
    expect(onSelect.mock.calls[0][1].type).toBe('click');
  });

  it('drag changes rotation without activating a tile, then a new plain click works', () => {
    vi.stubGlobal('PointerEvent', MouseEvent);
    const onSelect = vi.fn();
    const { container } = render(React.createElement(AgentGallery, { tiles, onSelect }));
    const shell = container.querySelector('.connected-orbit-shell');
    const before = shell.dataset.yaw;
    fireEvent.pointerDown(shell, { clientX: 100, clientY: 100, button: 0 });
    fireEvent.pointerMove(shell, { clientX: 160, clientY: 110 });
    expect(shell.dataset.yaw).not.toBe(before);
    fireEvent.pointerUp(shell);
    const tile = container.querySelector('[data-front=true]');
    fireEvent.click(tile, { detail: 1 });
    expect(onSelect).not.toHaveBeenCalled();
    fireEvent.pointerDown(tile, { clientX: 100, clientY: 100, button: 0 });
    fireEvent.pointerUp(tile);
    fireEvent.click(tile);
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it('leaves native wheel input alone and suppresses interactive graphics in static paths', () => {
    const onSelect = vi.fn();
    const { container, rerender } = render(React.createElement(AgentGallery, { tiles, onSelect }));
    expect(fireEvent.wheel(container.firstElementChild, { deltaY: 100, cancelable: true })).toBe(true);
    expect(onSelect).not.toHaveBeenCalled();
    rerender(React.createElement(AgentGallery, { tiles, onSelect, reduced: true }));
    expect(container).toBeEmptyDOMElement();
    rerender(React.createElement(AgentGallery, { tiles, onSelect, hidden: true }));
    expect(container).toBeEmptyDOMElement();
  });

  it('keeps the shell pose through selecting and closing a dossier', () => {
    const onSelect = vi.fn();
    const { container, rerender } = render(React.createElement(AgentGallery, { tiles, onSelect }));
    const tile = container.querySelector('[data-tile-id="work-3"]');
    const before = tile.style.transform;
    rerender(React.createElement(AgentGallery, { tiles, onSelect, selectedId: 'work-3' }));
    expect(tile).toHaveClass('is-selected');
    expect(tile).toBeEnabled();
    expect(tile.style.transform).not.toBe(before);
    rerender(React.createElement(AgentGallery, { tiles, onSelect, selectedId: null }));
    expect(tile.style.transform).toBe(before);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('cancels drag without blocking a later keyboard or assistive activation', () => {
    vi.stubGlobal('PointerEvent', MouseEvent);
    const onSelect = vi.fn();
    const { container } = render(React.createElement(AgentGallery, { tiles, onSelect }));
    const shell = container.querySelector('.connected-orbit-shell');
    fireEvent.pointerDown(shell, { clientX: 100, clientY: 100, button: 0 });
    fireEvent.pointerMove(shell, { clientX: 130, clientY: 110 });
    fireEvent.pointerCancel(shell);
    const yaw = shell.dataset.yaw;
    fireEvent.pointerMove(shell, { clientX: 180, clientY: 180 });
    expect(shell.dataset.yaw).toBe(yaw);
    expect(shell.dataset.dragging).toBe('false');
    fireEvent.click(container.querySelector('[data-front=true]'), { detail: 0 });
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it('disarms an uncaptured press that leaves before the drag threshold', () => {
    vi.stubGlobal('PointerEvent', MouseEvent);
    const onSelect = vi.fn();
    const { container } = render(React.createElement(AgentGallery, { tiles, onSelect }));
    const shell = container.querySelector('.connected-orbit-shell');
    const yaw = shell.dataset.yaw;
    fireEvent.pointerDown(shell, { clientX: 100, clientY: 100, button: 0 });
    fireEvent.pointerMove(shell, { clientX: 103, clientY: 100 });
    fireEvent.pointerLeave(shell);
    fireEvent.pointerEnter(shell);
    fireEvent.pointerMove(shell, { clientX: 180, clientY: 100, buttons: 0 });
    expect(shell.dataset.yaw).toBe(yaw);
    expect(shell.dataset.dragging).toBe('false');
    expect(onSelect).not.toHaveBeenCalled();
    fireEvent.pointerDown(shell, { clientX: 100, clientY: 100, button: 0 });
    fireEvent.pointerMove(shell, { clientX: 130, clientY: 100, buttons: 1 });
    expect(shell.dataset.yaw).not.toBe(yaw);
  });

  it('retains role text on image failure and resets the failed image for a new URL', () => {
    const onSelect = vi.fn();
    const { container, rerender } = render(React.createElement(AgentGallery, { tiles, onSelect }));
    const tile = container.querySelector('[data-tile-id="work-0"]');
    const image = tile.querySelector('img');
    fireEvent.error(image);
    expect(image.style.visibility).toBe('hidden');
    expect(tile).toHaveTextContent('Role 0');
    rerender(React.createElement(AgentGallery, { tiles: tiles.map(item => ({ ...item, image: `${item.image}?retry=1` })), onSelect }));
    expect(tile.querySelector('img')).not.toBe(image);
    expect(tile.querySelector('img').style.visibility).toBe('');
  });
});
