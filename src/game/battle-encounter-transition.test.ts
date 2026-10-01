import { describe, expect, it } from 'vitest';
import { shouldRecoverPartyForEncounter } from './battle-encounter-transition';

describe('battle encounter party recovery', () => {
  it('preserves damage only when advancing to a later wave in the same stage', () => {
    expect(shouldRecoverPartyForEncounter(
      { areaId: 'area.clover-road', stageNumber: 2, waveIndex: 0 },
      { areaId: 'area.clover-road', stageNumber: 2, waveIndex: 1 },
    )).toBe(false);
  });

  it('fully recovers when a cleared stage advances to the next stage', () => {
    expect(shouldRecoverPartyForEncounter(
      { areaId: 'area.clover-road', stageNumber: 2, waveIndex: 2 },
      { areaId: 'area.clover-road', stageNumber: 3, waveIndex: 0 },
    )).toBe(true);
  });

  it('fully recovers for a completed farm-stage loop even when the stage number is unchanged', () => {
    expect(shouldRecoverPartyForEncounter(
      { areaId: 'area.clover-road', stageNumber: 4, waveIndex: 2 },
      { areaId: 'area.clover-road', stageNumber: 4, waveIndex: 0 },
    )).toBe(true);
  });

  it('fully recovers on explicit restart or retry', () => {
    expect(shouldRecoverPartyForEncounter(
      { areaId: 'area.clover-road', stageNumber: 1, waveIndex: 0 },
      { areaId: 'area.clover-road', stageNumber: 1, waveIndex: 0 },
      true,
    )).toBe(true);
  });
});
