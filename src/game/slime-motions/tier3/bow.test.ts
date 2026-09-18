import * as THREE from 'three';
import { describe, expect, it } from 'vitest';

import { getRangerAttackMotion, getRangerShotReleaseU } from '../../slime-motion';
import {
  TIER3_BOW_THRESHOLDS,
  TIER3_BOW_TIMING,
  applySniperSignatureVfx,
  applyStormSignatureVfx,
  createSniperSignatureVfx,
  createStormSignatureVfx,
  getSniperAttackMotion,
  getStormArcherAttackMotion,
  getStormShotReleaseU,
} from './bow';

type BowPose = ReturnType<typeof getSniperAttackMotion> | ReturnType<typeof getStormArcherAttackMotion>;

function expectFinitePose(pose: BowPose): void {
  expect(Object.values(pose.deformation).every(Number.isFinite)).toBe(true);
  expect(Object.values(pose.equipment).every(Number.isFinite)).toBe(true);

  for (const value of Object.values(pose)) {
    if (typeof value === 'number') expect(Number.isFinite(value)).toBe(true);
    if (Array.isArray(value)) expect(value.every((entry) => Number.isFinite(entry))).toBe(true);
  }
}

function expectZeroPose(
  values: object,
  precision = 7,
): void {
  Object.values(values).forEach((value) => expect(value as number).toBeCloseTo(0, precision));
}

function beamDirection(mesh: THREE.Object3D): THREE.Vector3 {
  return new THREE.Vector3(1, 0, 0).applyQuaternion(mesh.quaternion).normalize();
}

describe('tier3 bow motion stability', () => {
  it('keeps Sniper and Storm Archer finite for clamped and out-of-range samples', () => {
    for (let index = 0; index <= 120; index += 1) {
      const u = -0.25 + index * (1.5 / 120);
      expectFinitePose(getSniperAttackMotion(u));
      expectFinitePose(getStormArcherAttackMotion(u));
    }
  });

  it('returns both signatures to a stable combat anchor at u=1', () => {
    const sniper = getSniperAttackMotion(1);
    expectZeroPose(sniper.deformation);
    expectZeroPose(sniper.equipment);
    expect(sniper.recoil).toBeCloseTo(0, 7);
    expect(sniper.sightLockPulse).toBeCloseTo(0, 7);
    expect(sniper.shotFlash).toBeCloseTo(0, 7);
    expect(sniper.trailPulse).toBeCloseTo(0, 7);
    expect(sniper.criticalPulse).toBeCloseTo(0, 7);

    const storm = getStormArcherAttackMotion(1);
    expectZeroPose(storm.deformation);
    expectZeroPose(storm.equipment);
    expect(storm.bodyOffset).toBeCloseTo(0, 7);
    expect(storm.electricPulse).toBeCloseTo(0, 7);
    expect(storm.chainPulse).toBeCloseTo(0, 7);
    expect(storm.shotPulses).toEqual([0, 0, 0]);
  });
});

describe('tier3 distinction from Ranger', () => {
  it('keeps Sniper materially quieter than Ranger before release', () => {
    const sniper = getSniperAttackMotion(0.40);
    const ranger = getRangerAttackMotion(0.40);
    const sniperActivity = Math.abs(sniper.deformation.squash)
      + Math.abs(sniper.deformation.stretch)
      + Math.abs(sniper.deformation.lean)
      + Math.abs(sniper.equipment.angle);
    const rangerActivity = Math.abs(ranger.deformation.squash)
      + Math.abs(ranger.deformation.stretch)
      + Math.abs(ranger.deformation.lean)
      + Math.abs(ranger.equipment.angle);

    expect(sniperActivity).toBeLessThan(rangerActivity * 0.5);
  });

  it('makes Storm Archer an airborne overlapping three-line volley rather than Ranger double-shot', () => {
    const storm = getStormArcherAttackMotion(getStormShotReleaseU(1));
    const ranger = getRangerAttackMotion(getRangerShotReleaseU(1));

    expect(storm.deformation.jump).toBeGreaterThan(0.12);
    expect(ranger.deformation.jump).toBe(0);
    expect(storm.shotPulses.filter((pulse) => pulse > 0.1)).toHaveLength(2);
    expect(getStormShotReleaseU(2) - getStormShotReleaseU(0)).toBeLessThan(0.11);
  });
});

