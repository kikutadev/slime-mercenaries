import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { budPoke, getFlowerMotionProfile, pollenAttack } from './flower';
import type { EnemySecondaryPose } from './shared';

const BEHAVIORS = ['flower-bud-poke', 'flower-pollen'] as const;

function expectFiniteNumbers(value: object): void {
  for (const entry of Object.values(value)) {
    if (typeof entry === 'number') expect(Number.isFinite(entry)).toBe(true);
    else if (entry && typeof entry === 'object') expectFiniteNumbers(entry);
  }
}

function expectPositiveScale(pose: { scaleX: number; scaleY: number; scaleZ: number }): void {
  expect(pose.scaleX).toBeGreaterThan(0);
  expect(pose.scaleY).toBeGreaterThan(0);
  expect(pose.scaleZ).toBeGreaterThan(0);
}

function expectSecondaryBounded(secondary: EnemySecondaryPose | undefined): void {
  if (!secondary) return;
  for (const [key, value] of Object.entries(secondary)) {
    if (value === undefined) continue;
    expect(Math.abs(value), `${key} exceeds authored flower-motion bound`).toBeLessThanOrEqual(0.85);
  }
}

for (const id of BEHAVIORS) {
  describe(id, () => {
    it('keeps idle, move, attack, hit, and defeat poses finite and bounded', () => {
      const profile = getFlowerMotionProfile(id);
      expect(profile.contactU).toBeGreaterThan(0);
      expect(profile.contactU).toBeLessThan(1);
      expect(profile.attackDuration).toBeGreaterThan(0);
      expect(profile.moveDuration).toBeGreaterThan(0);
      expect(profile.defeatDuration).toBeGreaterThan(0);

      for (let index = 0; index <= 40; index += 1) {
        const u = index / 40;
        const poses = [
          profile.idle(u * 2.4, 0.3),
          profile.move(u * profile.moveDuration, 0.2),
          profile.attack(u),
          profile.hit(u, -1),
          profile.defeat(u, 1),
        ];
        for (const pose of poses) {
          expectFiniteNumbers(pose);
          expectPositiveScale(pose);
          expectSecondaryBounded(pose.secondary);
        }
      }
    });

    it('settles its defeat geometry into a stable terminal pose', () => {
      const profile = getFlowerMotionProfile(id);
      const nearEnd = profile.defeat(0.98, 1);
      const end = profile.defeat(1, 1);
      expect(Math.abs(end.rotationZ - nearEnd.rotationZ)).toBeLessThan(0.02);
      expect(Math.abs(end.scaleZ - nearEnd.scaleZ)).toBeLessThan(0.02);
      expect(Math.abs((end.secondary?.open ?? 0) - (nearEnd.secondary?.open ?? 0))).toBeLessThan(0.02);
    });
  });
}

describe('Bud Bloom attack grammar', () => {
  it('closes visibly before one compact poke without a spring-toy overshoot loop', () => {
    const anticipation = budPoke(0.30);
    const release = budPoke(0.46);
    const contact = budPoke(0.58);
    const recovery = budPoke(0.96);

    expect(anticipation.secondary?.open ?? 0).toBeLessThan(-0.24);
    expect(anticipation.scaleZ).toBeLessThan(0.94);
    expect(release.travel).toBeGreaterThan(0.70);
    expect(release.secondary?.headNod ?? 0).toBeGreaterThan(0.15);
    expect(contact.travel).toBeGreaterThan(0.98);
    expect(contact.secondary?.open ?? 0).toBeGreaterThan(0.06);
    expect(contact.secondary?.headNod ?? 0).toBeLessThan(0.36);
    expect(recovery.travel).toBeLessThan(0.10);
    expect(Math.abs(recovery.secondary?.headNod ?? 1)).toBeLessThan(0.08);
  });

  it('keeps idle and move channels subordinate to the attack tell', () => {
    const profile = getFlowerMotionProfile('flower-bud-poke');
    const idle = Array.from({ length: 24 }, (_, index) => profile.idle(index * 0.12, 0.2));
    const move = Array.from({ length: 24 }, (_, index) => profile.move(index * profile.moveDuration / 23, 0.15));

    expect(Math.max(...idle.map((pose) => Math.abs(pose.secondary?.headNod ?? 0)))).toBe(0);
    expect(Math.max(...idle.map((pose) => Math.abs(pose.secondary?.open ?? 0)))).toBe(0);
    expect(Math.max(...move.map((pose) => Math.abs(pose.secondary?.headNod ?? 0)))).toBeLessThanOrEqual(0.026);
    expect(Math.max(...move.map((pose) => Math.abs(pose.secondary?.open ?? 0)))).toBe(0);
  });
});

describe('Puff Flower attack grammar', () => {
  it('inflates, holds still, then releases one small puff without reversing the flower head', () => {
    const early = pollenAttack(0.10);
    const tell = pollenAttack(0.44);
    const release = pollenAttack(0.56);
    const settled = pollenAttack(0.98);

    expect(tell.secondary?.open ?? 0).toBeGreaterThan(0.30);
    expect(tell.scaleX).toBeGreaterThan(early.scaleX);
    expect(Math.abs(tell.travel)).toBeLessThan(0.01);
    expect(Math.abs(tell.secondary?.headNod ?? 0)).toBe(0);
    expect(release.secondary?.open ?? 0).toBeGreaterThanOrEqual(0);
    expect(release.secondary?.headNod ?? 0).toBeGreaterThan(0.02);
    expect(release.travel).toBeLessThan(-0.05);
    expect(release.travel).toBeGreaterThanOrEqual(-0.16);
    expect(Math.abs(settled.secondary?.open ?? 1)).toBeLessThan(0.05);
  });

  it('keeps puff-flower idle quiet enough that attack anticipation owns the silhouette change', () => {
    const profile = getFlowerMotionProfile('flower-pollen');
    const idle = Array.from({ length: 24 }, (_, index) => profile.idle(index * 0.12, 0.2));
    expect(Math.max(...idle.map((pose) => Math.abs(pose.secondary?.open ?? 0)))).toBeLessThanOrEqual(0.016);
    expect(Math.max(...idle.map((pose) => Math.abs(pose.secondary?.headNod ?? 0)))).toBe(0);
    expect(Math.max(...idle.map((pose) => Math.abs(pose.secondary?.secondaryBend ?? 0)))).toBeLessThanOrEqual(0.019);
  });

  it('keeps pollen quieter than a friendly signature effect', () => {
    const profile = getFlowerMotionProfile('flower-pollen');
    const pollen = profile.projectile?.createMesh();
    expect(pollen).toBeDefined();
    expect(pollen?.children.length).toBe(4); // one soft core + three tiny motes

    const bounds = new THREE.Box3().setFromObject(pollen!);
    const size = bounds.getSize(new THREE.Vector3());
    expect(Math.max(size.x, size.y, size.z)).toBeLessThan(0.12);

    const materials: THREE.Material[] = [];
    pollen?.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      const meshMaterials = Array.isArray(object.material) ? object.material : [object.material];
      materials.push(...meshMaterials);
    });
    expect(materials).toHaveLength(4);
    expect(Math.max(...materials.map((material) => material.opacity))).toBeLessThanOrEqual(0.60);
    expect(materials.every((material) => material.transparent)).toBe(true);
    expect(materials.every((material) => material.depthWrite === false)).toBe(true);

    expect(profile.projectile?.flightSeconds).toBeLessThanOrEqual(0.50);
    expect(profile.projectile?.arcHeight(0.5) ?? 1).toBeLessThanOrEqual(0.10);
  });
});
