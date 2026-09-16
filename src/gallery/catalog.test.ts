import { describe, expect, it } from 'vitest';
import { slimeGalleryCatalog } from './catalog';

const EXPECTED_MOTIONS: Readonly<Record<string, readonly string[]>> = {
  sword: ['idle', 'move', 'attack', 'defeat'],
  greatsword: ['idle', 'move', 'attack', 'defeat'],
  bow: ['idle', 'attack', 'defeat'],
};

describe('slime gallery catalog', () => {
  it('keeps gallery ids and publication order unique', () => {
    const ids = slimeGalleryCatalog.map((entry) => entry.id);
    const orders = slimeGalleryCatalog.map((entry) => entry.order);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(orders).size).toBe(orders.length);
  });

  it('exposes only production-backed motions for every published model', () => {
    for (const entry of slimeGalleryCatalog) {
      expect(entry.implementationStatus).toBe('implemented');
      expect(entry.asset).toMatch(/^assets\/.+\.glb$/);
      expect(Number.isFinite(entry.inspectionFacingYawDegrees), `${entry.id} needs a curated inspection yaw`).toBe(true);
      expect(Math.abs(entry.inspectionFacingYawDegrees ?? 999)).toBeLessThanOrEqual(180);
      expect(entry.availableMotions).toEqual(EXPECTED_MOTIONS[entry.id]);
      expect(entry.weaponTipName === null || entry.weaponTipName.length > 0).toBe(true);
    }
  });
});
