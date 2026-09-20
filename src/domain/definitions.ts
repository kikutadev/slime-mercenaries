import type { CurrencyDefinition, CurveDefinition, GachaDefinition, ItemDefinition, LoadoutDefinition, Reward, TimedActivityDefinition } from 'idle-game-kit';
import { balance } from './balance';
import type { SlimeProductReward } from './rewards';

/** Stable IDs are the save/balance boundary. Display names can change without migrating saves. */
export const ids = {
  currency: {
    gold: 'currency.gold',
  },
  token: {
    plainSlime: 'token.slime.plain-stock',
    slimeGel: 'token.material.slime-gel',
    lifeWater: 'token.material.life-water',
    trainingSword: 'token.job-gear.training-sword',
    trainingShield: 'token.job-gear.training-shield',
    trainingBow: 'token.job-gear.training-bow',
    trainingWand: 'token.job-gear.training-wand',
    trainingDagger: 'token.job-gear.training-dagger',
    trainingGun: 'token.job-gear.training-gun',
    swordCore: 'token.fusion.sword-core',
    shieldCore: 'token.fusion.shield-core',
    bowCore: 'token.fusion.bow-core',
    wandCore: 'token.fusion.wand-core',
    daggerCore: 'token.fusion.dagger-core',
    gunCore: 'token.fusion.gun-core',
    greatswordBlank: 'token.fusion.greatsword-blank',
    reinforcedBow: 'token.fusion.reinforced-bow',
    hardeningGel: 'token.fusion.hardening-gel',
    temperedSteel: 'token.fusion.tempered-steel',
    forgeKey: 'token.forge-key',
    swordWeaponMaterial: 'token.equipment-material.sword',
    shieldWeaponMaterial: 'token.equipment-material.shield',
    bowWeaponMaterial: 'token.equipment-material.bow',
    wandWeaponMaterial: 'token.equipment-material.wand',
    daggerWeaponMaterial: 'token.equipment-material.dagger',
    gunWeaponMaterial: 'token.equipment-material.gun',
  },
  gacha: {
    forge: 'gacha.equipment-forge',
  },
  loadout: {
    sword: 'loadout.slime.sword',
    shield: 'loadout.slime.shield',
    bow: 'loadout.slime.bow',
    wand: 'loadout.slime.wand',
    dagger: 'loadout.slime.dagger',
    gun: 'loadout.slime.gun',
  },
  activity: {
    roadEscort: 'activity.dispatch.road-escort',
    forestExploration: 'activity.dispatch.forest-exploration',
    materialGathering: 'activity.dispatch.material-gathering',
  },
  rng: {
    loot: 'rng.loot',
    forge: 'rng.forge',
  },
} as const;

export const NORMAL_JOB_SLIME_IDS = ['sword', 'shield', 'bow', 'wand', 'dagger', 'gun'] as const;
export type JobSlimeId = typeof NORMAL_JOB_SLIME_IDS[number];

export const AREA_IDS = [
  'area.clover-road',
  'area.mushroom-forest',
  'area.amber-mine',
  'area.sunken-marsh',
  'area.frost-ruins',
  'area.ember-canyon',
  'area.moonlit-castle',
  'area.dragon-crater',
] as const;
export const WORLD_AREA_IDS = AREA_IDS;
export type AreaId = typeof AREA_IDS[number];
export type WorldAreaId = AreaId;

export type TokenRequirement = Readonly<{
  tokenId: string;
  count: number;
}>;

export type JobCreationDefinition = Readonly<{
  id: JobSlimeId;
  displayName: string;
  plainSlimeCount: number;
  jobGearTokenId: string;
  jobGearCount: number;
  fusionCoreTokenId: string;
  unlockAreaId: WorldAreaId;
  startingLevel: number;
  startingJobTier: number;
}>;

/**
 * Balance knobs for the renewable Plain Slime supply.
 * Commands consume these definitions instead of embedding economy numbers.
 */
