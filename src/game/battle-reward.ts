export type BattleRewardKind = 'gold' | 'material';

export type BattleRewardItem = Readonly<{
  kind: BattleRewardKind;
  id: string;
  label: string;
  amount: number;
}>;

export type BattleRewardCue = Readonly<{
  id: string;
  items: readonly BattleRewardItem[];
}>;

export type BattleRewardVisual = Readonly<{
  shape: 'coin' | 'shard' | 'orb';
  color: string;
}>;

const MATERIAL_VISUALS: Readonly<Record<string, BattleRewardVisual>> = {
  'token.material.slime-gel': { shape: 'orb', color: '#8eea78' },
  'token.material.life-water': { shape: 'orb', color: '#7edcf0' },
  'token.fusion.hardening-gel': { shape: 'shard', color: '#77b9e8' },
  'token.forge-key': { shape: 'shard', color: '#f6d070' },
  'token.promotion.common': { shape: 'shard', color: '#d8b1f4' },
  'token.fusion.greatsword-blank': { shape: 'shard', color: '#b6c2cf' },
  'token.fusion.reinforced-bow': { shape: 'shard', color: '#d49a63' },
  'token.fusion.tempered-steel': { shape: 'shard', color: '#c7d1dd' },
  'token.job-gear.training-sword': { shape: 'shard', color: '#d7c3a6' },
  'token.job-gear.training-bow': { shape: 'shard', color: '#bd9b72' },
};

export function battleRewardVisual(item: BattleRewardItem): BattleRewardVisual {
  if (item.kind === 'gold') return { shape: 'coin', color: '#ffd45e' };
  return MATERIAL_VISUALS[item.id] ?? { shape: 'shard', color: '#a9df9b' };
}

export function battleRewardParticleCount(item: BattleRewardItem): number {
  if (item.kind === 'gold') return Math.max(3, Math.min(7, 3 + Math.floor(Math.log10(Math.max(1, item.amount)))));
  return Math.max(1, Math.min(4, Math.ceil(item.amount)));
}
