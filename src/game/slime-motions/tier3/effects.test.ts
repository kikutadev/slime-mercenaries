import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { createCannoneerSignatureVfx, createNinjaSignatureVfx } from './effects';

describe('Tier 3 gun signature effects', () => {
  it('uses shaped circular meshes for Cannoneer blast/smoke instead of visible rectangle billboards', () => {
    const group = createCannoneerSignatureVfx();
    const shapedNames = [
      'CannoneerMuzzleGlow',
      'CannoneerMuzzleCore',
      'CannoneerSmoke0',
      'CannoneerSmoke1',
      'CannoneerSmoke2',
      'CannoneerSmoke3',
      'CannoneerImpactFlash',
      'CannoneerExplosion',
      'CannoneerExplosionCore',
      'CannoneerImpactSmoke',
    ];

    for (const name of shapedNames) {
      const mesh = group.getObjectByName(name);
      expect(mesh).toBeInstanceOf(THREE.Mesh);
      expect((mesh as THREE.Mesh).geometry).toBeInstanceOf(THREE.CircleGeometry);
    }

    const explosionRing = group.getObjectByName('CannoneerExplosionRing');
    expect(explosionRing).toBeInstanceOf(THREE.Mesh);
    expect((explosionRing as THREE.Mesh).geometry).toBeInstanceOf(THREE.RingGeometry);

    const visibleRectangle = group.children.find(
      (child) => child instanceof THREE.Mesh && child.geometry instanceof THREE.PlaneGeometry,
    );
    expect(visibleRectangle).toBeUndefined();
  });
});


describe('Tier 3 rogue signature effects', () => {
  it('uses shaped smoke/afterimages so Ninja never reveals billboard rectangles', () => {
    const group = createNinjaSignatureVfx();
    for (const name of [
      'NinjaVanishSmoke',
      'NinjaReturnSmoke',
      'NinjaAfterimage0',
      'NinjaAfterimage1',
      'NinjaAfterimage2',
      'NinjaAfterimage3',
    ]) {
      const mesh = group.getObjectByName(name);
      expect(mesh).toBeInstanceOf(THREE.Mesh);
      expect((mesh as THREE.Mesh).geometry).toBeInstanceOf(THREE.CircleGeometry);
    }
  });
});
