import { describe, expect, it } from 'vitest';
import { campRoutineOffsetSec, campTemperamentForInstance } from './camp-temperament';

describe('camp temperament', () => {
  it('is deterministic for a persistent slime instance', () => {
    expect(campTemperamentForInstance('slime.17')).toBe(campTemperamentForInstance('slime.17'));
    expect(campRoutineOffsetSec('slime.17')).toBe(campRoutineOffsetSec('slime.17'));
  });

  it('distributes nearby persistent instances across multiple presentation personalities', () => {
    const temperaments = new Set(
      Array.from({ length: 12 }, (_, index) => campTemperamentForInstance(`slime.${index + 1}`)),
    );
    expect(temperaments.size).toBeGreaterThanOrEqual(3);
  });

  it('desynchronises routines without introducing unbounded timing offsets', () => {
    const offsets = Array.from({ length: 12 }, (_, index) => campRoutineOffsetSec(`slime.${index + 1}`));
    expect(new Set(offsets).size).toBeGreaterThanOrEqual(4);
    expect(Math.min(...offsets)).toBeGreaterThanOrEqual(0);
    expect(Math.max(...offsets)).toBeLessThan(8);
  });
});
