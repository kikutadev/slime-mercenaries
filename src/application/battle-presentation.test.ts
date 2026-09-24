import { describe, expect, it } from 'vitest';
import type { BattleSceneModel } from './selectors/battle-scene';
import { canStartQueuedBattleScene, enqueueBattleSceneModel } from './battle-presentation';

function model(encounterKey: string, hasEncounter = true, visualKey = 'visual'): BattleSceneModel {
  return {
    areaId: 'area.clover-road',
    encounterKey,
    runtimeKey: 'runtime',
    visualKey,
    stageNumber: 1,
    waveIndex: 0,
    encounter: hasEncounter
      ? ({ id: encounterKey, displayName: encounterKey, boss: false, enemies: [] } as BattleSceneModel['encounter'])
      : null,
    isStageFinalEncounter: false,
    shouldCelebrateVictory: false,
    allies: [],
  };
}

describe('battle presentation queue', () => {
  it('preserves intermediate encounters instead of coalescing directly to the latest one', () => {
    const presented = model('wave-1');
    const withWave2 = enqueueBattleSceneModel(presented, null, [], model('wave-2'));
    const withWave3 = enqueueBattleSceneModel(presented, null, withWave2, model('wave-3'));

    expect(withWave3.map((entry) => entry.encounterKey)).toEqual(['wave-2', 'wave-3']);
  });

  it('keeps an already-loading encounter ahead of newer encounters', () => {
    const queued = enqueueBattleSceneModel(model('wave-1'), model('wave-2'), [], model('wave-3'));
    expect(queued.map((entry) => entry.encounterKey)).toEqual(['wave-3']);
  });

  it('updates a queued encounter in place when only its visual projection changes', () => {
    const presented = model('wave-1');
    const queued = [model('wave-2', true, 'a')];
    const updated = enqueueBattleSceneModel(presented, null, queued, model('wave-2', true, 'b'));

    expect(updated).toHaveLength(1);
    expect(updated[0]?.visualKey).toBe('b');
  });

  it('does not enqueue an empty content boundary as a fake encounter', () => {
    const queued = enqueueBattleSceneModel(model('wave-1'), null, [], model('none', false));
    expect(queued).toEqual([]);
  });

  it('starts the next queued encounter only after the current presentation is readable', () => {
    const queued = [model('wave-2')];
    expect(canStartQueuedBattleScene(false, null, queued)).toBe(false);
    expect(canStartQueuedBattleScene(true, model('loading'), queued)).toBe(false);
    expect(canStartQueuedBattleScene(true, null, queued)).toBe(true);
  });
});