export const plainSlimeBalance = {
  craft: {
    outputCount: balance.plainSlime.craft.outputCount,
    recipe: [
      { tokenId: ids.token.slimeGel, count: balance.plainSlime.craft.slimeGelCost },
      { tokenId: ids.token.lifeWater, count: balance.plainSlime.craft.lifeWaterCost },
    ] satisfies readonly TokenRequirement[],
  },
  shop: {
    outputCount: balance.plainSlime.shop.outputCount,
    // Initial tuning only. Linear pricing is deliberately easy to reason about and retune.
    costCurve: {
      type: 'linear',
      base: balance.plainSlime.shop.baseGoldCost,
      step: balance.plainSlime.shop.goldCostStep,
    } satisfies CurveDefinition,
  },
} as const;

/**
 * Job creation is definition-driven so new normal branches can reuse the same command.
 */
export const jobCreationDefinitions: Readonly<Record<JobSlimeId, JobCreationDefinition>> = {
  sword: {
    id: 'sword',
    displayName: '剣士スライム',
    plainSlimeCount: 1,
    jobGearTokenId: ids.token.trainingSword,
    jobGearCount: 1,
    fusionCoreTokenId: ids.token.swordCore,
    unlockAreaId: 'area.clover-road',
    startingLevel: 1,
    startingJobTier: 1,
  },
  shield: {
    id: 'shield',
    displayName: '盾士スライム',
    plainSlimeCount: 1,
    jobGearTokenId: ids.token.trainingShield,
    jobGearCount: 1,
    fusionCoreTokenId: ids.token.shieldCore,
    unlockAreaId: 'area.amber-mine',
    startingLevel: 1,
    startingJobTier: 1,
  },
  bow: {
    id: 'bow',
    displayName: '弓士スライム',
    plainSlimeCount: 1,
    jobGearTokenId: ids.token.trainingBow,
    jobGearCount: 1,
    fusionCoreTokenId: ids.token.bowCore,
    unlockAreaId: 'area.clover-road',
    startingLevel: 1,
    startingJobTier: 1,
  },
  wand: {
    id: 'wand',
    displayName: '杖士スライム',
    plainSlimeCount: 1,
    jobGearTokenId: ids.token.trainingWand,
    jobGearCount: 1,
    fusionCoreTokenId: ids.token.wandCore,
    unlockAreaId: 'area.mushroom-forest',
    startingLevel: 1,
    startingJobTier: 1,
  },
  dagger: {
    id: 'dagger',
    displayName: '短剣士スライム',
    plainSlimeCount: 1,
    jobGearTokenId: ids.token.trainingDagger,
    jobGearCount: 1,
    fusionCoreTokenId: ids.token.daggerCore,
    unlockAreaId: 'area.mushroom-forest',
    startingLevel: 1,
    startingJobTier: 1,
  },
  gun: {
    id: 'gun',
    displayName: '銃士スライム',
    plainSlimeCount: 1,
    jobGearTokenId: ids.token.trainingGun,
    jobGearCount: 1,
    fusionCoreTokenId: ids.token.gunCore,
    unlockAreaId: 'area.amber-mine',
    startingLevel: 1,
    startingJobTier: 1,
  },
};

/**
 * Tutorial bootstrap is data as well. The first body is crafted by the player rather than
 * silently appearing in authoritative state.
 */
export const initialEconomyBalance = {
  gold: balance.tutorialBootstrap.gold,
  tokens: {
    [ids.token.slimeGel]: balance.tutorialBootstrap.slimeGel,
    [ids.token.lifeWater]: balance.tutorialBootstrap.lifeWater,
    [ids.token.trainingSword]: balance.tutorialBootstrap.trainingSword,
    [ids.token.trainingShield]: 0,
    [ids.token.trainingBow]: balance.tutorialBootstrap.trainingBow,
    [ids.token.trainingWand]: 0,
    [ids.token.trainingDagger]: 0,
    [ids.token.trainingGun]: 0,
    [ids.token.plainSlime]: 0,
    [ids.token.swordCore]: 0,
    [ids.token.shieldCore]: 0,
    [ids.token.bowCore]: 0,
    [ids.token.wandCore]: 0,
    [ids.token.daggerCore]: 0,
    [ids.token.gunCore]: 0,
    [ids.token.greatswordBlank]: 0,
    [ids.token.reinforcedBow]: 0,
    [ids.token.hardeningGel]: 0,
    [ids.token.temperedSteel]: 0,
    [ids.token.forgeKey]: 0,
    [ids.token.swordWeaponMaterial]: 0,
    [ids.token.shieldWeaponMaterial]: 0,
    [ids.token.bowWeaponMaterial]: 0,
    [ids.token.wandWeaponMaterial]: 0,
    [ids.token.daggerWeaponMaterial]: 0,
    [ids.token.gunWeaponMaterial]: 0,
  } as Readonly<Record<string, number>>,
} as const;

