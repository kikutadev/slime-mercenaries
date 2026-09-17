import * as THREE from 'three';
import { describe, expect, it } from 'vitest';

import {
  TIER3_MAGIC_THRESHOLDS,
  TIER3_MAGIC_TIMING,
  TIER3_MAGIC_VFX_NODES,
  applyArchmageSignatureVfx,
  applyFrostMageSignatureVfx,
  createArchmageSignatureVfx,
  createFrostMageSignatureVfx,
  getArchmageAttackMotion,
  getFrostMageAttackMotion,
} from './magic';

type MagicPose =
  | ReturnType<typeof getArchmageAttackMotion>
  | ReturnType<typeof getFrostMageAttackMotion>;

const expectFinitePose = (pose: MagicPose): void => {
  expect(Object.values(pose.deformation).every(Number.isFinite)).toBe(true);
  expect(Object.values(pose.equipment).every(Number.isFinite)).toBe(true);

  for (const [key, value] of Object.entries(pose)) {
    if (key === 'deformation' || key === 'equipment') continue;
    expect(Number.isFinite(value), `${key} must remain finite`).toBe(true);
  }
};

describe('tier3 magic timing contract', () => {
  it('reserves explicit major-spell beats instead of reusing Mage orb cadence', () => {
    expect(TIER3_MAGIC_TIMING.archmageAttack).toBeGreaterThan(1.25);
    expect(TIER3_MAGIC_TIMING.frostMageAttack).toBeGreaterThan(1.20);
    expect(TIER3_MAGIC_THRESHOLDS.archmageReleaseU).toBeLessThan(TIER3_MAGIC_THRESHOLDS.archmageImpactU);
    expect(TIER3_MAGIC_THRESHOLDS.frostReleaseU).toBeLessThan(TIER3_MAGIC_THRESHOLDS.frostImpactU);
    expect(TIER3_MAGIC_THRESHOLDS.freezeFieldU).toBe(TIER3_MAGIC_THRESHOLDS.frostImpactU);
    expect(TIER3_MAGIC_TIMING.meteorFlight).toBeLessThan(TIER3_MAGIC_TIMING.archmageAttack * 0.30);
    expect(TIER3_MAGIC_TIMING.iceBoltFlight).toBeLessThan(TIER3_MAGIC_TIMING.frostMageAttack * 0.25);
  });

  it('returns deterministic finite poses for clamped and non-finite runtime inputs', () => {
    const samples = [
      Number.NEGATIVE_INFINITY,
      -4,
      0,
      0.17,
      0.53,
      0.76,
      1,
      3,
      Number.POSITIVE_INFINITY,
      Number.NaN,
    ];

    for (const sample of samples) {
      const archmageA = getArchmageAttackMotion(sample);
      const archmageB = getArchmageAttackMotion(sample);
      const frostA = getFrostMageAttackMotion(sample);
      const frostB = getFrostMageAttackMotion(sample);
      expectFinitePose(archmageA);
      expectFinitePose(frostA);
      expect(archmageA).toEqual(archmageB);
      expect(frostA).toEqual(frostB);
    }
  });
});

describe('Archmage production motion', () => {
  it('builds a readable coil, rune convergence, meteor drop, dominant impact, and clean return', () => {
    const coil = getArchmageAttackMotion(0.22);
    const convergence = getArchmageAttackMotion(0.47);
    const descent = getArchmageAttackMotion(0.60);
    const impact = getArchmageAttackMotion(0.74);
    const end = getArchmageAttackMotion(1);

    [coil, convergence, descent, impact, end].forEach(expectFinitePose);

    expect(coil.deformation.squash).toBeGreaterThan(0.35);
    expect(coil.runeCharge).toBeGreaterThan(0.45);

    expect(convergence.runeConvergence).toBeGreaterThan(0.75);
    expect(convergence.grandCircle).toBeGreaterThan(0.70);
    expect(convergence.meteorRelease).toBe(0);

    expect(descent.meteorRelease).toBeGreaterThan(0.45);
    expect(descent.meteorDrop).toBeGreaterThan(0.20);
    expect(descent.grandCircle).toBeCloseTo(1, 4);

    expect(impact.impactPulse).toBeGreaterThan(0.80);
    expect(impact.impactDominance).toBeGreaterThan(0.70);
    expect(impact.meteorDrop).toBe(1);

    expect(end.bodyOffset).toBeCloseTo(0, 6);
    expect(end.equipment.angle).toBeCloseTo(0, 6);
    expect(end.grandCircle).toBeCloseTo(0, 6);
    expect(end.impactDominance).toBe(0);
  });

  it('creates a giant target circle, vertical meteor rig, and screen-dominant impact surfaces', () => {
    const group = createArchmageSignatureVfx();
    const caster = new THREE.Vector3(-0.4, 0.1, 0.2);
    const target = new THREE.Vector3(0.8, 0, -0.25);
    const camera = new THREE.Quaternion();

    const convergence = getArchmageAttackMotion(0.47);
    applyArchmageSignatureVfx(group, convergence, camera, caster, target);
    const grandCircle = group.getObjectByName(TIER3_MAGIC_VFX_NODES.archmage.grandCircle) as THREE.Group;
    expect(group.visible).toBe(true);
    expect(grandCircle.visible).toBe(true);
    expect(grandCircle.scale.x).toBeGreaterThan(1.8);
    expect(grandCircle.position.x).toBeCloseTo(target.x, 6);

    const descent = getArchmageAttackMotion(0.57);
    applyArchmageSignatureVfx(group, descent, camera, caster, target);
    const meteor = group.getObjectByName(TIER3_MAGIC_VFX_NODES.archmage.meteorRig) as THREE.Group;
    expect(meteor.visible).toBe(true);
    expect(meteor.position.y).toBeGreaterThan(target.y + 0.5);
    expect(meteor.position.x).toBeCloseTo(target.x, 6);

    const impact = getArchmageAttackMotion(0.74);
    applyArchmageSignatureVfx(group, impact, camera, caster, target);
    const flash = group.getObjectByName(TIER3_MAGIC_VFX_NODES.archmage.impactFlash) as THREE.Mesh;
    const wave = group.getObjectByName(TIER3_MAGIC_VFX_NODES.archmage.impactWave) as THREE.Mesh;
    const halo = group.getObjectByName('ArchmageImpactHalo') as THREE.Mesh;
    expect(flash.visible).toBe(true);
    expect(wave.visible).toBe(true);
    expect(halo.visible).toBe(true);
    expect(flash.scale.x).toBeGreaterThan(2.8);
    expect(wave.scale.x).toBeGreaterThan(4.0);
    expect(halo.scale.x).toBeGreaterThan(3.4);
  });
});

