const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
const finite = value => Number.isFinite(value) ? value : 0;
const clamp = (value, limit) => Math.max(-limit, Math.min(limit, value));

export function spherePoints(count) {
  const length = Math.max(0, Math.floor(finite(count)));
  return Array.from({ length }, (_, index) => {
    const y = 1 - 2 * (index + .5) / length;
    const ring = Math.sqrt(1 - y * y);
    const angle = index * GOLDEN_ANGLE;
    return { x: Math.sin(angle) * ring, y, z: Math.cos(angle) * ring };
  });
}

export function dragRotation(start, dx, dy) {
  return {
    yaw: finite(start.yaw) + finite(dx) * .006,
    pitch: clamp(finite(start.pitch) - finite(dy) * .004, .85),
  };
}

export function cursorRotation(start, x, y, bounds) {
  const localX = bounds.width > 0 ? clamp(2 * (x - bounds.left) / bounds.width - 1, 1) : 0;
  const localY = bounds.height > 0 ? clamp(2 * (y - bounds.top) / bounds.height - 1, 1) : 0;
  return {
    yaw: finite(start.yaw) + finite(localX) * 1.8,
    pitch: clamp(finite(start.pitch) - finite(localY) * .54, .85),
  };
}

export function focusTileRotation(point) {
  return {
    yaw: -Math.atan2(point.x, point.z),
    pitch: clamp(Math.atan2(point.y, Math.hypot(point.x, point.z)), .85),
  };
}

export function projectTile(point, rotation, selected = false) {
  const yaw = finite(rotation.yaw), pitch = finite(rotation.pitch);
  const x = point.x * Math.cos(yaw) + point.z * Math.sin(yaw);
  const z = point.z * Math.cos(yaw) - point.x * Math.sin(yaw);
  const y = point.y * Math.cos(pitch) - z * Math.sin(pitch);
  const depth = point.y * Math.sin(pitch) + z * Math.cos(pitch);
  const perspective = 3.4 / (3.4 - depth);
  return {
    x: selected ? 0 : x * perspective,
    y: selected ? 0 : -y * perspective,
    scale: selected ? 1.65 : perspective * .79,
    yaw: selected ? 0 : Math.max(-32, Math.min(32, x * 32)),
    depth,
    opacity: selected ? 1 : .25 + (depth + 1) * .375,
    zIndex: selected ? 300 : Math.round((depth + 1) * 100),
    front: selected || depth > -.08,
  };
}
