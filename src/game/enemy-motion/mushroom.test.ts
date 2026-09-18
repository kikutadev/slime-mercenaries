import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import {
  ENEMY_MOTION_THRESHOLDS,
  ENEMY_MOTION_TIMING,
  getGreatMushroomAttackMotion,
  getMushroomHeavyAttackMotion,
  getGreatMushroomDefeatMotion,
  getGreatMushroomSlamVfxPose,
  getMushroomMotionProfile,
  getMushroomSporeAttackMotion,
  type MushroomBehaviorId,
} from './mushroom';
import { applyEnemySecondaryPose, captureEnemyRigRestPose, resolveEnemyRigParts } from './rig';

const BEHAVIORS: readonly MushroomBehaviorId[] = [
  'mushroom-bump',
  'mushroom-heavy-bump',
  'mushroom-spore',
  'mushroom-boss',
];

describe('mushroom motion profiles', () => {
  it('keeps every authored timeline finite with positive scales', () => {
    for (const id of BEHAVIORS) {
      const profile = getMushroomMotionProfile(id);
      for (let index = 0; index <= 40; index += 1) {
        const u = index / 40;
        const poses = [
          profile.idle(u * 2.5, 0.2),
          profile.move(u * profile.moveDuration, 0.1),
          profile.attack(u),
          profile.hit(u, 1),
          profile.defeat(u, -1),
        ];
        for (const pose of poses) {
          for (const value of Object.values(pose)) {
            if (typeof value === 'number') expect(Number.isFinite(value)).toBe(true);
          }
          expect(pose.scaleX).toBeGreaterThan(0);
          expect(pose.scaleY).toBeGreaterThan(0);
          expect(pose.scaleZ).toBeGreaterThan(0);
        }
      }
    }
  });

  it('gives tiny, heavy, ranged, and boss enemies distinct travel weight', () => {
    const tiny = getMushroomMotionProfile('mushroom-bump');
    const plump = getMushroomMotionProfile('mushroom-heavy-bump');
    const spore = getMushroomMotionProfile('mushroom-spore');
    const boss = getMushroomMotionProfile('mushroom-boss');

    expect(tiny.moveDuration).toBeLessThan(spore.moveDuration);
    expect(spore.moveDuration).toBeLessThan(plump.moveDuration);
    expect(plump.moveDuration).toBeLessThan(boss.moveDuration);
    expect(tiny.moveDistance).toBeGreaterThan(plump.moveDistance);
    expect(boss.moveDistance).toBeLessThan(plump.moveDistance);

    const tinyJump = Math.max(...Array.from({ length: 40 }, (_, i) => tiny.move(i * tiny.moveDuration / 39, 0.1).jump));
    const plumpJump = Math.max(...Array.from({ length: 40 }, (_, i) => plump.move(i * plump.moveDuration / 39, 0.1).jump));
    expect(tinyJump).toBeGreaterThan(plumpJump * 2);
  });
});

describe('mushroom hit and defeat identities', () => {
  it('keeps Tiny springy, Plump heavy, Spore pouch-led, and Great boss-weighted on hit', () => {
    const tiny = getMushroomMotionProfile('mushroom-bump').hit(0.5, 1);
    const plump = getMushroomMotionProfile('mushroom-heavy-bump').hit(0.5, 1);
    const spore = getMushroomMotionProfile('mushroom-spore').hit(0.5, 1);
    const boss = getMushroomMotionProfile('mushroom-boss').hit(0.5, 1);

    expect(Math.abs(tiny.rotationZ)).toBeGreaterThan(Math.abs(plump.rotationZ) * 2);
    expect(plump.scaleX).toBeGreaterThan(tiny.scaleX);
    expect(spore.secondary?.open ?? 0).toBeLessThan(-0.25);
    expect(Math.abs(boss.rotationZ)).toBeLessThan(Math.abs(tiny.rotationZ) * 0.30);
  });

  it('preserves role identity through defeat instead of returning to one mushroom collapse', () => {
    const tiny = getMushroomMotionProfile('mushroom-bump').defeat(0.72, 1);
    const plump = getMushroomMotionProfile('mushroom-heavy-bump').defeat(0.72, 1);
    const spore = getMushroomMotionProfile('mushroom-spore').defeat(0.72, 1);
    const boss = getMushroomMotionProfile('mushroom-boss').defeat(0.72, 1);

    expect(plump.scaleX).toBeGreaterThan(tiny.scaleX);
    expect(Math.abs(plump.lateralDrift)).toBeLessThan(Math.abs(tiny.lateralDrift));
    expect(spore.secondary?.open ?? 0).toBeLessThan(-0.35);
    expect(boss.scaleX).toBeGreaterThan(plump.scaleX);
    expect(Math.abs(boss.rotationZ)).toBeLessThan(Math.abs(tiny.rotationZ));
  });
});

