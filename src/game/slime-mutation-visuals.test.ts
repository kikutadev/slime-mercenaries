import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { applySlimeMutationVisuals, disposeSlimeMutationVisuals } from './slime-mutation-visuals';

function modelRoot() {
  const root = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.SphereGeometry(1, 8, 8),
    new THREE.MeshStandardMaterial({ color: '#55ccaa' }),
  );
  body.name = 'Body';
  root.add(body);
  return { root, body };
}

describe('slime mutation visuals', () => {
  it.each([
    ['king', 7],
    ['golden', 4],
    ['dragon', 5],
    ['prism', 4],
  ] as const)('adds a bounded %s identity layer without replacing the job model', (mutationId, minParts) => {
    const { root, body } = modelRoot();
    const originalGeometry = body.geometry;
    const originalMaterial = body.material;
    applySlimeMutationVisuals(root, mutationId);

    const visualRoot = root.getObjectByName('SlimeMutationVisualRoot');
    expect(visualRoot).toBeDefined();
    expect(visualRoot?.children.length).toBeGreaterThanOrEqual(minParts);
    expect(body.geometry).toBe(originalGeometry);
    expect(body.material).not.toBe(originalMaterial);
  });

  it('disposes only decorator resources and restores the cached GLTF body material', () => {
    const { root, body } = modelRoot();
    const originalMaterial = body.material;
    applySlimeMutationVisuals(root, 'golden');
    expect(body.material).not.toBe(originalMaterial);
    disposeSlimeMutationVisuals(root);
    expect(root.getObjectByName('SlimeMutationVisualRoot')).toBeUndefined();
    expect(body.material).toBe(originalMaterial);
  });

  it('leaves an unmutated model undecorated', () => {
    const { root } = modelRoot();
    applySlimeMutationVisuals(root, null);
    expect(root.getObjectByName('SlimeMutationVisualRoot')).toBeUndefined();
  });
});
