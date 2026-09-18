import { describe, expect, it } from 'vitest';
import { weaponDefinitions } from '../domain';
import { getForgeWeaponPresentation } from './forge-presentation';

describe('forge presentation', () => {
  it('authors a 3D reveal asset for every released weapon', () => {
    for (const weapon of Object.values(weaponDefinitions)) {
      const presentation = getForgeWeaponPresentation(weapon.id);

      expect(presentation.asset).toMatch(/^assets\/weapons\/.+\.glb$/);
      expect(presentation.family).toBe(weapon.family);
      expect(presentation.rarity).toBe(weapon.rarity);
      expect(presentation.familyLabel.length).toBeGreaterThan(0);
    }
  });

  it('fails fast for un-authored weapons', () => {
    expect(() => getForgeWeaponPresentation('weapon.unknown')).toThrow(
      'No Forge weapon presentation authored for weapon.unknown',
    );
  });
});
