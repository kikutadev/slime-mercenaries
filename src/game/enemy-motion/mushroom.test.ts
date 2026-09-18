import { describe, expect, it } from 'vitest';
import {
  ENEMY_MOTION_THRESHOLDS,
  ENEMY_MOTION_TIMING,
  getGreatMushroomAttackMotion,
  getGreatMushroomSlamVfxPose,
  getMushroomMotionProfile,
} from './mushroom';

describe('Great Mushroom production slam', () => {
  it('uses a longer multi-beat attack than the normal heavy mushroom', () => {
    expect(ENEMY_MOTION_TIMING.bossAttack).toBeGreaterThan(ENEMY_MOTION_TIMING.heavyAttack);
    expect(ENEMY_MOTION_TIMING.bossAttack).toBeCloseTo(1.36);
    expect(ENEMY_MOTION_THRESHOLDS.bossContactU).toBeCloseTo(0.64);
  });

  it('reads as crouch, lift, slam, rebound, recovery instead of a scaled bump', () => {
    const crouch = getGreatMushroomAttackMotion(0.18);
    const apex = getGreatMushroomAttackMotion(0.50);
    const contact = getGreatMushroomAttackMotion(ENEMY_MOTION_THRESHOLDS.bossContactU);
    const rebound = getGreatMushroomAttackMotion(0.72);
    const recovery = getGreatMushroomAttackMotion(0.96);

    expect(crouch.scaleY).toBeLessThan(0.8);
    expect(crouch.scaleX).toBeGreaterThan(1.14);

    expect(apex.jump).toBeGreaterThan(0.27);
    expect(apex.scaleY).toBeGreaterThan(1.05);

    expect(contact.jump).toBeCloseTo(0);
    expect(contact.scaleX).toBeGreaterThan(1.2);
    expect(contact.scaleY).toBeLessThan(0.75);
    expect(contact.travel).toBeGreaterThan(0.95);

    expect(rebound.jump).toBeGreaterThan(0.05);
    expect(recovery.jump).toBeCloseTo(0);
    expect(recovery.scaleX).toBeCloseTo(1, 2);
    expect(recovery.scaleY).toBeCloseTo(1, 2);
    expect(recovery.travel).toBeCloseTo(0);
  });

  it('telegraphs before contact and concentrates impact at the authored contact frame', () => {
    const early = getGreatMushroomSlamVfxPose(0.08);
    const warning = getGreatMushroomSlamVfxPose(0.40);
    const impact = getGreatMushroomSlamVfxPose(ENEMY_MOTION_THRESHOLDS.bossContactU);
    const after = getGreatMushroomSlamVfxPose(0.80);

    expect(early.telegraphOpacity).toBe(0);
    expect(warning.telegraphOpacity).toBeGreaterThan(0.35);
    expect(warning.telegraphScale).toBeGreaterThan(0.8);
    expect(impact.impactStrength).toBeGreaterThan(0.99);
    expect(impact.telegraphOpacity).toBeGreaterThan(0.65);
    expect(after.telegraphOpacity).toBe(0);
    expect(after.impactStrength).toBeLessThan(0.01);
  });

  it('exposes the warning and impact treatment through the generic enemy motion contract', () => {
    const profile = getMushroomMotionProfile('mushroom-boss');
    expect(profile.attackVfx).toBeDefined();
    expect(profile.attackVfx?.radius).toBeGreaterThan(0.45);
    expect(profile.attackVfx?.impactSize).toBeGreaterThan(0.2);
    expect(profile.attackVfx?.cameraShakeAmplitude).toBeGreaterThan(0.03);

    expect(getMushroomMotionProfile('mushroom-heavy-bump').attackVfx).toBeUndefined();
  });

  it('keeps the slam pose and VFX finite across the full normalized timeline', () => {
    for (let index = 0; index <= 100; index += 1) {
      const u = index / 100;
      for (const value of Object.values(getGreatMushroomAttackMotion(u))) {
        if (typeof value === 'number') expect(Number.isFinite(value)).toBe(true);
      }
      const vfx = getGreatMushroomSlamVfxPose(u);
      expect(Number.isFinite(vfx.telegraphOpacity)).toBe(true);
      expect(Number.isFinite(vfx.telegraphScale)).toBe(true);
      expect(Number.isFinite(vfx.impactStrength)).toBe(true);
      expect(vfx.telegraphOpacity).toBeGreaterThanOrEqual(0);
      expect(vfx.telegraphOpacity).toBeLessThanOrEqual(0.72);
    }
  });
});
