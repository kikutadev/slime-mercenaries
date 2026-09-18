import { getVictoryPresentationElapsed, victoryStatusLabel } from '../battle-transition';
import type { AllyUnit, BattleSnapshot, EnemyUnit } from './types';

export interface BattleSnapshotInput {
  phase: BattleSnapshot['phase'];
  result: BattleSnapshot['result'];
  allies: readonly AllyUnit[];
  enemies: readonly EnemyUnit[];
  bossEncounter: boolean;
  simulationNow: number;
  phaseStartedAt: number;
}

export function createBattleSnapshot(input: BattleSnapshotInput): BattleSnapshot {
  const enemyMaxHp = input.enemies.reduce((sum, enemy) => sum + enemy.maxHp, 0);
  const enemyHp = input.enemies.reduce((sum, enemy) => sum + enemy.hp, 0);
  const enemyAlive = input.enemies.filter((enemy) => enemy.alive).length;
  const label = input.phase === 'loading'
    ? '出撃準備中'
    : input.phase === 'approach'
      ? input.bossEncounter ? 'ボス接近' : '接敵中'
      : input.phase === 'combat'
        ? '交戦中'
        : input.result === 'victory'
          ? victoryStatusLabel(getVictoryPresentationElapsed(
              input.simulationNow - input.phaseStartedAt,
              input.bossEncounter,
            ))
          : '敗北';
  const allies = Object.fromEntries(input.allies.map((ally) => [ally.slimeId, {
    hp: ally.hp,
    maxHp: ally.maxHp,
    alive: ally.alive,
  }]));

  return {
    phase: input.phase,
    label,
    result: input.result,
    enemyAlive,
    enemyHp,
    enemyMaxHp,
    allies,
  };
}