describe('Sniper signature timing', () => {
  it('holds almost still through a long aim, flashes sight lock, then snaps into recoil', () => {
    const aim = getSniperAttackMotion(0.40);
    const lock = getSniperAttackMotion(
      (TIER3_BOW_THRESHOLDS.sniperSightLockU + TIER3_BOW_THRESHOLDS.sniperReleaseU) / 2,
    );
    const release = getSniperAttackMotion(TIER3_BOW_THRESHOLDS.sniperReleaseU + 0.025);
    const impact = getSniperAttackMotion(TIER3_BOW_THRESHOLDS.sniperImpactU + 0.015);

    expect(aim.tension).toBeGreaterThan(0.75);
    expect(aim.deformation.squash).toBeLessThan(0.03);
    expect(Math.abs(aim.deformation.lean)).toBeLessThan(0.02);
    expect(aim.deformation.wobble).toBe(0);
    expect(aim.deformation.jump).toBe(0);

    expect(lock.sightLockPulse).toBeGreaterThan(0.95);
    expect(lock.recoil).toBe(0);
    expect(release.release).toBeGreaterThan(0.85);
    expect(release.recoil).toBeGreaterThan(0.6);
    expect(release.trailPulse).toBeGreaterThan(0.25);
    expect(impact.criticalPulse).toBeGreaterThan(0.5);
  });

  it('uses a longer attack with an extremely short projectile flight', () => {
    expect(TIER3_BOW_TIMING.sniperAttack).toBeGreaterThan(1.1);
    expect(TIER3_BOW_TIMING.sniperArrowFlight).toBeLessThan(0.15);
    expect(TIER3_BOW_THRESHOLDS.sniperReleaseU).toBeGreaterThan(0.5);
    expect(
      (TIER3_BOW_THRESHOLDS.sniperImpactU - TIER3_BOW_THRESHOLDS.sniperReleaseU)
        * TIER3_BOW_TIMING.sniperAttack,
    ).toBeCloseTo(TIER3_BOW_TIMING.sniperArrowFlight, 2);
  });
});

describe('Storm Archer signature timing', () => {
  it('charges, jumps into full draw, and releases three tightly grouped fan shots', () => {
    const releases = [
      getStormShotReleaseU(0),
      getStormShotReleaseU(1),
      getStormShotReleaseU(2),
    ] as const;
    expect(releases[0]).toBeLessThan(releases[1]);
    expect(releases[1]).toBeLessThan(releases[2]);
    expect(releases[1] - releases[0]).toBeLessThanOrEqual(0.055);
    expect(releases[2] - releases[1]).toBeLessThanOrEqual(0.055);

    const charge = getStormArcherAttackMotion(0.22);
    const fullDraw = getStormArcherAttackMotion(0.44);
    expect(charge.deformation.squash).toBeGreaterThan(0.2);
    expect(charge.electricPulse).toBeGreaterThan(0.65);
    expect(fullDraw.deformation.jump).toBeGreaterThan(0.15);
    expect(fullDraw.equipment.angle).toBeLessThan(-0.55);

    releases.forEach((releaseU, index) => {
      const pose = getStormArcherAttackMotion(releaseU);
      expect(pose.shotIndex).toBe(index);
      expect(pose.shotPulses[index]).toBeGreaterThan(0.98);
      expect(pose.volleySpread).toBe(1);
    });
  });

  it('moves payoff from the fan volley into a short post-impact chain window', () => {
    const chain = getStormArcherAttackMotion(0.795);
    expect(chain.chainPulse).toBeGreaterThan(0.95);
    expect(chain.deformation.jump).toBeGreaterThanOrEqual(0);
    expect(chain.electricPulse).toBeLessThan(0.5);
    expect(
      (TIER3_BOW_THRESHOLDS.stormChainStartU - getStormShotReleaseU(2))
        * TIER3_BOW_TIMING.stormArcherAttack,
    ).toBeCloseTo(TIER3_BOW_TIMING.stormArrowFlight, 2);
  });
});

