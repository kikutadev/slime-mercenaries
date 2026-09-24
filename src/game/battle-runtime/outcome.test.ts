import { describe, expect, it } from 'vitest';
import { areAllUnitsVisiblyDefeated } from './outcome';

describe('battle runtime outcome guards', () => {
  it('does not finish while any defeated unit is still collapsing', () => {
    expect(areAllUnitsVisiblyDefeated([{ state: 'dead' }, { state: 'defeat' }])).toBe(false);
  });

  it('finishes only after every unit on the defeated side reached dead', () => {
    expect(areAllUnitsVisiblyDefeated([{ state: 'dead' }, { state: 'dead' }])).toBe(true);
  });

  it('does not treat an empty side as a completed result before an encounter exists', () => {
    expect(areAllUnitsVisiblyDefeated([])).toBe(false);
  });
});
