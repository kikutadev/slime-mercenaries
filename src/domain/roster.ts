import type { SlimeTypeId } from './definitions';
import type { SlimeInstanceId, SlimeMercenariesState, SlimeProgress } from './state';

export function ownedSlimes(state: SlimeMercenariesState): readonly SlimeProgress[] {
  return Object.values(state.gameData.roster.slimes).sort((left, right) => left.serial - right.serial);
}

export function slimeIdsByType(state: SlimeMercenariesState, typeId: SlimeTypeId): readonly SlimeInstanceId[] {
  return ownedSlimes(state).filter((slime) => slime.typeId === typeId).map((slime) => slime.id);
}

export function firstSlimeIdByType(state: SlimeMercenariesState, typeId: SlimeTypeId): SlimeInstanceId | null {
  return slimeIdsByType(state, typeId)[0] ?? null;
}

export function firstSlimeByType(state: SlimeMercenariesState, typeId: SlimeTypeId): SlimeProgress | null {
  const id = firstSlimeIdByType(state, typeId);
  return id === null ? null : state.gameData.roster.slimes[id] ?? null;
}

export function isJobDiscovered(state: SlimeMercenariesState, typeId: SlimeTypeId): boolean {
  return firstSlimeIdByType(state, typeId) !== null;
}

export function sameTypeCount(state: SlimeMercenariesState, typeId: SlimeTypeId): number {
  return slimeIdsByType(state, typeId).length;
}
