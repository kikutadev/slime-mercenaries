import { describe, expect, it } from 'vitest';
import { authoritativePresentationTriggerSec, readableAuthoritativeResultSec, resolvePresentationHpAfterDamage } from './authority';

describe('presentation combat authority boundary', () => {
  it('schedules the preferred visual result from the runtime creation deadline', () => {
    expect(authoritativePresentationTriggerSec('victory', 6)).toBe(5);
    expect(authoritativePresentationTriggerSec('defeat', 6)).toBeCloseTo(3.8);
    expect(authoritativePresentationTriggerSec('victory', 0.2)).toBe(0);
  });

  it('never presents an authoritative result before rendered combat had a readable window', () => {
    expect(readableAuthoritativeResultSec(3.8, 3.8, 0.22)).toBeCloseTo(4.02);
    expect(readableAuthoritativeResultSec(5, 1.55, 0.22)).toBe(5);
  });

  it('allows ordinary visual units to reach zero hp', () => {
    expect(resolvePresentationHpAfterDamage({
      hp: 1,
      damage: 2,
      authoritativeResult: null,
      isLastLivingUnit: true,
    })).toBe(0);
  });

  it('keeps the final visual unit alive until a domain-authored result boundary', () => {
    expect(resolvePresentationHpAfterDamage({
      hp: 1,
      damage: 10,
      authoritativeResult: 'victory',
      isLastLivingUnit: true,
    })).toBe(1);
  });

  it('does not protect non-final units in an authoritative encounter', () => {
    expect(resolvePresentationHpAfterDamage({
      hp: 1,
      damage: 10,
      authoritativeResult: 'defeat',
      isLastLivingUnit: false,
    })).toBe(0);
  });
});
