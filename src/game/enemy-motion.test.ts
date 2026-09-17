import { describe, expect, it } from 'vitest';
import { ENEMY_MOTION_THRESHOLDS, getEnemyAttackContactU, getEnemyAttackMotion, getMushroomDefeatMotion } from './enemy-motion';
import type { EnemyBehaviorId } from './enemies';

const BEHAVIORS: readonly EnemyBehaviorId[] = ['mushroom-bump', 'mushroom-heavy-bump', 'mushroom-spore', 'mushroom-boss'];

describe('enemy motion', () => {
  it('returns finite positive scales across attack timelines', () => {
    for (const behavior of BEHAVIORS) {
      for (let step = 0; step <= 20; step += 1) {
        const pose = getEnemyAttackMotion(behavior, step / 20);
        expect(Number.isFinite(pose.scaleX)).toBe(true);
        expect(Number.isFinite(pose.scaleY)).toBe(true);
        expect(Number.isFinite(pose.scaleZ)).toBe(true);
        expect(pose.scaleX).toBeGreaterThan(0);
        expect(pose.scaleY).toBeGreaterThan(0);
        expect(pose.scaleZ).toBeGreaterThan(0);
      }
    }
  });

  it('keeps contact thresholds inside the attack timeline', () => {
    for (const behavior of BEHAVIORS) {
      expect(getEnemyAttackContactU(behavior)).toBeGreaterThan(0);
      expect(getEnemyAttackContactU(behavior)).toBeLessThan(1);
    }
    expect(ENEMY_MOTION_THRESHOLDS.sporeReleaseU).toBeLessThan(ENEMY_MOTION_THRESHOLDS.bumpContactU);
  });

  it('ends defeat in a stable flattened pose', () => {
    const pose = getMushroomDefeatMotion(1, 1);
    expect(pose.scaleX).toBeGreaterThan(1);
    expect(pose.scaleY).toBeGreaterThan(0);
    expect(pose.scaleY).toBeLessThan(0.6);
    expect(Math.abs(pose.lateralDrift)).toBeGreaterThan(0);
    expect(pose.backwardDrift).toBeGreaterThan(0);
    expect(pose.opacity).toBe(0);
  });
});
