import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { getLeafMotionProfile, leafIdle, leafSlap, leafWhirl } from './leaf';
import type { EnemySecondaryPose } from './shared';

const BEHAVIORS = ['leaf-hop-slap', 'leaf-whirl'] as const;

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
    const limit = key === 'twist' ? Math.PI * 2 + 0.05 : 1.25;
    expect(Math.abs(value), `${key} exceeds authored leaf-motion bound`).toBeLessThanOrEqual(limit);
  }
}

for (const id of BEHAVIORS) {
  describe(id, () => {
    it('keeps all authored poses finite, positive, and bounded', () => {
      const profile = getLeafMotionProfile(id);
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

    it('ends defeat as a stable readable fallen pose instead of disappearing', () => {
      const profile = getLeafMotionProfile(id);
      const nearEnd = profile.defeat(0.98, 1);
      const end = profile.defeat(1, 1);
      expect(end.opacity).toBe(1);
      expect(Math.abs(end.rotationZ - nearEnd.rotationZ)).toBeLessThan(0.03);
      expect(Math.abs((end.secondary?.primaryBend ?? 0) - (nearEnd.secondary?.primaryBend ?? 0))).toBeLessThan(0.03);
    });
  });
}

describe('Leafling attack grammar', () => {
  it('holds a strong anticipation, then releases faster into contact and recovers', () => {
    const anticipation = leafSlap(0.28);
    const release = leafSlap(0.46);
    const contact = leafSlap(0.55);
    const recovery = leafSlap(0.96);

    expect(anticipation.secondary?.primaryBend ?? 0).toBeLessThan(-0.60);
    expect(release.secondary?.primaryBend ?? 0).toBeGreaterThan(0.55);
    expect(contact.secondary?.primaryBend ?? 0).toBeGreaterThan(1.0);
    expect(contact.travel).toBeGreaterThan(0.95);
    expect(Math.abs(recovery.secondary?.primaryBend ?? 1)).toBeLessThan(0.08);
    expect(recovery.travel).toBeLessThan(0.08);
  });

  it('keeps the leaf tip delayed behind the main leaf during release', () => {
    const release = leafSlap(0.43);
    expect((release.secondary?.primaryBend ?? 0) - (release.secondary?.secondaryBend ?? 0)).toBeGreaterThan(0.35);
  });
});

describe('Whirl Leaf attack grammar', () => {
  it('uses a restrained idle and a crisp half-spin release with same-direction settle', () => {
    const idle = leafIdle(0.7, 0.2);
    const anticipation = leafWhirl(0.32);
    const contact = leafWhirl(0.50);
    const recoil = leafWhirl(0.64);
    const end = leafWhirl(1);

    expect(Math.abs(idle.secondary?.twist ?? 0)).toBeLessThan(0.05);
    expect(Math.abs(anticipation.secondary?.twist ?? 0)).toBeLessThan(0.10);
    expect(contact.secondary?.twist ?? 0).toBeCloseTo(Math.PI, 1);
    expect(recoil.secondary?.twist ?? 0).toBeGreaterThan(Math.PI);
    expect(end.secondary?.twist ?? 0).toBeCloseTo(Math.PI * 2, 5);
  });

  it('builds a small layered crescent gust rather than a single giant ring', () => {
    const profile = getLeafMotionProfile('leaf-whirl');
    const gust = profile.projectile?.createMesh();
    expect(gust).toBeDefined();
    expect(gust?.children.length ?? 0).toBeGreaterThanOrEqual(4);

    const bounds = new THREE.Box3().setFromObject(gust!);
    const size = bounds.getSize(new THREE.Vector3());
    expect(Math.max(size.x, size.y, size.z)).toBeLessThan(0.22);
    expect(profile.projectile?.flightSeconds).toBeLessThanOrEqual(0.32);
  });
});
