import { balance } from './balance';
import { ids, type JobSlimeId, type SlimeTypeId, type TokenRequirement, type WorldAreaId } from './definition-ids';

export type FusionStepDefinition = Readonly<{
  id: string;
  slimeId: JobSlimeId;
  fromRank: number;
  toRank: number;
  minLevel: number;
  resultFusionFormId: string;
  resultDisplayName: string;
  resultJobTier: number;
  behaviorUnlockId: string;
  unlockAreaId?: WorldAreaId;
  recipe: readonly TokenRequirement[];
}>;

const FUSION_CORE_TOKEN_BY_JOB: Readonly<Record<JobSlimeId, string>> = {
  sword: ids.token.swordCore,
  shield: ids.token.shieldCore,
  bow: ids.token.bowCore,
  wand: ids.token.wandCore,
  dagger: ids.token.daggerCore,
  gun: ids.token.gunCore,
};

function advancedFusionRecipe(
  slimeId: JobSlimeId,
  tier: 'tier2' | 'tier3',
): readonly TokenRequirement[] {
  const tuning = balance.fusion.advanced[tier];
  return [
    { tokenId: FUSION_CORE_TOKEN_BY_JOB[slimeId], count: tuning.core },
    { tokenId: ids.token.temperedSteel, count: tuning.temperedSteel },
    { tokenId: ids.token.hardeningGel, count: tuning.hardeningGel },
  ];
}

function advancedFusionStep(args: Readonly<{
  id: string;
  slimeId: JobSlimeId;
  fromRank: number;
  toRank: number;
  resultFusionFormId: string;
  resultDisplayName: string;
  resultJobTier: number;
  behaviorUnlockId: string;
}>): FusionStepDefinition {
  const tier = args.resultJobTier >= 3 ? 'tier3' : 'tier2';
  return {
    ...args,
    minLevel: balance.fusion.advanced[tier].minLevel,
    ...(tier === 'tier3' ? { unlockAreaId: 'area.sunken-marsh' as const } : {}),
    recipe: advancedFusionRecipe(args.slimeId, tier),
  };
}

/**
 * Fusion is the only form-growth system. Rank 2 is the first family enhancement, Rank 3
 * becomes the authored Tier-2 job form, and Rank 4 chooses one authored Tier-3 specialization.
 */
