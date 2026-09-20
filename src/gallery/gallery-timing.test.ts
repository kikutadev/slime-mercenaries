import { describe, expect, it } from 'vitest';
import { SLIME_MOTION_TIMING } from '../game/slime-motion';
import { slimeGalleryCatalog } from './catalog';
import { galleryClipDuration, galleryTargetDistance } from './gallery-timing';

function slime(id: string) {
  const definition = slimeGalleryCatalog.find((entry) => entry.id === id);
  if (!definition) throw new Error(`Missing gallery definition: ${id}`);
  return definition;
}

describe('gallery timing and framing', () => {
  it('keeps ranged previews farther from their dummy than melee previews', () => {
    expect(galleryTargetDistance(slime('sniper'))).toBeGreaterThan(galleryTargetDistance(slime('blademaster')));
    expect(galleryTargetDistance(slime('wand'))).toBeGreaterThan(galleryTargetDistance(slime('shield')));
  });

  it('covers projectile travel in attack clip duration', () => {
    const bow = slime('bow');
    const duration = galleryClipDuration('attack', bow);
    expect(duration).toBeGreaterThan(SLIME_MOTION_TIMING.arrowFlight);
    expect(duration).toBeGreaterThan(0);
  });

  it('uses authored signature duration for tier-3 specialists', () => {
    expect(galleryClipDuration('attack', slime('ninja'))).toBeGreaterThan(0);
    expect(galleryClipDuration('attack', slime('engineer'))).toBeGreaterThan(0);
    expect(galleryClipDuration('defeat', slime('engineer'))).toBeGreaterThan(0);
  });
});