export const currencyDefinitions: readonly CurrencyDefinition[] = [
  {
    id: ids.currency.gold,
    displayName: 'ゴールド',
    symbol: 'G',
    precision: 0,
    roundingMode: 'floor',
    resetPolicy: 'retain',
  },
];

const currencyDefinitionsById = new Map(currencyDefinitions.map((definition) => [definition.id, definition]));

/** Resolve product currency policy for Kit transactions/rewards. */
export function resolveCurrencyDefinition(currencyId: string): CurrencyDefinition | undefined {
  return currencyDefinitionsById.get(currencyId);
}

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

export const typeLevelDefinitions: Readonly<Record<JobSlimeId, ReturnType<typeof createTypeLevelDefinition>>> = {
  sword: createTypeLevelDefinition('level.slime.sword'),
  shield: createTypeLevelDefinition('level.slime.shield'),
  bow: createTypeLevelDefinition('level.slime.bow'),
  wand: createTypeLevelDefinition('level.slime.wand'),
  dagger: createTypeLevelDefinition('level.slime.dagger'),
  gun: createTypeLevelDefinition('level.slime.gun'),
};


export type WeaponFamily = JobSlimeId;
export type WeaponRarity = 'common' | 'rare' | 'mythic';
export type WeaponId = keyof typeof weaponDefinitions;

export type WeaponDefinition = Readonly<{
  id: string;
  displayName: string;
  family: WeaponFamily;
  rarity: WeaponRarity;
  dpsMultiplier: number;
  item: ItemDefinition;
}>;

