import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import {
  poseAllyDefeatEyes,
  createAllyDefeatEyes,
  createShadow,
  createWorldHealthBar,
  setAllyDefeatEyes,
  updateWorldHealthBar,
} from './unit-visuals';
import type { AllyUnit, EnemyUnit } from './types';

describe('battle unit visual helpers', () => {
  it('creates a reusable ground shadow with the expected presentation defaults', () => {
    const shadow = createShadow(0.4);
    expect(shadow.geometry.parameters.radius).toBe(0.4);
    expect(shadow.material.transparent).toBe(true);
    expect(shadow.material.opacity).toBeCloseTo(0.22);
  });

  it('updates health-bar fill and keeps it camera-facing', () => {
    const root = new THREE.Group();
    root.visible = true;
    root.position.set(1, 0.2, 2);
    const healthBar = createWorldHealthBar();
    const unit = {
      root,
      healthBar,
      hp: 5,
      maxHp: 10,
      alive: true,
      state: 'idle',
    } as AllyUnit;
    const camera = new THREE.PerspectiveCamera();
    camera.rotation.set(0.1, 0.2, 0.3);

    updateWorldHealthBar(unit, camera, 'combat', null);

    expect(healthBar.userData.fill?.scale.x).toBeCloseTo(0.5);
    expect(healthBar.visible).toBe(true);
    expect(healthBar.quaternion.equals(camera.quaternion)).toBe(true);
  });

  it('hides full-health world bars and shows each unit bar after damage', () => {
    const root = new THREE.Group();
    root.visible = true;
    const bar = createWorldHealthBar('enemy');
    const unit = { side: 'enemy', scaleClass: 'normal', root, healthBar: bar,
      hp: 10, maxHp: 10, alive: true, state: 'idle' } as unknown as EnemyUnit;
    const camera = new THREE.PerspectiveCamera();

    updateWorldHealthBar(unit, camera, 'combat', null);
    expect(bar.visible).toBe(false);
    unit.hp = 9;
    updateWorldHealthBar(unit, camera, 'combat', null);
    expect(bar.visible).toBe(true);
    updateWorldHealthBar(unit, camera, 'result', 'victory');
    expect(bar.visible).toBe(false);
  });

  it('tracks a world-space health bar independently for each enemy unit', () => {
    const root = new THREE.Group();
    root.visible = true;
    root.position.set(-0.5, 0.1, -1);
    const healthBar = createWorldHealthBar('enemy');
    const enemy = {
      side: 'enemy',
      scaleClass: 'normal',
      root,
      healthBar,
      hp: 2,
      maxHp: 4,
      alive: true,
      state: 'idle',
    } as unknown as EnemyUnit;
    const camera = new THREE.PerspectiveCamera();

    updateWorldHealthBar(enemy, camera, 'combat', null);

    expect(healthBar.userData.fill?.scale.x).toBeCloseTo(0.5);
    expect(healthBar.visible).toBe(true);
    expect(healthBar.position.y).toBeCloseTo(0.48);
  });

  it('replaces normal ally eyes with defeat X eyes without detaching them', () => {
    const root = new THREE.Group();
    const face = new THREE.Group();
    root.add(face);
    const left = new THREE.Object3D();
    left.name = 'Eye_L';
    const right = new THREE.Object3D();
    right.name = 'Eye_R';
    face.add(left, right);

    const eyes = createAllyDefeatEyes(root);
    const unit = { normalEyes: eyes.normalEyes, xEyes: eyes.xEyes } as AllyUnit;
    expect(eyes.xEyes).toHaveLength(2);
    expect(eyes.xEyes.every((eye) => eye.parent === root)).toBe(true);

    setAllyDefeatEyes(unit, true);
    expect(left.visible).toBe(false);
    expect(right.visible).toBe(false);
    expect(eyes.xEyes.every((eye) => eye.visible)).toBe(true);
    const firstBar = eyes.xEyes[0]?.children[0];
    expect(firstBar).toBeInstanceOf(THREE.Mesh);
    expect((firstBar as THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial>).material.depthTest).toBe(true);
    expect(firstBar?.renderOrder).toBe(0);

    poseAllyDefeatEyes(eyes.xEyes, 0.25);
    expect(eyes.xEyes[0]?.position.z).toBeLessThan(0.7);
    expect(eyes.xEyes[0]?.position.z).toBeGreaterThan(0);
    expect(eyes.xEyes[0]?.position.y).toBeGreaterThan(0.95);
    // A real surface contact, not a screen-space X hovering above the jelly.
    expect((eyes.xEyes[0]?.position.y ?? 0) * 0.25).toBeLessThan(0.33);
    expect(eyes.xEyes[0]?.rotation.x).toBeLessThan(-1);
    expect(eyes.xEyes[0]?.scale.toArray()).toEqual([1, 1, 1]);

    setAllyDefeatEyes(unit, false);
    expect(eyes.xEyes[0]?.scale.toArray()).toEqual([1, 1, 1]);
    expect(eyes.xEyes[0]?.rotation.x).toBe(0);
  });
});
