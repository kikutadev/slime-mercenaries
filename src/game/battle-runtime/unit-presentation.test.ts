import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import {
  enemyTargetPosition,
  equipmentKindFor,
  findNearest,
  meleePresentationTarget,
  safeMeleeForwardOffset,
} from './unit-presentation';
import type { AllyUnit, EnemyUnit } from './types';

function ally(behaviorId: AllyUnit['behaviorId'], x = 0, z = 0): AllyUnit {
  const root = new THREE.Group();
  root.position.set(x, 0, z);
  root.visible = true;
  return {
    behaviorId,
    root,
    alive: true,
    combatAnchor: new THREE.Vector3(0.2, 0, 0.3),
    slotIndex: 0,
  } as AllyUnit;
}

function enemy(x: number, z: number, alive = true): EnemyUnit {
  const root = new THREE.Group();
  root.position.set(x, 0, z);
  root.visible = true;
  return { root, alive } as EnemyUnit;
}

describe('battle unit presentation helpers', () => {
  it('maps authored behaviors to the correct equipment family', () => {
    expect(equipmentKindFor(ally('storm-archer-volley'))).toBe('bow');
    expect(equipmentKindFor(ally('fortress-plant'))).toBe('shield');
    expect(equipmentKindFor(ally('assassin-execute'))).toBe('dagger');
    expect(equipmentKindFor(ally('engineer-turret'))).toBe('gun');
  });

  it('uses the stable combat anchor for melee enemy targeting', () => {
    const melee = ally('sword-melee');
    const ranged = ally('bow-ranged');
    expect(enemyTargetPosition(melee, 'combat')).toBe(melee.combatAnchor);
    expect(enemyTargetPosition(ranged, 'combat')).toBe(ranged.root.position);
    expect(enemyTargetPosition(melee, 'approach')).toBe(melee.root.position);
  });

  it('finds only the nearest living visible target', () => {
    const source = ally('sword-melee');
    const hidden = enemy(0.1, 0);
    hidden.root.visible = false;
    const dead = enemy(0.2, 0, false);
    const near = enemy(0.5, 0);
    const far = enemy(2, 0);
    expect(findNearest(source, [hidden, dead, far, near])).toBe(near);
  });

  it('fans simultaneous melee presentation around the same target without changing the target', () => {
    const target = enemy(0, -1);
    const left = ally('sword-melee');
    left.slotIndex = 0;
    const center = ally('shield-defender');
    center.slotIndex = 1;
    const right = ally('dagger-skirmisher');
    right.slotIndex = 2;

    const leftPoint = meleePresentationTarget(left, target, new THREE.Vector3());
    const centerPoint = meleePresentationTarget(center, target, new THREE.Vector3());
    const rightPoint = meleePresentationTarget(right, target, new THREE.Vector3());

    expect(leftPoint.x).toBeLessThan(target.root.position.x);
    expect(centerPoint.x).toBe(target.root.position.x);
    expect(rightPoint.x).toBeGreaterThan(target.root.position.x);
    expect(target.root.position.x).toBe(0);
  });

  it('caps forward melee travel before overlapping an enemy body', () => {
    const anchor = new THREE.Vector3(0, 0, 0);
    const direction = new THREE.Vector3(1, 0, 0);
    const blocked = safeMeleeForwardOffset(anchor, direction, 2, [enemy(0.8, 0)]);
    expect(blocked).toBeGreaterThanOrEqual(0);
    expect(blocked).toBeLessThan(0.8);
    expect(safeMeleeForwardOffset(anchor, direction, 0, [enemy(0.8, 0)])).toBe(0);
  });
});
