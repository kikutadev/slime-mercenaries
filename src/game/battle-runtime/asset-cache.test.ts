import * as THREE from 'three';
import { describe, expect, it, vi } from 'vitest';
import { cloneBattleAssetTemplate } from './asset-cache';
import { BattleSceneOwner } from './scene-owner';

describe('battle asset runtime clones', () => {
  it('shares cloned resources inside one runtime but never with the cached template', () => {
    const sourceGeometry = new THREE.BoxGeometry();
    const sourceTexture = new THREE.Texture();
    const sourceMaterial = new THREE.MeshBasicMaterial({ map: sourceTexture });
    const template = new THREE.Group();
    template.add(
      new THREE.Mesh(sourceGeometry, sourceMaterial),
      new THREE.Mesh(sourceGeometry, sourceMaterial),
    );

    const clone = cloneBattleAssetTemplate(template);
    const meshes = clone.children as THREE.Mesh[];
    const first = meshes[0]!;
    const second = meshes[1]!;

    expect(first.geometry).not.toBe(sourceGeometry);
    expect(first.geometry).toBe(second.geometry);
    expect(first.material).not.toBe(sourceMaterial);
    expect(first.material).toBe(second.material);
    expect((first.material as THREE.MeshBasicMaterial).map).not.toBe(sourceTexture);
    expect((first.material as THREE.MeshBasicMaterial).map)
      .toBe((second.material as THREE.MeshBasicMaterial).map);
  });

  it('lets runtime disposal free clone resources without disposing cached template resources', () => {
    const sourceGeometry = new THREE.BoxGeometry();
    const sourceMaterial = new THREE.MeshBasicMaterial();
    const sourceGeometryDispose = vi.spyOn(sourceGeometry, 'dispose');
    const sourceMaterialDispose = vi.spyOn(sourceMaterial, 'dispose');
    const template = new THREE.Group();
    template.add(new THREE.Mesh(sourceGeometry, sourceMaterial));

    const clone = cloneBattleAssetTemplate(template);
    const clonedMesh = clone.children[0] as THREE.Mesh;
    const clonedGeometryDispose = vi.spyOn(clonedMesh.geometry, 'dispose');
    const clonedMaterialDispose = vi.spyOn(clonedMesh.material as THREE.Material, 'dispose');

    const scene = new THREE.Scene();
    const owner = new BattleSceneOwner(scene);
    owner.add(clone);
    owner.dispose();

    expect(clonedGeometryDispose).toHaveBeenCalledOnce();
    expect(clonedMaterialDispose).toHaveBeenCalledOnce();
    expect(sourceGeometryDispose).not.toHaveBeenCalled();
    expect(sourceMaterialDispose).not.toHaveBeenCalled();
  });
});
