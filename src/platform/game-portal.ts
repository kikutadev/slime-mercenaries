export type GamePortalProgressKind = 'resume' | 'progress' | 'record';

export type GamePortalProgress = Readonly<{
  gameId: string;
  kind: GamePortalProgressKind;
  updatedAtMs?: number;
  primary: string;
  secondary?: string;
  actionLabel: string;
  resumable: boolean;
}>;

const PROGRESS_VERSION = 1;
const PROGRESS_KEY_PREFIX = 'games.kikuta.dev:progress:v1:';

export function setGamePortalProgress(progress: GamePortalProgress): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(PROGRESS_KEY_PREFIX + progress.gameId, JSON.stringify({
      version: PROGRESS_VERSION,
      gameId: progress.gameId,
      kind: progress.kind,
      updatedAtMs: progress.updatedAtMs ?? Date.now(),
      primary: progress.primary,
      secondary: progress.secondary,
      actionLabel: progress.actionLabel,
      resumable: progress.resumable,
    }));
  } catch {
    // Portal metadata is best-effort and must never block the authoritative game save.
  }
}

export function clearGamePortalProgress(gameId: string): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.removeItem(PROGRESS_KEY_PREFIX + gameId);
  } catch {
    // Browser storage may be unavailable; the game remains authoritative.
  }
}
