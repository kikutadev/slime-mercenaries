import { describe, expect, it } from 'vitest';
import type { DomainEvent } from 'idle-game-kit';
import { battleActivityProgressLabel, battleActivityReportIsMeaningful, buildBattleActivityReport, buildOfflineReturnView, mergeBattleActivityReports, routePresentationEvents, toBattleRewardCue, toPresentationNotices } from './presentation-events';

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
  it('does not surface a trivial one-second away report without progress', () => {
    const report = buildBattleActivityReport({
      elapsedSec: 1,
      from: { areaId: 'area.clover-road', stageNumber: 2, waveIndex: 1 },
      to: { areaId: 'area.clover-road', stageNumber: 2, waveIndex: 1 },
      events: [],
    });

    expect(battleActivityReportIsMeaningful(report)).toBe(false);
    expect(battleActivityReportIsMeaningful({ ...report, elapsedSec: 5 })).toBe(true);
  });

  it('aggregates battle activity while the battle screen is away', () => {
    const first = buildBattleActivityReport({
      elapsedSec: 45,
      from: { areaId: 'area.clover-road', stageNumber: 2, waveIndex: 0 },
      to: { areaId: 'area.clover-road', stageNumber: 3, waveIndex: 1 },
      events: [
        event('combatWaveCleared', {
          stageNumber: 2,
          waveNumber: 1,
          grantedRewards: [
            { kind: 'currency', id: 'currency.gold', amount: 30 },
            { kind: 'token', id: 'token.material.slime-gel', amount: 2 },
          ],
        }),
        event('stageCleared', {
          stageNumber: 2,
          nextStageNumber: 3,
          farming: false,
          grantedRewards: [{ kind: 'currency', id: 'currency.gold', amount: 20 }],
        }),
      ],
    });
    const second = buildBattleActivityReport({
      elapsedSec: 30,
      from: { areaId: 'area.clover-road', stageNumber: 3, waveIndex: 1 },
      to: { areaId: 'area.clover-road', stageNumber: 2, waveIndex: 0 },
      events: [
        event('partyDefeated', { stageNumber: 3 }),
        event('stageRetreated', { failedStageNumber: 3, farmStageNumber: 2 }),
        event('stageCleared', { stageNumber: 2, nextStageNumber: 2, farming: true, grantedRewards: [] }),
      ],
    });
    const merged = mergeBattleActivityReports(first, second);

    expect(merged.elapsedSec).toBe(75);
    expect(merged.start).toEqual({ areaId: 'area.clover-road', stageNumber: 2, waveIndex: 0 });
    expect(merged.current).toEqual({ areaId: 'area.clover-road', stageNumber: 2, waveIndex: 0 });
    expect(merged.furthest).toEqual({ areaId: 'area.clover-road', stageNumber: 3 });
    expect(merged.waveClearCount).toBe(1);
    expect(merged.stageClearCount).toBe(1);
    expect(merged.farmClearCount).toBe(1);
    expect(merged.defeatCount).toBe(1);
    expect(merged.rewards).toEqual([
      { kind: 'gold', id: 'currency.gold', label: 'G', amount: 50 },
      { kind: 'material', id: 'token.material.slime-gel', label: 'スライムジェル', amount: 2 },
    ]);
    expect(battleActivityProgressLabel(merged)).toBe('最前線 クローバー街道 Stage 3 · 現在 クローバー街道 Stage 2');
  });

  it('aggregates offline progress into one summary instead of claim-by-claim UI', () => {
    const summary = buildOfflineReturnView(95, [
      event('combatWaveCleared', {
        randomDrops: [{ tokenId: 'gel', count: 2 }],
        grantedRewards: [
          { kind: 'currency', id: 'currency.gold', amount: 40 },
          { kind: 'token', id: 'token.material.slime-gel', amount: 2 },
        ],
      }),
      event('stageCleared', { areaId: 'area.clover-road', stageNumber: 1, nextAreaId: 'area.clover-road', nextStageNumber: 2 }),
      event('dispatchCompleted', { contractId: 'roadEscort' }),
      event('frontierBreakthroughDeferred', { areaId: 'area.clover-road', frontierStageNumber: 5, farmStageNumber: 4 }),
    ], { areaId: 'area.clover-road', stageNumber: 2 });
    expect(summary.elapsedLabel).toBe('1分 35秒');
    expect(summary.stageClearCount).toBe(1);
    expect(summary.dispatchCompletedCount).toBe(1);
    expect(summary.materialDropCount).toBe(2);
    expect(summary.furthest).toEqual({ areaId: 'area.clover-road', stageNumber: 5 });
    expect(summary.frontier).toEqual({ areaId: 'area.clover-road', stageNumber: 5 });
    expect(summary.battleRewards).toEqual([
      { kind: 'gold', id: 'currency.gold', label: 'G', amount: 40 },
      { kind: 'material', id: 'token.material.slime-gel', label: 'スライムジェル', amount: 2 },
    ]);
  });

  it('orders Area transitions as forward progress even when Stage 5 resets to Stage 1', () => {
    const report = buildBattleActivityReport({
      elapsedSec: 30,
      from: { areaId: 'area.clover-road', stageNumber: 5, waveIndex: 2 },
      to: { areaId: 'area.mushroom-forest', stageNumber: 1, waveIndex: 0 },
      events: [
        event('stageCleared', {
          areaId: 'area.clover-road',
          stageNumber: 5,
          nextAreaId: 'area.mushroom-forest',
          nextStageNumber: 1,
          farming: false,
        }),
        event('areaUnlocked', { areaId: 'area.mushroom-forest', stageNumber: 1 }),
      ],
    });

    expect(report.furthest).toEqual({ areaId: 'area.mushroom-forest', stageNumber: 1 });
    expect(battleActivityProgressLabel(report))
      .toBe('クローバー街道 Stage 5 → キノコの森 Stage 1');
  });

  it('keeps the true cross-Area frontier after an offline defeat and retreat', () => {
    const summary = buildOfflineReturnView(120, [
      event('stageCleared', {
        areaId: 'area.clover-road',
        stageNumber: 5,
        nextAreaId: 'area.mushroom-forest',
        nextStageNumber: 1,
      }),
      event('partyDefeated', {
        areaId: 'area.mushroom-forest',
        stageNumber: 3,
      }),
      event('stageRetreated', {
        areaId: 'area.mushroom-forest',
        failedStageNumber: 3,
        farmStageNumber: 2,
      }),
    ], { areaId: 'area.mushroom-forest', stageNumber: 2 });

    expect(summary.furthest).toEqual({ areaId: 'area.mushroom-forest', stageNumber: 3 });
    expect(summary.frontier).toEqual({ areaId: 'area.mushroom-forest', stageNumber: 3 });
  });

});
