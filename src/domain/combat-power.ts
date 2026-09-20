import { GameNumber, curveValueAt } from 'idle-game-kit';
import { balance } from './balance';
import { equippedWeaponCombatMultiplier } from './equipment';
import { typeLevelDefinitions } from './fusion-definitions';
import type { SlimeInstanceId, SlimeMercenariesState, SlimeProgress } from './state';

export function partyCombatDps(state: SlimeMercenariesState): GameNumber {
  return activeSlimes(state).reduce(
    (total, slime) => total.add(slimeDps(state, slime)),
    GameNumber.zero(),
  );
}

export function partyCombatPower(state: SlimeMercenariesState): GameNumber {
  return activeSlimes(state).reduce(
    (total, slime) => total.add(slimePower(state, slime)),
    GameNumber.zero(),
  );
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
  const fusionMultiplier = balance.combat.fusionDpsMultiplierByRank[Math.max(0, slime.fusionRank - 1)]
    ?? balance.combat.fusionDpsMultiplierByRank.at(-1)!;
  return GameNumber.from(base)
    .multiply(levelMultiplier)
    .multiply(fusionMultiplier)
    .multiply(equippedWeaponCombatMultiplier(state, slime.id));
}

function slimePower(state: SlimeMercenariesState, slime: SlimeProgress): GameNumber {
  const base = balance.combat.basePowerByJob[slime.typeId];
  const levelMultiplier = curveValueAtForSlime(slime);
  const fusionMultiplier = balance.combat.fusionPowerMultiplierByRank[Math.max(0, slime.fusionRank - 1)]
    ?? balance.combat.fusionPowerMultiplierByRank.at(-1)!;
  return GameNumber.from(base)
    .multiply(levelMultiplier)
    .multiply(fusionMultiplier)
    .multiply(equippedWeaponCombatMultiplier(state, slime.id));
}

function curveValueAtForSlime(slime: SlimeProgress): GameNumber {
  // Keep analytical combat on the same stat curve used by Type Level progression.
  return curveValueAt(typeLevelDefinitions[slime.typeId].statCurve!, slime.level - 1);
}
