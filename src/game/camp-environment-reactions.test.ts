import { describe, expect, it } from 'vitest';
import {
  campFormationFlagRotation,
  campFusionAltarPose,
  campNurseryBubblePose,
  campTrainingDummyHit,
} from './camp-environment-reactions';

describe('camp environment reactions', () => {
  it('adds a temporary fusion pulse without changing the idle-ready baseline contract', () => {
    const baseline = campFusionAltarPose(2, true, 'idle', -1);
    const reacting = campFusionAltarPose(2, true, 'fusion', 0.575);

    expect(reacting.ringRotationY).toBeGreaterThan(baseline.ringRotationY);
    expect(reacting.ringScale).toBeGreaterThan(baseline.ringScale);
    expect(reacting.crystalScale(0)).toBeGreaterThan(baseline.crystalScale(0));
  });

  it('keeps the nursery bubble in its authored narrow float range', () => {
    for (let index = 0; index < 100; index += 1) {
      const pose = campNurseryBubblePose(index / 10);
      expect(pose.y).toBeGreaterThanOrEqual(0.845);
      expect(pose.y).toBeLessThanOrEqual(0.915);
      expect(pose.scaleY).toBeGreaterThanOrEqual(0.965);
      expect(pose.scaleY).toBeLessThanOrEqual(1.035);
    }
  });

  it('adds formation flag acknowledgement only during the formation window', () => {
    const base = campFormationFlagRotation(1.2, 'idle', -1);
    const reacting = campFormationFlagRotation(1.2, 'formation', 0.15);
    const finished = campFormationFlagRotation(1.2, 'formation', 0.9);

    expect(reacting).not.toBe(base);
    expect(finished).toBe(base);
  });

  it('uses the stronger of player and resident dummy impacts', () => {
    const residentOnly = campTrainingDummyHit('idle', -1, 0.42);
    const player = campTrainingDummyHit('level-up', 0.12, 0.1);

    expect(residentOnly).toBe(0.42);
    expect(player).toBeGreaterThan(0.1);
  });
});
