import { describe, expect, it } from 'vitest';
import { SLIME_MOTION_TIMING } from '../game/slime-motion';
import { slimeGalleryCatalog } from './catalog';
import { galleryClipDuration, galleryPlaybackSearch, galleryReviewFrame, galleryTargetDistance } from './gallery-timing';

function slime(id: string) {
  const definition = slimeGalleryCatalog.find((entry) => entry.id === id);
  if (!definition) throw new Error(`Missing gallery definition: ${id}`);
  return definition;
}

describe('gallery timing and framing', () => {
  it('keeps ordinary shared URLs moving, even when an old link has a frame parameter', () => {
    expect(galleryReviewFrame('?frame=1&slime=sword&motion=defeat')).toBeNull();
    expect(galleryReviewFrame('?slime=sword&frame=0.52')).toBeNull();
    expect(galleryPlaybackSearch('?slime=sword&motion=defeat&frame=1&qa=1'))
      .toBe('slime=sword&motion=defeat');
  });

  it('restricts exact normalized-frame inspection to explicit QA links', () => {
    expect(galleryReviewFrame('?qa=1&frame=0')).toBe(0);
    expect(galleryReviewFrame('?qa=1&slime=sword&frame=0.52')).toBe(0.52);
    expect(galleryReviewFrame('?qa=1&frame=1')).toBe(1);
    for (const raw of ['', '?qa=1&frame=', '?qa=1&frame=NaN', '?qa=1&frame=Infinity', '?qa=1&frame=1.2', '?qa=1&frame=-0.01', '?qa=0&frame=1']) {
      expect(galleryReviewFrame(raw)).toBeNull();
    }
  });

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
