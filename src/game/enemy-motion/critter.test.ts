import { describe, expect, it } from 'vitest';
import { getCritterMotionProfile } from './critter';

describe('critter character contracts', () => {
  it('round-hedgehog: shell curls -> rolling body attack -> uncurls', () => {
    const p = getCritterMotionProfile('critter-roll');
    const curl = p.attack(0.20);
    const roll = p.attack(0.49);
    expect(curl.secondary?.shellCurl ?? 0).toBeGreaterThan(0.24);
    expect(curl.secondary?.headNod ?? 0).toBeGreaterThan(0.22);
    expect(roll.travel).toBeGreaterThan(0.90);
    expect(Math.abs(roll.wobbleZ)).toBeGreaterThan(0.60);
    expect(p.projectile).toBeUndefined();
  });

  it('acorn-squirrel: oversized tail winds up -> one acorn -> tail recoil', () => {
    const p = getCritterMotionProfile('critter-acorn');
    const windup = p.attack(0.25);
    const recoil = p.attack(0.58);
    expect(windup.secondary?.wag ?? 0).toBeLessThan(-0.45);
    expect(recoil.releaseProgress).toBeGreaterThan(0);
    expect(recoil.secondary?.wag ?? 0).toBeGreaterThan(0.55);
    expect(p.projectile?.kind).toBe('acorn');
    expect(p.projectile?.flightSeconds).toBeGreaterThanOrEqual(0.40);
  });

  for (const id of ['critter-roll', 'critter-acorn'] as const) {
    it(`${id}: keeps all sampled poses finite`, () => {
      const p = getCritterMotionProfile(id);
      for (let i = 0; i <= 20; i += 1) {
        const u = i / 20;
        for (const pose of [p.attack(u), p.hit(u, -1), p.defeat(u, 1)]) {
          for (const value of Object.values(pose).filter((v) => typeof v === 'number')) expect(Number.isFinite(value)).toBe(true);
        }
      }
    });
  }
});
