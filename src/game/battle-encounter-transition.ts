export type BattleEncounterPosition = Readonly<{
  areaId: string;
  stageNumber: number;
  waveIndex: number;
}>;

/**
 * Damage and defeat persist only while advancing to a later wave inside one stage.
 * Any completed-stage boundary, stage restart, area move, or explicit retry fully restores the party.
 */
export function shouldRecoverPartyForEncounter(
  previous: BattleEncounterPosition,
  next: BattleEncounterPosition,
  forceRecovery = false,
): boolean {
  if (forceRecovery) return true;
  if (next.areaId !== previous.areaId) return true;
  if (next.stageNumber !== previous.stageNumber) return true;
  return next.waveIndex <= previous.waveIndex;
}
