import { describe, expect, it } from 'vitest';
import { getFlowerMotionProfile } from './flower';

describe('flower character contracts', () => {
  it('bud-bloom: closed bud compresses -> pokes with head -> recovers', () => {
    const p = getFlowerMotionProfile('flower-bud-poke');
    const windup = p.attack(0.20);
    const poke = p.attack(0.62);
    expect(windup.secondary?.open ?? 0).toBeLessThan(-0.18);
    expect(windup.secondary?.headNod ?? 0).toBeLessThan(-0.25);
    expect(poke.travel).toBeGreaterThan(0.90);
    expect(poke.secondary?.headNod ?? 0).toBeGreaterThan(0.50);
    expect(p.projectile).toBeUndefined();
  });

  it('puff-flower: puff head inflates -> releases pollen -> recoils', () => {
    const p = getFlowerMotionProfile('flower-pollen');
    const inflate = p.attack(0.30);
    const recoil = p.attack(0.58);
    expect(inflate.secondary?.open ?? 0).toBeGreaterThan(0.22);
    expect(inflate.scaleX).toBeGreaterThan(1.05);
    expect(recoil.releaseProgress).toBeGreaterThan(0);
    expect(recoil.travel).toBeLessThan(0);
    expect(p.projectile?.kind).toBe('pollen');
    expect(p.projectile?.flightSeconds).toBeGreaterThanOrEqual(0.40);
  });

  for (const id of ['flower-bud-poke', 'flower-pollen'] as const) {
    it(`${id}: keeps all sampled poses finite`, () => {
      const p = getFlowerMotionProfile(id);
      for (let i = 0; i <= 20; i += 1) {
        const u = i / 20;
        for (const pose of [p.attack(u), p.hit(u, 1), p.defeat(u, -1)]) {
          for (const value of Object.values(pose).filter((v) => typeof v === 'number')) expect(Number.isFinite(value)).toBe(true);
        }
      }
    });
  }
});
