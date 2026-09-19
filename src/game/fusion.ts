import { fusionStepDefinitions, type FusionStepDefinition } from '../domain/definitions';
import type { SlimeProgress } from '../domain/state';
import { FUSION_ITEMS, type FusionItemId, type SlimeId } from './slimes';

export interface FusionRequirement {
  itemId: FusionItemId;
  amount: number;
}

export interface FusionStep {
  id: string;
  rank: number;
  minLevel: number;
  title: string;
  description: string;
  resultName?: string;
  behaviorUnlockId: string;
  recipe: FusionRequirement[];
}

type FusionPresentation = Readonly<{
  title: string;
  description: string;
  resultName?: string;
}>;

/** Presentation copy only. Requirements/ranks come from authoritative Domain definitions. */
const PRESENTATION: Readonly<Record<string, FusionPresentation>> = {
  'fusion.sword.01-greatsword': {
    title: '大剣士へ合成',
    description: '大剣を横へ寝かせ、キレのある半回転の横薙ぎで周囲をまとめて斬る形態になる',
    resultName: '大剣士スライム',
  },
  'fusion.sword.02-heavy-impact': {
    title: '重撃強化',
    description: '横薙ぎの範囲とimpactがさらに強くなる',
  },
  'fusion.sword.03-whirlwind': {
    title: '旋風大斬',
    description: '横薙ぎの余波が広がり、さらに広い範囲を巻き込む',
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
  'fusion.shield.01-fortified-guard': {
    title: '堅守強化',
    description: '同職の核を取り込み、防御性能と押し返す力を一段強化する',
  },
  'fusion.wand.01-arcane-focus': {
    title: '魔力収束',
    description: '核へ魔力を収束させ、魔法攻撃の出力を一段引き上げる',
  },
  'fusion.dagger.01-afterimage-edge': {
    title: '残影強化',
    description: '同職の核を刃へ馴染ませ、高速近接の出力を一段引き上げる',
  },
  'fusion.gun.01-overpressure': {
    title: '高圧射撃',
    description: '同職の核と補強材を組み合わせ、射撃出力を一段引き上げる',
  },
};

const STEPS: Record<SlimeId, FusionStep[]> = {
  sword: fusionStepDefinitions.sword.map(toPresentationStep),
  shield: fusionStepDefinitions.shield.map(toPresentationStep),
  bow: fusionStepDefinitions.bow.map(toPresentationStep),
  wand: fusionStepDefinitions.wand.map(toPresentationStep),
  dagger: fusionStepDefinitions.dagger.map(toPresentationStep),
  gun: fusionStepDefinitions.gun.map(toPresentationStep),
};

export function getNextFusionStep(slime: SlimeProgress): FusionStep | null {
  return STEPS[slime.typeId].find((step) => step.rank === slime.fusionRank) ?? null;
}

export function isGreatswordRank(rank: number): boolean {
  return rank >= 2;
}

function toPresentationStep(definition: FusionStepDefinition): FusionStep {
  const presentation = PRESENTATION[definition.id];
  if (presentation === undefined) throw new Error(`Missing Fusion presentation metadata: ${definition.id}`);
  return {
    id: definition.id,
    rank: definition.fromRank,
    minLevel: definition.minLevel,
    title: presentation.title,
    description: presentation.description,
    behaviorUnlockId: definition.behaviorUnlockId,
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
