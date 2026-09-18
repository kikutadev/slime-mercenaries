import { describe, expect, it } from 'vitest';
import {
  WORLD_AREA_IDS,
  areaDefinitions,
  resolveAreaAdvance,
  type AreaDefinition,
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
    const catalog: Record<string, AreaDefinition> = {
      a: { id: 'a', order: 1, displayName: 'A', nextAreaId: 'b', stages: [stage('a', 1), stage('a', 2)] },
      b: { id: 'b', order: 2, displayName: 'B', nextAreaId: null, stages: [stage('b', 1)] },
    };
    const resolution = resolveAreaAdvance('a', 1, catalog);
    expect(resolution.kind).toBe('stage');
    if (resolution.kind !== 'stage') return;
    expect(resolution.area.id).toBe('a');
    expect(resolution.stage.stageNumber).toBe(2);
  });

  it('moves to stage 1 of the immediate next area and never skips an empty authored area', () => {
    const playable: Record<string, AreaDefinition> = {
      a: { id: 'a', order: 1, displayName: 'A', nextAreaId: 'b', stages: [stage('a', 1)] },
      b: { id: 'b', order: 2, displayName: 'B', nextAreaId: 'c', stages: [stage('b', 1)] },
      c: { id: 'c', order: 3, displayName: 'C', nextAreaId: null, stages: [stage('c', 1)] },
    };
    const transitioned = resolveAreaAdvance('a', 1, playable);
    expect(transitioned.kind).toBe('area');
    if (transitioned.kind !== 'area') return;
    expect(transitioned.area.id).toBe('b');
    expect(transitioned.stage.stageNumber).toBe(1);

    const blocked: Record<string, AreaDefinition> = {
      ...playable,
      b: { ...playable.b!, stages: [] },
    };
    expect(resolveAreaAdvance('a', 1, blocked)).toEqual({ kind: 'boundary' });
  });
});
