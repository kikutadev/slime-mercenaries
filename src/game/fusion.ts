import { fusionStepDefinitions, type FusionStepDefinition } from '../domain/definitions';
import { FUSION_ITEMS, type FusionItemId, type RosterState, type SlimeId, type SlimeProgress } from './slimes';

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

type FusionPresentation = Readonly<{
  title: string;
  description: string;
  resultName?: string;
}>;

/** Presentation copy stays local; all balance-relevant requirements come from domain definitions. */
const PRESENTATION: Readonly<Record<string, FusionPresentation>> = {
  'fusion.sword.01-greatsword': {
    title: '大剣士へ合成',
    description: '大剣を軸に身体ごと一回転し、周囲の敵を薙ぎ払う形態になる',
    resultName: 'Greatsword Slime',
  },
  'fusion.sword.02-heavy-impact': {
    title: '重撃強化',
    description: '回転薙ぎの範囲とimpactがさらに強くなる',
  },
  'fusion.sword.03-whirlwind': {
    title: '旋風大斬',
    description: '回転斬りの余波が広がり、さらに広い範囲を巻き込む',
  },
  'fusion.bow.01-rapid-shot': {
    title: '連射型へ合成',
    description: '弓士の核と強化弓を組み合わせ、短い間隔で追撃する形態になる',
  },
  'fusion.bow.02-piercing-shot': {
    title: '鋭い矢',
    description: '着弾impactと貫通性能を強化する',
  },
  'fusion.bow.03-triple-shot': {
    title: '三連射',
    description: '一度の攻撃で複数の矢を放つ',
  },
};

const STEPS: Record<SlimeId, FusionStep[]> = {
  sword: fusionStepDefinitions.sword.map(toPresentationStep),
  bow: fusionStepDefinitions.bow.map(toPresentationStep),
};

export function getNextFusionStep(slime: SlimeProgress): FusionStep | null {
  return STEPS[slime.id].find((step) => step.rank === slime.fusionRank) ?? null;
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

/**
 * Legacy UI-only transition. Product balance comes from src/domain; this function remains only
 * until App.tsx is migrated to the authoritative GameState command.
 */
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

function toPresentationStep(definition: FusionStepDefinition): FusionStep {
  const presentation = PRESENTATION[definition.id];
  if (presentation === undefined) throw new Error(`Missing Fusion presentation metadata: ${definition.id}`);
  return {
    rank: definition.fromRank,
    minLevel: definition.minLevel,
    title: presentation.title,
    description: presentation.description,
    ...(presentation.resultName === undefined ? {} : { resultName: presentation.resultName }),
    recipe: definition.recipe.map((requirement) => ({
      itemId: requireFusionItemId(requirement.tokenId),
      amount: requirement.count,
    })),
  };
}

function requireFusionItemId(tokenId: string): FusionItemId {
  if (tokenId in FUSION_ITEMS) return tokenId as FusionItemId;
  throw new Error(`Fusion recipe token is not exposed by the current presentation inventory: ${tokenId}`);
}
