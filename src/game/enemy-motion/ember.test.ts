import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { applyEnemySecondaryPose, captureEnemyRigRestPose, resolveEnemyRigParts } from './rig';
import { getEmberMotionProfile } from './ember';

describe('ember character contracts', () => {
  it('ember-gecko: crouch/flame tell -> dash -> body stop -> delayed tail whip', () => {
    const p = getEmberMotionProfile('ember-tail-dash');
    const tell = p.attack(0.24);
    const contact = p.attack(0.65);
    const after = p.attack(0.78);
    expect(tell.scaleY).toBeLessThan(0.95);
    expect(tell.secondary?.glow ?? 0).toBeGreaterThan(0);
    expect(contact.travel).toBeGreaterThan(0.90);
    expect(after.travel).toBeLessThan(contact.travel);
    expect(after.secondary?.wag ?? 0).toBeGreaterThan(0.45);
    expect(p.attackDuration).toBeGreaterThanOrEqual(0.84);
    expect(p.attackDuration).toBeLessThanOrEqual(1.00);
    expect(p.projectile).toBeUndefined();
  });

  it('charcoal-roller: red -> orange -> yellow charge holds before burst', () => {
    const p = getEmberMotionProfile('ember-charcoal-burst');
    const red = p.attack(0.16);
    const orange = p.attack(0.34);
    const whiteHot = p.attack(0.54);
    const hold = p.attack(0.60);
    const burst = p.attack(0.70);
    expect(red.secondary?.glow ?? 0).toBeGreaterThan(0.15);
    expect(orange.secondary?.glowHeat ?? 0).toBeGreaterThan(0.35);
    expect(whiteHot.secondary?.glowHeat ?? 0).toBeGreaterThan(0.90);
    expect(hold.travel).toBe(0);
    expect(burst.travel).toBeGreaterThan(0.40);
    expect(p.attackDuration).toBeGreaterThanOrEqual(1.00);
    expect(p.attackDuration).toBeLessThanOrEqual(1.18);
  });

  it('crackle-bug: two shell shakes -> still hold -> one spark -> recoil', () => {
    const p = getEmberMotionProfile('ember-spark-shell');
    const shake1 = p.attack(0.10);
    const shake2 = p.attack(0.34);
    const hold = p.attack(0.56);
    const recoil = p.attack(0.74);
    expect(Math.abs(shake1.secondary?.shellRoll ?? 0)).toBeGreaterThan(0.03);
    expect(Math.abs(shake2.secondary?.shellRoll ?? 0)).toBeGreaterThan(0.03);
    expect(hold.secondary?.shellCurl ?? 0).toBeGreaterThan(0.10);
    expect(recoil.travel).toBeLessThan(0);
    expect(p.projectile?.kind).toBe('ember-spark');
    expect(p.attackDuration).toBeGreaterThanOrEqual(1.02);
    expect(p.attackDuration).toBeLessThanOrEqual(1.20);
  });

  it('magma-crab: one-claw weight -> opposite snap -> delayed opposite-claw settle', () => {
    const p = getEmberMotionProfile('ember-crab-snap');
    const weight = p.attack(0.25);
    const snap = p.attack(0.58);
    const settle = p.attack(0.78);
    expect(weight.secondary?.primaryBend ?? 0).toBeGreaterThan(0.30);
    expect(snap.secondary?.secondaryBend ?? 0).toBeLessThan(-0.25);
    expect(snap.travel).toBeGreaterThan(0.70);
    expect(settle.secondary?.secondaryBend ?? 0).toBeGreaterThan(0.05);
    expect(p.projectile).toBeUndefined();
  });

  it('furnace-turtle: staged heat -> compression -> impact -> delayed ring', () => {
    const p = getEmberMotionProfile('ember-furnace-boss');
    const red = p.attack(0.26);
    const orange = p.attack(0.40);
    const whiteHot = p.attack(0.54);
    const impact = p.attack(0.70);
    const beforeRing = p.attack(0.76);
    const ring = p.attack(0.84);
    expect(red.secondary?.glow ?? 0).toBeGreaterThan(0.25);
    expect(orange.secondary?.glowHeat ?? 0).toBeGreaterThan(0.45);
    expect(whiteHot.secondary?.glowHeat ?? 0).toBeGreaterThan(0.90);
    expect(impact.scaleY).toBeLessThan(0.93);
    expect(beforeRing.releaseProgress).toBeLessThan(0);
    expect(ring.releaseProgress).toBeGreaterThan(0);
    expect(p.projectile?.kind).toBe('fire-ring');
    expect(p.attackDuration).toBeGreaterThanOrEqual(1.60);
    expect(p.defeatDuration).toBeGreaterThanOrEqual(1.65);
  });

  it('bounded rig glow changes emissive state and resets it deterministically', () => {
    const root = new THREE.Group();
    const glowRoot = new THREE.Group();
    glowRoot.name = 'GlowRoot';
    const material = new THREE.MeshStandardMaterial({ emissive: '#772000', emissiveIntensity: 0.5 });
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.1), material);
    glowRoot.add(mesh);
    root.add(glowRoot);
    const parts = resolveEnemyRigParts(root);
    const rest = captureEnemyRigRestPose(parts);
    applyEnemySecondaryPose(parts, rest, { glow: 1, glowHeat: 1 });
    expect(material.emissiveIntensity).toBeGreaterThan(1.0);
    expect(material.emissive.g).toBeGreaterThan(rest.glowEmissive[0]!.g);
    applyEnemySecondaryPose(parts, rest, undefined);
    expect(material.emissiveIntensity).toBeCloseTo(0.5);
    expect(material.emissive.getHex()).toBe(rest.glowEmissive[0]!.getHex());
  });

  for (const id of [
    'ember-tail-dash',
    'ember-charcoal-burst',
    'ember-spark-shell',
    'ember-crab-snap',
    'ember-furnace-boss',
  ] as const) {
    it(`${id}: keeps all production poses finite`, () => {
      const p = getEmberMotionProfile(id);
      for (let i = 0; i <= 24; i += 1) {
        const u = i / 24;
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
