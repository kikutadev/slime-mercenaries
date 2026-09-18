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
    frontier: {
      retryFarmClears: 3,
      /** Virtual encounter time reserved for a losing frontier attempt before retreat. */
      defeatDurationSec: 8,
    },
    baseDpsByJob: {
      sword: 10,
      shield: 7,
      bow: 8,
      wand: 9,
      dagger: 10,
      gun: 9,
    },
    basePowerByJob: {
      sword: 10,
      shield: 12,
      bow: 8,
      wand: 8.5,
      dagger: 9.5,
      gun: 9,
    },
    fusionPowerMultiplierByRank: [1, 1.55, 1.95, 2.45],
    fusionDpsMultiplierByRank: [1, 1.45, 1.8, 2.2],
    cloverRoad: {
      stages: [
        { waveWork: [60, 70, 80], waveGold: [22, 26, 32], clearReward: { slimeGel: 8, lifeWater: 1, trainingSword: 1 } },
        { waveWork: [78, 88, 100], waveGold: [32, 38, 46], clearReward: { greatswordBlank: 1, hardeningGel: 2 } },
        { requiredPartyPower: 10.8, waveWork: [180, 210, 240], waveGold: [44, 52, 62], clearReward: { slimeGel: 8, lifeWater: 1, trainingBow: 1 } },
        { requiredPartyPower: 11.5, waveWork: [260, 300, 340], waveGold: [58, 68, 80], clearReward: { reinforcedBow: 1, temperedSteel: 2 } },
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
    defeatLoop: {
      firstDefeat: { minSec: 45, maxSec: 90 },
      cloverRoadBoss: { minSec: 220, maxSec: 360 },
      defeats: { minCount: 1, maxCount: 2 },
      farmClears: { minCount: 3, maxCount: 6 },
      retries: { minCount: 1, maxCount: 2 },
    },
    pacedDefeat: {
      firstDefeat: { minSec: 45, maxSec: 90 },
      cloverRoadBoss: { minSec: 480, maxSec: 900 },
      defeats: { minCount: 2, maxCount: 3 },
      farmClears: { minCount: 6, maxCount: 9 },
      retries: { minCount: 2, maxCount: 3 },
      maxNoActionWindowSec: 60,
    },
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
      ironBulwark: { weight: 55, dpsMultiplier: 1.08 },
      cloverAegis: { weight: 18, dpsMultiplier: 1.18 },
      aegisOfDawn: { weight: 2, dpsMultiplier: 1.42 },
      oakWand: { weight: 55, dpsMultiplier: 1.08 },
      mooncapWand: { weight: 18, dpsMultiplier: 1.18 },
      sunseedStaff: { weight: 2, dpsMultiplier: 1.42 },
      scoutKnives: { weight: 55, dpsMultiplier: 1.08 },
      shadeTwins: { weight: 18, dpsMultiplier: 1.18 },
      nightglassTwins: { weight: 2, dpsMultiplier: 1.42 },
      brassPistol: { weight: 55, dpsMultiplier: 1.08 },
      sparkCarbine: { weight: 18, dpsMultiplier: 1.18 },
      jellynova: { weight: 2, dpsMultiplier: 1.42 },
    },
  },
  promotion: {
    dpsMultiplierByTier: [1, 1.35, 1.7],
    powerMultiplierByTier: [1, 1.4, 1.8],
    tier2: { minLevel: 20, goldCost: 320, promotionMaterial: 3 },
    tier3: { minLevel: 40, goldCost: 900, promotionMaterial: 6 },
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
    shield: {
      fortifiedGuard: { minLevel: 10, shieldCore: 1, temperedSteel: 1, hardeningGel: 1 },
    },
    wand: {
      arcaneFocus: { minLevel: 10, wandCore: 1, hardeningGel: 2 },
    },
    dagger: {
      afterimageEdge: { minLevel: 10, daggerCore: 1, temperedSteel: 1, hardeningGel: 1 },
    },
    gun: {
      overpressure: { minLevel: 10, gunCore: 1, temperedSteel: 1, hardeningGel: 1 },
    },
  },
} as const;
