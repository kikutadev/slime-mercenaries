import { describe, expect, it } from 'vitest';
import { enterAreaStage, maxSelectableStageForArea } from './world-navigation';
import { createInitialSlimeMercenariesState, withHighestStageClearedForArea } from './state';

describe('world navigation', () => {
  it('allows revisiting cleared stages and the current frontier, but not skipping ahead', () => {
    const initial = createInitialSlimeMercenariesState(0, 41);
    const state = {
      ...initial,
      gameData: {
        ...initial.gameData,
        progression: withHighestStageClearedForArea(initial.gameData.progression, 'area.clover-road', 2),
      },
    };
    expect(maxSelectableStageForArea(state, 'area.clover-road')).toBe(3);
    const revisit = enterAreaStage(state, 'area.clover-road', 2);
    expect(revisit.accepted).toBe(true);
    if (!revisit.accepted) return;
    expect(revisit.state.gameData.progression.currentStage).toBe(2);
    expect(revisit.state.gameData.combat.currentWaveIndex).toBe(0);
    expect(enterAreaStage(state, 'area.clover-road', 4)).toMatchObject({ accepted: false, reason: 'locked-stage' });
  });

  it('keeps future areas inaccessible until both unlocked and backed by stage content', () => {
    const initial = createInitialSlimeMercenariesState(0, 42);
    expect(enterAreaStage(initial, 'area.mushroom-forest', 1)).toMatchObject({ accepted: false, reason: 'locked-area' });
    const unlocked = {
      ...initial,
      gameData: {
        ...initial.gameData,
        progression: {
          ...initial.gameData.progression,
          currentAreaId: 'area.mushroom-forest',
          currentStage: 1,
        },
      },
    };
    expect(enterAreaStage(unlocked, 'area.mushroom-forest', 1)).toMatchObject({ accepted: false, reason: 'no-content' });
  });
});
