import type { BattleSceneModel } from './selectors/battle-scene';

/**
 * Keep the visible encounter stable while the authoritative idle simulation advances.
 * Same-encounter state may refresh immediately, but a new encounter cannot replace the
 * current one until its authored result animation reports that presentation is readable.
 */
export function canAdoptBattleSceneModel(
  presented: BattleSceneModel,
  incoming: BattleSceneModel,
  presentationReady: boolean,
): boolean {
  if (presented.encounterKey === incoming.encounterKey) {
    return presented.visualKey !== incoming.visualKey;
  }

  if (incoming.encounter === null) return false;
  if (presented.encounter === null) return true;
  return presentationReady;
}
