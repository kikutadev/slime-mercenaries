import { highestStageClearedForArea, resolveAreaDefinition, type SlimeMercenariesState } from '../domain';

const PORTAL_PROGRESS_KEY = 'games.kikuta.dev:progress:v1:slime-mercenaries';

export function syncSlimePortalProgress(state: SlimeMercenariesState, updatedAtMs = Date.now()): void {
  if (typeof localStorage === 'undefined') return;

  try {
    const progression = state.gameData.progression;
    const highest = highestStageClearedForArea(progression);
    const rosterCount = Object.keys(state.gameData.roster.slimes).length;
    const hasProgress = highest > 0
      || progression.currentStage > 1
      || rosterCount > 0;

    if (!hasProgress) {
      localStorage.removeItem(PORTAL_PROGRESS_KEY);
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

    localStorage.setItem(PORTAL_PROGRESS_KEY, JSON.stringify({
      version: 1,
      gameId: 'slime-mercenaries',
      kind: 'progress',
      updatedAtMs,
      primary: `${areaLabel} · Stage ${progression.currentStage}`,
      secondary,
      actionLabel: '戦闘へ戻る',
      resumable: true,
    }));
  } catch {
    // Portal metadata is best-effort and must never affect the authoritative save.
  }
}

export function clearSlimePortalProgress(): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.removeItem(PORTAL_PROGRESS_KEY);
  } catch {
    // Browser storage can be unavailable without blocking the game.
  }
}