import { describe, expect, it } from 'vitest';
import { CAMP_IDLE_MOTION_CYCLE_SEC, getCampIdleMotion } from './camp-slime-motion';

describe('camp slime idle motion', () => {
  it('adds visible travel, hops, and turns during one observation cycle', () => {
    const poses = Array.from({ length: 93 }, (_, index) =>
      getCampIdleMotion(index / 10, 'sword'));

    const xValues = poses.map((pose) => pose.offsetX);
    const yValues = poses.map((pose) => pose.offsetY);
    const yawValues = poses.map((pose) => pose.yawOffset);

    expect(Math.max(...xValues) - Math.min(...xValues)).toBeGreaterThan(0.08);
    expect(Math.max(...yValues) - Math.min(...yValues)).toBeGreaterThan(0.09);
    expect(Math.max(...yawValues) - Math.min(...yawValues)).toBeGreaterThan(0.22);
  });

  it('keeps idle travel bounded so the selected slime stays inside the Camp hero stage', () => {
    for (const slimeId of ['sword', 'shield', 'bow', 'wand', 'dagger', 'gun', 'mimic'] as const) {
      for (let index = 0; index <= 184; index += 1) {
        const pose = getCampIdleMotion(index / 20, slimeId);
        expect(Math.abs(pose.offsetX)).toBeLessThanOrEqual(0.13);
        expect(pose.offsetY).toBeGreaterThanOrEqual(-0.02);
        expect(pose.offsetY).toBeLessThanOrEqual(0.16);
        expect(Math.abs(pose.roll)).toBeLessThanOrEqual(0.10);
      }
    }
  });

  it('gives energetic and sturdy jobs different idle character without changing the cycle length', () => {
    const dagger = getCampIdleMotion(3.7, 'dagger');
    const shield = getCampIdleMotion(3.7, 'shield');

    expect(dagger.offsetY).toBeGreaterThan(shield.offsetY);
    expect(Math.abs(dagger.offsetX)).toBeGreaterThan(Math.abs(shield.offsetX));
    expect(CAMP_IDLE_MOTION_CYCLE_SEC).toBeGreaterThan(8);
  });
});
