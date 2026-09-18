import {
  addItemInstance,
  drawGacha,
  equipItem,
  grantToken,
  type CommandResult,
  type DomainEvent,
  type GameState,
  type LoadoutState,
} from 'idle-game-kit';
import { balance } from './balance';
import {
  equipmentForgeDefinition,
  ids,
  itemDefinitionsById,
  slimeWeaponLoadoutDefinitions,
  weaponDefinitionsByDefinitionId,
  type ForgeReward,
  type WeaponDefinition,
} from './definitions';
import { ownedSlimes } from './roster';
import { markCodexDiscovery } from './codex';
import { createSlimeWeaponLoadout, type SlimeInstanceId, type SlimeMercenariesData, type SlimeMercenariesState, type WeaponInstanceData } from './state';

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
  slimeId: SlimeInstanceId,
  weaponDefinitionId: string,
): CommandResult<SlimeMercenariesState, 'not-owned-slime' | 'weapon-not-owned' | 'wrong-family'> {
  const slime = state.gameData.roster.slimes[slimeId];
  if (slime === undefined) return reject(state, 'not-owned-slime');
  const instance = findWeaponInstance(state, weaponDefinitionId);
  if (instance === null) return reject(state, 'weapon-not-owned');

  const currentLoadout = state.gameData.equipment.loadouts[slimeId] ?? createSlimeWeaponLoadout(slime.typeId);
  const result = equipItem({
    inventory: state.gameData.equipment.inventory,
    itemDefinitions: itemDefinitionsById,
    loadoutDefinition: slimeWeaponLoadoutDefinitions[slime.typeId],
    loadout: currentLoadout,
    slotId: 'weapon',
    itemInstanceId: instance.instanceId,
  });
  if (!result.accepted) return reject(state, result.reason === 'slot-restriction' ? 'wrong-family' : 'weapon-not-owned');

  // A concrete inventory instance belongs to at most one slime. Equipping transfers it from any previous holder.
  const loadouts: Record<string, LoadoutState> = { ...state.gameData.equipment.loadouts };
  for (const [otherSlimeId, loadout] of Object.entries(loadouts)) {
    if (otherSlimeId === slimeId || loadout.equipped.weapon !== instance.instanceId) continue;
    loadouts[otherSlimeId] = {
      ...loadout,
      equipped: { ...loadout.equipped, weapon: null },
    };
  }
  loadouts[slimeId] = result.loadout;

  const nextState: SlimeMercenariesState = {
    ...state,
    gameData: {
      ...state.gameData,
      equipment: { ...state.gameData.equipment, loadouts },
    },
  };
  return accept(nextState, [semanticEvent(nextState, 'weaponEquipped', `${slimeId}:${weaponDefinitionId}`, {
    slimeId,
    typeId: slime.typeId,
    weaponDefinitionId,
  })]);
}

export function equippedWeaponDefinition(
  state: SlimeMercenariesState,
  slimeId: SlimeInstanceId,
): WeaponDefinition | null {
  const instanceId = state.gameData.equipment.loadouts[slimeId]?.equipped.weapon ?? null;
  if (instanceId === null) return null;
  const instance = state.gameData.equipment.inventory[instanceId];
  if (instance === undefined) return null;
  return weaponDefinitionsByDefinitionId[instance.definitionId] ?? null;
}

export function equippedWeaponCombatMultiplier(state: SlimeMercenariesState, slimeId: SlimeInstanceId): number {
  const loadout = state.gameData.equipment.loadouts[slimeId];
  const instanceId = loadout?.equipped.weapon ?? null;
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
  nextState = markCodexDiscovery(nextState, 'weapon', definition.id);

  const target = ownedSlimes(nextState)
    .find((slime) => slime.typeId === definition.family
      && (nextState.gameData.equipment.loadouts[slime.id]?.equipped.weapon ?? null) === null);
  if (target !== undefined) {
    const equipped = equipWeapon(nextState, target.id, definition.id);
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
    const materialTokenId = {
      sword: ids.token.swordWeaponMaterial,
      shield: ids.token.shieldWeaponMaterial,
      bow: ids.token.bowWeaponMaterial,
      wand: ids.token.wandWeaponMaterial,
      dagger: ids.token.daggerWeaponMaterial,
      gun: ids.token.gunWeaponMaterial,
    }[definition.family];
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
