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

function enemy(
  id: string,
  hp: number,
  maxHp: number,
  alive = true,
  index = 0,
): EnemyUnit {
  return {
    id,
    enemyId: 'tiny-mushroom',
    name: 'ちびキノコ',
    index,
    hp,
    maxHp,
    alive,
    root: new THREE.Group(),
  } as EnemyUnit;
}

describe('createBattleSnapshot', () => {
  it('marks victory ready only after the march handoff becomes readable', () => {
    const before = createBattleSnapshot({
      phase: 'result',
      result: 'victory',
      allies: [ally('a', 8)],
      enemies: [enemy('enemy-tiny-mushroom-1', 0, 5, false)],
      bossEncounter: false,
      simulationNow: 0.8,
      phaseStartedAt: 0,
    });
    const after = createBattleSnapshot({
      phase: 'result',
      result: 'victory',
      allies: [ally('a', 8)],
      enemies: [enemy('enemy-tiny-mushroom-1', 0, 5, false)],
      bossEncounter: false,
      simulationNow: 1.2,
      phaseStartedAt: 0,
    });

    expect(before.presentationReady).toBe(false);
    expect(after.presentationReady).toBe(true);
  });

  it('keeps defeat visible through the full ally collapse before allowing a swap', () => {
    const before = createBattleSnapshot({
      phase: 'result',
      result: 'defeat',
      allies: [ally('a', 0, false)],
      enemies: [enemy('enemy-tiny-mushroom-1', 5, 5)],
      bossEncounter: false,
      simulationNow: 0.6,
      phaseStartedAt: 0,
    });
    const after = createBattleSnapshot({
      phase: 'result',
      result: 'defeat',
      allies: [ally('a', 0, false)],
      enemies: [enemy('enemy-tiny-mushroom-1', 5, 5)],
      bossEncounter: false,
      simulationNow: 0.8,
      phaseStartedAt: 0,
    });

    expect(before.presentationReady).toBe(false);
    expect(after.presentationReady).toBe(true);
  });

  it('projects presentation hp without owning progression state', () => {
    const snapshot = createBattleSnapshot({
      phase: 'combat',
      result: null,
      allies: [ally('a', 8), ally('b', 0, false)],
      enemies: [enemy('enemy-tiny-mushroom-1', 3, 5), enemy('enemy-tiny-mushroom-2', 0, 5, false, 1)],
      bossEncounter: false,
      simulationNow: 3,
      phaseStartedAt: 1,
    });

    expect(snapshot.label).toBe('交戦中');
    expect(snapshot.enemyAlive).toBe(1);
    expect(snapshot.enemies['enemy-tiny-mushroom-1']).toEqual({
      enemyId: 'tiny-mushroom',
      name: 'ちびキノコ',
      index: 0,
      hp: 3,
      maxHp: 5,
      alive: true,
    });
    expect(snapshot.enemies['enemy-tiny-mushroom-2']).toEqual({
      enemyId: 'tiny-mushroom',
      name: 'ちびキノコ',
      index: 1,
      hp: 0,
      maxHp: 5,
      alive: false,
    });
    expect(snapshot.allies.a).toEqual({ hp: 8, maxHp: 10, alive: true });
  });

  it('keeps hp independent for multiple instances of the same enemy character', () => {
    const snapshot = createBattleSnapshot({
      phase: 'combat',
      result: null,
      allies: [ally('a', 10)],
      enemies: [
        enemy('enemy-tiny-mushroom-1', 1, 5, true, 0),
        enemy('enemy-tiny-mushroom-2', 4, 5, true, 1),
      ],
      bossEncounter: false,
      simulationNow: 2,
      phaseStartedAt: 1,
    });

    expect(snapshot.enemies['enemy-tiny-mushroom-1']?.hp).toBe(1);
    expect(snapshot.enemies['enemy-tiny-mushroom-2']?.hp).toBe(4);
  });
});
