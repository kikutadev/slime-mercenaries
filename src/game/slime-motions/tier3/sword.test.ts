import * as THREE from 'three';
import { describe, expect, it } from 'vitest';

import {
  TIER3_SWORD_RUNTIME_CUES,
  TIER3_SWORD_THRESHOLDS,
  TIER3_SWORD_TIMING,
  createBerserkerSignatureVfx,
  createBlademasterSignatureVfx,
  getBerserkerAttackMotion,
  getBerserkerSignatureVfxPose,
  getBlademasterAttackMotion,
  getBlademasterSignatureVfxPose,
} from './sword';

type NumericRecord = Record<string, unknown>;

const expectFiniteNumbers = (value: unknown): void => {
  if (typeof value === 'number') {
    expect(Number.isFinite(value)).toBe(true);
    return;
  }
  if (value !== null && typeof value === 'object') {
    Object.values(value as NumericRecord).forEach(expectFiniteNumbers);
  }
};

describe('tier3 sword production motions', () => {
  it('returns finite stable poses for clamped and malformed progress', () => {
    const samples = [
      Number.NEGATIVE_INFINITY,
      -10,
      -1,
      0,
      0.13,
      0.37,
      0.50,
      0.76,
      1,
      2,
      10,
      Number.POSITIVE_INFINITY,
      Number.NaN,
    ];

    for (const sample of samples) {
      expectFiniteNumbers(getBlademasterAttackMotion(sample));
      expectFiniteNumbers(getBerserkerAttackMotion(sample));
    }

    const blademasterStart = getBlademasterAttackMotion(Number.NaN);
    const blademasterEnd = getBlademasterAttackMotion(Number.POSITIVE_INFINITY);
    const berserkerStart = getBerserkerAttackMotion(Number.NEGATIVE_INFINITY);
    const berserkerEnd = getBerserkerAttackMotion(10);

    expect(blademasterStart.bodyOffset).toBe(0);
    expect(blademasterEnd.bodyOffset).toBeCloseTo(0, 6);
    expect(blademasterEnd.equipment.angle).toBeCloseTo(0, 6);
    expect(berserkerStart.bodyOffset).toBeCloseTo(0, 6);
    expect(berserkerEnd.bodyOffset).toBeCloseTo(0, 6);
    expect(berserkerEnd.equipment.angle).toBeCloseTo(0, 6);
  });

  it('makes Blademaster read as vanish, pass-through, stillness, then delayed cut', () => {
    const coil = getBlademasterAttackMotion(0.17);
    const dash = getBlademasterAttackMotion(0.30);
    const hold = getBlademasterAttackMotion(0.48);
    const cut = getBlademasterAttackMotion(0.66);
    const end = getBlademasterAttackMotion(1);

    expect(coil.deformation.squash).toBeGreaterThan(0.45);

    expect(dash.bodyOffset).toBeGreaterThan(0.85);
    expect(dash.bodyVisibility).toBeLessThan(0.35);
    expect(dash.afterimagePulse).toBeGreaterThan(0.65);
    expect(dash.cutProgress).toBeLessThan(0);

    expect(hold.bodyOffset).toBeGreaterThan(1.35);
    expect(hold.behindTargetHold).toBeGreaterThan(0.7);
    expect(hold.cutProgress).toBeLessThan(0);

    expect(cut.cutProgress).toBeGreaterThan(0.5);
    expect(cut.hitStopPulse).toBeGreaterThan(0.5);
    expect(end.bodyOffset).toBeCloseTo(0, 6);
    expect(end.equipment.angle).toBeCloseTo(0, 6);
  });

  it('exposes Blademaster signature timing and VFX as a runtime contract', () => {
    expect(TIER3_SWORD_TIMING.blademasterAttack).toBeGreaterThan(0.8);
    expect(TIER3_SWORD_THRESHOLDS.blademasterDashStartU)
      .toBeLessThan(TIER3_SWORD_THRESHOLDS.blademasterDashEndU);
    expect(TIER3_SWORD_THRESHOLDS.blademasterDashEndU)
      .toBeLessThan(TIER3_SWORD_THRESHOLDS.blademasterBehindHoldEndU);
    expect(TIER3_SWORD_THRESHOLDS.blademasterBehindHoldEndU)
      .toBeLessThan(TIER3_SWORD_THRESHOLDS.blademasterCutU);
    expect(TIER3_SWORD_RUNTIME_CUES.blademaster.hitStopSeconds).toBeGreaterThan(0);
    expect(TIER3_SWORD_RUNTIME_CUES.blademaster.hitStopSeconds).toBeLessThan(0.08);
    expect(TIER3_SWORD_RUNTIME_CUES.blademaster.afterimageCount).toBeGreaterThanOrEqual(3);

    const dashPose = getBlademasterAttackMotion(0.30);
    const cutPose = getBlademasterAttackMotion(0.66);
    const dashVfx = getBlademasterSignatureVfxPose(dashPose);
    const cutVfx = getBlademasterSignatureVfxPose(cutPose);

    expectFiniteNumbers(dashVfx);
    expectFiniteNumbers(cutVfx);
    expect(dashVfx.dashVisible).toBe(true);
    expect(dashVfx.delayedCutVisible).toBe(false);
    expect(dashVfx.afterimageOpacity).toBeGreaterThan(0.5);
    expect(cutVfx.dashVisible).toBe(false);
    expect(cutVfx.delayedCutVisible).toBe(true);
    expect(cutVfx.cutOpacity).toBeGreaterThan(0.5);
    expect(cutVfx.cutScaleX).toBeGreaterThan(1.3);
    expect(cutVfx.hitStopSeconds).toBe(TIER3_SWORD_RUNTIME_CUES.blademaster.hitStopSeconds);

    const group = createBlademasterSignatureVfx();
    expect(group.getObjectByName('BlademasterDelayedCut')).toBeTruthy();
    expect(group.getObjectByName('BlademasterCutEcho')).toBeTruthy();
    expect(
      group.children.filter((child) => child.name.startsWith('BlademasterDashStreak')),
    ).toHaveLength(TIER3_SWORD_RUNTIME_CUES.blademaster.afterimageCount);
  });

  it('makes Berserker read as deep windup, explosive impact, then long recoil', () => {
    const windup = getBerserkerAttackMotion(0.32);
    const impact = getBerserkerAttackMotion(0.50);
    const recoil = getBerserkerAttackMotion(0.70);
    const end = getBerserkerAttackMotion(1);

    expect(windup.deformation.squash).toBeGreaterThan(0.6);
    expect(Math.abs(windup.equipment.angle)).toBeGreaterThan(1.2);

    expect(impact.impactProgress).toBeGreaterThan(0.8);
    expect(impact.impactPulse).toBeGreaterThan(0.9);
    expect(impact.groundImpactPulse).toBeGreaterThan(0.9);
    expect(impact.debrisPulse).toBeGreaterThan(0.8);
    expect(impact.hitStopPulse).toBeGreaterThan(0.9);

    expect(recoil.recoilProgress).toBeGreaterThan(0.4);
    expect(recoil.deformation.squash).toBeGreaterThan(0.2);
    expect(Math.abs(recoil.deformation.wobble)).toBeGreaterThan(0.2);

    expect(end.bodyOffset).toBeCloseTo(0, 6);
    expect(end.equipment.angle).toBeCloseTo(0, 6);
  });

  it('exposes Berserker ground impact, debris and restrained flash as a runtime contract', () => {
    expect(TIER3_SWORD_THRESHOLDS.berserkerWindupEndU)
      .toBeLessThan(TIER3_SWORD_THRESHOLDS.berserkerImpactU);
    expect(TIER3_SWORD_THRESHOLDS.berserkerImpactU)
      .toBeLessThan(TIER3_SWORD_THRESHOLDS.berserkerFollowThroughU);
    expect(TIER3_SWORD_THRESHOLDS.berserkerFollowThroughU)
      .toBeLessThan(TIER3_SWORD_THRESHOLDS.berserkerRecoveryStartU);
    expect(TIER3_SWORD_RUNTIME_CUES.berserker.hitStopSeconds).toBeGreaterThan(
      TIER3_SWORD_RUNTIME_CUES.blademaster.hitStopSeconds,
    );

    const impactPose = getBerserkerAttackMotion(TIER3_SWORD_THRESHOLDS.berserkerImpactU);
    const vfx = getBerserkerSignatureVfxPose(impactPose);

    expectFiniteNumbers(vfx);
    expect(vfx.visible).toBe(true);
    expect(vfx.arcOpacity).toBeGreaterThan(0.6);
    expect(vfx.groundRingOpacity).toBeGreaterThan(0.5);
    expect(vfx.debrisOpacity).toBeGreaterThan(0.6);
    expect(vfx.flashOpacity).toBeLessThanOrEqual(0.42);
    expect(vfx.hitStopSeconds).toBe(TIER3_SWORD_RUNTIME_CUES.berserker.hitStopSeconds);
    expect(vfx.cameraShakeDuration).toBe(TIER3_SWORD_RUNTIME_CUES.berserker.cameraShakeDuration);
    expect(vfx.cameraShakeAmplitude).toBe(TIER3_SWORD_RUNTIME_CUES.berserker.cameraShakeAmplitude);

    const group = createBerserkerSignatureVfx();
    expect(group.getObjectByName('BerserkerImpactArc')).toBeTruthy();
    expect(group.getObjectByName('BerserkerGroundRing')).toBeTruthy();
    expect(group.getObjectByName('BerserkerImpactFlash')).toBeTruthy();
    expect(
      group.children.filter((child) => child.name.startsWith('BerserkerShard')),
    ).toHaveLength(TIER3_SWORD_RUNTIME_CUES.berserker.debrisCount);
  });

  it('keeps VFX application geometry constructible in the headless test environment', () => {
    const blademaster = createBlademasterSignatureVfx();
    const berserker = createBerserkerSignatureVfx();

    expect(blademaster).toBeInstanceOf(THREE.Group);
    expect(berserker).toBeInstanceOf(THREE.Group);
    expect(blademaster.visible).toBe(false);
    expect(berserker.visible).toBe(false);
  });
});
