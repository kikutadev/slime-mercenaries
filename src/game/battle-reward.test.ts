import { describe, expect, it } from 'vitest';
import { battleRewardCueMatchesEncounter, battleRewardParticleCount, battleRewardVisual, type BattleRewardCue, type BattleRewardItem } from './battle-reward';

describe('battle reward visuals', () => {
  it('matches reward cues only to their authoritative visual encounter', () => {
    const waveCue: BattleRewardCue = {
      id: 'wave',
      importance: 'normal',
      target: { kind: 'wave', areaId: 'area.clover-road', stageNumber: 3, waveIndex: 1 },
      items: [],
    };
    const bossCue: BattleRewardCue = {
      id: 'boss',
      importance: 'boss',
      target: { kind: 'boss', areaId: 'area.clover-road', stageNumber: 5 },
      items: [],
    };

    expect(battleRewardCueMatchesEncounter(waveCue, 'area.clover-road', 3, 1, false)).toBe(true);
    expect(battleRewardCueMatchesEncounter(waveCue, 'area.clover-road', 3, 2, false)).toBe(false);
    expect(battleRewardCueMatchesEncounter(waveCue, 'area.mushroom-forest', 3, 1, false)).toBe(false);
    expect(battleRewardCueMatchesEncounter(bossCue, 'area.clover-road', 5, 3, true)).toBe(true);
    expect(battleRewardCueMatchesEncounter(bossCue, 'area.clover-road', 5, 3, false)).toBe(false);
  });

  it('uses a coin presentation for Gold and caps particle density', () => {
    const item: BattleRewardItem = { kind: 'gold', id: 'currency.gold', label: 'G', amount: 999_999 };
    expect(battleRewardVisual(item).shape).toBe('coin');
    expect(battleRewardParticleCount(item)).toBeLessThanOrEqual(7);
    expect(battleRewardParticleCount(item)).toBeGreaterThanOrEqual(3);
  });

  it('gives known materials stable distinct visual families', () => {
    const gel = battleRewardVisual({ kind: 'material', id: 'token.material.slime-gel', label: 'スライムジェル', amount: 1 });
    const water = battleRewardVisual({ kind: 'material', id: 'token.material.life-water', label: '生命の水', amount: 1 });
    expect(gel.shape).toBe('orb');
    expect(water.shape).toBe('orb');
    expect(gel.color).not.toBe(water.color);
  });

  it('gives boss rewards a stronger but still bounded particle treatment', () => {
    const item: BattleRewardItem = { kind: 'gold', id: 'currency.gold', label: 'G', amount: 500 };
    expect(battleRewardParticleCount(item, 'boss')).toBeGreaterThan(battleRewardParticleCount(item, 'normal'));
    expect(battleRewardParticleCount(item, 'boss')).toBeLessThanOrEqual(9);
  });

  it('keeps material particle counts bounded even for large rewards', () => {
    expect(battleRewardParticleCount({ kind: 'material', id: 'unknown', label: '素材', amount: 999 })).toBe(4);
  });
});
