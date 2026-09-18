import { NORMAL_JOB_SLIME_IDS, resolveAreaDefinition, resolveStageDefinition, weaponDefinitionsByDefinitionId } from './definitions';
import { isAreaUnlocked, type SlimeMercenariesState } from './state';

const NORMAL_JOB_IDS = new Set<string>(NORMAL_JOB_SLIME_IDS);

/**
 * Validate cross-reference invariants that TypeScript cannot protect once a save has been
 * serialized. This intentionally checks structure/ownership consistency, not balance values.
 */
export function assertSlimeStateInvariants(state: SlimeMercenariesState): void {
  const progression = state.gameData.progression;
  const currentArea = resolveAreaDefinition(progression.currentAreaId);
  invariant(currentArea !== undefined, `Unknown current area: ${progression.currentAreaId}`);
  invariant(isAreaUnlocked(progression, progression.currentAreaId as Parameters<typeof isAreaUnlocked>[1]), 'Current area is not unlocked: ' + progression.currentAreaId);
  invariant(resolveStageDefinition(progression.currentAreaId, progression.currentStage) !== null,
    `Unknown current stage: ${progression.currentAreaId}:${progression.currentStage}`);

  for (const [areaId, areaProgress] of Object.entries(progression.areas)) {
    const area = resolveAreaDefinition(areaId);
    invariant(area !== undefined, `Unknown unlocked area: ${areaId}`);
    invariant(Number.isSafeInteger(areaProgress.highestStageCleared) && areaProgress.highestStageCleared >= 0,
      `Invalid highest stage for ${areaId}`);
    invariant(areaProgress.highestStageCleared <= area.stages.length,
      `Highest stage exceeds authored content for ${areaId}`);
  }

  const roster = state.gameData.roster;
  const serials = new Set<number>();
  let maxSerial = 0;
  for (const [slimeId, slime] of Object.entries(roster.slimes)) {
    invariant(slime.id === slimeId, `Roster key/id mismatch: ${slimeId} != ${slime.id}`);
    invariant(NORMAL_JOB_IDS.has(slime.typeId), `Unknown slime type: ${slime.typeId}`);
    invariant(Number.isSafeInteger(slime.serial) && slime.serial > 0, `Invalid slime serial: ${slimeId}`);
    invariant(!serials.has(slime.serial), `Duplicate slime serial: ${slime.serial}`);
    serials.add(slime.serial);
    maxSerial = Math.max(maxSerial, slime.serial);
    invariant(state.gameData.equipment.loadouts[slimeId] !== undefined, `Missing loadout for slime: ${slimeId}`);
  }
  invariant(Number.isSafeInteger(roster.nextSlimeSerial) && roster.nextSlimeSerial > maxSerial,
    `nextSlimeSerial must exceed every owned serial`);

  for (const loadoutSlimeId of Object.keys(state.gameData.equipment.loadouts)) {
    invariant(roster.slimes[loadoutSlimeId] !== undefined, `Orphan slime loadout: ${loadoutSlimeId}`);
  }

  const formationIds = roster.formationSlots.filter((slimeId): slimeId is string => slimeId !== null);
  invariant(new Set(formationIds).size === formationIds.length, 'One slime instance occupies multiple formation slots');
  const formationSet = new Set(formationIds);
  for (const slimeId of formationIds) {
    const slime = roster.slimes[slimeId];
    invariant(slime !== undefined, `Formation references missing slime: ${slimeId}`);
    invariant(slime.assignment === 'battle', `Formation slime is not battle-assigned: ${slimeId}`);
  }

  const dispatchIds = new Set<string>();
  for (const [contractId, contract] of Object.entries(state.gameData.dispatch.contracts)) {
    if (contract.slimeId === null) continue;
    invariant(!dispatchIds.has(contract.slimeId), `Slime is assigned to multiple dispatch contracts: ${contract.slimeId}`);
    dispatchIds.add(contract.slimeId);
    const slime = roster.slimes[contract.slimeId];
    invariant(slime !== undefined, `Dispatch ${contractId} references missing slime: ${contract.slimeId}`);
    invariant(slime.assignment === 'dispatch', `Dispatch slime is not dispatch-assigned: ${contract.slimeId}`);
    invariant(contract.activity.status === 'running', `Dispatch ${contractId} owns a slime while not running`);
  }

  for (const slime of Object.values(roster.slimes)) {
    if (slime.assignment === 'battle') invariant(formationSet.has(slime.id), `Battle-assigned slime is absent from formation: ${slime.id}`);
    if (slime.assignment === 'dispatch') invariant(dispatchIds.has(slime.id), `Dispatch-assigned slime has no contract: ${slime.id}`);
    if (slime.assignment === 'reserve') {
      invariant(!formationSet.has(slime.id), `Reserve slime appears in formation: ${slime.id}`);
      invariant(!dispatchIds.has(slime.id), `Reserve slime appears in dispatch: ${slime.id}`);
    }
  }

  const equippedWeaponOwners = new Map<string, string>();
  for (const [slimeId, loadout] of Object.entries(state.gameData.equipment.loadouts)) {
    const weaponInstanceId = loadout.equipped.weapon;
    if (weaponInstanceId === null) continue;
    const previousOwner = equippedWeaponOwners.get(weaponInstanceId);
    invariant(previousOwner === undefined, `Weapon instance equipped by multiple slimes: ${weaponInstanceId}`);
    equippedWeaponOwners.set(weaponInstanceId, slimeId);
    const instance = state.gameData.equipment.inventory[weaponInstanceId];
    invariant(instance !== undefined, `Loadout references missing weapon instance: ${weaponInstanceId}`);
    const definition = weaponDefinitionsByDefinitionId[instance.definitionId];
    invariant(definition !== undefined, `Inventory references unknown weapon definition: ${instance.definitionId}`);
    invariant(definition.family === roster.slimes[slimeId]!.typeId,
      `Wrong-family weapon equipped by ${slimeId}: ${definition.id}`);
  }

  validateCodexBucket(state.gameData.codex.slimeForms, 'slime form');
  validateCodexBucket(state.gameData.codex.weapons, 'weapon');
}

function validateCodexBucket(
  bucket: SlimeMercenariesState['gameData']['codex']['slimeForms'],
  label: string,
): void {
  for (const [entryId, entry] of Object.entries(bucket)) {
    invariant(Number.isFinite(entry.discoveredAtSimTimeSec) && entry.discoveredAtSimTimeSec >= 0,
      `Invalid ${label} discovery time: ${entryId}`);
    if (entry.viewedAtSimTimeSec !== null) {
      invariant(Number.isFinite(entry.viewedAtSimTimeSec) && entry.viewedAtSimTimeSec >= entry.discoveredAtSimTimeSec,
        `Invalid ${label} viewed time: ${entryId}`);
    }
  }
}

function invariant(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`Invalid Slime Mercenaries state: ${message}`);
}
