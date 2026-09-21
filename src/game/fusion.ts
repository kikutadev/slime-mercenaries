import { fusionStepDefinitions, isNormalJobSlimeId, type FusionStepDefinition } from '../domain/definitions';
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
  resultName: string;
  resultFusionFormId: string;
  resultJobTier: number;
  behaviorUnlockId: string;
  recipe: FusionRequirement[];
}

type FusionPresentation = Readonly<{
  title: string;
  description: string;
}>;

/** Presentation copy only. Requirements/ranks come from authoritative Domain definitions. */
const PRESENTATION: Readonly<Record<string, FusionPresentation>> = {
  'fusion.sword.01-greatsword': { title: '大剣士へ合成', description: '大剣を横へ寝かせ、キレのある半回転の横薙ぎで周囲をまとめて斬る形態になる' },
  'fusion.sword.02-fighter': { title: '戦士型へ合成', description: '核と鍛材を重ね、連撃を得意とする戦士型へ強化する' },
  'fusion.sword.03-blademaster': { title: '剣聖型へ合成', description: '静から瞬へ踏み込み、抜けた後に斬線が走る技巧型へ完成させる' },
  'fusion.sword.03-berserker': { title: '狂戦士型へ合成', description: '連打から範囲叩きつけへ繋ぐ、重撃特化型へ完成させる' },
  'fusion.shield.01-fortified-guard': { title: '堅守強化', description: '同職の核を取り込み、防御性能と押し返す力を一段強化する' },
  'fusion.shield.02-guardian': { title: 'ガーディアン型へ合成', description: '守りの核を重ね、前線を支える重防御型へ強化する' },
  'fusion.shield.03-paladin': { title: 'パラディン型へ合成', description: '盾閃光と聖撃を備えた守護型へ完成させる' },
  'fusion.shield.03-fortress': { title: 'フォートレス型へ合成', description: '巨大盾で敵列を押し潰す要塞型へ完成させる' },
  'fusion.bow.01-rapid-shot': { title: '連射型へ合成', description: '弓士の核と強化弓を組み合わせ、短い間隔で追撃する形態になる' },
  'fusion.bow.02-ranger': { title: 'レンジャー型へ合成', description: '機動しながら連続射撃する戦闘型へ強化する' },
  'fusion.bow.03-sniper': { title: 'スナイパー型へ合成', description: '長い照準から高速貫通矢を撃ち抜く狙撃型へ完成させる' },
  'fusion.bow.03-storm-archer': { title: 'ストーム型へ合成', description: '帯電した矢を連鎖させる広域射撃型へ完成させる' },
  'fusion.wand.01-arcane-focus': { title: '魔力収束', description: '核へ魔力を収束させ、魔法攻撃の出力を一段引き上げる' },
  'fusion.wand.02-mage': { title: 'メイジ型へ合成', description: '魔力の核を重ね、範囲魔法を扱う戦闘型へ強化する' },
  'fusion.wand.03-archmage': { title: 'アークメイジ型へ合成', description: '巨大魔法陣から大魔法を落とす高火力型へ完成させる' },
  'fusion.wand.03-frost-mage': { title: 'フロスト型へ合成', description: '冷気と氷柱で敵を制御する氷結型へ完成させる' },
  'fusion.dagger.01-afterimage-edge': { title: '残影強化', description: '同職の核を刃へ馴染ませ、高速近接の出力を一段引き上げる' },
  'fusion.dagger.02-rogue': { title: 'ローグ型へ合成', description: '双短剣の連撃を研ぎ澄ませた高速戦闘型へ強化する' },
  'fusion.dagger.03-ninja': { title: 'ニンジャ型へ合成', description: '煙と分身を使う遅延多段斬り型へ完成させる' },
  'fusion.dagger.03-assassin': { title: 'アサシン型へ合成', description: '低い構えから背後へ刺突する暗殺型へ完成させる' },
  'fusion.gun.01-overpressure': { title: '高圧射撃', description: '同職の核と補強材を組み合わせ、射撃出力を一段引き上げる' },
  'fusion.gun.02-gunner': { title: 'ガンナー型へ合成', description: '銃撃の核を重ね、連射に特化した戦闘型へ強化する' },
  'fusion.gun.03-cannoneer': { title: '砲撃手型へ合成', description: '巨大砲の反動ごと叩きつける爆発型へ完成させる' },
  'fusion.gun.03-engineer': { title: 'エンジニア型へ合成', description: '部品を収束しタレットを展開する機工型へ完成させる' },
};

const STEPS: Partial<Record<SlimeId, FusionStep[]>> = {
  sword: fusionStepDefinitions.sword.map(toPresentationStep),
  shield: fusionStepDefinitions.shield.map(toPresentationStep),
  bow: fusionStepDefinitions.bow.map(toPresentationStep),
  wand: fusionStepDefinitions.wand.map(toPresentationStep),
  dagger: fusionStepDefinitions.dagger.map(toPresentationStep),
  gun: fusionStepDefinitions.gun.map(toPresentationStep),
};

export function getNextFusionSteps(slime: SlimeProgress): readonly FusionStep[] {
  if (!isNormalJobSlimeId(slime.typeId)) return [];
  return (STEPS[slime.typeId] ?? []).filter((step) => step.rank === slime.fusionRank);
}

export function getNextFusionStep(slime: SlimeProgress, fusionStepId?: string): FusionStep | null {
  const choices = getNextFusionSteps(slime);
  if (fusionStepId === undefined) return choices[0] ?? null;
  return choices.find((step) => step.id === fusionStepId) ?? null;
}

export function isGreatswordRank(rank: number): boolean {
  return rank >= 2;
}

function toPresentationStep(definition: FusionStepDefinition): FusionStep {
  const presentation = PRESENTATION[definition.id];
  if (presentation === undefined) throw new Error('Missing Fusion presentation metadata: ' + definition.id);
  return {
    id: definition.id,
    rank: definition.fromRank,
    minLevel: definition.minLevel,
    title: presentation.title,
    description: presentation.description,
    resultName: definition.resultDisplayName,
    resultFusionFormId: definition.resultFusionFormId,
    resultJobTier: definition.resultJobTier,
    behaviorUnlockId: definition.behaviorUnlockId,
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
