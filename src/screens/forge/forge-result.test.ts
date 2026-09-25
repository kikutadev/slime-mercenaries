import { describe, expect, it } from 'vitest';
import { equipmentForgeDefinition, weaponDefinitionsByDefinitionId } from '../../domain';
import {
  forgeRarityLabel,
  forgeResultNotice,
  parseForgeDrawEvents,
  strongestForgeResult,
} from './forge-result';

describe('forge result helpers', () => {
  it('parses valid gacha events and ignores malformed events', () => {
    const commonEntry = equipmentForgeDefinition.pool.find((entry) => entry.rarity === 'common')!;
    const events = [
      { type: 'noop' },
      { type: 'gachaDrawn', payload: { entryId: 123 } },
      { type: 'gachaDrawn', payload: { entryId: commonEntry.id, duplicate: true } },
    ];

    expect(parseForgeDrawEvents(events)).toEqual([{
      weaponDefinitionId: commonEntry.reward.weaponDefinitionId,
      duplicate: true,
      rarity: 'common',
    }]);
  });

  it('selects the strongest rarity regardless of result order', () => {
    const common = equipmentForgeDefinition.pool.find((entry) => entry.rarity === 'common')!;
    const mythic = equipmentForgeDefinition.pool.find((entry) => entry.rarity === 'mythic')!;
    const rare = equipmentForgeDefinition.pool.find((entry) => entry.rarity === 'rare')!;

    const strongest = strongestForgeResult([
      { weaponDefinitionId: common.reward.weaponDefinitionId, duplicate: false, rarity: 'common' },
      { weaponDefinitionId: mythic.reward.weaponDefinitionId, duplicate: false, rarity: 'mythic' },
      { weaponDefinitionId: rare.reward.weaponDefinitionId, duplicate: false, rarity: 'rare' },
    ]);

    expect(strongest?.weaponDefinitionId).toBe(mythic.reward.weaponDefinitionId);
  });

  it('builds duplicate and auto-equip notices', () => {
    const entry = equipmentForgeDefinition.pool[0]!;
    const weapon = weaponDefinitionsByDefinitionId[entry.reward.weaponDefinitionId];
    const result = {
      weaponDefinitionId: weapon.id,
      duplicate: false,
      rarity: weapon.rarity,
    };

    expect(forgeResultNotice(result, null)).toBe(`${weapon.displayName} を獲得`);
    expect(forgeResultNotice(result, '剣士スライムが装備')).toBe(
      `${weapon.displayName} を獲得 · 剣士スライムが装備`,
    );
    expect(forgeResultNotice({ ...result, duplicate: true }, 'ignored')).toBe(
      `${weapon.displayName} · 精錬 +1`,
    );
  });

  it('uses localized rarity labels', () => {
    expect(forgeRarityLabel('common')).toBe('一般');
    expect(forgeRarityLabel('rare')).toBe('希少');
    expect(forgeRarityLabel('mythic')).toBe('神話');
  });
});
