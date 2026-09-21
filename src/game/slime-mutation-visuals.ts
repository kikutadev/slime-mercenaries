import * as THREE from 'three';
import type { SlimeMutationId } from '../domain';

const VISUAL_ROOT = 'SlimeMutationVisualRoot';
const ORIGINAL_MATERIAL_KEY = 'slimeMutationOriginalMaterial';

function makeMaterial(color: string, emissive = color, opacity = 1): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color,
    emissive,
    emissiveIntensity: 0.28,
    roughness: 0.34,
    metalness: 0.16,
    transparent: opacity < 1,
    opacity,
  });
}

function materialsOf(material: THREE.Material | THREE.Material[]): readonly THREE.Material[] {
  return Array.isArray(material) ? material : [material];
}

function disposeVisualRoot(root: THREE.Object3D): void {
  const visualRoot = root.getObjectByName(VISUAL_ROOT);
  if (visualRoot === undefined) return;
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  visualRoot.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    geometries.add(object.geometry);
    materialsOf(object.material).forEach((material) => materials.add(material));
  });
  visualRoot.removeFromParent();
  geometries.forEach((geometry) => geometry.dispose());
  materials.forEach((material) => material.dispose());
}

function restoreBodyMaterial(root: THREE.Object3D): void {
  const body = root.getObjectByName('Body');
  if (!(body instanceof THREE.Mesh)) return;
  const original = body.userData[ORIGINAL_MATERIAL_KEY] as THREE.Material | THREE.Material[] | undefined;
  if (original === undefined) return;

  const originalMaterials = new Set(materialsOf(original));
  materialsOf(body.material).forEach((material) => {
    if (!originalMaterials.has(material)) material.dispose();
  });
  body.material = original;
  delete body.userData[ORIGINAL_MATERIAL_KEY];
}

function tintBody(root: THREE.Object3D, mutationId: SlimeMutationId): void {
  const body = root.getObjectByName('Body');
  if (!(body instanceof THREE.Mesh)) return;
  body.userData[ORIGINAL_MATERIAL_KEY] = body.material;

  const tint = mutationId === 'king'
    ? '#8dddf0'
    : mutationId === 'golden'
      ? '#ffd84d'
      : mutationId === 'dragon'
        ? '#d96559'
        : '#9be8ff';
  const emissive = mutationId === 'golden'
    ? '#ffbf2f'
    : mutationId === 'prism'
      ? '#9fdcff'
      : '#000000';

  const recolor = (material: THREE.Material): THREE.Material => {
    const clone = material.clone();
    if ('color' in clone && clone.color instanceof THREE.Color) clone.color.set(tint);
    if (clone instanceof THREE.MeshStandardMaterial) {
      clone.emissive.set(emissive);
      clone.emissiveIntensity = mutationId === 'golden' ? 0.32 : mutationId === 'prism' ? 0.24 : 0.05;
      clone.roughness = mutationId === 'golden' ? 0.24 : 0.38;
    }
    return clone;
  };
  body.material = Array.isArray(body.material)
    ? body.material.map(recolor)
    : recolor(body.material);
}

function addCrown(group: THREE.Group): void {
  const gold = makeMaterial('#ffd45a', '#8a5a00');
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.42, 0.18, 8), gold);
  base.position.y = 1.40;
  group.add(base);
  for (let index = 0; index < 5; index += 1) {
    const angle = (index / 5) * Math.PI * 2;
    const point = new THREE.Mesh(new THREE.ConeGeometry(0.105, 0.38, 6), gold);
    point.position.set(Math.cos(angle) * 0.30, 1.64, Math.sin(angle) * 0.30);
    group.add(point);
  }
  const jewel = new THREE.Mesh(new THREE.OctahedronGeometry(0.10, 0), makeMaterial('#ff6c75', '#ff3348'));
  jewel.position.set(0, 1.48, 0.40);
  group.add(jewel);
  const aura = new THREE.Mesh(
    new THREE.TorusGeometry(0.72, 0.035, 8, 36),
    makeMaterial('#ffe88a', '#ffc83d', 0.52),
  );
  aura.rotation.x = Math.PI / 2;
  aura.position.y = 0.19;
  group.add(aura);
}

function addGoldenSparkles(group: THREE.Group): void {
  const material = makeMaterial('#fff1a3', '#ffc52d');
  const positions = [
    [-0.58, 0.82, 0.16],
    [0.55, 1.12, 0.10],
    [-0.40, 1.45, -0.06],
    [0.44, 0.62, -0.08],
  ] as const;
  positions.forEach(([x, y, z], index) => {
    const sparkle = new THREE.Mesh(new THREE.OctahedronGeometry(index % 2 === 0 ? 0.09 : 0.07, 0), material);
    sparkle.position.set(x, y, z);
    sparkle.rotation.z = index * 0.62;
    group.add(sparkle);
  });
}

function addDragonHorns(group: THREE.Group): void {
  const hornMaterial = makeMaterial('#5b2a2e', '#170507');
  for (const side of [-1, 1] as const) {
    const horn = new THREE.Mesh(new THREE.ConeGeometry(0.115, 0.46, 7), hornMaterial);
    horn.position.set(side * 0.34, 1.43, -0.02);
    horn.rotation.z = side * -0.42;
    group.add(horn);
  }
  const ember = makeMaterial('#ff9b55', '#ff4e24', 0.90);
  for (let index = 0; index < 3; index += 1) {
    const spike = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.30, 6), ember);
    spike.position.set(0, 1.08 - index * 0.28, -0.48);
    spike.rotation.x = -Math.PI / 2.6;
    group.add(spike);
  }
}

function addPrismCrystals(group: THREE.Group): void {
  const colors = ['#79eaff', '#d58cff', '#ff92c6'] as const;
  const positions = [
    [-0.53, 1.25, 0.06],
    [0.54, 1.02, -0.02],
    [0.05, 1.58, -0.12],
  ] as const;
  positions.forEach(([x, y, z], index) => {
    const crystal = new THREE.Mesh(
      new THREE.OctahedronGeometry(index === 2 ? 0.16 : 0.12, 0),
      makeMaterial(colors[index]!, colors[index]!, 0.78),
    );
    crystal.position.set(x, y, z);
    crystal.rotation.y = index * 0.9;
    group.add(crystal);
  });
  const halo = new THREE.Mesh(
    new THREE.TorusGeometry(0.58, 0.025, 8, 32),
    makeMaterial('#b8f4ff', '#8adfff', 0.58),
  );
  halo.rotation.x = Math.PI / 2;
  halo.position.y = 0.82;
  group.add(halo);
}

/** Release decorator-owned resources without touching cached GLTF geometry/materials. */
export function disposeSlimeMutationVisuals(root: THREE.Object3D): void {
  disposeVisualRoot(root);
  restoreBodyMaterial(root);
}

/**
 * Adds mutation identity without replacing the authored job model. Weapons, hats and Tier-3
 * silhouettes remain intact; the mutation is a horizontal visual layer.
 */
export function applySlimeMutationVisuals(root: THREE.Object3D, mutationId: SlimeMutationId | null): void {
  disposeSlimeMutationVisuals(root);
  if (mutationId === null) return;

  tintBody(root, mutationId);
  const visualRoot = new THREE.Group();
  visualRoot.name = VISUAL_ROOT;
  switch (mutationId) {
    case 'king': addCrown(visualRoot); break;
    case 'golden': addGoldenSparkles(visualRoot); break;
    case 'dragon': addDragonHorns(visualRoot); break;
    case 'prism': addPrismCrystals(visualRoot); break;
  }
  root.add(visualRoot);
}
