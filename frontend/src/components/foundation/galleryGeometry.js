const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
export const ORBIT_PITCH_LIMIT = 1.05;
const EDGE_ORBIT_THRESHOLD = 0.72;
const finite = value => Number.isFinite(value) ? value : 0;
export const clamp = (value, limit) => Math.max(-limit, Math.min(limit, value));

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
    yaw: finite(start.yaw) + finite(dx) * .0065,
    pitch: clamp(finite(start.pitch) - finite(dy) * .0045, ORBIT_PITCH_LIMIT),
  };
}

export function cursorRotation(start, x, y, bounds) {
  const localX = bounds.width > 0 ? clamp(2 * (x - bounds.left) / bounds.width - 1, 1) : 0;
  const localY = bounds.height > 0 ? clamp(2 * (y - bounds.top) / bounds.height - 1, 1) : 0;
  return {
    yaw: finite(start.yaw) + finite(localX) * .55,
    pitch: clamp(finite(start.pitch) - finite(localY) * .42, ORBIT_PITCH_LIMIT),
  };
}

/**
 * Returns normalized angular velocity (rad/s) when pointer moves into outer side margins
 * so back-facing tiles smoothly orbit forward across a full 360 degrees.
 */
export function edgeOrbitVelocity(x, bounds) {
  if (!bounds || !Number.isFinite(bounds.width) || bounds.width <= 0 || !Number.isFinite(bounds.left)) return 0;
  const localX = clamp(2 * (finite(x) - bounds.left) / bounds.width - 1, 1);
  const excess = Math.abs(localX) - EDGE_ORBIT_THRESHOLD;
  if (excess <= 0) return 0;
  const ratio = excess / (1 - EDGE_ORBIT_THRESHOLD);
  return Math.sign(localX) * ratio * 1.45;
}

export function focusTileRotation(point) {
  return {
    yaw: -Math.atan2(point.x, point.z),
    pitch: clamp(Math.atan2(point.y, Math.hypot(point.x, point.z)), ORBIT_PITCH_LIMIT),
  };
}

/**
 * Computes radial swell and scale multiplier for an idle spherical wave pass.
 */
export function waveOffset(point, wave) {
  const strength = finite(wave?.strength);
  if (!strength) return { radius: 1, scale: 1 };
  const phase = finite(wave?.phase);
  const spatial = point.y * 2.5 + Math.atan2(point.x, point.z) * 1.2;
  const swell = Math.sin(phase - spatial) * strength;
  return {
    radius: 1 + swell * 0.075,
    scale: 1 + swell * 0.045,
  };
}

export function projectTile(point, rotation, selected = false, wave = null) {
  const yaw = finite(rotation.yaw), pitch = finite(rotation.pitch);
  const { radius, scale: waveScale } = selected ? { radius: 1, scale: 1 } : waveOffset(point, wave);
  const x = point.x * Math.cos(yaw) + point.z * Math.sin(yaw);
  const z = point.z * Math.cos(yaw) - point.x * Math.sin(yaw);
  const y = point.y * Math.cos(pitch) - z * Math.sin(pitch);
  const baseDepth = point.y * Math.sin(pitch) + z * Math.cos(pitch);
  const depth = baseDepth * radius;
  const perspective = 3.4 / (3.4 - depth);
  return {
    x: selected ? 0 : x * radius * perspective,
    y: selected ? 0 : -y * radius * perspective,
    scale: selected ? 1.65 : perspective * .79 * waveScale,
    yaw: selected ? 0 : Math.max(-32, Math.min(32, x * 32)),
    depth,
    opacity: selected ? 1 : Math.max(.25, Math.min(1, .25 + (baseDepth + 1) * .375)),
    zIndex: selected ? 300 : Math.round((depth + 1) * 100),
    front: selected || depth > .02,
  };
}
