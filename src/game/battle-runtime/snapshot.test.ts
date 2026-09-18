import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { createBattleSnapshot } from './snapshot';
import type { AllyUnit, EnemyUnit } from './types';

function ally(slimeId: string, hp: number, alive = true): AllyUnit {
  return {
    slimeId,
    hp,
    maxHp: 10,
    alive,
  } as AllyUnit;
}

function enemy(hp: number, maxHp: number, alive = true): EnemyUnit {
  return {
    hp,
    maxHp,
    alive,
    root: new THREE.Group(),
  } as EnemyUnit;
}

describe('createBattleSnapshot', () => {
  it('projects presentation hp without owning progression state', () => {
    const snapshot = createBattleSnapshot({
      phase: 'combat',
      result: null,
      allies: [ally('a', 8), ally('b', 0, false)],
      enemies: [enemy(3, 5), enemy(0, 5, false)],
      bossEncounter: false,
      simulationNow: 3,
      phaseStartedAt: 1,
    });

    expect(snapshot.label).toBe('交戦中');
    expect(snapshot.enemyAlive).toBe(1);
    expect(snapshot.enemyHp).toBe(3);
    expect(snapshot.enemyMaxHp).toBe(10);
    expect(snapshot.allies.a).toEqual({ hp: 8, maxHp: 10, alive: true });
  });
});
