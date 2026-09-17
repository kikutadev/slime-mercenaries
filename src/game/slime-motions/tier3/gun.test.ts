import { describe, expect, it } from 'vitest';
import {
  CANNONEER_SIGNATURE_TIMING,
  ENGINEER_SIGNATURE_TIMING,
  getCannoneerImpactU,
  getCannoneerShellReleaseU,
  getCannoneerSignatureMotion,
  getEngineerSignatureMotion,
  getEngineerTurretShotReleaseU,
} from './gun';

function expectFiniteTree(value: unknown): void {
  if (typeof value === 'number') {
    expect(Number.isFinite(value)).toBe(true);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach(expectFiniteTree);
    return;
  }
  if (value && typeof value === 'object') {
    Object.values(value as Record<string, unknown>).forEach(expectFiniteTree);
  }
}

function expectNearZero(values: number[], epsilon = 0.001): void {
  values.forEach((value) => expect(Math.abs(value)).toBeLessThan(epsilon));
}

describe('Tier-3 Gun production motion contracts', () => {
  it('keeps Cannoneer and Engineer returns finite for boundary and invalid input', () => {
    for (const u of [-1, 0, 0.17, 0.5, 0.83, 1, 2, Number.NaN, Number.POSITIVE_INFINITY]) {
      expectFiniteTree(getCannoneerSignatureMotion(u));
      expectFiniteTree(getEngineerSignatureMotion(u));
    }
  });

  it('returns both signatures to a stable character/equipment endpoint', () => {
    const cannoneer = getCannoneerSignatureMotion(1);
    expectNearZero([
      cannoneer.bodyOffset,
      cannoneer.brace,
      cannoneer.charge,
      cannoneer.recoil,
      cannoneer.deformation.squash,
      cannoneer.deformation.stretch,
      cannoneer.deformation.lean,
      cannoneer.deformation.wobble,
      cannoneer.deformation.jump,
      cannoneer.equipment.angle,
      cannoneer.equipment.lift,
      cannoneer.equipment.sweep,
      cannoneer.vfx.muzzleFlash,
      cannoneer.vfx.muzzleCore,
      cannoneer.vfx.smoke,
      cannoneer.vfx.tracer,
      cannoneer.vfx.explosion,
      cannoneer.vfx.impactSmoke,
      cannoneer.vfx.screenPunch,
    ]);

    const engineer = getEngineerSignatureMotion(1);
    expectNearZero([
      engineer.bodyOffset,
      engineer.deformation.squash,
      engineer.deformation.stretch,
      engineer.deformation.lean,
      engineer.deformation.wobble,
      engineer.deformation.jump,
      engineer.equipment.angle,
      engineer.equipment.lift,
      engineer.equipment.sweep,
      engineer.vfx.partsOpacity,
      engineer.vfx.energyPulse,
      engineer.vfx.assemblySparks,
      engineer.vfx.activationPulse,
      engineer.turret.deployProgress,
      engineer.turret.visibility,
      engineer.turret.lift,
      engineer.turret.yaw,
      engineer.turret.recoil,
      engineer.turret.muzzlePulse,
    ]);
    expect(engineer.turret.shotIndex).toBeNull();
  });

  it('authors Cannoneer as one charged destructive shot rather than a longer Gunner burst', () => {
    const preFire = getCannoneerSignatureMotion(CANNONEER_SIGNATURE_TIMING.chargeEndU - 0.02);
    const release = getCannoneerSignatureMotion(getCannoneerShellReleaseU());
    const recoil = getCannoneerSignatureMotion(CANNONEER_SIGNATURE_TIMING.recoilPeakU);
    const flight = getCannoneerSignatureMotion(
      (getCannoneerShellReleaseU() + getCannoneerImpactU()) * 0.5,
    );
    const impact = getCannoneerSignatureMotion(getCannoneerImpactU());

    expect(preFire.charge).toBeGreaterThan(0.85);
    expect(preFire.brace).toBeGreaterThan(0.80);
    expect(preFire.vfx.muzzleFlash).toBe(0);

    expect(release.vfx.muzzleFlash).toBeGreaterThan(0.99);
    expect(release.vfx.muzzleCore).toBeGreaterThan(0.99);
    expect(release.vfx.screenPunch).toBeGreaterThan(0.65);

    expect(recoil.recoil).toBeGreaterThan(0.90);
    expect(recoil.bodyOffset).toBeLessThan(-0.40);
    expect(recoil.deformation.squash).toBeGreaterThan(0.45);

    expect(flight.vfx.shellTravelProgress).toBeGreaterThan(0.35);
    expect(flight.vfx.shellTravelProgress).toBeLessThan(0.65);
    expect(flight.vfx.shellArcHeight).toBeGreaterThan(0.30);
    expect(flight.vfx.tracer).toBeGreaterThan(0.90);
    expect(flight.vfx.smoke).toBeGreaterThan(0.20);

    expect(impact.vfx.impactFlash).toBeGreaterThan(0.99);
    expect(impact.vfx.explosion).toBeGreaterThan(0.80);
    expect(impact.vfx.screenPunch).toBeGreaterThan(0.99);
    expect(getCannoneerShellReleaseU()).toBeLessThan(getCannoneerImpactU());
  });

  it('keeps Cannoneer smoke, tracer, and impact phases ordered and independently consumable', () => {
    const releaseU = getCannoneerShellReleaseU();
    const impactU = getCannoneerImpactU();

    expect(CANNONEER_SIGNATURE_TIMING.duration).toBeGreaterThan(1.4);
    expect(releaseU).toBeGreaterThan(CANNONEER_SIGNATURE_TIMING.braceEndU);
    expect(releaseU).toBeGreaterThan(CANNONEER_SIGNATURE_TIMING.chargeEndU);
    expect(impactU).toBeGreaterThan(releaseU + 0.20);

    const before = getCannoneerSignatureMotion(releaseU - 0.01);
    const after = getCannoneerSignatureMotion(releaseU + 0.08);
    const postImpact = getCannoneerSignatureMotion(impactU + 0.08);

    expect(before.vfx.shellTravelProgress).toBe(-1);
    expect(after.vfx.smoke).toBeGreaterThan(0);
    expect(after.vfx.shellTravelProgress).toBeGreaterThan(0);
    expect(after.vfx.tracer).toBeGreaterThan(0);
    expect(postImpact.vfx.impactProgress).toBeGreaterThan(0);
    expect(postImpact.vfx.impactSmoke).toBeGreaterThan(0);
    expect(postImpact.vfx.explosionScale).toBeGreaterThan(2);
  });

  it('makes Engineer assembly/deployment the dominant signature before turret fire', () => {
    const gathering = getEngineerSignatureMotion(0.16);
    const assembly = getEngineerSignatureMotion(0.34);
    const deploy = getEngineerSignatureMotion(0.56);
    const online = getEngineerSignatureMotion(ENGINEER_SIGNATURE_TIMING.turretOnlineU);
    const beforeBurst = getEngineerSignatureMotion(getEngineerTurretShotReleaseU(0) - 0.04);

    expect(gathering.gatherProgress).toBeGreaterThan(0.20);
    expect(gathering.vfx.partsOpacity).toBeGreaterThan(0.15);
    expect(gathering.vfx.energyPulse).toBeGreaterThan(0.20);
    expect(gathering.turret.muzzlePulse).toBe(0);

    expect(assembly.assemblyProgress).toBeGreaterThan(0.25);
    expect(assembly.vfx.assemblySparks).toBeGreaterThan(0.20);
    expect(Math.abs(assembly.equipment.angle)).toBeGreaterThan(0.10);
    expect(assembly.turret.muzzlePulse).toBe(0);

    expect(deploy.deploymentProgress).toBeGreaterThan(0.80);
    expect(deploy.turret.visibility).toBeGreaterThan(0.80);
    expect(deploy.turret.muzzlePulse).toBe(0);

    expect(online.vfx.activationPulse).toBeGreaterThan(0.99);
    expect(online.turret.deployProgress).toBeGreaterThan(0.95);
    expect(beforeBurst.turret.shotIndex).toBeNull();
    expect(beforeBurst.turret.muzzlePulse).toBe(0);

    expect(ENGINEER_SIGNATURE_TIMING.deployEndU).toBeLessThan(getEngineerTurretShotReleaseU(0));
    expect(getEngineerTurretShotReleaseU(0)).toBeGreaterThan(0.65);
  });

  it('exposes an ordered, short turret burst only after Engineer deployment', () => {
    const shot0 = getEngineerTurretShotReleaseU(0);
    const shot1 = getEngineerTurretShotReleaseU(1);
    const shot2 = getEngineerTurretShotReleaseU(2);

    expect(shot0).toBeLessThan(shot1);
    expect(shot1).toBeLessThan(shot2);
    expect(shot2).toBeLessThan(ENGINEER_SIGNATURE_TIMING.retractStartU);
    expect(shot2 - shot0).toBeLessThan(0.20);

    for (const [index, releaseU] of [shot0, shot1, shot2].entries()) {
      const pose = getEngineerSignatureMotion(releaseU);
      expect(pose.turret.shotIndex).toBe(index);
      expect(pose.turret.muzzlePulse).toBeGreaterThan(0.99);
      expect(pose.turret.visibility).toBeGreaterThan(0.90);
      expect(pose.turret.deployProgress).toBeGreaterThan(0.90);
    }

    const retracting = getEngineerSignatureMotion(0.96);
    expect(retracting.turret.deployProgress).toBeLessThan(0.50);
    expect(retracting.turret.muzzlePulse).toBe(0);
  });
});
