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


  it('presents frontier defeat, retreat farming, and automatic retry without a game-over stop', () => {
    const notices = toPresentationNotices([
      event('partyDefeated', { stageNumber: 5 }),
      event('stageRetreated', { failedStageNumber: 5, farmStageNumber: 4, retryFarmClears: 3 }),
      event('frontierRetryStarted', { stageNumber: 5 }),
    ]);

    expect(notices.map((notice) => notice.title)).toEqual([
      '敗北 · 撤退',
      'ステージ 4 へ撤退',
      '最前線へ再出撃',
    ]);
    expect(notices.some((notice) => notice.title.includes('進行停止'))).toBe(false);
  });

  it('labels retreat-stage clears as farming rather than false forward progression', () => {
    const [notice] = toPresentationNotices([
      event('stageCleared', { stageNumber: 4, nextStageNumber: 4, farming: true, retryFarmClearsRemaining: 2 }),
    ]);
    expect(notice?.title).toBe('ステージ 4 周回完了');
    expect(notice?.body).toContain('再編成');
  });

  it('presents explicit spare-body Core conversion using the current event contract', () => {
    const [notice] = toPresentationNotices([event('slimeConvertedToFusionCore', { typeId: 'sword', slimeId: 'slime.2' })]);
    expect(notice?.title).toBe('剣士スライムの核');
    expect(notice?.body).toContain('控え');
  });

  it('presents mutation reveal as a high-priority milestone', () => {
    const [notice] = toPresentationNotices([event('slimeMutated', { mutationId: 'golden', slimeId: 'slime.1' })]);
    expect(notice?.title).toBe('変異発生 · ゴールデンスライム');
    expect(notice?.presentationPriority).toBe(95);
  });

  it('turns dispatch completion into a non-blocking reward notice', () => {
    const [notice] = toPresentationNotices([event('dispatchCompleted', { contractId: 'roadEscort' })]);
    expect(notice?.title).toBe('派遣帰還');
    expect(notice?.tone).toBe('reward');
  });
  it('aggregates offline progress into one summary instead of claim-by-claim UI', () => {
    const summary = buildOfflineReturnView(95, [
      event('combatWaveCleared', { randomDrops: [{ tokenId: 'gel', count: 2 }] }),
      event('stageCleared', { stageNumber: 1, nextStageNumber: 2 }),
      event('dispatchCompleted', { contractId: 'roadEscort' }),
      event('frontierBreakthroughDeferred', { frontierStageNumber: 5, farmStageNumber: 4 }),
    ], 2);
    expect(summary.elapsedLabel).toBe('1分 35秒');
    expect(summary.stageClearCount).toBe(1);
    expect(summary.dispatchCompletedCount).toBe(1);
    expect(summary.materialDropCount).toBe(2);
    expect(summary.furthestStage).toBe(2);
    expect(summary.frontierStageReached).toBe(5);
  });

  it('presents sequential area unlock as a milestone', () => {
    const [notice] = toPresentationNotices([event('areaUnlocked', { areaId: 'area.mushroom-forest', areaOrder: 2 })]);
    expect(notice?.title).toBe('新エリア解放');
    expect(notice?.presentationPriority).toBe(88);
  });

});
