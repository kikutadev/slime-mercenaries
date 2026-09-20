import { describe, expect, it } from 'vitest';
import { getFrostMotionProfile } from './frost';

describe('frost character contracts', () => {
  it('snow-roller: roll windup -> bump -> delayed nub overshoot', () => {
    const p = getFrostMotionProfile('frost-snow-roll');
    const wind = p.attack(0.24);
    const contact = p.attack(0.64);
    const settle = p.attack(0.78);
    expect(wind.wobbleZ).toBeLessThan(-0.15);
    expect(wind.secondary?.primaryBend ?? 0).toBeLessThan(-0.10);
    expect(contact.travel).toBeGreaterThan(0.90);
    expect(contact.scaleY).toBeLessThan(0.91);
    expect(settle.secondary?.primaryBend ?? 0).toBeGreaterThan(0.10);
    expect(p.attackDuration).toBeGreaterThanOrEqual(0.78);
    expect(p.attackDuration).toBeLessThanOrEqual(0.92);
    expect(p.projectile).toBeUndefined();
  });

  it('ice-bug: three-spike lean -> still hold -> snap -> one compact shard -> recoil', () => {
    const p = getFrostMotionProfile('frost-ice-spike-shot');
    const lean = p.attack(0.26);
    const hold = p.attack(0.36);
    const snap = p.attack(0.50);
    const recoil = p.attack(0.70);
    expect(lean.secondary?.primaryBend ?? 0).toBeLessThan(-0.25);
    expect(hold.secondary?.primaryBend ?? 0).toBeLessThan(-0.25);
    expect(snap.secondary?.primaryBend ?? 0).toBeGreaterThan(0.30);
    expect(recoil.travel).toBeLessThan(0);
    expect(p.projectile?.kind).toBe('ice-shard');
    expect(p.projectile?.flightSeconds).toBeGreaterThanOrEqual(0.38);
    expect(p.attackDuration).toBeGreaterThanOrEqual(0.90);
    expect(p.attackDuration).toBeLessThanOrEqual(1.05);
  });

  it('scarf-snowman: scarf tells first -> body dash -> scarf overshoots', () => {
    const p = getFrostMotionProfile('frost-scarf-dash');
    const tell = p.attack(0.25);
    const dash = p.attack(0.62);
    const overshoot = p.attack(0.76);
    expect(tell.secondary?.wag ?? 0).toBeLessThan(-0.55);
    expect(tell.travel).toBeLessThan(0.05);
    expect(dash.travel).toBeGreaterThan(0.90);
    expect(overshoot.secondary?.wag ?? 0).toBeGreaterThan(0.45);
    expect(p.projectile).toBeUndefined();
    expect(p.attackDuration).toBeGreaterThanOrEqual(0.82);
    expect(p.attackDuration).toBeLessThanOrEqual(0.98);
  });

  it('icicle-lantern: hover compress -> bounded core charge -> thin ray -> recoil/flicker', () => {
    const p = getFrostMotionProfile('frost-lantern-ray');
    const compress = p.attack(0.28);
    const charge = p.attack(0.50);
    const release = p.attack(0.62);
    expect(compress.scaleY).toBeLessThan(0.95);
    expect(charge.secondary?.inflate ?? 0).toBeGreaterThan(0.45);
    expect(release.releaseProgress).toBeGreaterThan(0);
    expect(release.travel).toBeLessThan(0);
    expect(p.projectile?.kind).toBe('ice-ray');
    expect(p.projectile?.flightSeconds).toBeLessThanOrEqual(0.32);
    expect(p.defeat(0.60, 1).secondary?.inflate ?? 0).toBeLessThan(-0.30);
  });

  it('snow-statue-guardian: upper leads -> lower follows -> full spin -> release -> crest settles last', () => {
    const p = getFrostMotionProfile('frost-guardian-boss');
    const upper = p.attack(0.16);
    const follow = p.attack(0.30);
    const spin = p.attack(0.58);
    const release = p.attack(0.68);
    const crest = p.attack(0.80);
    expect(upper.secondary?.twist ?? 0).toBeLessThan(-0.35);
    expect(Math.abs(follow.wobbleZ)).toBeGreaterThan(0.05);
    expect(Math.abs(spin.wobbleZ)).toBeGreaterThan(3.0);
    expect(release.releaseProgress).toBeGreaterThan(0);
    expect(crest.secondary?.secondaryBend ?? 0).toBeGreaterThan(0.20);
    expect(p.projectile?.kind).toBe('frost-icicle');
    expect(p.attackDuration).toBeGreaterThanOrEqual(1.45);
    expect(p.defeatDuration).toBeGreaterThanOrEqual(1.55);
    const defeated = p.defeat(0.72, 1);
    expect(defeated.secondary?.primaryLift ?? 0).toBeLessThan(-0.15);
    expect(Math.abs(defeated.secondary?.secondaryBend ?? 0)).toBeGreaterThan(0.15);
  });

  for (const id of [
    'frost-snow-roll',
    'frost-ice-spike-shot',
    'frost-scarf-dash',
    'frost-lantern-ray',
    'frost-guardian-boss',
  ] as const) {
    it(`${id}: keeps every sampled production pose finite`, () => {
      const p = getFrostMotionProfile(id);
      for (let i = 0; i <= 24; i += 1) {
        const u = i / 24;
        for (const sample of [p.attack(u), p.hit(u, -1), p.defeat(u, 1)]) {
          const numeric = Object.values(sample).filter((value) => typeof value === 'number');
          for (const value of numeric) expect(Number.isFinite(value)).toBe(true);
          if (sample.secondary) {
            for (const value of Object.values(sample.secondary)) expect(Number.isFinite(value)).toBe(true);
          }
        }
      }
    });
  }
});
