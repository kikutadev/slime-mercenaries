import type { BattleSceneModel } from '../application/selectors/battle-scene';

export type BattlePresentationCursor = Readonly<{
  model: BattleSceneModel;
  terminalReached: boolean;
}>;

export function battleSceneModelKey(model: BattleSceneModel): string {
  return model.encounterKey + ':' + model.visualKey;
}

export function createBattlePresentationCursor(
  latest: BattleSceneModel,
  contentBoundaryReached: boolean,
): BattlePresentationCursor {
  return {
    model: latest,
    terminalReached: contentBoundaryReached && latest.encounter === null,
  };
}

/**
 * Domain may advance faster than 3D presentation can load or animate. Keep the current visual
 * encounter alive until its authored result is readable, then jump directly to the latest Domain
 * encounter. Intermediate visual waves may be skipped, but an encounter already on screen is never
 * torn down during approach/combat/defeat.
 */
export function reconcileBattlePresentation(
  current: BattlePresentationCursor,
  latest: BattleSceneModel,
  presentationReady: boolean,
  contentBoundaryReached: boolean,
): BattlePresentationCursor {
  const currentKey = battleSceneModelKey(current.model);
  const latestKey = battleSceneModelKey(latest);

  if (currentKey === latestKey) {
    const terminalReached = contentBoundaryReached
      && (latest.encounter === null || presentationReady);
    return terminalReached === current.terminalReached
      ? current
      : { ...current, terminalReached };
  }

  if (current.model.encounter !== null && !presentationReady) return current;

  if (contentBoundaryReached && latest.encounter === null) {
    return current.terminalReached
      ? current
      : { ...current, terminalReached: true };
  }

  return {
    model: latest,
    terminalReached: false,
  };
}
