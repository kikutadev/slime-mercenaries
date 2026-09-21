import { describe, expect, it } from 'vitest';
import { getMimicMotionProfile } from './mimic';

describe('hostile Mimic motion contract', () => {
  it('keeps a near-closed idle and opens the chest decisively during the snap attack', () => {
    const profile = getMimicMotionProfile('mimic-chest-snap');
    const idle = profile.idle(1.2, 0.3);
    const windup = profile.attack(0.28);
    const impact = profile.attack(0.54);
    const recover = profile.attack(0.95);

    expect(profile.familyId).toBe('mimic');
    expect(profile.contactU).toBeGreaterThan(0.45);
    expect(profile.contactU).toBeLessThan(0.65);
    expect(Math.abs(idle.secondary?.primaryBend ?? 0)).toBeLessThan(0.12);
    expect(Math.abs(impact.secondary?.primaryBend ?? 0))
      .toBeGreaterThan(Math.abs(windup.secondary?.primaryBend ?? 0));
    expect(Math.abs(impact.secondary?.primaryBend ?? 0))
      .toBeGreaterThan(Math.abs(recover.secondary?.primaryBend ?? 0));
    expect(impact.travel).toBeGreaterThan(0.5);
  });

  it('keeps every authored pose finite and bounded over the complete timeline', () => {
    const profile = getMimicMotionProfile('mimic-chest-snap');
    for (let index = 0; index <= 100; index += 1) {
      const u = index / 100;
      const poses = [
        profile.attack(u),
        profile.hit(u, 1),
        profile.defeat(u, -1),
      ];
      for (const pose of poses) {
        for (const value of Object.values(pose)) {
          if (typeof value === 'number') expect(Number.isFinite(value)).toBe(true);
        }
      }
      const attack = profile.attack(u);
      expect(attack.scaleX).toBeGreaterThan(0.5);
      expect(attack.scaleY).toBeGreaterThan(0.5);
      expect(attack.scaleZ).toBeGreaterThan(0.5);
      expect(Math.abs(attack.secondary?.primaryBend ?? 0)).toBeLessThanOrEqual(1.2);
    }
  });
});
