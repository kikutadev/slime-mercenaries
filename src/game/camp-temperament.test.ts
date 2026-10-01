import { describe, expect, it } from 'vitest';
import { applyDevelopmentSandboxResources } from '../application/validation-mode';
import {
  createInitialSlimeMercenariesState,
  createJobSlime,
  firstSlimeIdByType,
  fuseSlime,
  levelUpSlime,
} from '../domain';
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

  it('keeps the same persistent identity and temperament through fusion', () => {
    let state = applyDevelopmentSandboxResources(createInitialSlimeMercenariesState(0, 91));
    const created = createJobSlime(state, 'sword');
    if (!created.accepted) throw new Error(`create sword rejected: ${created.reason}`);
    state = applyDevelopmentSandboxResources(created.state);

    const slimeId = firstSlimeIdByType(state, 'sword');
    if (slimeId === null) throw new Error('sword missing');
    const temperament = campTemperamentForInstance(slimeId);

    const leveled = levelUpSlime(state, slimeId, 9);
    if (!leveled.accepted) throw new Error(`level sword rejected: ${leveled.reason}`);
    state = applyDevelopmentSandboxResources(leveled.state);

    const fused = fuseSlime(state, slimeId);
    if (!fused.accepted) throw new Error(`fusion rejected: ${fused.reason}`);

    expect(fused.state.gameData.roster.slimes[slimeId]?.id).toBe(slimeId);
    expect(fused.state.gameData.roster.slimes[slimeId]?.fusionRank).toBe(2);
    expect(campTemperamentForInstance(slimeId)).toBe(temperament);
  });
});
