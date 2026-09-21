import type { CurrencyDefinition, CurveDefinition } from 'idle-game-kit';
import { balance } from './balance';
import { ids, type JobCreationDefinition, type JobSlimeId, type TokenRequirement } from './definition-ids';

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
    [ids.token.mimicHeart]: 0,
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
