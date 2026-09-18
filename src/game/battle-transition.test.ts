import { describe, expect, it } from 'vitest';
import { getBossRetreatEntrySlot, getVictoryMarchSlot, getVictoryTransitionPose, shouldUseMarchEntry, victoryStatusLabel } from './battle-transition';

describe('battle victory transition', () => {
  it('progresses from settle through loot into continuous march', () => {
    expect(getVictoryTransitionPose(0.1, 0).stage).toBe('settle');
    expect(getVictoryTransitionPose(0.6, 0).stage).toBe('loot');
    expect(getVictoryTransitionPose(1.4, 0).stage).toBe('march');
    expect(victoryStatusLabel(0.1)).toBe('撃破');
    expect(victoryStatusLabel(0.6)).toBe('戦利品回収');
    expect(victoryStatusLabel(1.4)).toBe('進軍中');
  });

  it('settles all six authored slots into a compact forward formation', () => {
    const slots = Array.from({ length: 6 }, (_, index) => getVictoryMarchSlot(index));
    expect(new Set(slots.map((slot) => [slot.x, slot.z].join(':'))).size).toBe(6);
    expect(Math.max(...slots.map((slot) => slot.z))).toBeLessThan(0);
    expect(getVictoryMarchSlot(-100)).toEqual(slots[0]);
    expect(getVictoryMarchSlot(100)).toEqual(slots[5]);
  });

  it('keeps marching scenery travel monotonic and unbounded while character motion stays bounded', () => {
    const early = getVictoryTransitionPose(1.2, 2);
    const late = getVictoryTransitionPose(12, 2);
    expect(early.sceneryTravel).toBeGreaterThanOrEqual(0);
    expect(late.sceneryTravel).toBeGreaterThan(early.sceneryTravel);
    expect(late.bob).toBeGreaterThanOrEqual(0);
    expect(late.bob).toBeLessThanOrEqual(0.07);
    expect(Math.abs(late.lean)).toBeLessThan(0.08);
    expect(late.cameraAdvance).toBeLessThanOrEqual(0.12);
  });

  it('starts boss retreat ahead of the march line so all allies visibly run backward', () => {
    for (let index = 0; index < 6; index += 1) {
      const march = getVictoryMarchSlot(index);
      const retreat = getBossRetreatEntrySlot(index);
      expect(retreat.z).toBeLessThan(march.z);
    }
  });

  it('uses march formation as the handoff origin after the opening encounter', () => {
    expect(shouldUseMarchEntry(1, 0)).toBe(false);
    expect(shouldUseMarchEntry(1, 1)).toBe(true);
    expect(shouldUseMarchEntry(2, 0)).toBe(true);
    expect(shouldUseMarchEntry(Number.NaN, Number.NaN)).toBe(false);
  });

  it('shows loot only during the handoff between defeat and march', () => {
    expect(getVictoryTransitionPose(0, 0).lootVisibility).toBe(0);
    expect(getVictoryTransitionPose(0.5, 0).lootVisibility).toBeGreaterThan(0.5);
    expect(getVictoryTransitionPose(2, 0).lootVisibility).toBe(0);
  });
});
