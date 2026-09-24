import type { BattleSceneModel } from './selectors/battle-scene';

/**
 * Preserve every live encounter observed by React until it has been presented.
 * Domain progression may advance faster than the renderer, but presentation must not
 * silently discard intermediate waves that were observed while the Battle screen was active.
 */
export function enqueueBattleSceneModel(
  presented: BattleSceneModel,
  pending: BattleSceneModel | null,
  queued: readonly BattleSceneModel[],
  incoming: BattleSceneModel,
): readonly BattleSceneModel[] {
  if (incoming.encounter === null) return queued;
  if (incoming.encounterKey === presented.encounterKey) return queued;
  if (incoming.encounterKey === pending?.encounterKey) return queued;

  const existingIndex = queued.findIndex((model) => model.encounterKey === incoming.encounterKey);
  if (existingIndex < 0) return [...queued, incoming];
  if (queued[existingIndex]?.visualKey === incoming.visualKey) return queued;

  return queued.map((model, index) => index === existingIndex ? incoming : model);
}

export function canStartQueuedBattleScene(
  presentationReady: boolean,
  pending: BattleSceneModel | null,
  queued: readonly BattleSceneModel[],
): boolean {
  return presentationReady && pending === null && queued.length > 0;
}
