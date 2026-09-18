import { describe, expect, it } from 'vitest';
import {
  BOSS_APPROACH_SECONDS,
  BOSS_LANDING_SECONDS,
  getApproachCameraRetreat,
  getBossApproachPresentation,
  getEnemyApproachEntryPose,
  getSceneryApproachOffset,
} from './battle-approach';

describe('battle approach presentation', () => {
  it('moves enemies from behind their authored slot into a stable terminal pose', () => {
    const start = getEnemyApproachEntryPose(0, 0, 'front-center', 'fodder');
    const mid = getEnemyApproachEntryPose(0.32, 0, 'front-center', 'fodder');
    const end = getEnemyApproachEntryPose(2, 0, 'front-center', 'fodder');

    expect(start.zOffset).toBeLessThan(0);
    expect(start.scale).toBeLessThan(1);
    expect(mid.yOffset).toBeGreaterThan(0);
    expect(end.zOffset).toBeCloseTo(0);
    expect(end.yOffset).toBeCloseTo(0);
    expect(end.scale).toBeCloseTo(1);
    expect(end.shadowOpacity).toBeCloseTo(0.22);
    expect(end.shadowScale).toBeCloseTo(1);
  });

  it('delays deeper formation bands and keeps boss entry heavier than fodder', () => {
    const front = getEnemyApproachEntryPose(0.2, 0, 'front-left', 'fodder');
    const rear = getEnemyApproachEntryPose(0.2, 0, 'rear-left', 'fodder');
    const boss = getEnemyApproachEntryPose(0, 0, 'front-center', 'boss');

    expect(rear.zOffset).toBeLessThan(front.zOffset);
    expect(boss.zOffset).toBeLessThan(front.zOffset);
    expect(boss.scale).toBeGreaterThan(0.7);
  });

  it('gives the boss a long camera lead-in and a single heavy landing window', () => {
    const start = getBossApproachPresentation(0);
    const landing = getBossApproachPresentation(BOSS_LANDING_SECONDS);
    const end = getBossApproachPresentation(BOSS_APPROACH_SECONDS);

    expect(start.cameraRetreat).toBeGreaterThan(0.4);
    expect(landing.squash).toBeCloseTo(1);
    expect(end.cameraRetreat).toBeCloseTo(0);
    expect(end.squash).toBe(0);
    expect(BOSS_APPROACH_SECONDS).toBeGreaterThan(1.55);
  });

  it('settles scenery and camera movement before combat begins', () => {
    expect(getSceneryApproachOffset(0)).toBeCloseTo(-0.34);
    expect(getSceneryApproachOffset(2)).toBeCloseTo(0);
    expect(getApproachCameraRetreat(0)).toBeCloseTo(0.22);
    expect(getApproachCameraRetreat(2)).toBeCloseTo(0);
  });

  it('keeps generated values finite and bounded', () => {
    for (const elapsed of [-1, 0, 0.2, 0.6, 1, 2]) {
      const pose = getEnemyApproachEntryPose(elapsed, 11, 'rear-right', 'elite');
      for (const value of Object.values(pose)) expect(Number.isFinite(value)).toBe(true);
      expect(pose.scale).toBeGreaterThan(0);
      expect(pose.shadowOpacity).toBeGreaterThanOrEqual(0);
      expect(pose.shadowOpacity).toBeLessThanOrEqual(0.22);
    }
  });
});
