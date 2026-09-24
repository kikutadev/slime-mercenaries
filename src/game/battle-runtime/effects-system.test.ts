import * as THREE from 'three';
import { describe, expect, it, vi } from 'vitest';
import { BattleEffectsSystem } from './effects-system';
import type { AllyUnit, EnemyUnit } from './types';

function makeAlly(): AllyUnit {
  const root = new THREE.Group();
  const anchor = new THREE.Object3D();
  root.add(anchor);
  root.updateMatrixWorld(true);
  return {
    root,
    projectileOrigin: anchor,
    spellOrigin: anchor,
    equipmentAnchor: anchor,
    alive: true,
  } as AllyUnit;
}

function makeEnemy(): EnemyUnit {
  const root = new THREE.Group();
  root.position.set(0, 0, -1);
  return {
    root,
    alive: true,
    moveSpeedEffect: null,
  } as EnemyUnit;
}

describe('BattleEffectsSystem', () => {
  it('owns and releases impact presentation resources', () => {
    const camera = new THREE.PerspectiveCamera();
    const added: THREE.Object3D[] = [];
    const removed: THREE.Object3D[] = [];
    const system = new BattleEffectsSystem({
      camera,
      addSceneObject: (object) => added.push(object),
      removeSceneObject: (object) => removed.push(object),
      getSimulationNow: () => 0,
      getAllies: () => [],
      getLivingEnemies: () => [],
      applyDamage: () => undefined,
      playSound: () => undefined,
    });

    system.createImpact(new THREE.Vector3(), '#fff', 0.1, 0.2);
    expect(added).toHaveLength(1);

    system.update(0.3);
    expect(removed).toEqual(added);
  });

  it('applies projectile damage once and releases the projectile after flight', () => {
    const camera = new THREE.PerspectiveCamera();
    const removed: THREE.Object3D[] = [];
    const damage = vi.fn();
    const playSound = vi.fn();
    const target = makeEnemy();
    const system = new BattleEffectsSystem({
      camera,
      addSceneObject: () => undefined,
      removeSceneObject: (object) => removed.push(object),
      getSimulationNow: () => 0,
      getAllies: () => [],
      getLivingEnemies: () => [target],
      applyDamage: damage,
      playSound,
    });

    system.fireBullet(makeAlly(), target);
    system.update(1);

    expect(playSound).toHaveBeenCalledWith('gun-shot');
    expect(damage).toHaveBeenCalledTimes(1);
    expect(damage.mock.calls[0]?.[0]).toBe(target);
    expect(removed.length).toBeGreaterThanOrEqual(2);
  });

  it('holds reward presentation until allies exist, then clears it as one owned lifecycle', () => {
    const camera = new THREE.PerspectiveCamera();
    const allies: AllyUnit[] = [];
    const added: THREE.Object3D[] = [];
    const removed: THREE.Object3D[] = [];
    const system = new BattleEffectsSystem({
      camera,
      addSceneObject: (object) => added.push(object),
      removeSceneObject: (object) => removed.push(object),
      getSimulationNow: () => 0,
      getAllies: () => allies,
      getLivingEnemies: () => [],
      applyDamage: () => undefined,
      playSound: () => undefined,
    });

    system.presentRewardCue({
      id: 'reward-1',
      importance: 'normal',
      target: null,
      items: [{ kind: 'gold', id: 'gold', label: 'G', amount: 10 }],
    });
    expect(added).toHaveLength(0);

    allies.push(makeAlly());
    system.flushPendingRewardCue();
    expect(added.length).toBeGreaterThan(0);

    system.clearAll();
    expect(removed).toEqual(added);
  });
});
