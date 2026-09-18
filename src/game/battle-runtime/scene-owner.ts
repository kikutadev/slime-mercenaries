import * as THREE from 'three';

type DisposalContext = Readonly<{
  geometries: Set<THREE.BufferGeometry>;
  materials: Set<THREE.Material>;
  textures: Set<THREE.Texture>;
  skeletons: Set<THREE.Skeleton>;
}>;

function createDisposalContext(): DisposalContext {
  return {
    geometries: new Set(),
    materials: new Set(),
    textures: new Set(),
    skeletons: new Set(),
  };
}

function disposeObjectTree(root: THREE.Object3D, context: DisposalContext): void {
  root.traverse((object) => {
    const renderable = object as THREE.Mesh;
    const geometry = renderable.geometry;
    if (geometry instanceof THREE.BufferGeometry && !context.geometries.has(geometry)) {
      context.geometries.add(geometry);
      geometry.dispose();
    }

    const material = renderable.material;
    const materials = Array.isArray(material) ? material : material === undefined ? [] : [material];
    for (const entry of materials) {
      if (!(entry instanceof THREE.Material) || context.materials.has(entry)) continue;
      context.materials.add(entry);
      for (const value of Object.values(entry)) {
        if (value instanceof THREE.Texture && !context.textures.has(value)) {
          context.textures.add(value);
          value.dispose();
        }
      }
      entry.dispose();
    }

    if (object instanceof THREE.SkinnedMesh && !context.skeletons.has(object.skeleton)) {
      context.skeletons.add(object.skeleton);
      object.skeleton.dispose();
    }
  });
}

/**
 * Owns top-level Three.js objects created by a single BattleRuntime.
 * This keeps a persistent Canvas safe across encounter swaps: disposing one
 * runtime cannot remove another runtime's scene objects.
 */
export class BattleSceneOwner {
  private readonly owned = new Set<THREE.Object3D>();
  private closed = false;

  constructor(private readonly scene: THREE.Scene) {}

  captureAddedBy<T>(create: (scene: THREE.Scene) => T): T {
    if (this.closed) throw new Error('Cannot create scene objects after BattleSceneOwner is disposed.');
    const before = new Set(this.scene.children);
    const value = create(this.scene);
    for (const child of this.scene.children) {
      if (!before.has(child)) this.owned.add(child);
    }
    return value;
  }

  add(object: THREE.Object3D): void {
    if (this.closed) {
      disposeObjectTree(object, createDisposalContext());
      return;
    }
    this.owned.add(object);
    this.scene.add(object);
  }

  remove(object: THREE.Object3D): void {
    this.owned.delete(object);
    this.scene.remove(object);
    disposeObjectTree(object, createDisposalContext());
  }

  dispose(): void {
    if (this.closed) return;
    this.closed = true;
    const context = createDisposalContext();
    for (const object of this.owned) {
      this.scene.remove(object);
      disposeObjectTree(object, context);
    }
    this.owned.clear();
  }
}