export const weaponDefinitions = {
  bronzeSaber: {
    id: 'weapon.sword.bronze-saber', displayName: 'ブロンズセイバー', family: 'sword', rarity: 'common',
    dpsMultiplier: balance.equipment.weapons.bronzeSaber.dpsMultiplier,
    item: { id: 'weapon.sword.bronze-saber', displayName: 'ブロンズセイバー', tags: ['weapon', 'family:sword'] },
  },
  cloverBlade: {
    id: 'weapon.sword.clover-blade', displayName: 'クローバーブレイド', family: 'sword', rarity: 'rare',
    dpsMultiplier: balance.equipment.weapons.cloverBlade.dpsMultiplier,
    item: { id: 'weapon.sword.clover-blade', displayName: 'クローバーブレイド', tags: ['weapon', 'family:sword'] },
  },
  starcleaver: {
    id: 'weapon.sword.starcleaver', displayName: '星断ちの大剣', family: 'sword', rarity: 'mythic',
    dpsMultiplier: balance.equipment.weapons.starcleaver.dpsMultiplier,
    item: { id: 'weapon.sword.starcleaver', displayName: '星断ちの大剣', tags: ['weapon', 'family:sword'] },
  },
  hunterBow: {
    id: 'weapon.bow.hunter-bow', displayName: '狩人の弓', family: 'bow', rarity: 'common',
    dpsMultiplier: balance.equipment.weapons.hunterBow.dpsMultiplier,
    item: { id: 'weapon.bow.hunter-bow', displayName: '狩人の弓', tags: ['weapon', 'family:bow'] },
  },
  windstring: {
    id: 'weapon.bow.windstring', displayName: '風弦の弓', family: 'bow', rarity: 'rare',
    dpsMultiplier: balance.equipment.weapons.windstring.dpsMultiplier,
    item: { id: 'weapon.bow.windstring', displayName: '風弦の弓', tags: ['weapon', 'family:bow'] },
  },
  cometString: {
    id: 'weapon.bow.comet-string', displayName: '彗星弓', family: 'bow', rarity: 'mythic',
    dpsMultiplier: balance.equipment.weapons.cometString.dpsMultiplier,
    item: { id: 'weapon.bow.comet-string', displayName: '彗星弓', tags: ['weapon', 'family:bow'] },
  },
  ironBulwark: {
    id: 'weapon.shield.iron-bulwark', displayName: '鉄壁の盾', family: 'shield', rarity: 'common',
    dpsMultiplier: balance.equipment.weapons.ironBulwark.dpsMultiplier,
    item: { id: 'weapon.shield.iron-bulwark', displayName: '鉄壁の盾', tags: ['weapon', 'family:shield'] },
  },
  cloverAegis: {
    id: 'weapon.shield.clover-aegis', displayName: 'クローバーイージス', family: 'shield', rarity: 'rare',
    dpsMultiplier: balance.equipment.weapons.cloverAegis.dpsMultiplier,
    item: { id: 'weapon.shield.clover-aegis', displayName: 'クローバーイージス', tags: ['weapon', 'family:shield'] },
  },
  aegisOfDawn: {
    id: 'weapon.shield.aegis-of-dawn', displayName: '暁のイージス', family: 'shield', rarity: 'mythic',
    dpsMultiplier: balance.equipment.weapons.aegisOfDawn.dpsMultiplier,
    item: { id: 'weapon.shield.aegis-of-dawn', displayName: '暁のイージス', tags: ['weapon', 'family:shield'] },
  },
  oakWand: {
    id: 'weapon.wand.oak-wand', displayName: '樫の杖', family: 'wand', rarity: 'common',
    dpsMultiplier: balance.equipment.weapons.oakWand.dpsMultiplier,
    item: { id: 'weapon.wand.oak-wand', displayName: '樫の杖', tags: ['weapon', 'family:wand'] },
  },
  mooncapWand: {
    id: 'weapon.wand.mooncap-wand', displayName: '月茸の杖', family: 'wand', rarity: 'rare',
    dpsMultiplier: balance.equipment.weapons.mooncapWand.dpsMultiplier,
    item: { id: 'weapon.wand.mooncap-wand', displayName: '月茸の杖', tags: ['weapon', 'family:wand'] },
  },
  sunseedStaff: {
    id: 'weapon.wand.sunseed-staff', displayName: '陽種の杖', family: 'wand', rarity: 'mythic',
    dpsMultiplier: balance.equipment.weapons.sunseedStaff.dpsMultiplier,
    item: { id: 'weapon.wand.sunseed-staff', displayName: '陽種の杖', tags: ['weapon', 'family:wand'] },
  },
  scoutKnives: {
    id: 'weapon.dagger.scout-knives', displayName: '斥候の双刃', family: 'dagger', rarity: 'common',
    dpsMultiplier: balance.equipment.weapons.scoutKnives.dpsMultiplier,
    item: { id: 'weapon.dagger.scout-knives', displayName: '斥候の双刃', tags: ['weapon', 'family:dagger'] },
  },
  shadeTwins: {
    id: 'weapon.dagger.shade-twins', displayName: '影縫いの双刃', family: 'dagger', rarity: 'rare',
    dpsMultiplier: balance.equipment.weapons.shadeTwins.dpsMultiplier,
    item: { id: 'weapon.dagger.shade-twins', displayName: '影縫いの双刃', tags: ['weapon', 'family:dagger'] },
  },
  nightglassTwins: {
    id: 'weapon.dagger.nightglass-twins', displayName: '夜玻璃の双刃', family: 'dagger', rarity: 'mythic',
    dpsMultiplier: balance.equipment.weapons.nightglassTwins.dpsMultiplier,
    item: { id: 'weapon.dagger.nightglass-twins', displayName: '夜玻璃の双刃', tags: ['weapon', 'family:dagger'] },
  },
  brassPistol: {
    id: 'weapon.gun.brass-pistol', displayName: '真鍮ピストル', family: 'gun', rarity: 'common',
    dpsMultiplier: balance.equipment.weapons.brassPistol.dpsMultiplier,
    item: { id: 'weapon.gun.brass-pistol', displayName: '真鍮ピストル', tags: ['weapon', 'family:gun'] },
  },
  sparkCarbine: {
    id: 'weapon.gun.spark-carbine', displayName: '火花のカービン', family: 'gun', rarity: 'rare',
    dpsMultiplier: balance.equipment.weapons.sparkCarbine.dpsMultiplier,
    item: { id: 'weapon.gun.spark-carbine', displayName: '火花のカービン', tags: ['weapon', 'family:gun'] },
  },
  jellynova: {
    id: 'weapon.gun.jellynova', displayName: 'ジェリーノヴァ', family: 'gun', rarity: 'mythic',
    dpsMultiplier: balance.equipment.weapons.jellynova.dpsMultiplier,
    item: { id: 'weapon.gun.jellynova', displayName: 'ジェリーノヴァ', tags: ['weapon', 'family:gun'] },
  },
} as const satisfies Readonly<Record<string, WeaponDefinition>>;

