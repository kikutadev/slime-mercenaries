import type { BattleSceneModel } from './selectors/battle-scene';
import type { BattleSnapshot } from '../game/BattleRuntime';

/**
 * Keep the visual encounter stable while the authoritative idle simulation advances.
 * The renderer may coalesce multiple analytical wave transitions, but it must never
 * tear down a visible encounter before its result presentation completes.
 */
export const BATTLE_RESULT_HOLD_MS = 450;

export function canAdoptBattleSceneModel(
  presented: BattleSceneModel,
  incoming: BattleSceneModel,
  phase: BattleSnapshot['phase'],
): boolean {
  if (presented.encounterKey === incoming.encounterKey) {
    return presented.visualKey !== incoming.visualKey;
  }

  // Never replace a real encounter with an empty analytical boundary. The domain
  // will resume terminal farming; until then the last real battle remains visible.
  if (incoming.encounter === null) return false;

  // A freshly available encounter can replace an empty initial presentation.
  if (presented.encounter === null) return true;

  return phase === 'result';
}
