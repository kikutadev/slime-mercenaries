import { describe, expect, it } from 'vitest';

import {
  AREA_IDS,
  WORLD_STAGE_COUNT,
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

  it('authors five playable stages for every area', () => {
    expect(WORLD_STAGE_COUNT).toBe(40);
    for (const areaId of AREA_IDS) {
      const area = areaDefinitions[areaId];
      expect(area.stages).toHaveLength(5);
      expect(area.stages.map((stage) => stage.stageNumber)).toEqual([1, 2, 3, 4, 5]);
      expect(area.stages.every((stage) => stage.areaId === areaId)).toBe(true);
      expect(area.stages.every((stage) => stage.waves.length === 3)).toBe(true);
    }
  });

  it('resolves sequential area order through the whole authored world', () => {
    expect(resolveNextAreaDefinition('area.clover-road')?.id).toBe('area.mushroom-forest');
    expect(resolveNextAreaDefinition('area.dragon-crater')).toBeNull();
    expect(resolveNextAreaDefinition('area.unknown')).toBeNull();

    for (let index = 0; index < AREA_IDS.length - 1; index += 1) {
      const current = AREA_IDS[index]!;
      const next = AREA_IDS[index + 1]!;
      const stage = resolveNextWorldStageDefinition(current, 5);
      expect(stage?.areaId).toBe(next);
      expect(stage?.stageNumber).toBe(1);
    }
    expect(resolveNextWorldStageDefinition('area.dragon-crater', 5)).toBeNull();
  });

  it('initializes per-area save progress for the full registered world', () => {
    const state = createInitialSlimeMercenariesState(0, 81);
    expect(Object.keys(state.gameData.progression.areas)).toEqual([...AREA_IDS]);
    expect(Object.values(state.gameData.progression.areas).every((area) => area.highestStageCleared === 0)).toBe(true);
  });
});
