import * as THREE from 'three';
import { describe, expect, it, vi } from 'vitest';
import { disposeObjectMaterials, disposeOwnedObjectResources } from './resource-disposal';

describe('battle runtime resource disposal', () => {
  it('can release cloned materials without disposing shared geometry', () => {
    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshBasicMaterial();
    const geometryDispose = vi.spyOn(geometry, 'dispose');
    const materialDispose = vi.spyOn(material, 'dispose');
    const root = new THREE.Group();
    root.add(new THREE.Mesh(geometry, material));

    disposeObjectMaterials(root);

    expect(materialDispose).toHaveBeenCalledOnce();
    expect(geometryDispose).not.toHaveBeenCalled();
  });

  it('deduplicates shared geometry and materials when disposing owned objects', () => {
    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshBasicMaterial();
    const geometryDispose = vi.spyOn(geometry, 'dispose');
    const materialDispose = vi.spyOn(material, 'dispose');
    const root = new THREE.Group();
    root.add(new THREE.Mesh(geometry, material), new THREE.Mesh(geometry, material));

    disposeOwnedObjectResources(root);

    expect(geometryDispose).toHaveBeenCalledOnce();
    expect(materialDispose).toHaveBeenCalledOnce();
  });
});
