import { highestStageClearedForArea, resolveAreaDefinition, type SlimeMercenariesState } from '../domain';
import { clearGamePortalProgress, setGamePortalProgress } from './game-portal';

const GAME_ID = 'slime-mercenaries';

export function syncSlimePortalProgress(state: SlimeMercenariesState, updatedAtMs = Date.now()): void {
  const progression = state.gameData.progression;
  const highest = highestStageClearedForArea(progression);
  const rosterCount = Object.keys(state.gameData.roster.slimes).length;
  const hasProgress = highest > 0
    || progression.currentStage > 1
    || rosterCount > 0;

  if (!hasProgress) {
    clearGamePortalProgress(GAME_ID);
    return;
  }

  const area = resolveAreaDefinition(progression.currentAreaId);
  const areaLabel = area?.displayName ?? progression.currentAreaId;
  const retryClears = state.gameData.combat.retryFarmClearsRemaining;
  const secondary = retryClears > 0
    ? `最前線 Stage ${progression.currentStage}へ再挑戦準備中`
    : highest > 0
      ? `最高到達 Stage ${highest}`
      : `傭兵 ${rosterCount}体を育成中`;

  setGamePortalProgress({
    gameId: GAME_ID,
    kind: 'progress',
    updatedAtMs,
    primary: `${areaLabel} · Stage ${progression.currentStage}`,
    secondary,
    actionLabel: '戦闘へ戻る',
    resumable: true,
  });
}

export function clearSlimePortalProgress(): void {
  clearGamePortalProgress(GAME_ID);
}