describe('Frost Mage production motion', () => {
  it('plants the staff, locks into still cold charge, fires a lance, freezes the field, then recovers', () => {
    const plant = getFrostMageAttackMotion(0.23);
    const lock = getFrostMageAttackMotion(0.44);
    const lance = getFrostMageAttackMotion(0.55);
    const freeze = getFrostMageAttackMotion(0.72);
    const end = getFrostMageAttackMotion(1);

    [plant, lock, lance, freeze, end].forEach(expectFinitePose);

    expect(plant.staffPlant).toBeGreaterThan(0.70);
    expect(plant.deformation.squash).toBeGreaterThan(0.25);

    expect(lock.coldStillness).toBeGreaterThan(0.75);
    expect(lock.deformation.wobble).toBe(0);
    expect(lock.deformation.jump).toBe(0);
    expect(lock.boltRelease).toBe(0);

    expect(lance.boltRelease).toBeGreaterThan(0.75);
    expect(lance.iceLance).toBe(lance.boltRelease);
    expect(lance.equipment.angle).toBeGreaterThan(-0.2);

    expect(freeze.freezeField).toBeGreaterThan(0.95);
    expect(freeze.spikeBurst).toBeGreaterThan(0.95);
    expect(freeze.coldStillness).toBe(1);
    expect(freeze.deformation.wobble).toBe(0);
    expect(freeze.deformation.jump).toBe(0);

    expect(end.bodyOffset).toBeCloseTo(0, 6);
    expect(end.equipment.angle).toBeCloseTo(0, 6);
    expect(end.freezeField).toBeCloseTo(0, 6);
  });

  it('uses a sharp traveling lance followed by a large freeze field and crystal eruption', () => {
    const group = createFrostMageSignatureVfx();
    const start = new THREE.Vector3(-0.6, 0.42, 0.15);
    const target = new THREE.Vector3(0.75, 0.08, -0.3);

    const lancePose = getFrostMageAttackMotion(0.55);
    applyFrostMageSignatureVfx(group, lancePose, start, target);
    const lanceRig = group.getObjectByName(TIER3_MAGIC_VFX_NODES.frostMage.lanceRig) as THREE.Group;
    const lance = group.getObjectByName('FrostIceBolt') as THREE.Mesh;
    expect(group.visible).toBe(true);
    expect(lanceRig.visible).toBe(true);
    expect(lance.visible).toBe(true);
    expect(lanceRig.position.distanceTo(start)).toBeGreaterThan(0.3);
    expect(lanceRig.position.distanceTo(target)).toBeGreaterThan(0.05);

    const freezePose = getFrostMageAttackMotion(0.72);
    applyFrostMageSignatureVfx(group, freezePose, start, target);
    const field = group.getObjectByName(TIER3_MAGIC_VFX_NODES.frostMage.freezeField) as THREE.Mesh;
    const flash = group.getObjectByName(TIER3_MAGIC_VFX_NODES.frostMage.freezeFlash) as THREE.Mesh;
    expect(field.visible).toBe(true);
    expect(flash.visible).toBe(true);
    expect(field.scale.x).toBeGreaterThan(3.5);
    expect(field.position.x).toBeCloseTo(target.x, 6);

    const visibleSpikes = Array.from({ length: 10 }, (_, index) => (
      group.getObjectByName(`FrostSpike${index}`) as THREE.Mesh
    )).filter((spike) => spike.visible);
    expect(visibleSpikes).toHaveLength(10);
    expect(Math.max(...visibleSpikes.map((spike) => spike.scale.y))).toBeGreaterThan(1.2);
  });

  it('allows parent runtime to omit signature groups without throwing', () => {
    const archmage = getArchmageAttackMotion(0.74);
    const frost = getFrostMageAttackMotion(0.72);
    expect(() => applyArchmageSignatureVfx(
      null,
      archmage,
      new THREE.Quaternion(),
      new THREE.Vector3(),
      new THREE.Vector3(1, 0, 0),
    )).not.toThrow();
    expect(() => applyFrostMageSignatureVfx(
      null,
      frost,
      new THREE.Vector3(),
      new THREE.Vector3(1, 0, 0),
    )).not.toThrow();
  });
});
