import { describe, expect, it } from 'vitest';
import type { DomainEvent } from 'idle-game-kit';
import { buildOfflineReturnView, routePresentationEvents, toBattleRewardCue, toPresentationNotices } from './presentation-events';

function event(type: string, payload?: Readonly<Record<string, unknown>>): DomainEvent {
  return { id: `${type}:1`, type, simTimeSec: 12, ...(payload === undefined ? {} : { payload }) };
}

describe('presentation event policy', () => {

  it('routes routine battle rewards to one surface when battle is visible', () => {
    const batch = [
      event('combatWaveCleared', {
        stageNumber: 1,
        waveNumber: 1,
        grantedRewards: [{ kind: 'currency', id: 'currency.gold', amount: 12 }],
      }),
    ];

    const inBattle = routePresentationEvents(batch, true);
    expect(inBattle.battleRewardCue?.items[0]?.amount).toBe(12);
    expect(inBattle.notices.some((notice) =>
      notice.presentationCoalescingKey === 'combat-reward')).toBe(false);

    const outsideBattle = routePresentationEvents(batch, false);
    expect(outsideBattle.battleRewardCue).toBeNull();
    expect(outsideBattle.notices.some((notice) =>
      notice.presentationCoalescingKey === 'combat-reward')).toBe(true);
  });

  it('keeps milestone notices while routing a battle reward receipt', () => {
    const routed = routePresentationEvents([
      event('bossDefeated', {
        stageNumber: 5,
        grantedRewards: [{ kind: 'currency', id: 'currency.gold', amount: 80 }],
      }),
    ], true);

    expect(routed.battleRewardCue?.importance).toBe('boss');
    expect(routed.notices.some((notice) => notice.title === 'ボス撃破')).toBe(true);
  });

  it('aggregates authoritative combat rewards into one battle cue', () => {
    const cue = toBattleRewardCue([
      event('combatWaveCleared', {
        stageNumber: 2,
        waveNumber: 3,
        grantedRewards: [
          { kind: 'currency', id: 'currency.gold', amount: 12 },
          { kind: 'token', id: 'token.material.slime-gel', amount: 1 },
        ],
      }),
      event('stageCleared', {
        grantedRewards: [
          { kind: 'token', id: 'token.material.slime-gel', amount: 2 },
          { kind: 'token', id: 'token.material.life-water', amount: 1 },
        ],
      }),
    ]);

    expect(cue).not.toBeNull();
    expect(cue?.target).toEqual({ kind: 'wave', stageNumber: 2, waveIndex: 2 });
    expect(cue?.items).toEqual([
      { kind: 'gold', id: 'currency.gold', label: 'G', amount: 12 },
      { kind: 'material', id: 'token.material.slime-gel', label: 'スライムジェル', amount: 3 },
      { kind: 'material', id: 'token.material.life-water', label: '生命の水', amount: 1 },
    ]);
  });

  it('projects mutation progress rewards into the authoritative battle receipt', () => {
    const cue = toBattleRewardCue([
      event('stageCleared', {
        grantedRewards: [
          { kind: 'mutation-fragment', id: 'king', amount: 3 },
          { kind: 'mutation-catalyst', id: 'prism', amount: 1 },
        ],
      }),
    ]);

    expect(cue?.items).toEqual([
      { kind: 'material', id: 'mutation-fragment:king', label: 'キングスライムの欠片', amount: 3 },
      { kind: 'material', id: 'mutation-catalyst:prism', label: 'プリズムスライムの核', amount: 1 },
    ]);
  });

  it('marks a reward cue as boss-grade when boss defeat contributed', () => {
    const cue = toBattleRewardCue([
      event('bossDefeated', { stageNumber: 5, grantedRewards: [{ kind: 'currency', id: 'currency.gold', amount: 80 }] }),
      event('stageCleared', { grantedRewards: [{ kind: 'token', id: 'token.material.life-water', amount: 1 }] }),
    ]);
    expect(cue?.importance).toBe('boss');
    expect(cue?.target).toEqual({ kind: 'boss', stageNumber: 5 });
    expect(cue?.items).toHaveLength(2);
  });

  it('ignores malformed or unrelated event reward payloads', () => {
    expect(toBattleRewardCue([
      event('dispatchCompleted', { grantedRewards: [{ kind: 'currency', id: 'currency.gold', amount: 10 }] }),
      event('combatWaveCleared', { grantedRewards: [{ kind: 'token', id: 'x', amount: 0 }] }),
    ])).toBeNull();
  });

  it('uses authoritative reward amounts in routine wave notices', () => {
    const [notice] = toPresentationNotices([
      event('combatWaveCleared', {
        grantedRewards: [
          { kind: 'currency', id: 'currency.gold', amount: 24 },
          { kind: 'token', id: 'token.material.slime-gel', amount: 2 },
        ],
      }),
    ]);
    expect(notice?.body).toBe('G +24 · スライムジェル +2');
  });

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

  it('presents a completed rare mutation as a high-priority milestone', () => {
    const [notice] = toPresentationNotices([event('slimeMutated', { slimeId: 'slime.7', mutationId: 'prism' })]);
    expect(notice?.title).toBe('変異完了 · プリズムスライム');
    expect(notice?.tone).toBe('milestone');
    expect(notice?.presentationPriority).toBeGreaterThanOrEqual(90);
    expect(notice?.presentationCoalescingKey).toBe('slime-mutation');
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

});
