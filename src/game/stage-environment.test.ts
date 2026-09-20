import * as THREE from 'three';
import { describe, expect, it } from 'vitest';

import {
  ENVIRONMENT_AREA_IDS,
  createStageEnvironment,
  getEnvironmentAreaMetadata,
  getStageEnvironmentDefinition,
  placementIntrudesCombatClearZone,
  resolveStageSceneryZ,
} from './stage-environment';

describe('stage environment production catalog', () => {
  it('authors five distinct stage signatures for every planned area', () => {
    for (const areaId of ENVIRONMENT_AREA_IDS) {
      const stages = [1, 2, 3, 4, 5].map((stage) => getStageEnvironmentDefinition(areaId, stage)!);
      expect(stages.every((stage) => stage.areaId === areaId)).toBe(true);
      expect(new Set(stages.map((stage) => stage.stageName)).size).toBe(5);
      expect(new Set(stages.map((stage) => stage.groundColor)).size).toBe(5);

      const signatures = stages.map((stage) => stage.placements
        .map((placement) => `${placement.node}:${placement.x}:${placement.z}:${placement.scale}`)
        .join('|'));
      expect(new Set(signatures).size).toBe(5);
    }
  });

  it('reserves exactly one area landmark for stage 5', () => {
    for (const areaId of ENVIRONMENT_AREA_IDS) {
      for (const stageNumber of [1, 2, 3, 4]) {
        const stage = getStageEnvironmentDefinition(areaId, stageNumber)!;
        expect(stage.placements.filter((placement) => placement.node.startsWith('Landmark_'))).toHaveLength(0);
      }
      const bossStage = getStageEnvironmentDefinition(areaId, 5)!;
      expect(bossStage.placements.filter((placement) => placement.node.startsWith('Landmark_'))).toHaveLength(1);
    }
  });

  it('keeps every authored near/mid prop outside the central combat clear zone', () => {
    for (const areaId of ENVIRONMENT_AREA_IDS) {
      for (const stageNumber of [1, 2, 3, 4, 5]) {
        const stage = getStageEnvironmentDefinition(areaId, stageNumber)!;
        expect(stage.placements.filter(placementIntrudesCombatClearZone)).toEqual([]);
      }
    }
  });

  it('clamps stage selection while keeping area metadata stable', () => {
    for (const areaId of ENVIRONMENT_AREA_IDS) {
      expect(getStageEnvironmentDefinition(areaId, -20)?.stageNumber).toBe(1);
      expect(getStageEnvironmentDefinition(areaId, Number.NaN)?.stageNumber).toBe(1);
      expect(getStageEnvironmentDefinition(areaId, 999)?.stageNumber).toBe(5);
      expect(getEnvironmentAreaMetadata(areaId)?.stageNames).toHaveLength(5);
    }
    expect(getStageEnvironmentDefinition('area.unreleased', 1)).toBeNull();
    expect(getEnvironmentAreaMetadata('area.unreleased')).toBeNull();
  });

  it('keeps long victory-march travel bounded and parallax-layer-specific', () => {
    for (const layer of ['near', 'mid', 'far'] as const) {
      for (const distance of [0, 10, 1000, 100_000]) {
        const z = resolveStageSceneryZ(-4.2, layer, 3, distance);
        expect(Number.isFinite(z)).toBe(true);
        if (layer === 'far') {
          expect(z).toBeGreaterThanOrEqual(-14.5);
          expect(z).toBeLessThanOrEqual(5.5);
        } else {
          expect(z).toBeGreaterThanOrEqual(-10.8);
          expect(z).toBeLessThanOrEqual(4.8);
        }
      }
    }
    const nearStep = resolveStageSceneryZ(-4, 'near', 0, 1) - resolveStageSceneryZ(-4, 'near', 0, 0);
    const farStep = resolveStageSceneryZ(-4, 'far', 0, 1) - resolveStageSceneryZ(-4, 'far', 0, 0);
    expect(Math.abs(farStep)).toBeLessThan(Math.abs(nearStep));
  });

  it('fails fast before asset loading for unauthored areas', async () => {
    await expect(createStageEnvironment(new THREE.Scene(), '/', 'area.unreleased', 1, 0))
      .rejects.toThrow('No stage environment authored for area.unreleased');
  });
});
