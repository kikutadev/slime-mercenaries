import { describe, expect, it } from 'vitest';
import type { BattleSceneModel } from '../../application/selectors/battle-scene';
import type { BattleRewardCue } from '../../game/battle-reward';
import {
  battleStatusText,
  clampBattleRatio,
  didBattleStageAdvance,
  visibleBattleRewardCue,
} from './battle-screen-view';

const scene = (overrides: Partial<BattleSceneModel> = {}): BattleSceneModel => ({
  areaId: 'area.clover-road',
  encounterKey: 'encounter-1',
  runtimeKey: 'runtime-1',
  visualKey: 'visual-1',
  stageNumber: 3,
  waveIndex: 1,
  encounter: { id: 'enemy', displayName: 'Enemy', boss: false, enemies: [] } as BattleSceneModel['encounter'],
  isStageFinalEncounter: false,
  shouldCelebrateVictory: false,
  allies: [],
  ...overrides,
});

describe('battle screen view helpers', () => {
  it('prioritizes result and retry status over routine runtime labels', () => {
    expect(battleStatusText({
      battle: { label: '攻撃中', result: 'defeat' },
      hasEncounter: true,
      contentBoundaryReached: false,
      retryFarmClearsRemaining: 0,
      activeCount: 3,
      sceneModel: scene(),
    })).toBe('敗北 · 戦線を立て直します');

    expect(battleStatusText({
      battle: { label: '攻撃中', result: null },
      hasEncounter: true,
      contentBoundaryReached: false,
      retryFarmClearsRemaining: 2,
      activeCount: 3,
      sceneModel: scene(),
    })).toBe('再編成中 · ステージ3 · 再出撃まであと2周');
  });

  it('distinguishes stage clear from intermediate-wave victory', () => {
    expect(battleStatusText({
      battle: { label: 'result', result: 'victory' },
      hasEncounter: true,
      contentBoundaryReached: false,
      retryFarmClearsRemaining: 0,
      activeCount: 3,
      sceneModel: scene({ shouldCelebrateVictory: true }),
    })).toBe('ステージクリア');

    expect(battleStatusText({
      battle: { label: 'result', result: 'victory' },
      hasEncounter: true,
      contentBoundaryReached: false,
      retryFarmClearsRemaining: 0,
      activeCount: 3,
      sceneModel: scene({ shouldCelebrateVictory: false }),
    })).toBe('敵部隊を突破 · 次のウェーブへ');
  });

  it('clamps hp ratios to a stable UI range', () => {
    expect(clampBattleRatio(50, 100)).toBe(0.5);
    expect(clampBattleRatio(-1, 100)).toBe(0);
    expect(clampBattleRatio(150, 100)).toBe(1);
    expect(clampBattleRatio(10, 0)).toBe(0);
  });

  it('only exposes matching reward cues after victory', () => {
    const cue: BattleRewardCue = {
      id: 'reward-1',
      importance: 'normal',
      target: { kind: 'wave', areaId: 'area.clover-road', stageNumber: 3, waveIndex: 1 },
      items: [],
    };
    expect(visibleBattleRewardCue([cue], null, scene())).toBeNull();
    expect(visibleBattleRewardCue([cue], 'victory', scene())?.id).toBe('reward-1');
    expect(visibleBattleRewardCue([cue], 'victory', scene({ waveIndex: 2 }))).toBeNull();
  });

  it('treats area changes or higher stages as arrival transitions', () => {
    expect(didBattleStageAdvance(scene({ stageNumber: 3 }), scene({ stageNumber: 4 }))).toBe(true);
    expect(didBattleStageAdvance(scene({ areaId: 'a' }), scene({ areaId: 'b' }))).toBe(true);
    expect(didBattleStageAdvance(scene({ stageNumber: 3 }), scene({ stageNumber: 2 }))).toBe(false);
  });
});
