import { getVictoryPresentationElapsed, getVictoryTransitionPose, victoryStatusLabel } from '../battle-transition';
import { SLIME_MOTION_TIMING } from '../slime-motion';
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
  const resultElapsed = Math.max(0, input.simulationNow - input.phaseStartedAt);
  const presentationReady = input.phase === 'result'
    && input.result !== null
    && (input.result === 'victory'
      ? getVictoryTransitionPose(
          getVictoryPresentationElapsed(resultElapsed, input.bossEncounter),
          0,
        ).stage === 'march'
      : resultElapsed >= SLIME_MOTION_TIMING.allyDefeat);

  const enemies = Object.fromEntries(input.enemies.map((enemy) => [enemy.id, {
    enemyId: enemy.enemyId,
    name: enemy.name,
    index: enemy.index,
    hp: enemy.hp,
    maxHp: enemy.maxHp,
    alive: enemy.alive,
  }]));
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
    presentationReady,
    enemies,
    allies,
  };
}
