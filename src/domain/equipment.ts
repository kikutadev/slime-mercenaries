import {
  addItemInstance,
  drawGacha,
  equipItem,
  grantToken,
  type CommandResult,
  type DomainEvent,
  type GameState,
} from 'idle-game-kit';
import { balance } from './balance';
import {
  equipmentForgeDefinition,
  ids,
  itemDefinitionsById,
  slimeWeaponLoadoutDefinitions,
  weaponDefinitionsByDefinitionId,
  type ForgeReward,
  type JobSlimeId,
  type WeaponDefinition,
} from './definitions';
import type { SlimeMercenariesData, SlimeMercenariesState, WeaponInstanceData } from './state';

export type ForgeRejectReason = 'invalid-draw-count' | 'insufficient-currency' | 'insufficient-token' | 'missing-rng-stream';

export function forgeEquipment(
  state: SlimeMercenariesState,
  drawCount: 1 | 10,
): CommandResult<SlimeMercenariesState, ForgeRejectReason> {
  const result = drawGacha({
    state,
    definition: equipmentForgeDefinition,
    drawCount,
    hooks: {
      isDuplicate: (candidate, reward) => findWeaponInstance(candidate as SlimeMercenariesState, reward.weaponDefinitionId) !== null,
      grantReward: (candidate, reward) => grantNewWeapon(candidate as SlimeMercenariesState, reward),
      grantDuplicate: (candidate, reward) => refineWeapon(candidate as SlimeMercenariesState, reward),
    },
  });
  if (!result.accepted) return result as CommandResult<SlimeMercenariesState, ForgeRejectReason>;

  const nextState = result.state as SlimeMercenariesState;
  return {
    accepted: true,
    state: nextState,
    events: [
      ...result.events,
      semanticEvent(nextState, 'equipmentForgeResolved', `${nextState.gachaStates[ids.gacha.forge]?.totalDrawCount ?? 0}`, {
        drawCount,
      }),
    ],
  };
}

export function equipWeapon(
  state: SlimeMercenariesState,
  slimeId: JobSlimeId,
  weaponDefinitionId: string,
): CommandResult<SlimeMercenariesState, 'not-owned-slime' | 'weapon-not-owned' | 'wrong-family'> {
  if (state.gameData.roster.slimes[slimeId] === undefined) return reject(state, 'not-owned-slime');
  const instance = findWeaponInstance(state, weaponDefinitionId);
  if (instance === null) return reject(state, 'weapon-not-owned');

  const result = equipItem({
    inventory: state.gameData.equipment.inventory,
    itemDefinitions: itemDefinitionsById,
    loadoutDefinition: slimeWeaponLoadoutDefinitions[slimeId],
    loadout: state.gameData.equipment.loadouts[slimeId],
    slotId: 'weapon',
    itemInstanceId: instance.instanceId,
  });
  if (!result.accepted) return reject(state, result.reason === 'slot-restriction' ? 'wrong-family' : 'weapon-not-owned');

  const nextState: SlimeMercenariesState = {
    ...state,
    gameData: {
      ...state.gameData,
      equipment: {
        ...state.gameData.equipment,
        loadouts: { ...state.gameData.equipment.loadouts, [slimeId]: result.loadout },
      },
    },
  };
  return accept(nextState, [semanticEvent(nextState, 'weaponEquipped', `${slimeId}:${weaponDefinitionId}`, { slimeId, weaponDefinitionId })]);
}

export function equippedWeaponDefinition(
  state: SlimeMercenariesState,
  slimeId: JobSlimeId,
): WeaponDefinition | null {
  const instanceId = state.gameData.equipment.loadouts[slimeId].equipped.weapon ?? null;
  if (instanceId === null) return null;
  const instance = state.gameData.equipment.inventory[instanceId];
  if (instance === undefined) return null;
  return weaponDefinitionsByDefinitionId[instance.definitionId] ?? null;
}

