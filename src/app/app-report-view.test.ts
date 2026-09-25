import { describe, expect, it } from 'vitest';
import type { BattleActivityReport } from '../application/presentation-events';
import { battleActivityRewardLabel } from './app-report-view';

function report(rewards: BattleActivityReport['rewards']): BattleActivityReport {
  return {
    elapsedSec: 10,
    start: { areaId: 'area.clover-road', stageNumber: 1, waveIndex: 0 },
    current: { areaId: 'area.clover-road', stageNumber: 1, waveIndex: 1 },
    furthest: { areaId: 'area.clover-road', stageNumber: 1 },
    waveClearCount: 1,
    stageClearCount: 0,
    farmClearCount: 0,
    bossDefeatedCount: 0,
    defeatCount: 0,
    retryCount: 0,
    rewards,
  };
}

describe('app report view', () => {
  it('summarizes no-reward activity without an empty label', () => {
    expect(battleActivityRewardLabel(report([]))).toBe('戦闘進行のみ');
  });

  it('shows at most two rewards and counts the rest', () => {
    expect(battleActivityRewardLabel(report([
      { kind: 'gold', id: 'gold', label: 'G', amount: 1234 },
      { kind: 'material', id: 'gel', label: 'ジェル', amount: 4 },
      { kind: 'material', id: 'key', label: '鍵', amount: 1 },
    ]))).toBe('G +1,234 · ジェル +4 · ほか1種');
  });

  it('returns null when no report exists', () => {
    expect(battleActivityRewardLabel(null)).toBeNull();
  });
});
