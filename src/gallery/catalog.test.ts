import { describe, expect, it } from 'vitest';
import { slimeGalleryCatalog } from './catalog';

const REQUIRED_MOTIONS = ['idle', 'move', 'attack', 'hit', 'defeat', 'celebrate'] as const;

describe('slime gallery catalog', () => {
  it('keeps gallery ids and publication order unique', () => {
    const ids = slimeGalleryCatalog.map((entry) => entry.id);
    const orders = slimeGalleryCatalog.map((entry) => entry.order);

    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(orders).size).toBe(orders.length);
  });

  it('requires the shared QA motion vocabulary for every published model', () => {
    for (const entry of slimeGalleryCatalog) {
      expect(entry.implementationStatus).toBe('implemented');
      expect(entry.asset).toMatch(/^assets\/.+\.glb$/);
      expect(Number.isFinite(entry.inspectionFacingYawDegrees), `${entry.id} needs a curated inspection yaw`).toBe(true);
      expect(Math.abs(entry.inspectionFacingYawDegrees ?? 999)).toBeLessThanOrEqual(180);
      for (const motion of REQUIRED_MOTIONS) {
        expect(entry.availableMotions, `${entry.id} is missing ${motion}`).toContain(motion);
      }
    }
  });
});
