import { describe, expect, it } from 'vitest';
import { addItemInstance, grantToken } from 'idle-game-kit';
import { assignSlimeToFormation, partyCombatDps } from './combat';
import { craftPlainSlime, createJobSlime } from './commands';
import { equipWeapon, forgeEquipment } from './equipment';
import { ids, weaponDefinitions, weaponDefinitionsByDefinitionId } from './definitions';
import { createInitialSlimeMercenariesState, type SlimeMercenariesState, type WeaponInstanceData } from './state';

function swordState(): SlimeMercenariesState {
  const initial = createInitialSlimeMercenariesState(0, 3);
  const crafted = craftPlainSlime(initial);
  if (!crafted.accepted) throw new Error('setup craft failed');
  const created = createJobSlime(crafted.state, 'sword');
  if (!created.accepted) throw new Error('setup job failed');
  return created.state;
}

describe('equipment forge and loadout', () => {
  it('spends Forge Key through Kit Gacha and grants one persistent weapon instance', () => {
    const before = swordState();
    const funded: SlimeMercenariesState = { ...before, tokens: grantToken(before.tokens, ids.token.forgeKey, 1) };
    const result = forgeEquipment(funded, 1);
    expect(result.accepted).toBe(true);
    if (!result.accepted) return;

    expect(result.state.tokens[ids.token.forgeKey]).toBe(0);
    expect(Object.values(result.state.gameData.equipment.inventory)).toHaveLength(1);
    expect(result.state.gachaStates[ids.gacha.forge]?.totalDrawCount).toBe(1);
  });

  it('refines a duplicate instead of adding another inventory row', () => {
    let state = swordState();
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

  it('enforces weapon-family loadout restrictions', () => {
    let state = swordState();
    const bowDefinition = weaponDefinitions.hunterBow;
    const added = addItemInstance(state.gameData.equipment.inventory, {
      instanceId: `equipment-instance.${bowDefinition.id}`,
      definitionId: bowDefinition.id,
      quantity: 1,
      data: { refinementRank: 0 } satisfies WeaponInstanceData,
    });
    if (!added.accepted) throw new Error('setup inventory failed');
    state = { ...state, gameData: { ...state.gameData, equipment: { ...state.gameData.equipment, inventory: added.inventory } } };

    const result = equipWeapon(state, 'sword', bowDefinition.id);
    expect(result.accepted).toBe(false);
    if (result.accepted) return;
    expect(result.reason).toBe('wrong-family');
  });

  it('feeds the equipped weapon multiplier into the analytical combat model', () => {
    let state = swordState();
    const assigned = assignSlimeToFormation(state, 'sword', 0);
    if (!assigned.accepted) throw new Error('setup assign failed');
    state = assigned.state;
    const before = partyCombatDps(state).toNumber();

    const definition = weaponDefinitions.starcleaver;
    const added = addItemInstance(state.gameData.equipment.inventory, {
      instanceId: `equipment-instance.${definition.id}`,
      definitionId: definition.id,
      quantity: 1,
      data: { refinementRank: 0 } satisfies WeaponInstanceData,
    });
    if (!added.accepted) throw new Error('setup inventory failed');
    state = { ...state, gameData: { ...state.gameData, equipment: { ...state.gameData.equipment, inventory: added.inventory } } };
    const equipped = equipWeapon(state, 'sword', definition.id);
    if (!equipped.accepted) throw new Error('setup equip failed');

    expect(partyCombatDps(equipped.state).toNumber()).toBeGreaterThan(before);
    const equippedId = equipped.state.gameData.equipment.loadouts.sword.equipped.weapon;
    expect(equippedId).not.toBeNull();
    const item = equipped.state.gameData.equipment.inventory[equippedId!];
    expect(weaponDefinitionsByDefinitionId[item!.definitionId]?.family).toBe('sword');
  });
});
