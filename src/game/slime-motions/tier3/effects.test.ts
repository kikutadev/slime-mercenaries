import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { createAssassinSignatureVfx, createCannoneerSignatureVfx, createEngineerSignatureVfx, createNinjaSignatureVfx } from './effects';

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


describe('Tier 3 impact shapes', () => {
  it('does not reveal any rectangular white flash on Assassin targets', () => {
    const group = createAssassinSignatureVfx();
    for (const name of ['AssassinShadowBlink', 'AssassinImpactFlash']) {
      const mesh = group.getObjectByName(name);
      expect(mesh).toBeInstanceOf(THREE.Mesh);
      expect((mesh as THREE.Mesh).geometry).toBeInstanceOf(name === 'AssassinImpactFlash' ? THREE.RingGeometry : THREE.CircleGeometry);
    }
  });

  it('uses pointed attack ribbons for Ninja and Assassin, not sharp-edged rectangular flashes', () => {
    const ninja = createNinjaSignatureVfx();
    const assassin = createAssassinSignatureVfx();
    for (const name of ['NinjaDelayedSlash0', 'NinjaDelayedSlash1']) {
      const node = ninja.getObjectByName(name) as THREE.Mesh;
      expect(node.geometry).toBeInstanceOf(THREE.ShapeGeometry);
    }
    for (const name of ['AssassinCrossA', 'AssassinCrossB', 'AssassinExecutionGlow', 'AssassinExecutionLine']) {
      const node = assassin.getObjectByName(name) as THREE.Mesh;
      expect(node.geometry).toBeInstanceOf(THREE.ShapeGeometry);
    }
  });

  it('uses radial Engineer power-up and muzzle effects instead of floating white cards', () => {
    const group = createEngineerSignatureVfx();
    for (const name of ['EngineerEnergy', 'EngineerActivation', 'EngineerMuzzle']) {
      const mesh = group.getObjectByName(name);
      expect(mesh).toBeInstanceOf(THREE.Mesh);
      expect((mesh as THREE.Mesh).geometry).toBeInstanceOf(name === 'EngineerMuzzle' ? THREE.CircleGeometry : THREE.RingGeometry);
    }
  });
});


describe('Ninja smoke shape', () => {
  it('keeps vanishing silhouettes translucent rather than additive-white on bright stages', () => {
    const group = createNinjaSignatureVfx();
    for (const name of ['NinjaVanishSmoke','NinjaReturnSmoke','NinjaAfterimage0']) {
      const mesh = group.getObjectByName(name) as THREE.Mesh<THREE.CircleGeometry,THREE.MeshBasicMaterial>;
      expect(mesh.geometry).toBeInstanceOf(THREE.CircleGeometry);
      expect(mesh.material.blending).toBe(THREE.NormalBlending);
    }
  });
});
