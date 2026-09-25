import type { SlimeInstanceId, SlimeMercenariesState } from '../domain';
import { getSlimePresentation, type SlimePresentation } from './slimes';

export interface CampLifeResidentSpec {
  instanceId: SlimeInstanceId;
  presentation: SlimePresentation;
}

/**
 * Camp life uses real roster instances but never duplicates the selected Hero or a slime
 * that the player explicitly sent away on dispatch.
 */
export function selectCampLifeResidents(
  state: SlimeMercenariesState,
  selectedId: SlimeInstanceId | null,
  limit = 4,
): readonly CampLifeResidentSpec[] {
  if (!Number.isSafeInteger(limit) || limit <= 0) return [];
  return Object.values(state.gameData.roster.slimes)
    .sort((left, right) => left.serial - right.serial)
    .filter((slime) => slime.id !== selectedId && slime.assignment !== 'dispatch')
    .slice(0, limit)
    .map((slime) => ({
      instanceId: slime.id,
      presentation: getSlimePresentation(slime),
    }));
}
