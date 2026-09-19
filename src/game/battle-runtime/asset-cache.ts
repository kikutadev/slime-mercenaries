import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clone as cloneSkeleton } from 'three/addons/utils/SkeletonUtils.js';

const loader = new GLTFLoader();
const templatePromises = new Map<string, Promise<THREE.Group>>();

export function loadBattleAssetTemplate(url: string): Promise<THREE.Group> {
  const cached = templatePromises.get(url);
  if (cached !== undefined) return cached;

  const promise = loader.loadAsync(url)
    .then((gltf) => gltf.scene as THREE.Group)
    .catch((cause: unknown) => {
      templatePromises.delete(url);
      throw cause;
    });
  templatePromises.set(url, promise);
  return promise;
}

/**
 * Parsed GLTF templates are shared for the application lifetime, while each runtime gets
 * independent GPU-disposable resources. This avoids reparsing the same GLB every wave without
 * letting disposal of an old encounter invalidate a new encounter.
 */
export function cloneBattleAssetTemplate(template: THREE.Group): THREE.Group {
  const root = cloneSkeleton(template) as THREE.Group;
  const geometries = new Map<THREE.BufferGeometry, THREE.BufferGeometry>();
  const materials = new Map<THREE.Material, THREE.Material>();
  const textures = new Map<THREE.Texture, THREE.Texture>();

  const cloneTexture = (texture: THREE.Texture): THREE.Texture => {
    const existing = textures.get(texture);
    if (existing !== undefined) return existing;
    const cloned = texture.clone();
    cloned.needsUpdate = true;
    textures.set(texture, cloned);
    return cloned;
  };

  const cloneMaterial = (material: THREE.Material): THREE.Material => {
    const existing = materials.get(material);
    if (existing !== undefined) return existing;
    const cloned = material.clone();
    materials.set(material, cloned);

    const record = cloned as unknown as Record<string, unknown>;
    for (const [key, value] of Object.entries(record)) {
      if (value instanceof THREE.Texture) record[key] = cloneTexture(value);
    }
    return cloned;
  };

  root.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;

    const sourceGeometry = object.geometry;
    if (!(sourceGeometry instanceof THREE.BufferGeometry)) return;
    let geometry = geometries.get(sourceGeometry);
    if (geometry === undefined) {
      geometry = sourceGeometry.clone();
      geometries.set(sourceGeometry, geometry);
    }
    object.geometry = geometry;

    object.material = Array.isArray(object.material)
      ? object.material.map(cloneMaterial)
      : cloneMaterial(object.material);
  });

  return root;
}

export function battleAssetCacheSize(): number {
  return templatePromises.size;
}
