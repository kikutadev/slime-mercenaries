import { describe, expect, it } from 'vitest';
import {
  SLIME_MOTION_THRESHOLDS,
  getDaggerAttackMotion,
  getFighterAttackMotion,
  getGunAttackMotion,
  getGunnerAttackMotion,
  getGunnerShotReleaseU,
  getGuardianAttackMotion,
  getMageAttackMotion,
  getRangerAttackMotion,
  getRangerShotReleaseU,
  getRogueAttackMotion,
  getShieldAttackMotion,
  getWandAttackMotion,
  type EquipmentPose,
  type SlimeDeformationPose,
} from './slime-motion';

const finitePose = (pose: { deformation: SlimeDeformationPose; equipment: EquipmentPose }) => {
  expect([pose.deformation.squash, pose.deformation.stretch, pose.deformation.lean, pose.deformation.wobble, pose.deformation.jump].every(Number.isFinite)).toBe(true);
  expect([pose.equipment.angle, pose.equipment.lift, pose.equipment.sweep].every(Number.isFinite)).toBe(true);
};

describe('production branch motion poses', () => {
  it('keeps every pose finite and returns to a stable endpoint', () => {
    for (const getPose of [getShieldAttackMotion, getWandAttackMotion, getDaggerAttackMotion, getGunAttackMotion]) {
      for (const u of [0, 0.2, 0.5, 0.8, 1]) finitePose(getPose(u));
      const end = getPose(1);
      expect(Math.abs(end.deformation.lean)).toBeLessThan(0.001);
      expect(Math.abs(end.equipment.angle)).toBeLessThan(0.001);
    }
  });

  it('authors distinct branch identities around their contact/release frames', () => {
    expect(getShieldAttackMotion(SLIME_MOTION_THRESHOLDS.shieldContactU).bodyOffset).toBeGreaterThan(0.1);
    expect(getDaggerAttackMotion(SLIME_MOTION_THRESHOLDS.daggerContactU).bodyOffset).toBeGreaterThan(0.2);
    expect(getWandAttackMotion(SLIME_MOTION_THRESHOLDS.wandReleaseU).castProgress).toBeGreaterThanOrEqual(0);
    expect(getGunAttackMotion(SLIME_MOTION_THRESHOLDS.gunReleaseU).shotProgress).toBeGreaterThanOrEqual(0);
  });

  it('makes Guardian bracing stronger than Shield and restores equipment at the end', () => {
    const tier1 = getShieldAttackMotion(0.32);
    const tier2 = getGuardianAttackMotion(0.32);
    expect(tier2.deformation.squash).toBeGreaterThan(tier1.deformation.squash + 0.05);
    expect(tier2.equipment.lift).toBeGreaterThan(tier1.equipment.lift + 0.04);
    expect(tier2.bodyOffset).toBeLessThan(tier1.bodyOffset + 0.05);
    const end = getGuardianAttackMotion(1);
    expect(end.equipment.angle).toBeCloseTo(0);
    expect(end.equipment.lift).toBeCloseTo(0);
    expect(end.deformation.squash).toBeCloseTo(0);
  });

  it('gives Gunner three alternating recoil beats, not three identical Gun attacks', () => {
    const first = getGunnerAttackMotion(0.32 / 3 + 0.05);
    const second = getGunnerAttackMotion(1 / 3 + 0.32 / 3 + 0.05);
    const third = getGunnerAttackMotion(2 / 3 + 0.32 / 3 + 0.05);
    expect(Math.sign(first.equipment.sweep)).toBe(-Math.sign(second.equipment.sweep));
    expect(Math.sign(third.equipment.sweep)).toBe(Math.sign(first.equipment.sweep));
    expect(Math.abs(first.deformation.lean - second.deformation.lean)).toBeGreaterThan(0.05);
    expect(getGunnerAttackMotion(1).equipment.sweep).toBeCloseTo(0);
  });

  it('keeps Fighter hits and Ranger shots ordered as connected two-step attacks', () => {
    const fighterFirst = getFighterAttackMotion(0.34);
    const fighterSecond = getFighterAttackMotion(0.78);
    expect(fighterFirst.comboHit).toBe(0);
    expect(fighterSecond.comboHit).toBe(1);
    expect(fighterFirst.slashDirection).toBe(1);
    expect(fighterSecond.slashDirection).toBe(-1);

    const rangerFirst = getRangerAttackMotion(0.30);
    const rangerSecond = getRangerAttackMotion(0.76);
    expect(rangerFirst.shotIndex).toBe(0);
    expect(rangerSecond.shotIndex).toBe(1);
    expect(getRangerShotReleaseU(0)).toBeLessThan(getRangerShotReleaseU(1));
    expect(getRangerShotReleaseU(1)).toBeLessThan(1);
  });


  it('keeps Guardian, Mage, Rogue, and Gunner production signatures distinct', () => {
    const guardian = getGuardianAttackMotion(SLIME_MOTION_THRESHOLDS.guardianContactU + 0.08);
    expect(guardian.guardPulse).toBeGreaterThan(0);
    expect(guardian.bodyOffset).toBeGreaterThan(0.05);

    const mage = getMageAttackMotion(SLIME_MOTION_THRESHOLDS.mageReleaseU);
    expect(mage.runePulse).toBeGreaterThan(0);
    expect(Number.isFinite(mage.runeRotation)).toBe(true);

    const rogueFirst = getRogueAttackMotion(0.30);
    const rogueSecond = getRogueAttackMotion(0.72);
    expect(rogueFirst.comboHit).toBe(0);
    expect(rogueSecond.comboHit).toBe(1);
    expect(Math.sign(rogueFirst.deformation.lean)).not.toBe(Math.sign(rogueSecond.deformation.lean));

    const gunner = getGunnerAttackMotion(0.52);
    finitePose(gunner);
    expect(gunner.shotIndex).toBe(1);
    expect(getGunnerShotReleaseU(0)).toBeLessThan(getGunnerShotReleaseU(1));
    expect(getGunnerShotReleaseU(1)).toBeLessThan(getGunnerShotReleaseU(2));
    expect(getGunnerShotReleaseU(2)).toBeLessThan(1);
  });

});
