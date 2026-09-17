import { describe, expect, it } from 'vitest';
import {
  ASSASSIN_SIGNATURE_TIMING,
  NINJA_SIGNATURE_TIMING,
  getAssassinCrossHitU,
  getAssassinExecutionLineU,
  getAssassinSignatureMotion,
  getNinjaDashPassU,
  getNinjaDelayedSlashU,
  getNinjaSignatureMotion,
} from './rogue';

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

describe('Tier-3 Rogue production motion contracts', () => {
  it('keeps Ninja and Assassin returns finite for boundary and invalid input', () => {
    for (const u of [-1, 0, 0.12, 0.37, 0.68, 1, 2, Number.NaN, Number.POSITIVE_INFINITY]) {
      expectFiniteTree(getNinjaSignatureMotion(u));
      expectFiniteTree(getAssassinSignatureMotion(u));
    }
  });

  it('returns both signatures to a stable character/equipment endpoint', () => {
    const ninja = getNinjaSignatureMotion(1);
    expect(ninja.bodyAlpha).toBeCloseTo(1);
    expectNearZero([
      ninja.bodyOffset,
      ninja.lateralOffset,
      ninja.deformation.squash,
      ninja.deformation.stretch,
      ninja.deformation.lean,
      ninja.deformation.wobble,
      ninja.deformation.jump,
      ninja.equipment.angle,
      ninja.equipment.lift,
      ninja.equipment.sweep,
      ninja.secondaryEquipment.angle,
      ninja.secondaryEquipment.lift,
      ninja.secondaryEquipment.sweep,
      ninja.vfx.vanishSmoke,
      ninja.vfx.returnSmoke,
      ninja.vfx.afterimage,
      ninja.vfx.speedLines,
      ninja.vfx.dashPassPulse,
      ninja.vfx.delayedSlashBurst,
      ninja.vfx.screenPunch,
    ]);
    expect(ninja.vfx.delayedSlashPulses.every((pulse) => pulse === 0)).toBe(true);

    const assassin = getAssassinSignatureMotion(1);
    expect(assassin.bodyAlpha).toBeCloseTo(1);
    expectNearZero([
      assassin.bodyOffset,
      assassin.lateralOffset,
      assassin.hitStop,
      assassin.stillness,
      assassin.deformation.squash,
      assassin.deformation.stretch,
      assassin.deformation.lean,
      assassin.deformation.wobble,
      assassin.deformation.jump,
      assassin.equipment.angle,
      assassin.equipment.lift,
      assassin.equipment.sweep,
      assassin.secondaryEquipment.angle,
      assassin.secondaryEquipment.lift,
      assassin.secondaryEquipment.sweep,
      assassin.vfx.shadowBlink,
      assassin.vfx.crossSlashA,
      assassin.vfx.crossSlashB,
      assassin.vfx.impactFlash,
      assassin.vfx.executionLine,
      assassin.vfx.executionGlow,
      assassin.vfx.screenPunch,
    ]);
  });

  it('authors Ninja as vanish plus repeated row passes rather than a faster Rogue combo', () => {
    const anticipation = getNinjaSignatureMotion(NINJA_SIGNATURE_TIMING.vanishStartU);
    const vanished = getNinjaSignatureMotion(NINJA_SIGNATURE_TIMING.vanishEndU + 0.03);
    const pass0 = getNinjaSignatureMotion(getNinjaDashPassU(0));
    const pass1 = getNinjaSignatureMotion(getNinjaDashPassU(1));
    const pass2 = getNinjaSignatureMotion(getNinjaDashPassU(2));

    expect(anticipation.deformation.squash).toBeGreaterThan(0.45);
    expect(vanished.bodyAlpha).toBeLessThan(0.05);
    expect(vanished.vfx.vanishSmoke).toBeGreaterThan(0.25);
    expect(vanished.vfx.afterimage).toBeGreaterThan(0.25);

    for (const [index, pose] of [pass0, pass1, pass2].entries()) {
      expect(pose.bodyAlpha).toBeLessThan(0.05);
      expect(pose.vfx.dashPassIndex).toBe(index);
      expect(pose.vfx.dashPassPulse).toBeGreaterThan(0.99);
      expect(pose.vfx.afterimage).toBeGreaterThan(0.70);
      expect(pose.vfx.speedLines).toBeGreaterThan(0.45);
    }

    expect(pass0.dashProgress).toBeLessThan(pass1.dashProgress);
    expect(pass1.dashProgress).toBeLessThan(pass2.dashProgress);
    expect(getNinjaDashPassU(2)).toBeLessThan(NINJA_SIGNATURE_TIMING.reappearU);
  });

  it('clusters Ninja delayed slash lines only after the real body has returned', () => {
    const returned = getNinjaSignatureMotion(NINJA_SIGNATURE_TIMING.reappearU);
    expect(returned.bodyAlpha).toBeCloseTo(1);
    expect(returned.vfx.returnSmoke).toBeGreaterThan(0.99);
    expect(returned.vfx.delayedSlashProgress).toBeGreaterThanOrEqual(0);

    const slashUs = [0, 1, 2, 3].map(
      (index) => getNinjaDelayedSlashU(index as 0 | 1 | 2 | 3),
    );
    expect(slashUs[0]).toBeGreaterThanOrEqual(NINJA_SIGNATURE_TIMING.reappearU);
    expect(slashUs[3]! - slashUs[0]!).toBeLessThan(0.10);

    slashUs.forEach((u, index) => {
      const pose = getNinjaSignatureMotion(u!);
      expect(pose.bodyAlpha).toBeGreaterThan(0.99);
      expect(pose.vfx.delayedSlashPulses[index]).toBeGreaterThan(0.99);
      expect(pose.vfx.delayedSlashBurst).toBeGreaterThan(0.99);
      expect(pose.vfx.screenPunch).toBeGreaterThan(0.45);
    });

    const beforeReturn = getNinjaSignatureMotion(NINJA_SIGNATURE_TIMING.reappearStartU - 0.02);
    expect(beforeReturn.vfx.delayedSlashProgress).toBe(-1);
    expect(beforeReturn.vfx.delayedSlashBurst).toBe(0);
  });

  it('gives Assassin a long quiet low stance before an instant back-side relocation', () => {
    const still = getAssassinSignatureMotion(ASSASSIN_SIGNATURE_TIMING.stillnessEndU - 0.015);
    const launch = getAssassinSignatureMotion(
      (ASSASSIN_SIGNATURE_TIMING.launchU + ASSASSIN_SIGNATURE_TIMING.behindTargetU) * 0.5,
    );
    const behind = getAssassinSignatureMotion(ASSASSIN_SIGNATURE_TIMING.behindTargetU);

    expect(still.stillness).toBeGreaterThan(0.90);
    expect(still.deformation.squash).toBeGreaterThan(0.38);
    expect(still.vfx.crossSlashA).toBe(0);
    expect(still.vfx.crossSlashB).toBe(0);
    expect(still.vfx.executionLine).toBe(0);
    expect(still.vfx.screenPunch).toBe(0);

    expect(launch.bodyAlpha).toBeLessThan(0.10);
    expect(launch.behindTargetProgress).toBeGreaterThan(0.80);
    expect(behind.behindTargetProgress).toBeGreaterThan(0.99);
    expect(behind.vfx.shadowBlink).toBeGreaterThan(0.70);
  });

  it('makes Assassin cross slash hit-stop dominant before the delayed execution line', () => {
    const crossHitU = getAssassinCrossHitU();
    const executionU = getAssassinExecutionLineU();
    const cross = getAssassinSignatureMotion(crossHitU);
    const freeze = getAssassinSignatureMotion(
      (ASSASSIN_SIGNATURE_TIMING.hitStopStartU + ASSASSIN_SIGNATURE_TIMING.hitStopEndU) * 0.5,
    );
    const execution = getAssassinSignatureMotion(executionU);

    expect(cross.vfx.crossSlashA).toBeGreaterThan(0.70);
    expect(cross.vfx.crossSlashB).toBeGreaterThan(0.70);
    expect(cross.vfx.impactFlash).toBeGreaterThan(0.99);
    expect(cross.vfx.executionLine).toBe(0);
    expect(cross.vfx.screenPunch).toBeGreaterThan(0.80);

    expect(freeze.hitStop).toBeGreaterThan(0.99);
    expect(freeze.deformation.squash).toBeGreaterThan(0.15);

    expect(executionU).toBeGreaterThan(ASSASSIN_SIGNATURE_TIMING.hitStopEndU);
    expect(execution.vfx.executionLine).toBeGreaterThan(0.99);
    expect(execution.vfx.executionGlow).toBeGreaterThan(0.60);
    expect(execution.vfx.screenPunch).toBeGreaterThan(0.99);
    expect(execution.vfx.impactFlash).toBe(0);
    expect(execution.vfx.executionLineProgress).toBeGreaterThan(0);
  });

  it('keeps Ninja and Assassin signature timing intentionally different', () => {
    expect(NINJA_SIGNATURE_TIMING.dashPassUs.length).toBe(3);
    expect(NINJA_SIGNATURE_TIMING.delayedSlashUs.length).toBe(4);
    expect(ASSASSIN_SIGNATURE_TIMING.hitStopEndU - ASSASSIN_SIGNATURE_TIMING.hitStopStartU)
      .toBeGreaterThan(0.10);
    expect(getAssassinExecutionLineU() - getAssassinCrossHitU()).toBeGreaterThan(0.15);
    expect(NINJA_SIGNATURE_TIMING.duration).toBeLessThan(ASSASSIN_SIGNATURE_TIMING.duration);
  });
});
