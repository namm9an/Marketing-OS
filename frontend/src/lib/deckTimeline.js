/**
 * Pinned Dossier Cascade Deck Timeline Constants & Motion Contracts.
 * Single source of truth for all deck scrolling, arrival milestones, and card stacking metrics.
 */

export const CONTAINER_HEIGHT_VH = 600;
export const CONTAINER_HEIGHT = '600vh';
export const MORPH_END = 0.15;
export const CARD_ARRIVAL_POINTS = [0.15, 0.32, 0.49, 0.66, 0.83];
export const TRANSITION_LENGTH = 0.06;

// Per caveat: Visible strip must be the same height for every level, at least 36px,
// ensuring the full tab label (tag badge + domain title) is unclipped.
export const PER_LEVEL_OFFSET_PX = 40; // 40px >= 36px for unclipped tab labels
export const PER_LEVEL_OFFSET = '40px';

export const PER_LEVEL_SCALE_STEP = 0.03;
export const MAX_VISIBLE_BEHIND = 3;
export const SCROLL_TRANSITION_DURATION = 1.2;

/**
 * Generate keyframes for card Y, scale, tint, and visibility.
 * @param {number} cardIndex - 0 to 4
 * @returns {object} Framer Motion transforms configuration
 */
export function getCardTimelineConfig(cardIndex) {
  const arrival = CARD_ARRIVAL_POINTS[cardIndex];
  const enterStart = Math.max(0, arrival - TRANSITION_LENGTH);

  // Milestone points across the entire cascade
  // [0: 0.15, 1: 0.32, 2: 0.49, 3: 0.66, 4: 0.83, 5: 1.00]
  const scrollMilestones = [...CARD_ARRIVAL_POINTS, 1.00];

  const yKeyframes = [];
  const scaleKeyframes = [];
  const tintKeyframes = [];

  // 1. Entrance phase
  if (cardIndex > 0) {
    yKeyframes.push({ progress: enterStart, value: '600px' });
    scaleKeyframes.push({ progress: enterStart, value: 1.0 - PER_LEVEL_SCALE_STEP });
    tintKeyframes.push({ progress: enterStart, value: 0 });
  }

  // 2. Active in front milestone
  yKeyframes.push({ progress: arrival, value: '0px' });
  scaleKeyframes.push({ progress: arrival, value: 1.0 });
  tintKeyframes.push({ progress: arrival, value: 0 });

  // 3. Stacking behind subsequent cards
  for (let m = cardIndex + 1; m < CARD_ARRIVAL_POINTS.length; m++) {
    const nextArrival = CARD_ARRIVAL_POINTS[m];
    const level = m - cardIndex;

    if (level <= MAX_VISIBLE_BEHIND) {
      const offsetPx = -(level * PER_LEVEL_OFFSET_PX);
      const scaleVal = 1.0 - (level * PER_LEVEL_SCALE_STEP);
      const tintVal = Math.min(0.70, level * 0.22);

      yKeyframes.push({ progress: nextArrival, value: `${offsetPx}px` });
      scaleKeyframes.push({ progress: nextArrival, value: scaleVal });
      tintKeyframes.push({ progress: nextArrival, value: tintVal });
    } else {
      // Exceeds max visible behind: step off / hide
      const maxOffsetPx = -((MAX_VISIBLE_BEHIND + 1) * PER_LEVEL_OFFSET_PX);
      yKeyframes.push({ progress: nextArrival, value: `${maxOffsetPx}px` });
      scaleKeyframes.push({ progress: nextArrival, value: 1.0 - ((MAX_VISIBLE_BEHIND + 1) * PER_LEVEL_SCALE_STEP) });
      tintKeyframes.push({ progress: nextArrival, value: 0.85 });
    }
  }

  // 4. Hold at end of scroll
  const lastY = yKeyframes[yKeyframes.length - 1].value;
  const lastScale = scaleKeyframes[scaleKeyframes.length - 1].value;
  const lastTint = tintKeyframes[tintKeyframes.length - 1].value;

  yKeyframes.push({ progress: 1.00, value: lastY });
  scaleKeyframes.push({ progress: 1.00, value: lastScale });
  tintKeyframes.push({ progress: 1.00, value: lastTint });

  return {
    enterStart,
    arrival,
    inputProgressY: yKeyframes.map((k) => k.progress),
    outputY: yKeyframes.map((k) => k.value),
    inputProgressScale: scaleKeyframes.map((k) => k.progress),
    outputScale: scaleKeyframes.map((k) => k.value),
    inputProgressTint: tintKeyframes.map((k) => k.progress),
    outputTint: tintKeyframes.map((k) => k.value),
  };
}
