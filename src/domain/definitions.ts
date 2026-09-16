import type { CurrencyDefinition, CurveDefinition, Reward, TimedActivityDefinition } from 'idle-game-kit';
import { balance } from './balance';

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
    trainingBow: 'token.job-gear.training-bow',
    swordCore: 'token.fusion.sword-core',
    bowCore: 'token.fusion.bow-core',
    greatswordBlank: 'token.fusion.greatsword-blank',
    reinforcedBow: 'token.fusion.reinforced-bow',
    hardeningGel: 'token.fusion.hardening-gel',
    temperedSteel: 'token.fusion.tempered-steel',
    forgeKey: 'token.forge-key',
    promotionMaterial: 'token.promotion.common',
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

export type JobSlimeId = 'sword' | 'bow';

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
    displayName: 'Sword Slime',
    plainSlimeCount: 1,
    jobGearTokenId: ids.token.trainingSword,
    jobGearCount: 1,
    fusionCoreTokenId: ids.token.swordCore,
    startingLevel: 1,
    startingJobTier: 1,
  },
  bow: {
    id: 'bow',
    displayName: 'Bow Slime',
    plainSlimeCount: 1,
    jobGearTokenId: ids.token.trainingBow,
    jobGearCount: 1,
    fusionCoreTokenId: ids.token.bowCore,
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
    [ids.token.trainingBow]: balance.tutorialBootstrap.trainingBow,
    [ids.token.plainSlime]: 0,
    [ids.token.swordCore]: 0,
    [ids.token.bowCore]: 0,
    [ids.token.greatswordBlank]: 0,
    [ids.token.reinforcedBow]: 0,
    [ids.token.hardeningGel]: 0,
    [ids.token.temperedSteel]: 0,
    [ids.token.forgeKey]: 0,
    [ids.token.promotionMaterial]: 0,
  } as Readonly<Record<string, number>>,
} as const;