export const fusionStepDefinitions: Readonly<Record<JobSlimeId, readonly FusionStepDefinition[]>> = {
  sword: [
    {
      id: 'fusion.sword.01-greatsword',
      slimeId: 'sword',
      fromRank: 1,
      toRank: 2,
      minLevel: balance.fusion.sword.greatsword.minLevel,
      resultFusionFormId: 'greatsword',
      resultDisplayName: '大剣士スライム',
      resultJobTier: 1,
      behaviorUnlockId: 'behavior.sword.spinning-cleave',
      recipe: [
        { tokenId: ids.token.swordCore, count: balance.fusion.sword.greatsword.swordCore },
        { tokenId: ids.token.greatswordBlank, count: balance.fusion.sword.greatsword.greatswordBlank },
        { tokenId: ids.token.hardeningGel, count: balance.fusion.sword.greatsword.hardeningGel },
      ],
    },
    advancedFusionStep({
      id: 'fusion.sword.02-fighter', slimeId: 'sword', fromRank: 2, toRank: 3,
      resultFusionFormId: 'fighter', resultDisplayName: '戦士スライム', resultJobTier: 2,
      behaviorUnlockId: 'behavior.sword.fighter-combo',
    }),
    advancedFusionStep({
      id: 'fusion.sword.03-blademaster', slimeId: 'sword', fromRank: 3, toRank: 4,
      resultFusionFormId: 'blademaster', resultDisplayName: '剣聖スライム', resultJobTier: 3,
      behaviorUnlockId: 'behavior.sword.blademaster-dash',
    }),
    advancedFusionStep({
      id: 'fusion.sword.03-berserker', slimeId: 'sword', fromRank: 3, toRank: 4,
      resultFusionFormId: 'berserker', resultDisplayName: '狂戦士スライム', resultJobTier: 3,
      behaviorUnlockId: 'behavior.sword.berserker-heavy',
    }),
  ],
  shield: [
    {
      id: 'fusion.shield.01-fortified-guard',
      slimeId: 'shield',
      fromRank: 1,
      toRank: 2,
      minLevel: balance.fusion.shield.fortifiedGuard.minLevel,
      resultFusionFormId: 'fortified-guard',
      resultDisplayName: '堅守スライム',
      resultJobTier: 1,
      behaviorUnlockId: 'behavior.shield.fortified-guard',
      recipe: [
        { tokenId: ids.token.shieldCore, count: balance.fusion.shield.fortifiedGuard.shieldCore },
        { tokenId: ids.token.temperedSteel, count: balance.fusion.shield.fortifiedGuard.temperedSteel },
        { tokenId: ids.token.hardeningGel, count: balance.fusion.shield.fortifiedGuard.hardeningGel },
      ],
    },
    advancedFusionStep({
      id: 'fusion.shield.02-guardian', slimeId: 'shield', fromRank: 2, toRank: 3,
      resultFusionFormId: 'guardian', resultDisplayName: 'ガーディアンスライム', resultJobTier: 2,
      behaviorUnlockId: 'behavior.shield.guardian-guard',
    }),
    advancedFusionStep({
      id: 'fusion.shield.03-paladin', slimeId: 'shield', fromRank: 3, toRank: 4,
      resultFusionFormId: 'paladin', resultDisplayName: 'パラディンスライム', resultJobTier: 3,
      behaviorUnlockId: 'behavior.shield.paladin-barrier',
    }),
    advancedFusionStep({
      id: 'fusion.shield.03-fortress', slimeId: 'shield', fromRank: 3, toRank: 4,
      resultFusionFormId: 'fortress', resultDisplayName: 'フォートレススライム', resultJobTier: 3,
      behaviorUnlockId: 'behavior.shield.fortress-plant',
    }),
  ],
  bow: [
    {
      id: 'fusion.bow.01-rapid-shot',
      slimeId: 'bow',
      fromRank: 1,
      toRank: 2,
      minLevel: balance.fusion.bow.rapidShot.minLevel,
      resultFusionFormId: 'rapid-shot',
      resultDisplayName: '連射弓スライム',
      resultJobTier: 1,
      behaviorUnlockId: 'behavior.bow.follow-up-shot',
      recipe: [
        { tokenId: ids.token.bowCore, count: balance.fusion.bow.rapidShot.bowCore },
        { tokenId: ids.token.reinforcedBow, count: balance.fusion.bow.rapidShot.reinforcedBow },
        { tokenId: ids.token.hardeningGel, count: balance.fusion.bow.rapidShot.hardeningGel },
      ],
    },
    advancedFusionStep({
      id: 'fusion.bow.02-ranger', slimeId: 'bow', fromRank: 2, toRank: 3,
      resultFusionFormId: 'ranger', resultDisplayName: 'レンジャースライム', resultJobTier: 2,
      behaviorUnlockId: 'behavior.bow.ranger-double-shot',
    }),
    advancedFusionStep({
      id: 'fusion.bow.03-sniper', slimeId: 'bow', fromRank: 3, toRank: 4,
      resultFusionFormId: 'sniper', resultDisplayName: 'スナイパースライム', resultJobTier: 3,
      behaviorUnlockId: 'behavior.bow.sniper-pierce',
    }),
    advancedFusionStep({
      id: 'fusion.bow.03-storm-archer', slimeId: 'bow', fromRank: 3, toRank: 4,
      resultFusionFormId: 'storm-archer', resultDisplayName: 'ストームアーチャースライム', resultJobTier: 3,
      behaviorUnlockId: 'behavior.bow.storm-archer-volley',
    }),
  ],
  wand: [
    {
      id: 'fusion.wand.01-arcane-focus',
      slimeId: 'wand',
      fromRank: 1,
      toRank: 2,
      minLevel: balance.fusion.wand.arcaneFocus.minLevel,
      resultFusionFormId: 'arcane-focus',
      resultDisplayName: '魔力収束スライム',
      resultJobTier: 1,
      behaviorUnlockId: 'behavior.wand.arcane-focus',
      recipe: [
        { tokenId: ids.token.wandCore, count: balance.fusion.wand.arcaneFocus.wandCore },
        { tokenId: ids.token.hardeningGel, count: balance.fusion.wand.arcaneFocus.hardeningGel },
      ],
    },
    advancedFusionStep({
      id: 'fusion.wand.02-mage', slimeId: 'wand', fromRank: 2, toRank: 3,
      resultFusionFormId: 'mage', resultDisplayName: 'メイジスライム', resultJobTier: 2,
      behaviorUnlockId: 'behavior.wand.mage-aoe',
    }),
    advancedFusionStep({
      id: 'fusion.wand.03-archmage', slimeId: 'wand', fromRank: 3, toRank: 4,
      resultFusionFormId: 'archmage', resultDisplayName: 'アークメイジスライム', resultJobTier: 3,
      behaviorUnlockId: 'behavior.wand.archmage-burst',
    }),
    advancedFusionStep({
      id: 'fusion.wand.03-frost-mage', slimeId: 'wand', fromRank: 3, toRank: 4,
      resultFusionFormId: 'frost-mage', resultDisplayName: 'フロストメイジスライム', resultJobTier: 3,
      behaviorUnlockId: 'behavior.wand.frost-mage-control',
    }),
  ],
  dagger: [
    {
      id: 'fusion.dagger.01-afterimage-edge',
      slimeId: 'dagger',
      fromRank: 1,
      toRank: 2,
      minLevel: balance.fusion.dagger.afterimageEdge.minLevel,
      resultFusionFormId: 'afterimage-edge',
      resultDisplayName: '残影スライム',
      resultJobTier: 1,
      behaviorUnlockId: 'behavior.dagger.afterimage-edge',
      recipe: [
        { tokenId: ids.token.daggerCore, count: balance.fusion.dagger.afterimageEdge.daggerCore },
        { tokenId: ids.token.temperedSteel, count: balance.fusion.dagger.afterimageEdge.temperedSteel },
        { tokenId: ids.token.hardeningGel, count: balance.fusion.dagger.afterimageEdge.hardeningGel },
      ],
    },
    advancedFusionStep({
      id: 'fusion.dagger.02-rogue', slimeId: 'dagger', fromRank: 2, toRank: 3,
      resultFusionFormId: 'rogue', resultDisplayName: 'ローグスライム', resultJobTier: 2,
      behaviorUnlockId: 'behavior.dagger.rogue-twin-strike',
    }),
    advancedFusionStep({
      id: 'fusion.dagger.03-ninja', slimeId: 'dagger', fromRank: 3, toRank: 4,
      resultFusionFormId: 'ninja', resultDisplayName: 'ニンジャスライム', resultJobTier: 3,
      behaviorUnlockId: 'behavior.dagger.ninja-vanish',
    }),
    advancedFusionStep({
      id: 'fusion.dagger.03-assassin', slimeId: 'dagger', fromRank: 3, toRank: 4,
      resultFusionFormId: 'assassin', resultDisplayName: 'アサシンスライム', resultJobTier: 3,
      behaviorUnlockId: 'behavior.dagger.assassin-execute',
    }),
  ],
  gun: [
    {
      id: 'fusion.gun.01-overpressure',
      slimeId: 'gun',
      fromRank: 1,
      toRank: 2,
      minLevel: balance.fusion.gun.overpressure.minLevel,
      resultFusionFormId: 'overpressure',
      resultDisplayName: '高圧射撃スライム',
      resultJobTier: 1,
      behaviorUnlockId: 'behavior.gun.overpressure',
      recipe: [
        { tokenId: ids.token.gunCore, count: balance.fusion.gun.overpressure.gunCore },
        { tokenId: ids.token.temperedSteel, count: balance.fusion.gun.overpressure.temperedSteel },
        { tokenId: ids.token.hardeningGel, count: balance.fusion.gun.overpressure.hardeningGel },
      ],
    },
    advancedFusionStep({
      id: 'fusion.gun.02-gunner', slimeId: 'gun', fromRank: 2, toRank: 3,
      resultFusionFormId: 'gunner', resultDisplayName: 'ガンナースライム', resultJobTier: 2,
      behaviorUnlockId: 'behavior.gun.gunner-burst',
    }),
    advancedFusionStep({
      id: 'fusion.gun.03-cannoneer', slimeId: 'gun', fromRank: 3, toRank: 4,
      resultFusionFormId: 'cannoneer', resultDisplayName: '砲撃手スライム', resultJobTier: 3,
      behaviorUnlockId: 'behavior.gun.cannoneer-shell',
    }),
    advancedFusionStep({
      id: 'fusion.gun.03-engineer', slimeId: 'gun', fromRank: 3, toRank: 4,
      resultFusionFormId: 'engineer', resultDisplayName: 'エンジニアスライム', resultJobTier: 3,
      behaviorUnlockId: 'behavior.gun.engineer-turret',
    }),
  ],
};

/** Shared first-pass curve factory; each branch still owns a separate definition ID for later tuning. */
function createTypeLevelDefinition(id: string) {
  return {
    id,
    costCurve: { type: 'linear', base: balance.typeLevel.baseGoldCost, step: balance.typeLevel.goldCostStep },
    statCurve: { type: 'geometric', base: balance.typeLevel.statBase, ratio: balance.typeLevel.statRatioPerLevel },
    maxLevel: balance.typeLevel.maxLevel,
  } as const;
}

export const typeLevelDefinitions: Readonly<Record<SlimeTypeId, ReturnType<typeof createTypeLevelDefinition>>> = {
  sword: createTypeLevelDefinition('level.slime.sword'),
  shield: createTypeLevelDefinition('level.slime.shield'),
  bow: createTypeLevelDefinition('level.slime.bow'),
  wand: createTypeLevelDefinition('level.slime.wand'),
  dagger: createTypeLevelDefinition('level.slime.dagger'),
  gun: createTypeLevelDefinition('level.slime.gun'),
  mimic: createTypeLevelDefinition('level.slime.mimic'),
};
