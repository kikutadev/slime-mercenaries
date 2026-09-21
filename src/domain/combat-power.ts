import { GameNumber, curveValueAt } from 'idle-game-kit';
import { balance } from './balance';
import { equippedWeaponCombatMultiplier } from './equipment';
import { typeLevelDefinitions } from './fusion-definitions';
import type { SlimeInstanceId, SlimeMercenariesState, SlimeProgress } from './state';

export function partyCombatDps(state: SlimeMercenariesState): GameNumber {
  const active = activeSlimes(state);
  const total = active.reduce(
    (sum, slime) => sum.add(slimeDps(state, slime)),
    GameNumber.zero(),
  );
  return active.some((slime) => slime.mutationId === 'king')
    ? total.multiply(balance.mutation.kingPartyMultiplier)
    : total;
}

export function partyCombatPower(state: SlimeMercenariesState): GameNumber {
  const active = activeSlimes(state);
  const total = active.reduce(
    (sum, slime) => sum.add(slimePower(state, slime)),
    GameNumber.zero(),
  );
  return active.some((slime) => slime.mutationId === 'king')
    ? total.multiply(balance.mutation.kingPartyMultiplier)
    : total;
}

export function slimeCombatPower(state: SlimeMercenariesState, slimeId: SlimeInstanceId): GameNumber {
  const slime = state.gameData.roster.slimes[slimeId];
  return slime === undefined ? GameNumber.zero() : slimePower(state, slime);
}

function activeSlimes(state: SlimeMercenariesState): readonly SlimeProgress[] {
  return state.gameData.roster.formationSlots.flatMap((slimeId) => {
    if (slimeId === null) return [];
    const slime = state.gameData.roster.slimes[slimeId];
    return slime === undefined ? [] : [slime];
  });
}

function slimeDps(state: SlimeMercenariesState, slime: SlimeProgress): GameNumber {
  const base = balance.combat.baseDpsByJob[slime.typeId];
  const levelMultiplier = curveValueAtForSlime(slime);
  const fusionMultiplier = slime.typeId === 'mimic'
    ? balance.combat.mimicDpsMultiplier
    : balance.combat.fusionDpsMultiplierByRank[Math.max(0, slime.fusionRank - 1)]
      ?? balance.combat.fusionDpsMultiplierByRank.at(-1)!;
  return GameNumber.from(base)
    .multiply(levelMultiplier)
    .multiply(fusionMultiplier)
    .multiply(equippedWeaponCombatMultiplier(state, slime.id))
    .multiply(mutationDpsMultiplier(slime));
}

function slimePower(state: SlimeMercenariesState, slime: SlimeProgress): GameNumber {
  const base = balance.combat.basePowerByJob[slime.typeId];
  const levelMultiplier = curveValueAtForSlime(slime);
  const fusionMultiplier = slime.typeId === 'mimic'
    ? balance.combat.mimicPowerMultiplier
    : balance.combat.fusionPowerMultiplierByRank[Math.max(0, slime.fusionRank - 1)]
      ?? balance.combat.fusionPowerMultiplierByRank.at(-1)!;
  return GameNumber.from(base)
    .multiply(levelMultiplier)
    .multiply(fusionMultiplier)
    .multiply(equippedWeaponCombatMultiplier(state, slime.id))
    .multiply(mutationPowerMultiplier(slime));
}

function curveValueAtForSlime(slime: SlimeProgress): GameNumber {
  // Keep analytical combat on the same stat curve used by Type Level progression.
  return curveValueAt(typeLevelDefinitions[slime.typeId].statCurve!, slime.level - 1);
}

function mutationDpsMultiplier(slime: SlimeProgress): number {
  switch (slime.mutationId) {
    case 'dragon': return balance.mutation.dragonDpsMultiplier;
    case 'prism': return balance.mutation.prismDpsMultiplier;
    default: return 1;
  }
}

function mutationPowerMultiplier(slime: SlimeProgress): number {
  switch (slime.mutationId) {
    case 'dragon': return balance.mutation.dragonPowerMultiplier;
    case 'prism': return balance.mutation.prismPowerMultiplier;
    default: return 1;
  }
}
