import type { RosterState, SlimeId, SlimeProgress } from './slimes';

export interface FusionStep {
  rank: number;
  requiredCopies: number;
  minLevel: number;
  title: string;
  description: string;
  resultName?: string;
  attackHits?: number;
}

const SWORD_STEPS: FusionStep[] = [
  {
    rank: 1,
    requiredCopies: 1,
    minLevel: 10,
    title: '大剣士へ合成',
    description: '2体の剣士スライムが融合し、大剣と二連斬りを使う上位形態になる',
    resultName: 'Greatsword Slime',
    attackHits: 2,
  },
  { rank: 2, requiredCopies: 2, minLevel: 18, title: '重撃強化', description: '2撃目の斬撃とimpactがさらに強くなる', attackHits: 2 },
  { rank: 3, requiredCopies: 3, minLevel: 28, title: '三連重斬', description: '大剣を振り切る3連撃へ強化される', attackHits: 3 },
];

const BOW_STEPS: FusionStep[] = [
  { rank: 1, requiredCopies: 1, minLevel: 10, title: '連射', description: '短い間隔で2本目の矢を放つ' },
  { rank: 2, requiredCopies: 2, minLevel: 18, title: '鋭い矢', description: '着弾impactが強化される' },
  { rank: 3, requiredCopies: 3, minLevel: 28, title: '三連射', description: '一度の攻撃で複数の矢を放つ' },
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
  return Boolean(
    next
      && slime.level >= next.minLevel
      && slime.fusionProgress >= next.requiredCopies,
  );
}

export function fuseSlime(state: RosterState, id: SlimeId): RosterState {
  const current = state.slimes[id];
  const next = getNextFusionStep(current);
  if (!next || current.level < next.minLevel || current.fusionProgress < next.requiredCopies) {
    return state;
  }

  const nextRank = current.fusionRank + 1;
  return {
    ...state,
    slimes: {
      ...state.slimes,
      [id]: {
        ...current,
        fusionRank: nextRank,
        fusionProgress: current.fusionProgress - next.requiredCopies,
        equippedWeapon: id === 'sword' && nextRank >= 2 ? 'Mercenary Greatsword' : current.equippedWeapon,
      },
    },
  };
}

export function getSwordAttackHits(rank: number): number {
  if (rank >= 4) return 3;
  if (rank >= 2) return 2;
  return 1;
}
