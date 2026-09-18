import { describe, expect, it } from 'vitest';

import {
  AREA_IDS,
  areaDefinitions,
  resolveNextAreaDefinition,
  resolveNextWorldStageDefinition,
} from './definitions';
import { createInitialSlimeMercenariesState } from './state';

describe('first-world area manifest', () => {
  it('registers the complete eight-area world horizon in stable sequence', () => {
    expect(AREA_IDS).toEqual([
      'area.clover-road',
      'area.mushroom-forest',
      'area.amber-mine',
      'area.sunken-marsh',
      'area.frost-ruins',
      'area.ember-canyon',
      'area.moonlit-castle',
      'area.dragon-crater',
    ]);
    expect(Object.keys(areaDefinitions)).toEqual([...AREA_IDS]);
  });

  it('keeps unauthored areas registered without inventing combat content', () => {
    for (const areaId of AREA_IDS.slice(1)) {
      expect(areaDefinitions[areaId].stages).toEqual([]);
    }
  });

  it('resolves sequential area order without skipping an unauthored area', () => {
    expect(resolveNextAreaDefinition('area.clover-road')?.id).toBe('area.mushroom-forest');
    expect(resolveNextAreaDefinition('area.dragon-crater')).toBeNull();
    expect(resolveNextAreaDefinition('area.unknown')).toBeNull();
  });

  it('advances within authored content and stops cleanly before unauthored Area 2', () => {
    expect(resolveNextWorldStageDefinition('area.clover-road', 4)?.stageNumber).toBe(5);
    expect(resolveNextWorldStageDefinition('area.clover-road', 5)).toBeNull();
  });

  it('initializes per-area save progress for the full registered world', () => {
    const state = createInitialSlimeMercenariesState(0, 81);
    expect(Object.keys(state.gameData.progression.areas)).toEqual([...AREA_IDS]);
    expect(Object.values(state.gameData.progression.areas).every((area) => area.highestStageCleared === 0)).toBe(true);
  });
});
