import type { BattleSceneModel } from '../../application/selectors/battle-scene';
import type { BattleSnapshot } from '../../game/BattleRuntime';
import {
  battleRewardCueMatchesEncounter,
  type BattleRewardCue,
} from '../../game/battle-reward';

export function clampBattleRatio(value: number, max: number): number {
  if (max <= 0) return 0;
  return Math.max(0, Math.min(1, value / max));
}

export function battleStatusText({
  battle,
  hasEncounter,
  contentBoundaryReached,
  retryFarmClearsRemaining,
  activeCount,
  sceneModel,
}: {
  battle: Pick<BattleSnapshot, 'label' | 'result'>;
  hasEncounter: boolean;
  contentBoundaryReached: boolean;
  retryFarmClearsRemaining: number;
  activeCount: number;
  sceneModel: Pick<BattleSceneModel, 'shouldCelebrateVictory' | 'stageNumber'>;
}): string {
  if (battle.result === 'defeat') return '敗北 · 戦線を立て直します';
  if (battle.result === 'victory') {
    return sceneModel.shouldCelebrateVictory
      ? 'ステージクリア'
      : '敵部隊を突破 · 次のウェーブへ';
  }
  if (!hasEncounter && contentBoundaryReached) return '次の戦闘を準備中';
  if (retryFarmClearsRemaining > 0) {
    return `再編成中 · ステージ${sceneModel.stageNumber} · 再出撃まであと${retryFarmClearsRemaining}周`;
  }
  if (activeCount === 0) return '傭兵を編成すると自動戦闘が始まります';
  return battle.label;
}

export function visibleBattleRewardCue(
  rewardCues: readonly BattleRewardCue[],
  result: BattleSnapshot['result'],
  sceneModel: Pick<BattleSceneModel, 'areaId' | 'stageNumber' | 'waveIndex' | 'encounter'>,
): BattleRewardCue | null {
  if (result !== 'victory') return null;
  return rewardCues.find((cue) =>
    battleRewardCueMatchesEncounter(
      cue,
      sceneModel.areaId,
      sceneModel.stageNumber,
      sceneModel.waveIndex,
      sceneModel.encounter?.boss ?? false,
    )) ?? null;
}

export function didBattleStageAdvance(
  previous: Pick<BattleSceneModel, 'areaId' | 'stageNumber'>,
  next: Pick<BattleSceneModel, 'areaId' | 'stageNumber'>,
): boolean {
  return next.areaId !== previous.areaId || next.stageNumber > previous.stageNumber;
}
