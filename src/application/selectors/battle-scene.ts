import { currentCombatEncounter, currentStageDefinition, equippedWeaponDefinition, nextCombatBoundarySec, partyCombatPower, type SlimeInstanceId, type SlimeMercenariesState } from '../../domain';
import { resolveEncounterDefinition, type ResolvedEncounter } from '../../game/encounters';
import { getSlimePresentation, type BattleBehaviorId } from '../../game/slimes';

/**
 * Stable projection consumed by the visual battle runtime.
 * Durable combat/progression remains in Domain; Three.js receives only presentation data.
 */
export type BattleSceneAlly = Readonly<{
  slotIndex: number;
  slimeId: SlimeInstanceId;
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
  encounter: ResolvedEncounter | null;
  authoritativeResult: 'victory' | 'defeat' | null;
  authoritativeResultDelaySec: number | null;
  isStageFinalEncounter: boolean;
  shouldCelebrateVictory: boolean;
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
  const combatEncounter = currentCombatEncounter(state);
  const stage = currentStageDefinition(state);
  const encounterId = combatEncounter?.kind === 'wave'
    ? combatEncounter.wave?.encounterId
    : combatEncounter?.boss?.encounterId;
  const encounter = encounterId === undefined ? null : resolveEncounterDefinition(encounterId);
  const authoritativeResult = combatEncounter === null
    ? null
    : combatEncounter.requiredPartyPower !== null
      && partyCombatPower(state).compare(combatEncounter.requiredPartyPower) < 0
      ? 'defeat'
      : 'victory';
  const nextBoundarySec = nextCombatBoundarySec(state);
  const authoritativeResultDelaySec = authoritativeResult === null || nextBoundarySec === null
    ? null
    : Math.max(0, nextBoundarySec - state.simTimeSec);
  const encounterKey = `${state.gameData.progression.currentAreaId}:${stageNumber}:${waveIndex}:${encounter?.id ?? 'none'}`;
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
  const isStageFinalEncounter = combatEncounter?.kind === 'boss'
    || (combatEncounter?.kind === 'wave'
      && stage !== null
      && stage.boss === undefined
      && combatEncounter.waveIndex === stage.waves.length - 1);
  const shouldCelebrateVictory = isStageFinalEncounter
    && state.gameData.combat.retryFarmClearsRemaining === 0;

  return {
    encounterKey,
    visualKey,
    stageNumber,
    waveIndex,
    encounter,
    authoritativeResult,
    authoritativeResultDelaySec,
    isStageFinalEncounter,
    shouldCelebrateVictory,
    allies,
  };
}
