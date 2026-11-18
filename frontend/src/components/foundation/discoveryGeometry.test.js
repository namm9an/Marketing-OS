import { describe, expect, it } from 'vitest';
import { agentForProgress, cardPose, clampProgress, expansionFor, progressForAgent } from './discoveryGeometry';

describe('five-agent discovery geometry', () => {
  it('gives every direct role choice a distinct focal state with matching selected content', () => {
    const positions = Array.from({ length: 5 }, (_, index) => progressForAgent(index));
    expect(new Set(positions).size).toBe(5);
    positions.forEach((progress, index) => {
      expect(agentForProgress(progress)).toBe(index);
      const poses = positions.map((_, item) => cardPose(item, progress, 1200, index));
      expect(Math.abs(poses[index].x)).toBeLessThan(.0001);
      expect(poses[index].zIndex).toBeGreaterThan(Math.max(...poses.filter((_, item) => item !== index).map(pose => pose.zIndex)));
    });
  });

  it('moves the foreground left on forward travel, returns exactly on reverse and has no clock input', () => {
    const start = progressForAgent(0);
    const initial = cardPose(0, start, 1100, 0);
    expect(cardPose(0, start + .02, 1100, 0).x).toBeLessThan(initial.x);
    expect(cardPose(0, start, 1100, 0)).toEqual(initial);
  });

  it('responds to the first small scroll before full gallery rotation begins', () => {
    const initial = cardPose(0, 0, 1100, 0);
    const response = cardPose(0, .08, 1100, 0);
    expect(response.x).toBeLessThan(initial.x);
    expect(response.y).toBeLessThan(initial.y);
    expect(agentForProgress(.08)).toBe(0);
  });

  it('keeps the chosen identity when jumping out of the gallery to read its full result', () => {
    expect(agentForProgress(1, 1)).toBe(1);
    expect(agentForProgress(.9, 3)).toBe(3);
    expect(agentForProgress(progressForAgent(2), 3)).toBe(2);
    expect(cardPose(1, 1, 1100, 1).opacity).toBe(1);
    expect(cardPose(1, 1, 1100, 1).x).toBeLessThan(0);
  });

  it('has bounded finite geometry for narrow, wide and invalid measurements at every phase', () => {
    for (const width of [0, 320, 900, 1920, 8000, NaN]) {
      for (const progress of [-2, 0, .18, .66, .84, 1, 4, NaN]) {
        for (let index = 0; index < 5; index++) {
          const pose = cardPose(index, progress, width, agentForProgress(progress));
          Object.values(pose).forEach(value => expect(Number.isFinite(value)).toBe(true));
          expect(pose.opacity).toBeGreaterThanOrEqual(0);
          expect(pose.opacity).toBeLessThanOrEqual(1);
          expect(pose.scale).toBeGreaterThan(0);
        }
      }
    }
    expect(clampProgress(NaN)).toBe(0);
    expect(clampProgress(Infinity)).toBe(0);
    expect(expansionFor(-1)).toBe(0);
    expect(expansionFor(2)).toBe(1);
  });
});