export const weaponDefinitionsByDefinitionId: Readonly<Record<string, WeaponDefinition>> = Object.fromEntries(
  Object.values(weaponDefinitions).map((definition) => [definition.id, definition]),
);

export const itemDefinitionsById: Readonly<Record<string, ItemDefinition>> = Object.fromEntries(
  Object.values(weaponDefinitions).map((definition) => [definition.item.id, definition.item]),
);

export const slimeWeaponLoadoutDefinitions: Readonly<Record<JobSlimeId, LoadoutDefinition>> = {
  sword: { id: ids.loadout.sword, slots: [{ id: 'weapon', acceptsTags: ['family:sword'] }] },
  shield: { id: ids.loadout.shield, slots: [{ id: 'weapon', acceptsTags: ['family:shield'] }] },
  bow: { id: ids.loadout.bow, slots: [{ id: 'weapon', acceptsTags: ['family:bow'] }] },
  wand: { id: ids.loadout.wand, slots: [{ id: 'weapon', acceptsTags: ['family:wand'] }] },
  dagger: { id: ids.loadout.dagger, slots: [{ id: 'weapon', acceptsTags: ['family:dagger'] }] },
  gun: { id: ids.loadout.gun, slots: [{ id: 'weapon', acceptsTags: ['family:gun'] }] },
};

