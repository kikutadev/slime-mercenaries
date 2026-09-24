import { describe, expect, it } from 'vitest';
import {
  BOSS_CAMERA_BASE_POSITION,
  CAMERA_BASE_POSITION,
  CAMERA_LOOK_AT,
  allyHome,
  allyOpeningAttackDelay,
  meleeCombatAnchor,
} from './layout';

describe('battle presentation layout', () => {
  it('keeps normal encounters closer than boss framing', () => {
    const normalDistance = CAMERA_BASE_POSITION.distanceTo(CAMERA_LOOK_AT);
    const bossDistance = BOSS_CAMERA_BASE_POSITION.distanceTo(CAMERA_LOOK_AT);
    expect(normalDistance).toBeLessThan(bossDistance);
  });

  it('keeps melee presentation anchors separated for a six-slime party', () => {
    const anchors = Array.from({ length: 6 }, (_, slotIndex) => meleeCombatAnchor(slotIndex));
    let minimumDistance = Number.POSITIVE_INFINITY;

    for (let left = 0; left < anchors.length; left += 1) {
      for (let right = left + 1; right < anchors.length; right += 1) {
        minimumDistance = Math.min(minimumDistance, anchors[left]!.distanceTo(anchors[right]!));
      }
    }

    expect(minimumDistance).toBeGreaterThanOrEqual(0.44);
  });

  it('stages the first six-job attack instead of firing every presentation cue together', () => {
    const delays = [
      allyOpeningAttackDelay(0, true),
      allyOpeningAttackDelay(1, true),
      allyOpeningAttackDelay(2, false),
      allyOpeningAttackDelay(3, false),
      allyOpeningAttackDelay(4, true),
      allyOpeningAttackDelay(5, false),
    ];
    expect(new Set(delays).size).toBe(delays.length);
    expect(Math.max(...delays) - Math.min(...delays)).toBeGreaterThan(0.6);
    expect(Math.max(...delays)).toBeLessThan(1);
  });

  it('keeps battle homes in two readable portrait rows', () => {
    const front = [0, 1, 2].map(allyHome);
    const rear = [3, 4, 5].map(allyHome);
    expect(Math.max(...front.map((position) => position.z)))
      .toBeLessThan(Math.min(...rear.map((position) => position.z)));
  });
});
