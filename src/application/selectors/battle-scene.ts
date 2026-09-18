import { currentCombatEncounter, equippedWeaponDefinition, type JobSlimeId, type SlimeMercenariesState } from '../../domain';
import { resolveEncounterDefinition, type ResolvedEncounter } from '../../game/encounters';
import { getSlimePresentation, type BattleBehaviorId } from '../../game/slimes';

/**
 * Stable projection consumed by the visual battle runtime.
 * Durable combat/progression remains in Domain; Three.js receives only presentation data.
 */
export type BattleSceneAlly = Readonly<{
  slotIndex: number;
  slimeId: JobSlimeId;
  asset: string;
  icon: string;
  name: string;
  fusionRank: number;
  fusionFormId: string;
  promotionPathId: string | null;
  weaponDefinitionId: string | null;
  weaponName: string | null;
  behaviorId: BattleBehaviorId;
  equipmentAnchorName: string;
  weaponTipName: string | null;
  maxHp: number;
  formationRole: 'front' | 'back';
}>;

export type BattleSceneModel = Readonly<{
  encounterKey: string;
  visualKey: string;
  stageNumber: number;
  waveIndex: number;
  retreatingFromBoss: boolean;
  encounter: ResolvedEncounter | null;
  allies: readonly BattleSceneAlly[];
}>;

/**
 * Project authoritative roster/loadout state into a small immutable scene model.
 * The visual key changes only for battle-visible configuration, avoiding Three scene recreation
 * for unrelated Gold/Token/dispatch updates.
 */
export function selectBattleSceneModel(state: SlimeMercenariesState): BattleSceneModel {
  const allies = state.gameData.roster.formationSlots.flatMap((slimeId, slotIndex) => {
    if (slimeId === null) return [];
    const slime = state.gameData.roster.slimes[slimeId];
    if (slime === undefined) return [];
    const presentation = getSlimePresentation(slime);
    const weapon = equippedWeaponDefinition(state, slimeId);
    return [{
      slotIndex,
      slimeId,
      asset: presentation.asset,
      icon: presentation.icon,
      name: presentation.name,
      fusionRank: slime.fusionRank,
      fusionFormId: slime.fusionFormId,
      promotionPathId: slime.promotionPathId,
      weaponDefinitionId: weapon?.id ?? null,
      weaponName: weapon?.displayName ?? null,
      behaviorId: presentation.battle.behaviorId,
      equipmentAnchorName: presentation.battle.equipmentAnchorName,
      weaponTipName: presentation.battle.weaponTipName,
      maxHp: presentation.battle.maxHp,
      formationRole: presentation.battle.formationRole,
    } satisfies BattleSceneAlly];
  });

  const stageNumber = state.gameData.progression.currentStage;
  const waveIndex = state.gameData.combat.currentWaveIndex;
  const blockedBossStage = state.gameData.combat.blockedBossStage;
  const retreatingFromBoss = blockedBossStage !== null
    && stageNumber === blockedBossStage - 1
    && waveIndex === 0;
  const combatEncounter = currentCombatEncounter(state);
  const encounterId = combatEncounter === null
    ? null
    : combatEncounter.kind === 'boss'
      ? `encounter.clover-road.${String(stageNumber).padStart(2, '0')}.boss`
      : `encounter.clover-road.${String(stageNumber).padStart(2, '0')}.${String(waveIndex + 1).padStart(2, '0')}`;
  const encounter = encounterId === null ? null : resolveEncounterDefinition(encounterId);
  const encounterKey = `${state.gameData.progression.currentAreaId}:${stageNumber}:${waveIndex}:${encounter?.id ?? 'none'}:${retreatingFromBoss ? 'retreat' : 'advance'}`;
  const visualKey = allies
    .map((ally) => [
      ally.slotIndex,
      ally.slimeId,
      ally.asset,
      ally.fusionRank,
      ally.fusionFormId,
      ally.promotionPathId ?? '-',
      ally.weaponDefinitionId ?? '-',
      ally.behaviorId,
    ].join(':'))
    .join('|');

  return { encounterKey, visualKey, stageNumber, waveIndex, retreatingFromBoss, encounter, allies };
}
