import { describe, expect, it } from 'vitest';
import { getDragonMotionProfile } from './dragon';

describe('dragon crater character contracts', () => {
  it('egg-dragon: inhale holds before one fireball and shell reacts after release', () => {
    const p = getDragonMotionProfile('dragon-egg-fire');
    const inhale = p.attack(0.28);
    const holdA = p.attack(0.36);
    const holdB = p.attack(0.44);
    const release = p.attack(0.54);
    const shellAfter = p.attack(0.70);

    expect(inhale.secondary?.inflate ?? 0).toBeGreaterThan(0.20);
    expect(holdA.travel).toBe(0);
    expect(holdB.travel).toBe(0);
    expect(holdA.secondary?.inflate).toBeCloseTo(holdB.secondary?.inflate ?? 0);
    expect(holdA.releaseProgress).toBeLessThan(0);
    expect(release.releaseProgress).toBeGreaterThan(0);
    expect(Math.abs(shellAfter.secondary?.shellRoll ?? 0)).toBeGreaterThan(0.05);
    expect(p.projectile?.kind).toBe('dragon-fireball');
    expect(p.attackDuration).toBeGreaterThanOrEqual(1.10);
    expect(p.attackDuration).toBeLessThanOrEqual(1.30);
  });

  it('tiny-wing-dragon: three failed flaps become one short dive and delayed flutter', () => {
    const p = getDragonMotionProfile('dragon-tiny-wing-dive');
    const flapA = p.attack(0.06);
    const flapB = p.attack(0.12);
    const flapC = p.attack(0.18);
    const hover = p.attack(0.46);
    const dive = p.attack(0.72);
    const after = p.attack(0.84);

    expect(Math.sign(flapA.secondary?.open ?? 0)).not.toBe(Math.sign(flapB.secondary?.open ?? 0));
    expect(Math.sign(flapB.secondary?.open ?? 0)).not.toBe(Math.sign(flapC.secondary?.open ?? 0));
    expect(hover.jump).toBeGreaterThan(0.05);
    expect(dive.travel).toBeGreaterThan(0.65);
    expect(Math.abs(after.secondary?.open ?? 0)).toBeGreaterThan(0.03);
    expect(p.projectile).toBeUndefined();
    expect(p.attackDuration).toBeGreaterThanOrEqual(1.10);
    expect(p.attackDuration).toBeLessThanOrEqual(1.30);
  });

  it('star-eater-lizard: back star drains during charge and relights after impact', () => {
    const p = getDragonMotionProfile('dragon-star-lizard-charge');
    const drain = p.attack(0.28);
    const holdA = p.attack(0.38);
    const holdB = p.attack(0.46);
    const impact = p.attack(0.64);
    const rebound = p.attack(0.80);

    expect(drain.secondary?.glow ?? 0).toBeLessThan(-0.30);
    expect(holdA.travel).toBe(0);
    expect(holdB.travel).toBe(0);
    expect(holdA.secondary?.primaryLift).toBeCloseTo(holdB.secondary?.primaryLift ?? 0);
    expect(impact.travel).toBeGreaterThan(0.75);
    expect(rebound.secondary?.glow ?? 0).toBeGreaterThan(0.35);
    expect(rebound.secondary?.primaryLift ?? 0).toBeGreaterThan(0.01);
    expect(p.projectile).toBeUndefined();
    expect(p.attackDuration).toBeGreaterThanOrEqual(1.18);
    expect(p.attackDuration).toBeLessThanOrEqual(1.38);
  });

  it('meteor-hatchling: body stays still while exactly two mote channels gather and hold before meteor', () => {
    const p = getDragonMotionProfile('dragon-meteor-cast');
    const start = p.attack(0.10);
    const gather = p.attack(0.40);
    const holdA = p.attack(0.52);
    const holdB = p.attack(0.60);
    const release = p.attack(0.68);
    const reform = p.attack(0.90);

    expect(start.travel).toBe(0);
    expect(gather.secondary?.twist ?? 0).toBeGreaterThan(0);
    expect(gather.secondary?.secondaryTwist ?? 0).toBeLessThan(0);
    expect(gather.secondary?.inflate ?? 0).toBeLessThan(-0.20);
    expect(holdA.travel).toBe(0);
    expect(holdB.travel).toBe(0);
    expect(holdA.releaseProgress).toBeLessThan(0);
    expect(holdA.secondary?.inflate).toBeCloseTo(holdB.secondary?.inflate ?? 0);
    expect(release.releaseProgress).toBeGreaterThan(0);
    expect(reform.secondary?.inflate ?? 0).toBeGreaterThan(-0.15);
    expect(p.projectile?.kind).toBe('dragon-meteor');
    expect(p.attackDuration).toBeGreaterThanOrEqual(1.30);
    expect(p.attackDuration).toBeLessThanOrEqual(1.50);
  });

  it('star-eater-dragon: seven-beat star charge has held anticipation and delayed secondary ring', () => {
    const p = getDragonMotionProfile('dragon-star-eater-boss');
    const crouch = p.attack(0.12);
    const closed = p.attack(0.28);
    const gather = p.attack(0.38);
    const holdA = p.attack(0.44);
    const holdB = p.attack(0.48);
    const burst = p.attack(0.56);
    const contact = p.attack(0.63);
    const beforeRing = p.attack(0.68);
    const ring = p.attack(0.72);
    const tailAfter = p.attack(0.78);

    expect(crouch.scaleZ).toBeLessThan(0.96);
    expect(closed.secondary?.open ?? 0).toBeLessThan(-0.35);
    expect(gather.secondary?.glow ?? 0).toBeGreaterThan(0.8);
    expect(holdA.travel).toBe(0);
    expect(holdB.travel).toBe(0);
    expect(holdA.secondary?.open).toBeCloseTo(holdB.secondary?.open ?? 0, 1);
    expect(burst.secondary?.open ?? 0).toBeGreaterThan(0.20);
    expect(contact.travel).toBeGreaterThan(0.85);
    expect(beforeRing.releaseProgress).toBeLessThan(0);
    expect(ring.releaseProgress).toBeGreaterThan(0);
    expect(Math.abs(tailAfter.secondary?.wag ?? 0)).toBeGreaterThan(0.20);
    expect((0.50 - 0.42) * p.attackDuration).toBeGreaterThanOrEqual(0.15);
    expect((0.70 - p.contactU) * p.attackDuration).toBeGreaterThanOrEqual(0.12);
    expect((0.70 - p.contactU) * p.attackDuration).toBeLessThanOrEqual(0.18);
    expect(p.projectile?.kind).toBe('dragon-star-ring');
    expect(p.attackDuration).toBeGreaterThanOrEqual(1.90);
    expect(p.defeatDuration).toBeGreaterThanOrEqual(2.00);
    expect(p.attackVfx?.pose(0.44).telegraphOpacity ?? 0).toBeGreaterThan(0.4);
  });

  for (const id of [
    'dragon-egg-fire',
    'dragon-tiny-wing-dive',
    'dragon-star-lizard-charge',
    'dragon-meteor-cast',
    'dragon-star-eater-boss',
  ] as const) {
    it(`${id}: keeps all production poses finite`, () => {
      const p = getDragonMotionProfile(id);
      for (let i = 0; i <= 40; i += 1) {
        const u = i / 40;
        for (const sample of [p.attack(u), p.hit(u, -1), p.defeat(u, 1)]) {
          for (const value of Object.values(sample).filter((value) => typeof value === 'number')) {
            expect(Number.isFinite(value)).toBe(true);
          }
          if (sample.secondary) {
            for (const value of Object.values(sample.secondary)) {
              expect(Number.isFinite(value)).toBe(true);
            }
          }
        }
      }
    });
  }
});
