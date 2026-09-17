import { describe, expect, it } from 'vitest';

import { acornAttack, getCritterMotionProfile, rollAttack } from './critter';
import type { EnemyDefeatPose, EnemyHitPose, EnemyPose, EnemySecondaryPose } from './shared';

const IDS = ['critter-roll', 'critter-acorn'] as const;

function numericValues(pose: EnemyPose | EnemyHitPose | EnemyDefeatPose): number[] {
  const direct = Object.values(pose).filter((value): value is number => typeof value === 'number');
  const secondary = pose.secondary ?? {};
  return direct.concat(Object.values(secondary).filter((value): value is number => typeof value === 'number'));
}

function expectFinitePose(pose: EnemyPose | EnemyHitPose | EnemyDefeatPose): void {
  for (const value of numericValues(pose)) expect(Number.isFinite(value)).toBe(true);
  expect(pose.scaleX).toBeGreaterThan(0);
  expect(pose.scaleY).toBeGreaterThan(0);
  expect(pose.scaleZ).toBeGreaterThan(0);
}

function expectBoundedSecondary(secondary: EnemySecondaryPose | undefined): void {
  if (!secondary) return;
  for (const value of Object.values(secondary)) {
    if (typeof value === 'number') expect(Math.abs(value)).toBeLessThanOrEqual(1.2);
  }
}

describe('Forest Critter production motion profiles', () => {
  for (const id of IDS) {
    describe(id, () => {
      it('keeps every sampled motion finite and physically valid', () => {
        const profile = getCritterMotionProfile(id);
        expect(profile.attackDuration).toBeGreaterThan(0);
        expect(profile.moveDuration).toBeGreaterThan(0);
        expect(profile.defeatDuration).toBeGreaterThan(0);
        expect(profile.contactU).toBeGreaterThan(0);
        expect(profile.contactU).toBeLessThan(1);

        for (let i = 0; i <= 40; i += 1) {
          const u = i / 40;
          const samples = [
            profile.attack(u),
            profile.hit(u, -1),
            profile.hit(u, 1),
            profile.defeat(u, -1),
            profile.defeat(u, 1),
            profile.idle(u * 3.0, 0.17),
            profile.move(u * profile.moveDuration, 0.11),
          ];
          for (const pose of samples) {
            expectFinitePose(pose);
            expectBoundedSecondary(pose.secondary);
          }
        }
      });

      it('ends defeat in a stable terminal pose', () => {
        const profile = getCritterMotionProfile(id);
        const end = profile.defeat(1, 1);
        const beyond = profile.defeat(1.5, 1);
        expect(end).toEqual(beyond);
        expect(end.opacity).toBeGreaterThanOrEqual(0);
        expect(end.opacity).toBeLessThanOrEqual(1);
      });
    });
  }

  it('roll attack has a readable crouch, fast release, contact and settle', () => {
    const anticipation = rollAttack(0.25);
    const releaseStart = rollAttack(0.43);
    const preContact = rollAttack(0.58);
    const contact = rollAttack(0.67);
    const recovery = rollAttack(0.90);

    expect(anticipation.secondary?.shellCurl ?? 0).toBeGreaterThan(0.20);
    expect(releaseStart.releaseProgress).toBeGreaterThanOrEqual(0);
    expect(preContact.travel - releaseStart.travel).toBeGreaterThan(0.45);
    expect(contact.travel).toBeGreaterThanOrEqual(0.95);
    expect(Math.abs(recovery.wobbleZ)).toBeLessThan(Math.abs(contact.wobbleZ));
    expect(recovery.secondary?.shellCurl ?? 0).toBeLessThan(contact.secondary?.shellCurl ?? 0);
  });

  it('acorn toss holds anticipation, releases crisply, then settles tail motion', () => {
    const anticipation = acornAttack(0.32);
    const hold = acornAttack(0.40);
    const release = acornAttack(0.46);
    const recoil = acornAttack(0.53);
    const recovery = acornAttack(0.90);

    expect(anticipation.secondary?.wag ?? 0).toBeLessThan(-0.45);
    expect(hold.releaseProgress).toBe(-1);
    expect(release.releaseProgress).toBeGreaterThanOrEqual(0);
    expect(recoil.jump).toBeGreaterThan(0.01);
    expect(Math.abs(recovery.secondary?.wag ?? 0)).toBeLessThan(Math.abs(recoil.secondary?.wag ?? 0));
  });

  it('acorn projectile stays toy-like and uses a shallow arc', () => {
    const projectile = getCritterMotionProfile('critter-acorn').projectile;
    expect(projectile?.kind).toBe('acorn');
    expect(projectile?.flightSeconds).toBeGreaterThan(0.30);
    expect(projectile?.flightSeconds).toBeLessThan(0.60);
    expect(projectile?.arcHeight(0)).toBeCloseTo(0, 6);
    expect(projectile?.arcHeight(0.5)).toBeGreaterThan(0.10);
    expect(projectile?.arcHeight(1)).toBeCloseTo(0, 6);
    expect(projectile?.createMesh().name).toBe('AcornProjectile');
  });
});
