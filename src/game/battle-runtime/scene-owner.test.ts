import * as THREE from 'three';
import { describe, expect, it, vi } from 'vitest';
import { BattleSceneOwner } from './scene-owner';

describe('BattleSceneOwner', () => {
  it('removes only objects owned by the disposed runtime', () => {
    const scene = new THREE.Scene();
    const first = new BattleSceneOwner(scene);
    const second = new BattleSceneOwner(scene);
    const firstMesh = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial());
    const secondMesh = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial());

    first.add(firstMesh);
    second.add(secondMesh);
    first.dispose();

    expect(scene.children).not.toContain(firstMesh);
    expect(scene.children).toContain(secondMesh);
  });

  it('disposes geometry and material when an owned object is removed', () => {
    const scene = new THREE.Scene();
    const owner = new BattleSceneOwner(scene);
    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshBasicMaterial();
    const geometryDispose = vi.spyOn(geometry, 'dispose');
    const materialDispose = vi.spyOn(material, 'dispose');
    const mesh = new THREE.Mesh(geometry, material);

    owner.add(mesh);
    owner.remove(mesh);

    expect(geometryDispose).toHaveBeenCalledOnce();
    expect(materialDispose).toHaveBeenCalledOnce();
  });

  it('captures environment objects added directly to the scene', () => {
    const scene = new THREE.Scene();
    const owner = new BattleSceneOwner(scene);
    const external = new THREE.Group();
    scene.add(external);

    const created = owner.captureAddedBy((ownedScene) => {
      const group = new THREE.Group();
      ownedScene.add(group);
      return group;
    });

    owner.dispose();
    expect(scene.children).toContain(external);
    expect(scene.children).not.toContain(created);
  });
});
