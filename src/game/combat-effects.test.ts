import { describe, expect, it } from 'vitest';
import { applyTimedMultiplier, distanceSqToSegment2D, isExecuteThreshold, resolveTimedMultiplier } from './combat-effects';

describe('combat effect primitives', () => {
  it('keeps the stronger active multiplier while extending duration', () => {
    const slow = applyTimedMultiplier(null, 10, 3, 0.5);
    const refreshed = applyTimedMultiplier(slow, 11, 5, 0.8);
    expect(refreshed.multiplier).toBe(0.5);
    expect(refreshed.expiresAtSec).toBe(16);
    expect(resolveTimedMultiplier(refreshed, 15.9)).toBe(0.5);
    expect(resolveTimedMultiplier(refreshed, 16)).toBe(1);
  });

  it('recognizes a living low-HP execute target only below the threshold', () => {
    expect(isExecuteThreshold(3, 10)).toBe(true);
    expect(isExecuteThreshold(4, 10)).toBe(false);
    expect(isExecuteThreshold(0, 10)).toBe(false);
  });
  it('measures finite line-pierce distance in the XZ plane', () => {
    expect(distanceSqToSegment2D(1, 0.2, 0, 0, 2, 0)).toBeCloseTo(0.04);
    expect(distanceSqToSegment2D(3, 0, 0, 0, 2, 0)).toBeCloseTo(1);
  });

});