export function equippedWeaponCombatMultiplier(state: SlimeMercenariesState, slimeId: JobSlimeId): number {
  const loadout = state.gameData.equipment.loadouts[slimeId];
  const instanceId = loadout.equipped.weapon ?? null;
  if (instanceId === null) return 1;
  const instance = state.gameData.equipment.inventory[instanceId];
  if (instance === undefined) return 1;
  const definition = weaponDefinitionsByDefinitionId[instance.definitionId];
  if (definition === undefined) return 1;
  const refinementRank = (instance.data as WeaponInstanceData | undefined)?.refinementRank ?? 0;
  return definition.dpsMultiplier * (1 + refinementRank * balance.equipment.refinementDpsPerRank);
}

function grantNewWeapon(state: SlimeMercenariesState, reward: ForgeReward): GameState<SlimeMercenariesData> {
  const definition = weaponDefinitionsByDefinitionId[reward.weaponDefinitionId];
  if (definition === undefined) throw new Error(`Unknown forged weapon: ${reward.weaponDefinitionId}`);
  const instanceId = instanceIdForWeapon(definition.id);
  const added = addItemInstance(state.gameData.equipment.inventory, {
    instanceId,
    definitionId: definition.id,
    quantity: 1,
    data: { refinementRank: 0 } satisfies WeaponInstanceData,
  });
  if (!added.accepted) throw new Error(`Failed to add forged weapon: ${added.reason}`);

  let nextState: SlimeMercenariesState = {
    ...state,
    gameData: {
      ...state.gameData,
      equipment: { ...state.gameData.equipment, inventory: added.inventory },
    },
  };

  const slime = nextState.gameData.roster.slimes[definition.family];
  const loadout = nextState.gameData.equipment.loadouts[definition.family];
  if (slime !== undefined && (loadout.equipped.weapon ?? null) === null) {
    const equipped = equipWeapon(nextState, definition.family, definition.id);
    if (equipped.accepted) nextState = equipped.state;
  }
  return nextState;
}

function refineWeapon(state: SlimeMercenariesState, reward: ForgeReward): GameState<SlimeMercenariesData> {
  const definition = weaponDefinitionsByDefinitionId[reward.weaponDefinitionId];
  if (definition === undefined) throw new Error(`Unknown duplicate weapon: ${reward.weaponDefinitionId}`);
  const instance = findWeaponInstance(state, reward.weaponDefinitionId);
  if (instance === null) throw new Error(`Duplicate weapon missing from inventory: ${reward.weaponDefinitionId}`);
  const currentRank = (instance.data as WeaponInstanceData | undefined)?.refinementRank ?? 0;

  if (currentRank >= balance.equipment.refinementCap) {
    const materialTokenId = definition.family === 'sword' ? ids.token.swordWeaponMaterial : ids.token.bowWeaponMaterial;
    return { ...state, tokens: grantToken(state.tokens, materialTokenId, 1) };
  }

  return {
    ...state,
    gameData: {
      ...state.gameData,
      equipment: {
        ...state.gameData.equipment,
        inventory: {
          ...state.gameData.equipment.inventory,
          [instance.instanceId]: {
            ...instance,
            data: { refinementRank: currentRank + 1 } satisfies WeaponInstanceData,
          },
        },
      },
    },
  };
}

function findWeaponInstance(state: SlimeMercenariesState, weaponDefinitionId: string) {
  return Object.values(state.gameData.equipment.inventory).find((instance) => instance.definitionId === weaponDefinitionId) ?? null;
}

function instanceIdForWeapon(weaponDefinitionId: string): string {
  return `equipment-instance.${weaponDefinitionId}`;
}

function semanticEvent(
  state: SlimeMercenariesState,
  type: string,
  key: string,
  payload?: Readonly<Record<string, unknown>>,
): DomainEvent {
  return { id: `${type}:${key}:${state.simTimeSec}`, type, simTimeSec: state.simTimeSec, ...(payload === undefined ? {} : { payload }) };
}

function accept(state: SlimeMercenariesState, events: readonly DomainEvent[]): CommandResult<SlimeMercenariesState, never> {
  return { accepted: true, state, events };
}

function reject<TReason extends string>(state: SlimeMercenariesState, reason: TReason): CommandResult<SlimeMercenariesState, TReason> {
  return { accepted: false, state, events: [], reason };
}
