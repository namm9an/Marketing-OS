export const GALLERY_START = .18;
export const GALLERY_END = .66;
export const EXPANSION_END = .84;
const COUNT = 5;
const STEP = Math.PI * 2 / COUNT;

export const clampProgress = value => Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));
export const expansionFor = progress => clampProgress((progress - GALLERY_END) / (EXPANSION_END - GALLERY_END));

export function progressForAgent(index) {
  return GALLERY_START + Math.min(COUNT - 1, Math.max(0, index)) / (COUNT - 1) * (GALLERY_END - GALLERY_START);
}

export function agentForProgress(progress, current = 0) {
  const p = clampProgress(progress);
  // Reading a chosen full result must not silently replace it with the last role.
  if (p > GALLERY_END) return current;
  return Math.round(clampProgress((p - GALLERY_START) / (GALLERY_END - GALLERY_START)) * (COUNT - 1));
}

export function cardPose(index, progress, width, selected = 0) {
  const p = clampProgress(progress);
  const size = Math.max(320, Number.isFinite(width) ? width : 1000);
  const gallery = clampProgress((p - GALLERY_START) / (GALLERY_END - GALLERY_START));
  const anticipation = clampProgress(p / GALLERY_START);
  const turn = (p > GALLERY_END ? selected : gallery * (COUNT - 1)) * STEP - (1 - anticipation) * .08;
  const angle = index * STEP - turn;
  const depth = (Math.cos(angle) + 1) / 2;
  const scale = 1200 / (1200 - Math.cos(angle) * Math.min(size * .13, 160));
  const expand = expansionFor(p);
  const foreground = index === selected;
  const x = Math.sin(angle) * Math.min(size * .31, 410) * scale;
  const y = Math.cos(angle) * 76 * scale;
  return {
    x: x * (1 - expand * .5) - (foreground ? expand * Math.min(size * .16, 190) : 0),
    y: y * (1 - expand * .55) + (1 - anticipation) * 18,
    scale: scale * (1 + (foreground ? expand * .12 : -expand * .1)),
    yaw: -Math.sin(angle) * 18 * (1 - expand),
    opacity: foreground ? 1 : (0.56 + depth * .44) * (1 - expand * .68),
    zIndex: Math.round(depth * 100) + (foreground ? 2 : 0),
  };
}
