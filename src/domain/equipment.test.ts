import { describe, expect, it } from 'vitest';
import { addItemInstance, grantToken } from 'idle-game-kit';
import { assignSlimeToFormation, partyCombatDps } from './combat';
import { craftPlainSlime, createJobSlime } from './commands';
import { equipWeapon, forgeEquipment } from './equipment';
import { equipmentForgeDefinition, ids, jobCreationDefinitions, NORMAL_JOB_SLIME_IDS, weaponDefinitions, weaponDefinitionsByDefinitionId } from './definitions';
import { firstSlimeIdByType, slimeIdsByType } from './roster';
import { createInitialSlimeMercenariesState, type SlimeMercenariesState, type WeaponInstanceData } from './state';

function swordState(): Readonly<{ state: SlimeMercenariesState; swordId: string }> {
  const initial = createInitialSlimeMercenariesState(0, 3);
  const crafted = craftPlainSlime(initial);
  if (!crafted.accepted) throw new Error('setup craft failed');
  const created = createJobSlime(crafted.state, 'sword');
  if (!created.accepted) throw new Error('setup job failed');
  const swordId = firstSlimeIdByType(created.state, 'sword');
  if (swordId === null) throw new Error('setup sword missing');
  return { state: created.state, swordId };
}

function addWeapon(state: SlimeMercenariesState, definitionId: string): SlimeMercenariesState {
  const added = addItemInstance(state.gameData.equipment.inventory, {
    instanceId: `test.${definitionId}`,
    definitionId,
    quantity: 1,
    data: { refinementRank: 0 } satisfies WeaponInstanceData,
  });
  if (!added.accepted) throw new Error('setup inventory failed');
  return { ...state, gameData: { ...state.gameData, equipment: { ...state.gameData.equipment, inventory: added.inventory } } };
}

