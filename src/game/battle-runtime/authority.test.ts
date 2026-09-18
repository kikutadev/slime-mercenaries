import { describe, expect, it } from 'vitest';
import { resolvePresentationHpAfterDamage } from './authority';

describe('presentation combat authority boundary', () => {
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