export const currencyDefinitions: readonly CurrencyDefinition[] = [
  {
    id: ids.currency.gold,
    displayName: 'Gold',
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
  behaviorUnlockId: string;
  recipe: readonly TokenRequirement[];
}>;

/**
 * Fusion balance lives in data. Form IDs are presentation/combat selectors, not promotion tiers.
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
      behaviorUnlockId: 'behavior.sword.spinning-cleave',
      recipe: [
        { tokenId: ids.token.swordCore, count: balance.fusion.sword.greatsword.swordCore },
        { tokenId: ids.token.greatswordBlank, count: balance.fusion.sword.greatsword.greatswordBlank },
        { tokenId: ids.token.hardeningGel, count: balance.fusion.sword.greatsword.hardeningGel },
      ],
    },
    {
      id: 'fusion.sword.02-heavy-impact',
      slimeId: 'sword',
      fromRank: 2,
      toRank: 3,
      minLevel: balance.fusion.sword.heavyImpact.minLevel,
      resultFusionFormId: 'greatsword',
      behaviorUnlockId: 'behavior.sword.heavy-impact',
      recipe: [
        { tokenId: ids.token.swordCore, count: balance.fusion.sword.heavyImpact.swordCore },
        { tokenId: ids.token.temperedSteel, count: balance.fusion.sword.heavyImpact.temperedSteel },
        { tokenId: ids.token.hardeningGel, count: balance.fusion.sword.heavyImpact.hardeningGel },
      ],
    },
    {
      id: 'fusion.sword.03-whirlwind',
      slimeId: 'sword',
      fromRank: 3,
      toRank: 4,
      minLevel: balance.fusion.sword.whirlwind.minLevel,
      resultFusionFormId: 'whirlwind-greatsword',
      behaviorUnlockId: 'behavior.sword.whirlwind-wave',
      recipe: [
        { tokenId: ids.token.swordCore, count: balance.fusion.sword.whirlwind.swordCore },
        { tokenId: ids.token.temperedSteel, count: balance.fusion.sword.whirlwind.temperedSteel },
        { tokenId: ids.token.hardeningGel, count: balance.fusion.sword.whirlwind.hardeningGel },
      ],
    },
  ],
  bow: [
    {
      id: 'fusion.bow.01-rapid-shot',
      slimeId: 'bow',
      fromRank: 1,
      toRank: 2,
      minLevel: balance.fusion.bow.rapidShot.minLevel,
      resultFusionFormId: 'rapid-shot',
      behaviorUnlockId: 'behavior.bow.follow-up-shot',
      recipe: [
        { tokenId: ids.token.bowCore, count: balance.fusion.bow.rapidShot.bowCore },
        { tokenId: ids.token.reinforcedBow, count: balance.fusion.bow.rapidShot.reinforcedBow },
        { tokenId: ids.token.hardeningGel, count: balance.fusion.bow.rapidShot.hardeningGel },
      ],
    },
    {
      id: 'fusion.bow.02-piercing-shot',
      slimeId: 'bow',
      fromRank: 2,
      toRank: 3,
      minLevel: balance.fusion.bow.piercingShot.minLevel,
      resultFusionFormId: 'piercing-shot',
      behaviorUnlockId: 'behavior.bow.pierce',
      recipe: [
        { tokenId: ids.token.bowCore, count: balance.fusion.bow.piercingShot.bowCore },
        { tokenId: ids.token.temperedSteel, count: balance.fusion.bow.piercingShot.temperedSteel },
        { tokenId: ids.token.hardeningGel, count: balance.fusion.bow.piercingShot.hardeningGel },
      ],
    },
    {
      id: 'fusion.bow.03-triple-shot',
      slimeId: 'bow',
      fromRank: 3,
      toRank: 4,
      minLevel: balance.fusion.bow.tripleShot.minLevel,
      resultFusionFormId: 'triple-shot',
      behaviorUnlockId: 'behavior.bow.triple-shot',
      recipe: [
        { tokenId: ids.token.bowCore, count: balance.fusion.bow.tripleShot.bowCore },
        { tokenId: ids.token.temperedSteel, count: balance.fusion.bow.tripleShot.temperedSteel },
        { tokenId: ids.token.hardeningGel, count: balance.fusion.bow.tripleShot.hardeningGel },
      ],
    },
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

export const typeLevelDefinitions = {
  sword: createTypeLevelDefinition('level.slime.sword'),
  bow: createTypeLevelDefinition('level.slime.bow'),
} as const;


export type StageWaveDefinition = Readonly<{
  work: number;
  rewards: readonly Reward[];
  randomDrops: readonly Readonly<{
    tokenId: string;
    chance: number;
    count: number;
  }>[];
}>;

export type StageBossDefinition = Readonly<{
  work: number;
  requiredPartyPower: number;
  rewards: readonly Reward[];
}>;

export type StageDefinition = Readonly<{
  id: string;
  areaId: string;
  stageNumber: number;
  waves: readonly StageWaveDefinition[];
  boss?: StageBossDefinition;
  clearRewards: readonly Reward[];
}>;

function stageClearRewards(clearReward: Readonly<Record<string, number>>): readonly Reward[] {
  const rewards: Reward[] = [];
  const tokenByKey: Readonly<Record<string, string>> = {
    slimeGel: ids.token.slimeGel,
    lifeWater: ids.token.lifeWater,
    trainingSword: ids.token.trainingSword,
    trainingBow: ids.token.trainingBow,
    greatswordBlank: ids.token.greatswordBlank,
    hardeningGel: ids.token.hardeningGel,
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
  waves: stage.waveWork.map((work, waveIndex) => ({
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

export const stageDefinitionsById = new Map(cloverRoadStageDefinitions.map((stage) => [stage.id, stage]));


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
    displayName: 'Road Escort',
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
    displayName: 'Forest Exploration',
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
    displayName: 'Material Gathering',
    requiredPower: balance.dispatch.materialGathering.requiredPower,
    activity: {
      id: ids.activity.materialGathering,
      mode: 'timed',
      durationSec: balance.dispatch.materialGathering.durationSec,
      completionRewards: [{ type: 'token', tokenId: ids.token.promotionMaterial, count: balance.dispatch.materialGathering.promotionMaterialReward }],
      claimPolicy: 'auto',
      repeatPolicy: 'repeatable',
      offlinePolicy: 'progress',
    },
  },
} as const satisfies Readonly<Record<string, DispatchContractDefinition>>;
