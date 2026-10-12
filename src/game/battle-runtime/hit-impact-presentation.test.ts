import { describe, expect, it } from 'vitest';
import { hitImpactPresentation } from './hit-impact-presentation';

describe('hit impact presentation', () => {
  it('differentiates quick and powerful attacks without affecting combat damage', () => {
    const light = hitImpactPresentation('enemy', 'melee', 1);
    const heavy = hitImpactPresentation('enemy', 'melee', 4);
    expect(heavy.size).toBeGreaterThan(light.size);
    expect(heavy.duration).toBeGreaterThan(light.duration);
    expect(hitImpactPresentation('enemy', 'projectile', 2).color).not.toBe(light.color);
  });

  it('caps effects even for abnormal damage magnitudes', () => {
    const cap = hitImpactPresentation('enemy', 'melee', 4);
    expect(hitImpactPresentation('enemy', 'melee', 1000)).toEqual(cap);
    expect(hitImpactPresentation('enemy', 'melee', Number.POSITIVE_INFINITY).size).toBeLessThanOrEqual(0.18);
    expect(hitImpactPresentation('ally', 'enemy', 1000).size).toBe(0.095);
  });
});