export type ForgeReward = Readonly<{ weaponDefinitionId: string }>;
export const equipmentForgeDefinition: GachaDefinition<ForgeReward> = {
  id: ids.gacha.forge,
  cost: { tokenId: ids.token.forgeKey, countPerDraw: balance.equipment.forgeKeyCostPerDraw },
  allowedDrawCounts: [1, 10],
  rngStreamName: ids.rng.forge,
  duplicatePolicy: 'resolve-with-hook',
  pity: {
    id: 'forge.mythic-pity',
    threshold: balance.equipment.mythicPityDraws,
    poolEntryIds: ['forge.starcleaver', 'forge.aegis-of-dawn', 'forge.comet-string', 'forge.sunseed-staff', 'forge.nightglass-twins', 'forge.jellynova'],
  },
  pool: [
    { id: 'forge.bronze-saber', weight: balance.equipment.weapons.bronzeSaber.weight, reward: { weaponDefinitionId: weaponDefinitions.bronzeSaber.id }, rarity: 'common' },
    { id: 'forge.clover-blade', weight: balance.equipment.weapons.cloverBlade.weight, reward: { weaponDefinitionId: weaponDefinitions.cloverBlade.id }, rarity: 'rare' },
    { id: 'forge.starcleaver', weight: balance.equipment.weapons.starcleaver.weight, reward: { weaponDefinitionId: weaponDefinitions.starcleaver.id }, rarity: 'mythic' },
    { id: 'forge.hunter-bow', weight: balance.equipment.weapons.hunterBow.weight, reward: { weaponDefinitionId: weaponDefinitions.hunterBow.id }, rarity: 'common' },
    { id: 'forge.windstring', weight: balance.equipment.weapons.windstring.weight, reward: { weaponDefinitionId: weaponDefinitions.windstring.id }, rarity: 'rare' },
    { id: 'forge.comet-string', weight: balance.equipment.weapons.cometString.weight, reward: { weaponDefinitionId: weaponDefinitions.cometString.id }, rarity: 'mythic' },
    { id: 'forge.iron-bulwark', weight: balance.equipment.weapons.ironBulwark.weight, reward: { weaponDefinitionId: weaponDefinitions.ironBulwark.id }, rarity: 'common' },
    { id: 'forge.clover-aegis', weight: balance.equipment.weapons.cloverAegis.weight, reward: { weaponDefinitionId: weaponDefinitions.cloverAegis.id }, rarity: 'rare' },
    { id: 'forge.aegis-of-dawn', weight: balance.equipment.weapons.aegisOfDawn.weight, reward: { weaponDefinitionId: weaponDefinitions.aegisOfDawn.id }, rarity: 'mythic' },
    { id: 'forge.oak-wand', weight: balance.equipment.weapons.oakWand.weight, reward: { weaponDefinitionId: weaponDefinitions.oakWand.id }, rarity: 'common' },
    { id: 'forge.mooncap-wand', weight: balance.equipment.weapons.mooncapWand.weight, reward: { weaponDefinitionId: weaponDefinitions.mooncapWand.id }, rarity: 'rare' },
    { id: 'forge.sunseed-staff', weight: balance.equipment.weapons.sunseedStaff.weight, reward: { weaponDefinitionId: weaponDefinitions.sunseedStaff.id }, rarity: 'mythic' },
    { id: 'forge.scout-knives', weight: balance.equipment.weapons.scoutKnives.weight, reward: { weaponDefinitionId: weaponDefinitions.scoutKnives.id }, rarity: 'common' },
    { id: 'forge.shade-twins', weight: balance.equipment.weapons.shadeTwins.weight, reward: { weaponDefinitionId: weaponDefinitions.shadeTwins.id }, rarity: 'rare' },
    { id: 'forge.nightglass-twins', weight: balance.equipment.weapons.nightglassTwins.weight, reward: { weaponDefinitionId: weaponDefinitions.nightglassTwins.id }, rarity: 'mythic' },
    { id: 'forge.brass-pistol', weight: balance.equipment.weapons.brassPistol.weight, reward: { weaponDefinitionId: weaponDefinitions.brassPistol.id }, rarity: 'common' },
    { id: 'forge.spark-carbine', weight: balance.equipment.weapons.sparkCarbine.weight, reward: { weaponDefinitionId: weaponDefinitions.sparkCarbine.id }, rarity: 'rare' },
    { id: 'forge.jellynova', weight: balance.equipment.weapons.jellynova.weight, reward: { weaponDefinitionId: weaponDefinitions.jellynova.id }, rarity: 'mythic' },
  ],
};

export type StageWaveDefinition = Readonly<{
  /** Stable visual encounter ID; analytical combat still uses work/rewards as authority. */
  encounterId: string;
  work: number;
  rewards: readonly SlimeProductReward[];
  randomDrops: readonly Readonly<{
    tokenId: string;
    chance: number;
    count: number;
  }>[];
}>;

export type StageBossDefinition = Readonly<{
  /** Stable visual encounter ID for the boss presentation. */
  encounterId: string;
  work: number;
  requiredPartyPower: number;
  rewards: readonly SlimeProductReward[];
}>;

export type StageDefinition = Readonly<{
  id: string;
  areaId: string;
  stageNumber: number;
  /** Optional survivability gate checked before normal waves on this stage. */
  requiredPartyPower?: number;
  waves: readonly StageWaveDefinition[];
  boss?: StageBossDefinition;
  clearRewards: readonly SlimeProductReward[];
}>;

function stageClearRewards(clearReward: Readonly<Record<string, number>>): readonly SlimeProductReward[] {
  const rewards: SlimeProductReward[] = [];
  const tokenByKey: Readonly<Record<string, string>> = {
    slimeGel: ids.token.slimeGel,
    lifeWater: ids.token.lifeWater,
    trainingSword: ids.token.trainingSword,
    trainingBow: ids.token.trainingBow,
    greatswordBlank: ids.token.greatswordBlank,
    hardeningGel: ids.token.hardeningGel,
    forgeKey: ids.token.forgeKey,
    reinforcedBow: ids.token.reinforcedBow,
    temperedSteel: ids.token.temperedSteel,
  };
  for (const [key, count] of Object.entries(clearReward)) {
    const tokenId = tokenByKey[key];
    if (tokenId === undefined || count <= 0) continue;
    rewards.push({ type: 'token', tokenId, count });
  }
  return rewards;
}

