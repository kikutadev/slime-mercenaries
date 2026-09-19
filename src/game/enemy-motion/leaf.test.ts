import { describe, expect, it } from 'vitest';
import { getLeafMotionProfile } from './leaf';

describe('leaf character contracts', () => {
  it('leafling: one broad leaf winds back -> slaps -> returns, with no projectile', () => {
    const p = getLeafMotionProfile('leaf-hop-slap');
    const windup = p.attack(0.15);
    const slap = p.attack(0.56);
    expect(windup.secondary?.primaryBend ?? 0).toBeLessThan(-0.55);
    expect(slap.travel).toBeGreaterThan(0.90);
    expect(slap.secondary?.primaryBend ?? 0).toBeGreaterThan(0.90);
    expect(p.projectile).toBeUndefined();
    expect(p.attackDuration).toBeLessThan(0.65);
  });

  it('whirl-leaf: counter-bends two leaves -> full twist -> emits one gust', () => {
    const p = getLeafMotionProfile('leaf-whirl');
    const charge = p.attack(0.20);
    const spin = p.attack(0.44);
    expect(charge.secondary?.primaryBend ?? 0).toBeLessThan(-0.18);
    expect(charge.secondary?.secondaryBend ?? 0).toBeGreaterThan(0.14);
    expect(spin.secondary?.twist ?? 0).toBeGreaterThan(1.0);
    expect(p.projectile?.kind).toBe('gust');
    expect(p.projectile?.flightSeconds).toBeGreaterThanOrEqual(0.30);
  });

  for (const id of ['leaf-hop-slap', 'leaf-whirl'] as const) {
    it(`${id}: keeps all sampled poses finite`, () => {
      const p = getLeafMotionProfile(id);
      for (let i = 0; i <= 20; i += 1) {
        const u = i / 20;
        for (const pose of [p.attack(u), p.hit(u, -1), p.defeat(u, 1)]) {
          for (const value of Object.values(pose).filter((v) => typeof v === 'number')) expect(Number.isFinite(value)).toBe(true);
        }
      }
    });
  }
});
