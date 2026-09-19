import { describe, expect, it } from 'vitest';
import type { BattleSceneModel } from './selectors/battle-scene';
import { canAdoptBattleSceneModel } from './battle-presentation';

function model(encounterKey: string, hasEncounter = true, visualKey = 'visual'): BattleSceneModel {
  return {
    areaId: 'area.clover-road',
    encounterKey,
    runtimeKey: 'runtime',
    visualKey,
    stageNumber: 1,
    waveIndex: 0,
    encounter: hasEncounter ? ({ id: encounterKey, displayName: encounterKey, boss: false, enemies: [] } as BattleSceneModel['encounter']) : null,
    authoritativeResult: 'victory',
    authoritativeResultDelaySec: 1,
    allies: [],
  };
}

describe('battle presentation handoff', () => {
  it('keeps the current encounter while the authoritative simulation advances', () => {
    expect(canAdoptBattleSceneModel(model('wave-1'), model('wave-2'), 'combat')).toBe(false);
    expect(canAdoptBattleSceneModel(model('wave-1'), model('wave-2'), 'approach')).toBe(false);
  });

  it('hands off to the latest real encounter after the visible result', () => {
    expect(canAdoptBattleSceneModel(model('wave-1'), model('wave-3'), 'result')).toBe(true);
  });

  it('never replaces a real encounter with an empty content boundary', () => {
    expect(canAdoptBattleSceneModel(model('wave-1'), model('none', false), 'result')).toBe(false);
  });

  it('accepts visual-only roster changes within the same encounter', () => {
    expect(canAdoptBattleSceneModel(model('wave-1', true, 'a'), model('wave-1', true, 'b'), 'combat')).toBe(true);
  });
});
