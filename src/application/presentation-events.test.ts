import { describe, expect, it } from 'vitest';
import type { DomainEvent } from 'idle-game-kit';
import { buildOfflineReturnView, toPresentationNotices } from './presentation-events';

function event(type: string, payload?: Readonly<Record<string, unknown>>): DomainEvent {
  return { id: `${type}:1`, type, simTimeSec: 12, ...(payload === undefined ? {} : { payload }) };
}

describe('presentation event policy', () => {
  it('prioritizes new job discoveries over routine battle rewards', () => {
    const notices = toPresentationNotices([
      event('combatWaveCleared', { randomDrops: [] }),
      event('slimeJobDiscovered', { jobId: 'sword' }),
    ]);
    expect(notices).toHaveLength(2);
    expect(notices[1]?.title).toContain('剣士スライム');
    expect(notices[1]?.presentationPriority).toBeGreaterThan(notices[0]?.presentationPriority ?? 0);
  });

  it('coalesces stage-like progress through a stable presentation key', () => {
    const [notice] = toPresentationNotices([event('stageCleared', { stageNumber: 3 })]);
    expect(notice?.presentationCoalescingKey).toBe('stage-progress');
  });

  it('presents boss failure as a retreat rather than a progression stop', () => {
    const notices = toPresentationNotices([
      event('bossBlocked', { stageNumber: 5, retreatStageNumber: 4 }),
      event('combatRetreated', { bossStageNumber: 5, retreatStageNumber: 4 }),
    ]);
    expect(notices).toHaveLength(1);
    expect(notices[0]?.title).toBe('ボスに敗北');
    expect(notices[0]?.body).toContain('ステージ 4');
    expect(notices[0]?.tone).toBe('warning');
  });

  it('turns dispatch completion into a non-blocking reward notice', () => {
    const [notice] = toPresentationNotices([event('dispatchCompleted', { contractId: 'roadEscort' })]);
    expect(notice?.title).toBe('派遣帰還');
    expect(notice?.tone).toBe('reward');
  });
  it('keeps the reached boss stage in offline summary even when the party ends one stage back', () => {
    const summary = buildOfflineReturnView(600, [
      event('combatRetreated', { bossStageNumber: 5, retreatStageNumber: 4 }),
      event('combatRetreated', { bossStageNumber: 5, retreatStageNumber: 4 }),
    ], 4);
    expect(summary.furthestStage).toBe(5);
    expect(summary.bossRetreatCount).toBe(2);
  });

  it('aggregates offline progress into one summary instead of claim-by-claim UI', () => {
    const summary = buildOfflineReturnView(95, [
      event('combatWaveCleared', { randomDrops: [{ tokenId: 'gel', count: 2 }] }),
      event('stageCleared', { stageNumber: 1, nextStageNumber: 2 }),
      event('dispatchCompleted', { contractId: 'roadEscort' }),
    ], 2);
    expect(summary.elapsedLabel).toBe('1分 35秒');
    expect(summary.stageClearCount).toBe(1);
    expect(summary.dispatchCompletedCount).toBe(1);
    expect(summary.materialDropCount).toBe(2);
    expect(summary.furthestStage).toBe(2);
  });

});
