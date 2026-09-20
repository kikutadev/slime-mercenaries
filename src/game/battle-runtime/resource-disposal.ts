import * as THREE from 'three';

function collectMaterials(root: THREE.Object3D): Set<THREE.Material> {
  const materials = new Set<THREE.Material>();
  root.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    const entries = Array.isArray(object.material) ? object.material : [object.material];
    entries.forEach((material) => materials.add(material));
  });
  return materials;
}

/**
 * Dispose per-instance materials while preserving geometry that may be shared with
 * a cached/template GLTF.
 */
export function disposeObjectMaterials(root: THREE.Object3D): void {
  collectMaterials(root).forEach((material) => material.dispose());
}

/**
 * Dispose geometry and materials owned exclusively by a runtime-created object.
 * Textures are intentionally not disposed here because material clones can share
 * texture instances with cached GLTF templates.
 */
export function disposeOwnedObjectResources(root: THREE.Object3D): void {
  const geometries = new Set<THREE.BufferGeometry>();
  root.traverse((object) => {
    if (object instanceof THREE.Mesh) geometries.add(object.geometry);
  });
  geometries.forEach((geometry) => geometry.dispose());
  disposeObjectMaterials(root);
}
