import { describe, expect, it } from 'vitest';
import { getMushroomMotionProfile } from './mushroom';

describe('mushroom character contracts', () => {
  it('tiny-mushroom: quick cap dip -> bump -> cap rebound', () => {
    const p = getMushroomMotionProfile('mushroom-bump');
    const crouch = p.attack(0.15);
    const contact = p.attack(0.57);
    expect(crouch.scaleY).toBeLessThan(0.90);
    expect(crouch.secondary?.primaryBend ?? 0).toBeLessThan(-0.08);
    expect(contact.travel).toBeGreaterThan(0.90);
    expect(contact.secondary?.primaryBend ?? 0).toBeGreaterThan(0.10);
    expect(p.attackDuration).toBeLessThanOrEqual(0.55);
    expect(p.projectile).toBeUndefined();
  });

  it('plump-mushroom: heavier and slower windup than tiny-mushroom', () => {
    const tiny = getMushroomMotionProfile('mushroom-bump');
    const p = getMushroomMotionProfile('mushroom-heavy-bump');
    const crouch = p.attack(0.20);
    const contact = p.attack(0.60);
    expect(crouch.scaleY).toBeLessThan(0.83);
    expect(crouch.secondary?.primaryBend ?? 0).toBeLessThan(-0.14);
    expect(contact.travel).toBeGreaterThan(0.90);
    expect(contact.secondary?.primaryBend ?? 0).toBeGreaterThan(0.16);
    expect(p.attackDuration).toBeGreaterThan(tiny.attackDuration);
    expect(p.attackDuration).toBeGreaterThanOrEqual(0.70);
  });

  it('spore-mushroom: cap inflates -> one spore release -> recoil', () => {
    const p = getMushroomMotionProfile('mushroom-spore');
    const charge = p.attack(0.40);
    const recoil = p.attack(0.58);
    expect(charge.scaleY).toBeGreaterThan(1.10);
    expect(charge.secondary?.primaryBend ?? 0).toBeLessThan(-0.07);
    expect(recoil.releaseProgress).toBeGreaterThan(0);
    expect(recoil.travel).toBeLessThan(0);
    expect(recoil.secondary?.primaryBend ?? 0).toBeGreaterThan(0);
    expect(p.projectile?.kind).toBe('spore');
    expect(p.projectile?.flightSeconds).toBeGreaterThanOrEqual(0.40);
  });

  it('great-mushroom: boss has hold -> slam -> delayed shelf reaction -> long defeat', () => {
    const p = getMushroomMotionProfile('mushroom-boss');
    const windup = p.attack(0.20);
    const hold = p.attack(0.34);
    const impact = p.attack(0.62);
    const delayed = p.attack(0.78);
    expect(windup.secondary?.primaryBend ?? 0).toBeLessThan(-0.10);
    expect(hold.scaleY).toBeLessThan(0.80);
    expect(impact.travel).toBeGreaterThan(0.90);
    expect(impact.scaleX).toBeGreaterThan(1.14);
    expect(Math.abs(delayed.secondary?.secondaryBend ?? 0)).toBeGreaterThan(0.10);
    expect(p.attackDuration).toBeGreaterThanOrEqual(1.20);
    expect(p.defeatDuration).toBeGreaterThanOrEqual(1.35);
    expect(Math.abs(p.defeat(0.80, 1).secondary?.secondaryBend ?? 0)).toBeGreaterThan(0.15);
  });
});