/**
 * First-area headless progression definitions. Battle presentation may use richer enemy data,
 * but offline/simulator progression reads these same work/reward values.
 */
export const cloverRoadStageDefinitions: readonly StageDefinition[] = balance.combat.cloverRoad.stages.map((stage, index) => ({
  id: `stage.clover-road.${String(index + 1).padStart(2, '0')}`,
  areaId: 'area.clover-road',
  stageNumber: index + 1,
  ...(!('requiredPartyPower' in stage) ? {} : { requiredPartyPower: stage.requiredPartyPower }),
  waves: stage.waveWork.map((work, waveIndex) => ({
    encounterId: `encounter.clover-road.${String(index + 1).padStart(2, '0')}.${String(waveIndex + 1).padStart(2, '0')}`,
    work,
    rewards: [{
      type: 'currency',
      currencyId: ids.currency.gold,
      amount: stage.waveGold[waveIndex] ?? 0,
      source: `stage.clover-road.${index + 1}.wave.${waveIndex + 1}`,
    }],
    randomDrops: [
      {
        tokenId: ids.token.slimeGel,
        chance: balance.loot.normalWave.slimeGelChance,
        count: balance.loot.normalWave.slimeGelCount,
      },
      {
        tokenId: ids.token.hardeningGel,
        chance: balance.loot.normalWave.hardeningGelChance,
        count: balance.loot.normalWave.hardeningGelCount,
      },
    ],
  })),
  ...(!('bossWork' in stage) ? {} : {
    boss: {
      encounterId: `encounter.clover-road.${String(index + 1).padStart(2, '0')}.boss`,
      work: stage.bossWork,
      requiredPartyPower: stage.bossRequiredPower,
      rewards: [{
        type: 'currency',
        currencyId: ids.currency.gold,
        amount: stage.bossGold,
        source: `stage.clover-road.${index + 1}.boss`,
      }],
    },
  }),
  clearRewards: stageClearRewards(stage.clearReward),
}));

export type AreaDefinition = Readonly<{
  id: AreaId;
  order: number;
  displayName: string;
  nextAreaId: AreaId | null;
  stages: readonly StageDefinition[];
}>;

/**
 * Stable first-world area manifest. Planned areas are registered before their combat content so
 * save/progression code never needs area-specific branches when later stages are authored.
 */
export const areaDefinitions: Readonly<Record<AreaId, AreaDefinition>> = {
  'area.clover-road': {
    id: 'area.clover-road', order: 1, displayName: 'クローバー街道',
    nextAreaId: 'area.mushroom-forest', stages: cloverRoadStageDefinitions,
  },
  'area.mushroom-forest': {
    id: 'area.mushroom-forest', order: 2, displayName: 'Mushroom Forest',
    nextAreaId: 'area.amber-mine', stages: [],
  },
  'area.amber-mine': {
    id: 'area.amber-mine', order: 3, displayName: 'Amber Mine',
    nextAreaId: 'area.sunken-marsh', stages: [],
  },
  'area.sunken-marsh': {
    id: 'area.sunken-marsh', order: 4, displayName: 'Sunken Marsh',
    nextAreaId: 'area.frost-ruins', stages: [],
  },
  'area.frost-ruins': {
    id: 'area.frost-ruins', order: 5, displayName: 'Frost Ruins',
    nextAreaId: 'area.ember-canyon', stages: [],
  },
  'area.ember-canyon': {
    id: 'area.ember-canyon', order: 6, displayName: 'Ember Canyon',
    nextAreaId: 'area.moonlit-castle', stages: [],
  },
  'area.moonlit-castle': {
    id: 'area.moonlit-castle', order: 7, displayName: 'Moonlit Castle',
    nextAreaId: 'area.dragon-crater', stages: [],
  },
  'area.dragon-crater': {
    id: 'area.dragon-crater', order: 8, displayName: 'Dragon Crater',
    nextAreaId: null, stages: [],
  },
};

export function resolveAreaDefinition(areaId: string): AreaDefinition | undefined {
  return areaDefinitions[areaId as AreaId];
}

export function resolveNextAreaDefinition(areaId: string): AreaDefinition | null {
  const nextAreaId = resolveAreaDefinition(areaId)?.nextAreaId ?? null;
  return nextAreaId === null ? null : areaDefinitions[nextAreaId];
}

