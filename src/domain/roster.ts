import type { JobSlimeId } from './definitions';
import type { SlimeInstanceId, SlimeMercenariesState, SlimeProgress } from './state';

export function ownedSlimes(state: SlimeMercenariesState): readonly SlimeProgress[] {
  return Object.values(state.gameData.roster.slimes).sort((left, right) => left.serial - right.serial);
}

export function slimeIdsByType(state: SlimeMercenariesState, typeId: JobSlimeId): readonly SlimeInstanceId[] {
  return ownedSlimes(state).filter((slime) => slime.typeId === typeId).map((slime) => slime.id);
}

export function firstSlimeIdByType(state: SlimeMercenariesState, typeId: JobSlimeId): SlimeInstanceId | null {
  return slimeIdsByType(state, typeId)[0] ?? null;
}

export function firstSlimeByType(state: SlimeMercenariesState, typeId: JobSlimeId): SlimeProgress | null {
  const id = firstSlimeIdByType(state, typeId);
  return id === null ? null : state.gameData.roster.slimes[id] ?? null;
}

export function isJobDiscovered(state: SlimeMercenariesState, typeId: JobSlimeId): boolean {
  return firstSlimeIdByType(state, typeId) !== null;
}

export function sameTypeCount(state: SlimeMercenariesState, typeId: JobSlimeId): number {
  return slimeIdsByType(state, typeId).length;
}
