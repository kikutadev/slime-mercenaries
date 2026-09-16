import type { FusionItemId, RosterState, SlimeId, SlimeProgress } from './slimes';

export interface FusionRequirement {
  itemId: FusionItemId;
  amount: number;
}

export interface FusionStep {
  rank: number;
  minLevel: number;
  title: string;
  description: string;
  resultName?: string;
  recipe: FusionRequirement[];
}

const SWORD_STEPS: FusionStep[] = [
  {
    rank: 1,
    minLevel: 10,
    title: '大剣士へ合成',
    description: '大剣を軸に身体ごと一回転し、周囲の敵を薙ぎ払う上位形態になる',
    resultName: 'Greatsword Slime',
    recipe: [
      { itemId: 'sword-core', amount: 1 },
      { itemId: 'greatsword-blank', amount: 1 },
      { itemId: 'hardening-gel', amount: 2 },
    ],
  },
  {
    rank: 2,
    minLevel: 18,
    title: '重撃強化',
    description: '回転薙ぎの範囲とimpactがさらに強くなる',
    recipe: [
      { itemId: 'sword-core', amount: 2 },
      { itemId: 'tempered-steel', amount: 2 },
      { itemId: 'hardening-gel', amount: 3 },
    ],
  },
  {
    rank: 3,
    minLevel: 28,
    title: '旋風大斬',
    description: '回転斬りの余波が広がり、さらに広い範囲を巻き込む',
    recipe: [
      { itemId: 'sword-core', amount: 3 },
      { itemId: 'tempered-steel', amount: 4 },
      { itemId: 'hardening-gel', amount: 5 },
    ],
  },
];

const BOW_STEPS: FusionStep[] = [
  {
    rank: 1,
    minLevel: 10,
    title: '連射型へ合成',
    description: '弓士の核と強化弓を組み合わせ、短い間隔で追撃する形態になる',
    recipe: [
      { itemId: 'bow-core', amount: 1 },
      { itemId: 'reinforced-bow', amount: 1 },
      { itemId: 'hardening-gel', amount: 1 },
    ],
  },
  {
    rank: 2,
    minLevel: 18,
    title: '鋭い矢',
    description: '着弾impactと貫通性能を強化する',
    recipe: [
      { itemId: 'bow-core', amount: 2 },
      { itemId: 'tempered-steel', amount: 1 },
      { itemId: 'hardening-gel', amount: 2 },
    ],
  },
  {
    rank: 3,
    minLevel: 28,
    title: '三連射',
    description: '一度の攻撃で複数の矢を放つ',
    recipe: [
      { itemId: 'bow-core', amount: 3 },
      { itemId: 'tempered-steel', amount: 2 },
      { itemId: 'hardening-gel', amount: 4 },
    ],
  },
];

const STEPS: Record<SlimeId, FusionStep[]> = {
  sword: SWORD_STEPS,
  bow: BOW_STEPS,
};

export function getNextFusionStep(slime: SlimeProgress): FusionStep | null {
  return STEPS[slime.id][slime.fusionRank - 1] ?? null;
}

export function getFusionRequirementCount(state: RosterState, requirement: FusionRequirement): number {
  return state.inventory[requirement.itemId] ?? 0;
}

export function getMissingFusionRequirements(state: RosterState, id: SlimeId): FusionRequirement[] {
  const slime = state.slimes[id];
  const next = getNextFusionStep(slime);
  if (!next) return [];
  return next.recipe.filter((requirement) => getFusionRequirementCount(state, requirement) < requirement.amount);
}

export function canFuse(state: RosterState, id: SlimeId): boolean {
  const slime = state.slimes[id];
  const next = getNextFusionStep(slime);
  return Boolean(
    next
      && slime.level >= next.minLevel
      && getMissingFusionRequirements(state, id).length === 0,
  );
}

export function fuseSlime(state: RosterState, id: SlimeId): RosterState {
  const current = state.slimes[id];
  const next = getNextFusionStep(current);
  if (!next || !canFuse(state, id)) return state;

  const inventory = { ...state.inventory };
  for (const requirement of next.recipe) {
    inventory[requirement.itemId] = Math.max(0, inventory[requirement.itemId] - requirement.amount);
  }

  const nextRank = current.fusionRank + 1;
  return {
    ...state,
    inventory,
    slimes: {
      ...state.slimes,
      [id]: {
        ...current,
        fusionRank: nextRank,
        equippedWeapon: id === 'sword' && nextRank >= 2 ? 'Mercenary Greatsword' : current.equippedWeapon,
      },
    },
  };
}

export function isGreatswordRank(rank: number): boolean {
  return rank >= 2;
}