describe('Sniper signature VFX', () => {
  it('draws a thin ProjectileOrigin-to-target line and compact sight/critical flashes', () => {
    const group = createSniperSignatureVfx();
    const source = new THREE.Vector3(0.35, 0.82, -0.10);
    const target = new THREE.Vector3(3.85, 1.20, 0.34);
    const camera = new THREE.Quaternion();

    const lockPose = getSniperAttackMotion(
      (TIER3_BOW_THRESHOLDS.sniperSightLockU + TIER3_BOW_THRESHOLDS.sniperReleaseU) / 2,
    );
    applySniperSignatureVfx(group, lockPose, source, target, camera);
    expect(group.visible).toBe(true);
    expect(group.getObjectByName('SniperSightLockHorizontal')?.visible).toBe(true);
    expect(group.getObjectByName('SniperPiercingCore')?.visible).toBe(false);

    const releasePose = getSniperAttackMotion(TIER3_BOW_THRESHOLDS.sniperReleaseU + 0.02);
    applySniperSignatureVfx(group, releasePose, source, target, camera);
    const core = group.getObjectByName('SniperPiercingCore') as THREE.Mesh;
    expect(core.visible).toBe(true);
    expect(core.scale.x).toBeCloseTo(source.distanceTo(target), 5);
    expect(core.position.distanceTo(source.clone().lerp(target, 0.5))).toBeLessThan(1e-6);
    expect(beamDirection(core).dot(target.clone().sub(source).normalize())).toBeGreaterThan(0.9999);

    const impactPose = getSniperAttackMotion(TIER3_BOW_THRESHOLDS.sniperImpactU + 0.015);
    applySniperSignatureVfx(group, impactPose, source, target, camera);
    const impactRay = group.getObjectByName('SniperImpactRay0') as THREE.Mesh;
    expect(impactRay.visible).toBe(true);
    expect(impactRay.position.distanceTo(target)).toBeLessThan(1e-6);
  });
});

describe('Storm Archer signature VFX', () => {
  it('uses three explicit fan lines and no ring/torus field geometry', () => {
    const group = createStormSignatureVfx();
    const ringLike = group.children.filter(
      (child) => child instanceof THREE.Mesh
        && (child.geometry instanceof THREE.RingGeometry || child.geometry instanceof THREE.TorusGeometry),
    );
    expect(ringLike).toHaveLength(0);

    for (let index = 0; index < 3; index += 1) {
      expect(group.getObjectByName(`StormFanTrail${index}Core`)).toBeDefined();
      expect(group.getObjectByName(`StormFanTrail${index}Glow`)).toBeDefined();
    }
  });

  it('renders a readable three-line fan and short chain lightning between impact points', () => {
    const group = createStormSignatureVfx();
    const source = new THREE.Vector3(0, 0.72, 0);
    const impacts = [
      new THREE.Vector3(3.1, -0.42, 0.05),
      new THREE.Vector3(3.55, 0.30, 0.03),
      new THREE.Vector3(3.05, 1.02, 0.02),
    ] as const;
    const camera = new THREE.Quaternion();

    const thirdRelease = getStormArcherAttackMotion(getStormShotReleaseU(2));
    applyStormSignatureVfx(group, thirdRelease, source, impacts, camera);

    const directions = impacts.map((impact, index) => {
      const trail = group.getObjectByName(`StormFanTrail${index}Core`) as THREE.Mesh;
      expect(trail.visible).toBe(true);
      expect(trail.scale.x).toBeCloseTo(source.distanceTo(impact), 5);
      return beamDirection(trail);
    });
    expect(directions[0]!.dot(directions[1]!)).toBeLessThan(0.999);
    expect(directions[1]!.dot(directions[2]!)).toBeLessThan(0.999);

    const chainPose = getStormArcherAttackMotion(0.795);
    applyStormSignatureVfx(group, chainPose, source, impacts, camera);
    for (let chainIndex = 0; chainIndex < 2; chainIndex += 1) {
      for (let segment = 0; segment < 4; segment += 1) {
        expect(group.getObjectByName(`StormChain${chainIndex}Core${segment}`)?.visible).toBe(true);
      }
    }

    const firstChainStart = group.getObjectByName('StormChain0Core0') as THREE.Mesh;
    const secondChainStart = group.getObjectByName('StormChain1Core0') as THREE.Mesh;
    expect(firstChainStart.position.distanceTo(impacts[0])).toBeLessThan(impacts[0].distanceTo(impacts[1]));
    expect(secondChainStart.position.distanceTo(impacts[1])).toBeLessThan(impacts[1].distanceTo(impacts[2]));
  });
});
