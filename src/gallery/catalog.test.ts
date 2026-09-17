import { describe, expect, it } from 'vitest';
import { slimeGalleryCatalog } from './catalog';

const EXPECTED_MOTIONS: Readonly<Record<string, readonly string[]>> = {
  plain: ['idle'],
  sword: ['idle', 'move', 'attack', 'defeat'],
  greatsword: ['idle', 'move', 'attack', 'defeat'],
  bow: ['idle', 'attack', 'defeat'],
  shield: ['idle', 'move', 'attack', 'defeat'],
  wand: ['idle', 'move', 'attack', 'defeat'],
  dagger: ['idle', 'move', 'attack', 'defeat'],
  gun: ['idle', 'move', 'attack', 'defeat'],
  fighter: ['idle', 'move', 'attack', 'defeat'],
  guardian: ['idle', 'move', 'attack', 'defeat'],
  ranger: ['idle', 'move', 'attack', 'defeat'],
  mage: ['idle', 'move', 'attack', 'defeat'],
  rogue: ['idle', 'move', 'attack', 'defeat'],
  gunner: ['idle', 'move', 'attack', 'defeat'],
  blademaster: ['idle'],
  berserker: ['idle'],
  paladin: ['idle'],
  fortress: ['idle'],
  sniper: ['idle'],
  'storm-archer': ['idle'],
  archmage: ['idle'],
  'frost-mage': ['idle'],
  ninja: ['idle'],
  assassin: ['idle'],
  cannoneer: ['idle'],
  engineer: ['idle'],
  'tiny-mushroom': ['idle', 'move', 'attack', 'hit', 'defeat'],
  'plump-mushroom': ['idle', 'move', 'attack', 'hit', 'defeat'],
  'spore-mushroom': ['idle', 'move', 'attack', 'hit', 'defeat'],
  'great-mushroom': ['idle', 'move', 'attack', 'hit', 'defeat'],
  'leafling': ['idle', 'move', 'attack', 'hit', 'defeat'],
  'whirl-leaf': ['idle', 'move', 'attack', 'hit', 'defeat'],
  'bud-bloom': ['idle', 'move', 'attack', 'hit', 'defeat'],
  'puff-flower': ['idle', 'move', 'attack', 'hit', 'defeat'],
  'round-hedgehog': ['idle', 'move', 'attack', 'hit', 'defeat'],
  'acorn-squirrel': ['idle', 'move', 'attack', 'hit', 'defeat'],
};

describe('slime gallery catalog', () => {
  it('keeps gallery ids and publication order unique', () => {
    const ids = slimeGalleryCatalog.map((entry) => entry.id);
    const orders = slimeGalleryCatalog.map((entry) => entry.order);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(orders).size).toBe(orders.length);
  });

  it('exposes only explicitly accepted motions for every published model', () => {
    for (const entry of slimeGalleryCatalog) {
      expect(['implemented', 'model']).toContain(entry.implementationStatus);
      expect(entry.asset).toMatch(/^assets\/.+\.glb$/);
      expect(Number.isFinite(entry.inspectionFacingYawDegrees), `${entry.id} needs a curated inspection yaw`).toBe(true);
      expect(Math.abs(entry.inspectionFacingYawDegrees ?? 999)).toBeLessThanOrEqual(180);
      expect(entry.availableMotions).toEqual(EXPECTED_MOTIONS[entry.id]);
      if (entry.implementationStatus === 'model') expect(entry.availableMotions).not.toContain('attack');
      expect(entry.weaponTipName === null || entry.weaponTipName.length > 0).toBe(true);
    }
  });
});