describe('equipment forge and loadout', () => {
  it('spends Forge Key through Kit Gacha and grants one persistent weapon instance', () => {
    const before = swordState().state;
    const funded: SlimeMercenariesState = { ...before, tokens: grantToken(before.tokens, ids.token.forgeKey, 1) };
    const result = forgeEquipment(funded, 1);
    expect(result.accepted).toBe(true);
    if (!result.accepted) return;

    expect(result.state.tokens[ids.token.forgeKey]).toBe(0);
    const forged = Object.values(result.state.gameData.equipment.inventory);
    expect(forged).toHaveLength(1);
    expect(result.state.gameData.codex.weapons[forged[0]!.definitionId]).toMatchObject({ viewedAtSimTimeSec: null });
    expect(result.state.gachaStates[ids.gacha.forge]?.totalDrawCount).toBe(1);
  });

  it('refines a duplicate weapon instead of adding another inventory row', () => {
    let state = swordState().state;
    let inventory = state.gameData.equipment.inventory;
    for (const definition of Object.values(weaponDefinitions)) {
      const added = addItemInstance(inventory, {
        instanceId: `equipment-instance.${definition.id}`,
        definitionId: definition.id,
        quantity: 1,
        data: { refinementRank: 0 } satisfies WeaponInstanceData,
      });
      if (!added.accepted) throw new Error('setup inventory failed');
      inventory = added.inventory;
    }
    state = {
      ...state,
      tokens: grantToken(state.tokens, ids.token.forgeKey, 1),
      gameData: { ...state.gameData, equipment: { ...state.gameData.equipment, inventory } },
    };

    const result = forgeEquipment(state, 1);
    expect(result.accepted).toBe(true);
    if (!result.accepted) return;
    expect(Object.values(result.state.gameData.equipment.inventory)).toHaveLength(Object.keys(weaponDefinitions).length);
    const refinementTotal = Object.values(result.state.gameData.equipment.inventory)
      .reduce((sum, item) => sum + ((item.data as WeaponInstanceData | undefined)?.refinementRank ?? 0), 0);
    expect(refinementTotal).toBe(1);
  });

  it('enforces weapon-family loadout restrictions per slime instance', () => {
    const setup = swordState();
    const state = addWeapon(setup.state, weaponDefinitions.hunterBow.id);

    const result = equipWeapon(state, setup.swordId, weaponDefinitions.hunterBow.id);
    expect(result.accepted).toBe(false);
    if (result.accepted) return;
    expect(result.reason).toBe('wrong-family');
  });

  it('feeds the selected instance weapon multiplier into analytical combat', () => {
    const setup = swordState();
    const assigned = assignSlimeToFormation(setup.state, setup.swordId, 0);
    if (!assigned.accepted) throw new Error('setup assign failed');
    const before = partyCombatDps(assigned.state).toNumber();

    const definition = weaponDefinitions.starcleaver;
    const withWeapon = addWeapon(assigned.state, definition.id);
    const equipped = equipWeapon(withWeapon, setup.swordId, definition.id);
    if (!equipped.accepted) throw new Error('setup equip failed');

    expect(partyCombatDps(equipped.state).toNumber()).toBeGreaterThan(before);
    const equippedId = equipped.state.gameData.equipment.loadouts[setup.swordId]?.equipped.weapon;
    expect(equippedId).not.toBeNull();
    const item = equipped.state.gameData.equipment.inventory[equippedId!];
    expect(weaponDefinitionsByDefinitionId[item!.definitionId]?.family).toBe('sword');
  });

  it('transfers one concrete weapon instance between same-type bodies instead of duplicating it', () => {
    const setup = swordState();
    const prepared = {
      ...setup.state,
      tokens: grantToken(
        grantToken(setup.state.tokens, ids.token.plainSlime, jobCreationDefinitions.sword.plainSlimeCount),
        ids.token.trainingSword,
        jobCreationDefinitions.sword.jobGearCount,
      ),
    };
    const duplicate = createJobSlime(prepared, 'sword');
    if (!duplicate.accepted) throw new Error('duplicate setup failed');
    const [firstId, secondId] = slimeIdsByType(duplicate.state, 'sword');
    if (firstId === undefined || secondId === undefined) throw new Error('duplicate IDs missing');
    const definition = weaponDefinitions.starcleaver;
    const withWeapon = addWeapon(duplicate.state, definition.id);
    const firstEquip = equipWeapon(withWeapon, firstId, definition.id);
    if (!firstEquip.accepted) throw new Error('first equip failed');
    const secondEquip = equipWeapon(firstEquip.state, secondId, definition.id);
    if (!secondEquip.accepted) throw new Error('second equip failed');

    expect(secondEquip.state.gameData.equipment.loadouts[firstId]?.equipped.weapon).toBeNull();
    expect(secondEquip.state.gameData.equipment.loadouts[secondId]?.equipped.weapon).toBe(`test.${definition.id}`);
  });
  it('ships a forgeable Common/Rare/Mythic weapon set for every normal family without changing rarity proportions', () => {
    const weapons = Object.values(weaponDefinitions);
    for (const family of NORMAL_JOB_SLIME_IDS) {
      const familyWeapons = weapons.filter((weapon) => weapon.family === family);
      expect(familyWeapons.map((weapon) => weapon.rarity).sort()).toEqual(['common', 'mythic', 'rare']);
      expect(familyWeapons.map((weapon) => weapon.dpsMultiplier).sort((a, b) => a - b)).toEqual([1.08, 1.18, 1.42]);
    }

    const poolDefinitionIds = new Set(equipmentForgeDefinition.pool.map((entry) => entry.reward.weaponDefinitionId));
    expect([...weapons].every((weapon) => poolDefinitionIds.has(weapon.id))).toBe(true);
    expect(equipmentForgeDefinition.pity?.poolEntryIds).toHaveLength(NORMAL_JOB_SLIME_IDS.length);
  });

});
