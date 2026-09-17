import * as THREE from 'three';
import { describe, expect, it } from 'vitest';

import {
  TIER3_DEFENSE_THRESHOLDS,
  TIER3_DEFENSE_TIMING,
  applyFortressSignatureVfx,
  applyPaladinSignatureVfx,
  createFortressSignatureVfx,
  createPaladinSignatureVfx,
  getFortressAttackMotion,
  getPaladinAttackMotion,
} from './defense';

type DefensePose =
  | ReturnType<typeof getPaladinAttackMotion>
  | ReturnType<typeof getFortressAttackMotion>;

function expectFinitePose(pose: DefensePose): void {
  for (const value of Object.values(pose)) {
    if (typeof value === 'number') expect(Number.isFinite(value)).toBe(true);
  }
  expect(Object.values(pose.deformation).every(Number.isFinite)).toBe(true);
  expect(Object.values(pose.equipment).every(Number.isFinite)).toBe(true);
}

function materialOpacity(object: THREE.Object3D | undefined): number {
  if (!(object instanceof THREE.Mesh) || !(object.material instanceof THREE.MeshBasicMaterial)) return 0;
  return object.material.opacity;
}

describe('tier3 defense production motions', () => {
  it('keeps timing ordered so Paladin flashes, hits, then opens the holy barrier', () => {
    expect(TIER3_DEFENSE_TIMING.paladinAttack).toBeGreaterThan(1);
    expect(TIER3_DEFENSE_THRESHOLDS.paladinShieldFlashU)
      .toBeLessThan(TIER3_DEFENSE_THRESHOLDS.paladinContactU);
    expect(TIER3_DEFENSE_THRESHOLDS.paladinContactU)
      .toBeLessThan(TIER3_DEFENSE_THRESHOLDS.paladinBarrierStartU);

    const flash = getPaladinAttackMotion(TIER3_DEFENSE_THRESHOLDS.paladinShieldFlashU);
    const impact = getPaladinAttackMotion(TIER3_DEFENSE_THRESHOLDS.paladinContactU);
    const sanctuary = getPaladinAttackMotion(0.66);
    const end = getPaladinAttackMotion(1);

    [flash, impact, sanctuary, end].forEach(expectFinitePose);

    expect(flash.shieldFlashPulse).toBeGreaterThan(0.7);
    expect(flash.holyImpactPulse).toBe(0);

    expect(impact.strikeProgress).toBeGreaterThan(0.6);
    expect(impact.holyImpactPulse).toBeGreaterThan(0.4);
    expect(impact.bodyOffset).toBeGreaterThan(0.25);
    expect(impact.equipment.angle).toBeGreaterThan(0.25);

    expect(sanctuary.barrierProgress).toBeGreaterThan(0.3);
    expect(sanctuary.barrierPulse).toBeGreaterThan(0.4);
    expect(sanctuary.sanctuaryPulse).toBeGreaterThan(0.5);

    expect(end.bodyOffset).toBeCloseTo(0, 6);
    expect(end.deformation.squash).toBeCloseTo(0, 6);
    expect(end.deformation.jump).toBeCloseTo(0, 6);
    expect(end.equipment.angle).toBeCloseTo(0, 6);
    expect(end.equipment.lift).toBeCloseTo(0, 6);
    expect(end.equipment.sweep).toBeCloseTo(0, 6);
    expect(end.barrierPulse).toBeCloseTo(0, 6);
    expect(end.sanctuaryPulse).toBeCloseTo(0, 6);
  });

  it('keeps Fortress planted while the impact, ground wave, and fortify lock provide the motion', () => {
    expect(TIER3_DEFENSE_TIMING.fortressAttack).toBeGreaterThan(
      TIER3_DEFENSE_TIMING.paladinAttack,
    );
    expect(TIER3_DEFENSE_THRESHOLDS.fortressPlantU)
      .toBeLessThan(TIER3_DEFENSE_THRESHOLDS.fortressFortifyLockU);
    expect(TIER3_DEFENSE_THRESHOLDS.fortressFortifyLockU)
      .toBeLessThan(TIER3_DEFENSE_THRESHOLDS.fortressGroundWaveEndU);

    const plant = getFortressAttackMotion(TIER3_DEFENSE_THRESHOLDS.fortressPlantU);
    const wave = getFortressAttackMotion(0.60);
    const locked = getFortressAttackMotion(0.84);
    const end = getFortressAttackMotion(1);

    [plant, wave, locked, end].forEach(expectFinitePose);

    expect(plant.plantProgress).toBeGreaterThan(0.8);
    expect(plant.impactPulse).toBeGreaterThan(0.7);
    expect(plant.deformation.squash).toBeGreaterThan(0.5);
    expect(plant.equipment.angle).toBeLessThan(-0.7);

    expect(wave.groundWaveProgress).toBeGreaterThan(0.5);
    expect(wave.groundWavePulse).toBeGreaterThan(0.5);
    expect(wave.fortifyLock).toBeGreaterThan(0.9);
    expect(wave.bodyOffset).toBeLessThan(0.12);

    expect(locked.fortifyLock).toBe(1);
    expect(locked.lockPulse).toBeGreaterThan(0.7);
    expect(locked.deformation.squash).toBeGreaterThan(0.6);
    expect(locked.deformation.jump).toBe(0);
    expect(locked.bodyOffset).toBeLessThan(0.1);

    expect(end.bodyOffset).toBeCloseTo(0, 6);
    expect(end.fortifyLock).toBeCloseTo(0, 6);
    expect(end.lockPulse).toBeCloseTo(0, 6);
    expect(end.deformation.squash).toBeCloseTo(0, 6);
    expect(end.deformation.jump).toBe(0);
    expect(end.equipment.angle).toBeCloseTo(0, 6);
    expect(end.equipment.lift).toBeCloseTo(0, 6);
  });

  it('never adds a Fortress hop or a Guardian-like dash across the full authored timeline', () => {
    for (let step = 0; step <= 100; step += 1) {
      const pose = getFortressAttackMotion(step / 100);
      expectFinitePose(pose);
      expect(pose.deformation.jump).toBe(0);
      expect(Math.abs(pose.bodyOffset)).toBeLessThan(0.12);
    }
  });

  it('returns finite, stable poses for clamped and non-finite runtime inputs', () => {
    const inputs = [
      -10,
      -1,
      0,
      0.25,
      0.5,
      0.75,
      1,
      2,
      10,
      Number.NaN,
      Number.POSITIVE_INFINITY,
      Number.NEGATIVE_INFINITY,
    ];

    for (const input of inputs) {
      expectFinitePose(getPaladinAttackMotion(input));
      expectFinitePose(getFortressAttackMotion(input));
    }

    expect(getPaladinAttackMotion(-1)).toEqual(getPaladinAttackMotion(0));
    expect(getPaladinAttackMotion(2)).toEqual(getPaladinAttackMotion(1));
    expect(getFortressAttackMotion(-1)).toEqual(getFortressAttackMotion(0));
    expect(getFortressAttackMotion(2)).toEqual(getFortressAttackMotion(1));
    expect(getPaladinAttackMotion(Number.NaN)).toEqual(getPaladinAttackMotion(0));
    expect(getFortressAttackMotion(Number.POSITIVE_INFINITY)).toEqual(
      getFortressAttackMotion(0),
    );
  });
});