describe('Plump Mushroom heavy body-check', () => {
  it('builds weight with stillness and stays low instead of becoming a bigger Tiny hop', () => {
    const anticipation = getMushroomHeavyAttackMotion(0.38);
    const release = getMushroomHeavyAttackMotion(0.52);
    const contact = getMushroomHeavyAttackMotion(ENEMY_MOTION_THRESHOLDS.heavyContactU);

    expect(Math.abs(anticipation.travel)).toBeLessThan(0.01);
    expect(anticipation.scaleY).toBeLessThan(0.88);
    expect(release.travel).toBeGreaterThan(0.35);
    expect(Math.max(
      ...Array.from({ length: 101 }, (_, i) => getMushroomHeavyAttackMotion(i / 100).jump),
    )).toBeLessThan(0.016);
    expect(contact.travel).toBeGreaterThan(0.99);
    expect(contact.scaleX).toBeGreaterThan(1.10);
  });
});

describe('Spore Mushroom pouch release', () => {
  it('charges the semantic pouch channel while leaving the body almost still', () => {
    const tell = getMushroomSporeAttackMotion(0.42);
    const release = getMushroomSporeAttackMotion(0.57);
    const settled = getMushroomSporeAttackMotion(1);

    expect(tell.secondary?.open ?? 0).toBeGreaterThan(0.40);
    expect(tell.scaleX).toBeLessThan(1.01);
    expect(tell.jump).toBe(0);
    expect(Math.abs(tell.travel)).toBeLessThan(0.001);
    expect(release.secondary?.open ?? 0).toBeLessThan(0);
    expect(release.travel).toBeGreaterThanOrEqual(-0.101);
    expect(settled.secondary?.open ?? 1).toBeCloseTo(0, 5);
  });

  it('resolves SporePouchRoot as the runtime open channel', () => {
    const root = new THREE.Group();
    const pouch = new THREE.Group();
    pouch.name = 'SporePouchRoot';
    root.add(pouch);

    const parts = resolveEnemyRigParts(root);
    expect(parts.openRoot).toBe(pouch);

    const rest = captureEnemyRigRestPose(parts);
    applyEnemySecondaryPose(parts, rest, { open: 0.4 });
    expect(pouch.scale.x).toBeGreaterThan(1);
    expect(pouch.scale.z).toBeGreaterThan(1);
  });

  it('keeps its projectile authored separately from body motion', () => {
    const projectile = getMushroomMotionProfile('mushroom-spore').projectile;
    expect(projectile).toBeDefined();
    expect(projectile?.kind).toBe('spore');
    expect(projectile?.createMesh().children.length).toBe(5);
  });
});


describe('Great Mushroom production motion', () => {
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

  it('uses a slower two-stage defeat than normal mushrooms without changing normal defeat timing', () => {
    expect(ENEMY_MOTION_TIMING.defeat).toBeCloseTo(1.05);
    expect(ENEMY_MOTION_TIMING.bossDefeat).toBeCloseTo(1.72);
    expect(ENEMY_MOTION_TIMING.bossDefeat).toBeGreaterThan(ENEMY_MOTION_TIMING.defeat);

    const stagger = getGreatMushroomDefeatMotion(0.12, 1);
    const collapse = getGreatMushroomDefeatMotion(0.55, 1);
    const rebound = getGreatMushroomDefeatMotion(0.69, 1);
    const settled = getGreatMushroomDefeatMotion(0.84, 1);
    const gone = getGreatMushroomDefeatMotion(1, 1);

    expect(stagger.yOffset).toBeGreaterThan(0);
    expect(collapse.rotationZ).toBeGreaterThan(0.3);
    expect(collapse.scaleY).toBeLessThan(0.7);
    expect(rebound.scaleY).toBeGreaterThan(collapse.scaleY);
    expect(settled.scaleY).toBeLessThan(rebound.scaleY);
    expect(gone.opacity).toBe(0);
  });

  it('keeps the boss defeat finite and mirrors lateral collapse by side', () => {
    for (let index = 0; index <= 100; index += 1) {
      const u = index / 100;
      const left = getGreatMushroomDefeatMotion(u, -1);
      const right = getGreatMushroomDefeatMotion(u, 1);
      for (const value of Object.values(left)) expect(Number.isFinite(value)).toBe(true);
      expect(left.lateralDrift).toBeCloseTo(-right.lateralDrift);
      expect(left.rotationZ).toBeCloseTo(-right.rotationZ);
      expect(left.opacity).toBeGreaterThanOrEqual(0);
      expect(left.opacity).toBeLessThanOrEqual(1);
    }
  });
});