export function resolveStageDefinition(areaId: string, stageNumber: number): StageDefinition | null {
  if (!Number.isSafeInteger(stageNumber) || stageNumber <= 0) return null;
  return resolveAreaDefinition(areaId)?.stages[stageNumber - 1] ?? null;
}

/** Resolve the next sequential stage without skipping an unauthored area. */
export function resolveNextWorldStageDefinition(areaId: string, stageNumber: number): StageDefinition | null {
  const sameArea = resolveStageDefinition(areaId, stageNumber + 1);
  if (sameArea !== null) return sameArea;
  const nextArea = resolveNextAreaDefinition(areaId);
  return nextArea?.stages[0] ?? null;
}

export type AreaAdvanceResolution =
  | Readonly<{ kind: 'stage'; area: AreaDefinition; stage: StageDefinition }>
  | Readonly<{ kind: 'area'; area: AreaDefinition; stage: StageDefinition }>
  | Readonly<{ kind: 'boundary' }>;

export function resolveAreaAdvance(
  areaId: AreaId,
  currentStageNumber: number,
  catalog: Readonly<Partial<Record<AreaId, AreaDefinition>>> = areaDefinitions,
): AreaAdvanceResolution {
  const area = catalog[areaId];
  if (area === undefined) return { kind: 'boundary' };
  const sameAreaStage = area.stages[currentStageNumber] ?? null;
  if (sameAreaStage !== null) return { kind: 'stage', area, stage: sameAreaStage };
  if (area.nextAreaId === null) return { kind: 'boundary' };
  const nextArea = catalog[area.nextAreaId];
  const firstNextStage = nextArea?.stages[0] ?? null;
  if (nextArea === undefined || firstNextStage === null) return { kind: 'boundary' };
  return { kind: 'area', area: nextArea, stage: firstNextStage };
}

export const stageDefinitionsById = new Map(
  Object.values(areaDefinitions).flatMap((area) => area.stages).map((stage) => [stage.id, stage]),
);


export type DispatchContractId = keyof typeof dispatchContractDefinitions;

export type DispatchContractDefinition = Readonly<{
  id: string;
  displayName: string;
  requiredPower: number;
  activity: TimedActivityDefinition;
}>;

export const dispatchContractDefinitions = {
  roadEscort: {
    id: ids.activity.roadEscort,
    displayName: '街道護衛',
    requiredPower: balance.dispatch.roadEscort.requiredPower,
    activity: {
      id: ids.activity.roadEscort,
      mode: 'timed',
      durationSec: balance.dispatch.roadEscort.durationSec,
      completionRewards: [{
        type: 'currency',
        currencyId: ids.currency.gold,
        amount: balance.dispatch.roadEscort.goldReward,
        source: ids.activity.roadEscort,
      }],
      claimPolicy: 'auto',
      repeatPolicy: 'repeatable',
      offlinePolicy: 'progress',
    },
  },
  forestExploration: {
    id: ids.activity.forestExploration,
    displayName: '森林探索',
    requiredPower: balance.dispatch.forestExploration.requiredPower,
    activity: {
      id: ids.activity.forestExploration,
      mode: 'timed',
      durationSec: balance.dispatch.forestExploration.durationSec,
      completionRewards: [{ type: 'token', tokenId: ids.token.forgeKey, count: balance.dispatch.forestExploration.forgeKeyReward }],
      claimPolicy: 'auto',
      repeatPolicy: 'repeatable',
      offlinePolicy: 'progress',
    },
  },
  materialGathering: {
    id: ids.activity.materialGathering,
    displayName: '素材採集',
    requiredPower: balance.dispatch.materialGathering.requiredPower,
    activity: {
      id: ids.activity.materialGathering,
      mode: 'timed',
      durationSec: balance.dispatch.materialGathering.durationSec,
      completionRewards: [{ type: 'token', tokenId: ids.token.hardeningGel, count: balance.dispatch.materialGathering.hardeningGelReward }],
      claimPolicy: 'auto',
      repeatPolicy: 'repeatable',
      offlinePolicy: 'progress',
    },
  },
} as const satisfies Readonly<Record<string, DispatchContractDefinition>>;
