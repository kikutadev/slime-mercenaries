import { describe, expect, it } from 'vitest';
import { battleRewardParticleCount, battleRewardVisual, type BattleRewardItem } from './battle-reward';

describe('battle reward visuals', () => {
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

  it('keeps material particle counts bounded even for large rewards', () => {
    expect(battleRewardParticleCount({ kind: 'material', id: 'unknown', label: '素材', amount: 999 })).toBe(4);
  });
});
