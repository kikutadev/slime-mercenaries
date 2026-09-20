import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import {
  enemyTargetPosition,
  equipmentKindFor,
  findNearest,
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

  it('caps forward melee travel before overlapping an enemy body', () => {
    const anchor = new THREE.Vector3(0, 0, 0);
    const direction = new THREE.Vector3(1, 0, 0);
    const blocked = safeMeleeForwardOffset(anchor, direction, 2, [enemy(0.8, 0)]);
    expect(blocked).toBeGreaterThanOrEqual(0);
    expect(blocked).toBeLessThan(0.8);
    expect(safeMeleeForwardOffset(anchor, direction, 0, [enemy(0.8, 0)])).toBe(0);
  });
});
