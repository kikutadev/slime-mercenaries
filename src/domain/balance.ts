/**
 * Product balance knobs only.
 * IDs, presentation text and command algorithms deliberately live elsewhere so routine tuning
 * can be done by editing this file without touching state-transition code.
 */
export const balance = {
  plainSlime: {
    craft: {
      outputCount: 1,
      slimeGelCost: 8,
      lifeWaterCost: 1,
    },
    shop: {
      outputCount: 1,
      baseGoldCost: 100,
      goldCostStep: 20,
    },
  },
  tutorialBootstrap: {
    gold: 0,
    slimeGel: 8,
    lifeWater: 1,
    trainingSword: 1,
    trainingBow: 0,
  },
  typeLevel: {
    baseGoldCost: 30,
    goldCostStep: 5,
    statBase: 1,
    statRatioPerLevel: 1.06,
    maxLevel: 100,
  },
  combat: {
    baseDpsByJob: {
      sword: 10,
      bow: 8,
    },
    basePowerByJob: {
      sword: 10,
      bow: 8,
    },
    fusionPowerMultiplierByRank: [1, 1.55, 1.95, 2.45],
    fusionDpsMultiplierByRank: [1, 1.45, 1.8, 2.2],
    cloverRoad: {
      stages: [
        { waveWork: [60, 70, 80], waveGold: [22, 26, 32], clearReward: { slimeGel: 8, lifeWater: 1, trainingSword: 1 } },
        { waveWork: [78, 88, 100], waveGold: [32, 38, 46], clearReward: { greatswordBlank: 1, hardeningGel: 2 } },
        { waveWork: [180, 210, 240], waveGold: [44, 52, 62], clearReward: { slimeGel: 8, lifeWater: 1, trainingBow: 1 } },
        { waveWork: [260, 300, 340], waveGold: [58, 68, 80], clearReward: { reinforcedBow: 1, temperedSteel: 2 } },
        {
          waveWork: [330, 380, 430],
          waveGold: [72, 84, 98],
          bossWork: 750,
          bossRequiredPower: 12.5,
          bossGold: 180,
          clearReward: { forgeKey: 2, promotionMaterial: 3, temperedSteel: 2 },
        },
      ],
    },
  },
  loot: {
    normalWave: {
      slimeGelChance: 0.28,
      slimeGelCount: 1,
      hardeningGelChance: 0.10,
      hardeningGelCount: 1,
    },
  },
  dispatch: {
    roadEscort: { durationSec: 300, requiredPower: 10, goldReward: 250 },
    forestExploration: { durationSec: 600, requiredPower: 12, forgeKeyReward: 1 },
    materialGathering: { durationSec: 900, requiredPower: 14, promotionMaterialReward: 2 },
  },
  targets: {
    firstFusion: { minSec: 60, maxSec: 180 },
    cloverRoadBoss: { minSec: 180, maxSec: 300 },
    maxNoActionWindowSec: 35,
  },
  equipment: {
    forgeKeyCostPerDraw: 1,
    refinementCap: 5,
    refinementDpsPerRank: 0.05,
    mythicPityDraws: 20,
    weapons: {
      bronzeSaber: { weight: 55, dpsMultiplier: 1.08 },
      cloverBlade: { weight: 18, dpsMultiplier: 1.18 },
      starcleaver: { weight: 2, dpsMultiplier: 1.42 },
      hunterBow: { weight: 55, dpsMultiplier: 1.08 },
      windstring: { weight: 18, dpsMultiplier: 1.18 },
      cometString: { weight: 2, dpsMultiplier: 1.42 },
    },
  },
  promotion: {
    dpsMultiplierByTier: [1, 1.35, 1.7],
    powerMultiplierByTier: [1, 1.4, 1.8],
    swordFighter: { minLevel: 20, goldCost: 320, promotionMaterial: 3 },
    bowRanger: { minLevel: 20, goldCost: 320, promotionMaterial: 3 },
  },
  fusion: {
    sword: {
      greatsword: {
        minLevel: 10,
        swordCore: 1,
        greatswordBlank: 1,
        hardeningGel: 2,
      },
      heavyImpact: {
        minLevel: 18,
        swordCore: 2,
        temperedSteel: 2,
        hardeningGel: 3,
      },
      whirlwind: {
        minLevel: 28,
        swordCore: 3,
        temperedSteel: 4,
        hardeningGel: 5,
      },
    },
    bow: {
      rapidShot: {
        minLevel: 10,
        bowCore: 1,
        reinforcedBow: 1,
        hardeningGel: 1,
      },
      piercingShot: {
        minLevel: 18,
        bowCore: 2,
        temperedSteel: 1,
        hardeningGel: 2,
      },
      tripleShot: {
        minLevel: 28,
        bowCore: 3,
        temperedSteel: 2,
        hardeningGel: 4,
      },
    },
  },
} as const;
