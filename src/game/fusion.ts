import type { RosterState, SlimeId, SlimeProgress } from './slimes';

export interface FusionStep {
  rank: number;
  requiredCopies: number;
  title: string;
  description: string;
  attackHits?: number;
}

const SWORD_STEPS: FusionStep[] = [
  { rank: 1, requiredCopies: 1, title: '二連斬り', description: '通常攻撃が2回斬りになる', attackHits: 2 },
  { rank: 2, requiredCopies: 2, title: '強い斬撃軌跡', description: '2撃目の斬撃とimpactが強化される', attackHits: 2 },
  { rank: 3, requiredCopies: 3, title: '連撃強化', description: '斬撃のテンポと威力がさらに上がる', attackHits: 3 },
];

const BOW_STEPS: FusionStep[] = [
  { rank: 1, requiredCopies: 1, title: '連射', description: '短い間隔で2本目の矢を放つ' },
  { rank: 2, requiredCopies: 2, title: '鋭い矢', description: '着弾impactが強化される' },
  { rank: 3, requiredCopies: 3, title: '三連射', description: '一度の攻撃で複数の矢を放つ' },
];

const STEPS: Record<SlimeId, FusionStep[]> = {
  sword: SWORD_STEPS,
  bow: BOW_STEPS,
};

export function getNextFusionStep(slime: SlimeProgress): FusionStep | null {
  return STEPS[slime.id][slime.fusionRank - 1] ?? null;
}

export function canFuse(slime: SlimeProgress): boolean {
  const next = getNextFusionStep(slime);
  return Boolean(next && slime.fusionProgress >= next.requiredCopies);
}

export function fuseSlime(state: RosterState, id: SlimeId): RosterState {
  const current = state.slimes[id];
  const next = getNextFusionStep(current);
  if (!next || current.fusionProgress < next.requiredCopies) {
    return state;
  }

  return {
    ...state,
    slimes: {
      ...state.slimes,
      [id]: {
        ...current,
        fusionRank: current.fusionRank + 1,
        fusionProgress: current.fusionProgress - next.requiredCopies,
      },
    },
  };
}

export function getSwordAttackHits(rank: number): number {
  if (rank >= 4) return 3;
  if (rank >= 2) return 2;
  return 1;
}
