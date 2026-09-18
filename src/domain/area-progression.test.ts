import { describe, expect, it } from 'vitest';
import {
  WORLD_AREA_IDS,
  areaDefinitions,
  resolveAreaAdvance,
  type AreaDefinition,
  type AreaId,
  type StageDefinition,
} from './definitions';

function stage(areaId: string, stageNumber: number): StageDefinition {
  return {
    id: `stage.${areaId}.${stageNumber}`,
    areaId,
    stageNumber,
    waves: [],
    clearRewards: [],
  };
}

describe('sequential world-area progression', () => {
  it('registers the authored eight-area horizon in strict order', () => {
    expect(WORLD_AREA_IDS).toHaveLength(8);
    expect(WORLD_AREA_IDS.map((id) => areaDefinitions[id].order)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(areaDefinitions['area.clover-road'].nextAreaId).toBe('area.mushroom-forest');
    expect(areaDefinitions['area.dragon-crater'].nextAreaId).toBeNull();
  });

  it('resolves same-area advance before considering the next area', () => {
    const catalog: Partial<Record<AreaId, AreaDefinition>> = {
      'area.clover-road': {
        id: 'area.clover-road',
        order: 1,
        displayName: 'A',
        nextAreaId: 'area.mushroom-forest',
        stages: [stage('area.clover-road', 1), stage('area.clover-road', 2)],
      },
      'area.mushroom-forest': {
        id: 'area.mushroom-forest',
        order: 2,
        displayName: 'B',
        nextAreaId: null,
        stages: [stage('area.mushroom-forest', 1)],
      },
    };
    const resolution = resolveAreaAdvance('area.clover-road', 1, catalog);
    expect(resolution.kind).toBe('stage');
    if (resolution.kind !== 'stage') return;
    expect(resolution.area.id).toBe('area.clover-road');
    expect(resolution.stage.stageNumber).toBe(2);
  });

  it('moves to stage 1 of the immediate next area and never skips an empty authored area', () => {
    const playable: Partial<Record<AreaId, AreaDefinition>> = {
      'area.clover-road': {
        id: 'area.clover-road',
        order: 1,
        displayName: 'A',
        nextAreaId: 'area.mushroom-forest',
        stages: [stage('area.clover-road', 1)],
      },
      'area.mushroom-forest': {
        id: 'area.mushroom-forest',
        order: 2,
        displayName: 'B',
        nextAreaId: 'area.amber-mine',
        stages: [stage('area.mushroom-forest', 1)],
      },
      'area.amber-mine': {
        id: 'area.amber-mine',
        order: 3,
        displayName: 'C',
        nextAreaId: null,
        stages: [stage('area.amber-mine', 1)],
      },
    };
    const transitioned = resolveAreaAdvance('area.clover-road', 1, playable);
    expect(transitioned.kind).toBe('area');
    if (transitioned.kind !== 'area') return;
    expect(transitioned.area.id).toBe('area.mushroom-forest');
    expect(transitioned.stage.stageNumber).toBe(1);

    const blocked: Partial<Record<AreaId, AreaDefinition>> = {
      ...playable,
      'area.mushroom-forest': { ...playable['area.mushroom-forest']!, stages: [] },
    };
    expect(resolveAreaAdvance('area.clover-road', 1, blocked)).toEqual({ kind: 'boundary' });
  });
});