describe('tier3 defense signature VFX contracts', () => {
  const cameraQuaternion = new THREE.Quaternion();
  const caster = new THREE.Vector3(1, 0.2, -2);
  const shield = new THREE.Vector3(1.25, 0.55, -2.15);

  it('exposes a shield-local holy flash and post-impact Paladin barrier/sanctuary', () => {
    const group = createPaladinSignatureVfx();

    expect(group.name).toBe('PaladinSignatureVfx');
    expect(group.getObjectByName('PaladinShieldFlashRing')).toBeDefined();
    expect(group.getObjectByName('PaladinHolyImpact')).toBeDefined();
    expect(group.getObjectByName('PaladinBarrierShell')).toBeDefined();
    expect(group.getObjectByName('PaladinSanctuaryOuter')).toBeDefined();

    const flashPose = getPaladinAttackMotion(TIER3_DEFENSE_THRESHOLDS.paladinShieldFlashU);
    applyPaladinSignatureVfx(group, flashPose, cameraQuaternion, caster, shield);

    const flash = group.getObjectByName('PaladinShieldFlashRing');
    const barrier = group.getObjectByName('PaladinBarrierShell');
    expect(group.visible).toBe(true);
    expect(flash?.visible).toBe(true);
    expect(flash?.position.x).toBeCloseTo(shield.x, 6);
    expect(materialOpacity(flash)).toBeGreaterThan(0.6);
    expect(barrier?.visible).toBe(false);

    const barrierPose = getPaladinAttackMotion(0.66);
    applyPaladinSignatureVfx(group, barrierPose, cameraQuaternion, caster, shield);

    const sanctuary = group.getObjectByName('PaladinSanctuaryOuter');
    expect(flash?.visible).toBe(false);
    expect(barrier?.visible).toBe(true);
    expect(barrier?.position.x).toBeCloseTo(caster.x, 6);
    expect(materialOpacity(barrier)).toBeGreaterThan(0.05);
    expect(sanctuary?.visible).toBe(true);
    expect(materialOpacity(sanctuary)).toBeGreaterThan(0.3);

    applyPaladinSignatureVfx(group, getPaladinAttackMotion(1), cameraQuaternion, caster, shield);
    expect(group.visible).toBe(false);
  });

  it('exposes Fortress plant dust, expanding ground wave, and persistent lock geometry', () => {
    const group = createFortressSignatureVfx();

    expect(group.name).toBe('FortressSignatureVfx');
    expect(group.getObjectByName('FortressPlantImpact')).toBeDefined();
    expect(group.getObjectByName('FortressGroundWave')).toBeDefined();
    expect(group.getObjectByName('FortressLockRing')).toBeDefined();
    expect(group.getObjectByName('FortressDust0')).toBeDefined();
    expect(group.getObjectByName('FortressLockPlate0')).toBeDefined();

    const plantPose = getFortressAttackMotion(TIER3_DEFENSE_THRESHOLDS.fortressPlantU);
    applyFortressSignatureVfx(group, plantPose, cameraQuaternion, caster);

    const impact = group.getObjectByName('FortressPlantImpact');
    const dust = group.getObjectByName('FortressDust0');
    const lock = group.getObjectByName('FortressLockRing');
    expect(group.visible).toBe(true);
    expect(impact?.visible).toBe(true);
    expect(materialOpacity(impact)).toBeGreaterThan(0.4);
    expect(dust?.visible).toBe(true);
    expect(materialOpacity(dust)).toBeGreaterThan(0.2);
    expect(lock?.visible).toBe(true);

    const wavePose = getFortressAttackMotion(0.60);
    applyFortressSignatureVfx(group, wavePose, cameraQuaternion, caster);

    const wave = group.getObjectByName('FortressGroundWave');
    expect(wave?.visible).toBe(true);
    expect(materialOpacity(wave)).toBeGreaterThan(0.3);
    expect(lock?.visible).toBe(true);
    expect(materialOpacity(lock)).toBeGreaterThan(0.2);

    const lockedPose = getFortressAttackMotion(0.84);
    applyFortressSignatureVfx(group, lockedPose, cameraQuaternion, caster);
    expect(wave?.visible).toBe(false);
    expect(lock?.visible).toBe(true);
    expect(group.getObjectByName('FortressLockPlate0')?.visible).toBe(true);

    applyFortressSignatureVfx(group, getFortressAttackMotion(1), cameraQuaternion, caster);
    expect(group.visible).toBe(false);
  });
});
