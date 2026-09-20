import { describe, expect, it } from 'vitest';
import { getCastleMotionProfile } from './castle';

describe('castle character contracts', () => {
  it('round-sentry: spear pullback stops before the burst and helmet reacts after contact', () => {
    const p = getCastleMotionProfile('castle-spear-thrust');
    const holdA = p.attack(0.32);
    const holdB = p.attack(0.38);
    const impact = p.attack(0.58);
    const helmetCatch = p.attack(0.68);
    expect(holdA.travel).toBe(0);
    expect(holdB.travel).toBe(0);
    expect(holdA.secondary?.primaryBend).toBeCloseTo(holdB.secondary?.primaryBend ?? 0);
    expect(impact.travel).toBeGreaterThan(0.75);
    expect(helmetCatch.secondary?.headNod ?? 0).toBeGreaterThan(0.12);
    expect(p.attackDuration).toBeGreaterThanOrEqual(0.92);
    expect(p.attackDuration).toBeLessThanOrEqual(1.08);
    expect(p.projectile).toBeUndefined();
  });

  it('shield-sentry: planted shield holds still before one short bash and rebound', () => {
    const p = getCastleMotionProfile('castle-shield-bash');
    const holdA = p.attack(0.30);
    const holdB = p.attack(0.39);
    const impact = p.attack(0.63);
    const rebound = p.attack(0.78);
    expect(holdA.travel).toBe(0);
    expect(holdB.travel).toBe(0);
    expect(holdA.secondary?.shellCurl).toBeCloseTo(holdB.secondary?.shellCurl ?? 0);
    expect(impact.travel).toBeGreaterThan(0.65);
    expect(Math.abs(rebound.secondary?.shellRoll ?? 0)).toBeGreaterThan(0.08);
    expect(p.attackDuration).toBeGreaterThanOrEqual(1.00);
    expect(p.attackDuration).toBeLessThanOrEqual(1.18);
    expect(p.projectile).toBeUndefined();
  });

  it('bell-mage: left/right swing reaches an exact center stop before one sound ring', () => {
    const p = getCastleMotionProfile('castle-bell-ring');
    const left = p.attack(0.22);
    const right = p.attack(0.46);
    const stopA = p.attack(0.62);
    const stopB = p.attack(0.68);
    const release = p.attack(0.74);
    expect(left.secondary?.twist ?? 0).toBeGreaterThan(0.25);
    expect(right.secondary?.twist ?? 0).toBeLessThan(-0.20);
    expect(stopA.secondary?.twist ?? 0).toBe(0);
    expect(stopB.secondary?.twist ?? 0).toBe(0);
    expect(stopA.releaseProgress).toBeLessThan(0);
    expect(release.releaseProgress).toBeGreaterThan(0);
    expect(p.projectile?.kind).toBe('castle-sound-ring');
    expect(p.attackDuration).toBeGreaterThanOrEqual(1.18);
    expect(p.attackDuration).toBeLessThanOrEqual(1.38);
  });

  it('windup-bat: only the key winds through the hold before projectile release and wing catch-up', () => {
    const p = getCastleMotionProfile('castle-windup-burst');
    const wind = p.attack(0.42);
    const hold = p.attack(0.52);
    const release = p.attack(0.66);
    const catchUp = p.attack(0.80);
    expect(wind.travel).toBe(0);
    expect(hold.travel).toBe(0);
    expect(Math.abs(hold.secondary?.wag ?? 0)).toBeGreaterThan(0.55);
    expect(Math.abs(hold.secondary?.open ?? 0)).toBeLessThan(0.01);
    expect(release.releaseProgress).toBeGreaterThan(0);
    expect(catchUp.secondary?.open ?? 0).toBeGreaterThan(0.20);
    expect(p.projectile?.kind).toBe('castle-moon-bolt');
    expect(p.attackDuration).toBeGreaterThanOrEqual(0.98);
    expect(p.attackDuration).toBeLessThanOrEqual(1.14);
  });

  it('moon-crown-knight: dash stops before a delayed slash and cape catches up later', () => {
    const p = getCastleMotionProfile('castle-moon-knight-boss');
    const entrance = p.move(0.43, 0);
    expect(p.moveDuration).toBeGreaterThanOrEqual(1.6);
    expect(Math.abs(entrance.secondary?.wag ?? 0)).toBeGreaterThan(0.05);
    const dashStop = p.attack(0.54);
    const beforeSlash = p.attack(0.59);
    const slash = p.attack(0.63);
    const capeCatch = p.attack(0.78);
    expect(dashStop.travel).toBeGreaterThan(0.95);
    expect(beforeSlash.releaseProgress).toBeLessThan(0);
    expect(Math.abs(beforeSlash.secondary?.wag ?? 0)).toBeLessThan(0.01);
    expect(slash.releaseProgress).toBeGreaterThan(0);
    expect(Math.abs(capeCatch.secondary?.wag ?? 0)).toBeGreaterThan(0.35);
    expect((0.61 - 0.54) * p.attackDuration).toBeGreaterThanOrEqual(0.10);
    expect((0.61 - 0.54) * p.attackDuration).toBeLessThanOrEqual(0.16);
    expect(p.attackDuration).toBeGreaterThanOrEqual(1.65);
    expect(p.defeatDuration).toBeGreaterThanOrEqual(1.75);
    expect(p.projectile?.kind).toBe('castle-slash-line');
  });

  for (const id of [
    'castle-spear-thrust',
    'castle-shield-bash',
    'castle-bell-ring',
    'castle-windup-burst',
    'castle-moon-knight-boss',
  ] as const) {
    it(`${id}: keeps all production poses finite`, () => {
      const p = getCastleMotionProfile(id);
      for (let i = 0; i <= 32; i += 1) {
        const u = i / 32;
        for (const sample of [p.attack(u), p.hit(u, -1), p.defeat(u, 1)]) {
          for (const value of Object.values(sample).filter((value) => typeof value === 'number')) {
            expect(Number.isFinite(value)).toBe(true);
          }
          if (sample.secondary) {
            for (const value of Object.values(sample.secondary)) expect(Number.isFinite(value)).toBe(true);
          }
        }
      }
    });
  }
});
