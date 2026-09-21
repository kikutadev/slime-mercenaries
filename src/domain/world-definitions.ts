import { balance } from './balance';
import { ids, type AreaId } from './definition-ids';
import type { SlimeProductReward } from './rewards';

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

type ClearRewardKey =
  | 'slimeGel'
  | 'lifeWater'
  | 'trainingSword'
  | 'trainingBow'
  | 'trainingShield'
  | 'trainingWand'
  | 'trainingDagger'
  | 'trainingGun'
  | 'greatswordBlank'
  | 'hardeningGel'
  | 'forgeKey'
  | 'reinforcedBow'
  | 'temperedSteel';

const TOKEN_BY_CLEAR_REWARD_KEY: Readonly<Record<ClearRewardKey, string>> = {
  slimeGel: ids.token.slimeGel,
  lifeWater: ids.token.lifeWater,
  trainingSword: ids.token.trainingSword,
  trainingBow: ids.token.trainingBow,
  trainingShield: ids.token.trainingShield,
  trainingWand: ids.token.trainingWand,
  trainingDagger: ids.token.trainingDagger,
  trainingGun: ids.token.trainingGun,
  greatswordBlank: ids.token.greatswordBlank,
  hardeningGel: ids.token.hardeningGel,
  forgeKey: ids.token.forgeKey,
  reinforcedBow: ids.token.reinforcedBow,
  temperedSteel: ids.token.temperedSteel,
};

function stageClearRewards(clearReward: Readonly<Partial<Record<ClearRewardKey, number>>>): readonly SlimeProductReward[] {
  const rewards: SlimeProductReward[] = [];
  for (const [key, count] of Object.entries(clearReward) as [ClearRewardKey, number][]) {
    const tokenId = TOKEN_BY_CLEAR_REWARD_KEY[key];
    if (tokenId === undefined || count <= 0) continue;
    rewards.push({ type: 'token', tokenId, count });
  }
  return rewards;
}

function normalWaveRandomDrops(areaOrder: number): StageWaveDefinition['randomDrops'] {
  const lateAreaBonus = Math.max(0, areaOrder - 2);
  return [
    {
      tokenId: ids.token.slimeGel,
      chance: Math.min(0.48, balance.loot.normalWave.slimeGelChance + lateAreaBonus * 0.025),
      count: balance.loot.normalWave.slimeGelCount,
    },
    {
      tokenId: ids.token.hardeningGel,
      chance: Math.min(0.28, balance.loot.normalWave.hardeningGelChance + lateAreaBonus * 0.02),
      count: balance.loot.normalWave.hardeningGelCount,
    },
  ];
}

function encounterId(areaSlug: string, stageNumber: number, wave: number | 'boss'): string {
  const stagePart = String(stageNumber).padStart(2, '0');
  const encounterPart = wave === 'boss' ? 'boss' : String(wave).padStart(2, '0');
  return `encounter.${areaSlug}.${stagePart}.${encounterPart}`;
}

/** Area 1 keeps hand-authored onboarding work/reward values. */
const cloverRoadStages: readonly StageDefinition[] = balance.combat.cloverRoad.stages.map((stage, index) => ({
  id: `stage.clover-road.${String(index + 1).padStart(2, '0')}`,
  areaId: 'area.clover-road',
  stageNumber: index + 1,
  ...(!('requiredPartyPower' in stage) ? {} : { requiredPartyPower: stage.requiredPartyPower }),
  waves: stage.waveWork.map((work, waveIndex) => ({
    encounterId: encounterId('clover-road', index + 1, waveIndex + 1),
    work,
    rewards: [{
      type: 'currency',
      currencyId: ids.currency.gold,
      amount: stage.waveGold[waveIndex] ?? 0,
      source: `stage.clover-road.${index + 1}.wave.${waveIndex + 1}`,
    }],
    randomDrops: normalWaveRandomDrops(1),
  })),
  clearRewards: stageClearRewards(stage.clearReward),
}));

type CurvedAreaPlan = Readonly<{
  id: AreaId;
  order: number;
  slug: string;
}>;

const CURVED_AREA_PLANS: readonly CurvedAreaPlan[] = [
  { id: 'area.mushroom-forest', order: 2, slug: 'mushroom-forest' },
  { id: 'area.amber-mine', order: 3, slug: 'amber-mine' },
  { id: 'area.sunken-marsh', order: 4, slug: 'sunken-marsh' },
  { id: 'area.frost-ruins', order: 5, slug: 'frost-ruins' },
  { id: 'area.ember-canyon', order: 6, slug: 'ember-canyon' },
  { id: 'area.moonlit-castle', order: 7, slug: 'moonlit-castle' },
  { id: 'area.dragon-crater', order: 8, slug: 'dragon-crater' },
];

const JOB_GEAR_CYCLE: readonly string[] = [
  ids.token.trainingSword,
  ids.token.trainingShield,
  ids.token.trainingBow,
  ids.token.trainingWand,
  ids.token.trainingDagger,
  ids.token.trainingGun,
];

function deterministicJobGearRewards(areaOrder: number, stageNumber: number): readonly SlimeProductReward[] {
  const globalStageNumber = (areaOrder - 1) * 5 + stageNumber;
  const cycleTokenId = JOB_GEAR_CYCLE[globalStageNumber % JOB_GEAR_CYCLE.length]!;
  const rewards: SlimeProductReward[] = [{ type: 'token', tokenId: cycleTokenId, count: 1 }];

  // Shield/Gun become available when Mushroom Forest is cleared, matching their Amber Mine area gate.
  if (areaOrder === 2 && stageNumber === 5) {
    rewards.push({ type: 'token', tokenId: ids.token.trainingShield, count: 1 });
    rewards.push({ type: 'token', tokenId: ids.token.trainingGun, count: 2 });
  }
  // Deliberate late-world body milestones make Tier 3 arrive during play rather than after bosses.
  if (areaOrder === 6 && stageNumber === 4) {
    rewards.push({ type: 'token', tokenId: ids.token.trainingSword, count: 1 });
  }
  if (areaOrder === 7 && stageNumber === 4) {
    rewards.push({ type: 'token', tokenId: ids.token.trainingGun, count: 1 });
  }
  // The normal six-family cycle leaves Dagger one body short before the final boss.
  if (areaOrder === 8 && stageNumber === 4) {
    rewards.push({ type: 'token', tokenId: ids.token.trainingDagger, count: 1 });
  }
  return rewards;
}

function mutationMilestoneRewards(areaOrder: number, stageNumber: number): readonly SlimeProductReward[] {
  const rewards: SlimeProductReward[] = [];
  if (areaOrder === 4 && stageNumber === 5) rewards.push({ type: 'mutation-fragment', mutationId: 'golden', count: 5 });
  if (areaOrder === 5 && stageNumber === 2) rewards.push({ type: 'mutation-fragment', mutationId: 'golden', count: 5 });
  if (areaOrder === 7 && stageNumber === 2) rewards.push({ type: 'mutation-fragment', mutationId: 'king', count: 5 });
  if (areaOrder === 7 && stageNumber === 3) rewards.push({ type: 'mutation-fragment', mutationId: 'prism', count: 5 });
  if (areaOrder === 7 && stageNumber === 5) rewards.push({ type: 'mutation-fragment', mutationId: 'king', count: 5 });
  if (areaOrder === 8 && stageNumber === 2) rewards.push({ type: 'mutation-fragment', mutationId: 'prism', count: 5 });
  if (areaOrder === 8 && stageNumber === 4) rewards.push({ type: 'mutation-catalyst', mutationId: 'dragon', count: 1 });
  return rewards;
}

function curvedStageClearRewards(areaOrder: number, stageNumber: number): readonly SlimeProductReward[] {
  const jobGear = deterministicJobGearRewards(areaOrder, stageNumber);
  const mutationRewards = mutationMilestoneRewards(areaOrder, stageNumber);
  if (stageNumber === 1) {
    return [...stageClearRewards({ slimeGel: 8 + areaOrder * 2, lifeWater: areaOrder % 2 === 0 ? 1 : 0 }), ...jobGear, ...mutationRewards];
  }
  if (stageNumber === 2) {
    return [...stageClearRewards({ hardeningGel: 2 + Math.floor(areaOrder / 3) }), ...jobGear, ...mutationRewards];
  }
  if (stageNumber === 3) {
    return [...stageClearRewards({ slimeGel: 6 + areaOrder, temperedSteel: 1 + Math.floor(areaOrder / 4) }), ...jobGear, ...mutationRewards];
  }
  if (stageNumber === 4) {
    return [...stageClearRewards({ hardeningGel: 2 + Math.floor(areaOrder / 2), temperedSteel: 2 }), ...jobGear, ...mutationRewards];
  }
  return [...stageClearRewards({
    forgeKey: 2 + Math.floor(areaOrder / 3),
    hardeningGel: 3 + Math.floor(areaOrder / 2),
    temperedSteel: 2 + Math.floor(areaOrder / 3),
  }), ...jobGear, ...mutationRewards];
}

function buildCurvedAreaStages(plan: CurvedAreaPlan): readonly StageDefinition[] {
  const curve = balance.combat.worldAreaCurve;
  const baseWork = curve.baseWaveWorkByAreaOrder[plan.order];
  const baseGold = curve.baseWaveGoldByAreaOrder[plan.order];
  const workStep = curve.stageWorkStepByAreaOrder[plan.order];
  const goldStep = curve.stageGoldStepByAreaOrder[plan.order];
  const basePower = curve.stagePowerBaseByAreaOrder[plan.order];
  if (baseWork === undefined || workStep === undefined || baseGold === undefined || goldStep === undefined || basePower === undefined) {
    throw new Error(`Missing world-area combat curve values for order ${plan.order}`);
  }

  return Array.from({ length: 5 }, (_unused, stageIndex): StageDefinition => {
    const stageNumber = stageIndex + 1;
    const stageWork = baseWork + stageIndex * workStep;
    const stageGold = baseGold + stageIndex * goldStep;
    const stagePower = basePower;
    const waves = curve.waveWorkMultipliers.map((multiplier, waveIndex): StageWaveDefinition => ({
      encounterId: encounterId(plan.slug, stageNumber, waveIndex + 1),
      work: Math.round(stageWork * multiplier),
      rewards: [{
        type: 'currency',
        currencyId: ids.currency.gold,
        amount: Math.round(stageGold * curve.waveGoldMultipliers[waveIndex]!),
        source: `stage.${plan.slug}.${stageNumber}.wave.${waveIndex + 1}`,
      }],
      randomDrops: normalWaveRandomDrops(plan.order),
    }));

    const requiredPartyPower = stageNumber === 3 ? stagePower : undefined;
    const boss = stageNumber === 5
      ? {
          encounterId: encounterId(plan.slug, stageNumber, 'boss'),
          work: Math.round(waves[2]!.work * curve.bossWorkMultiplier),
          requiredPartyPower: Math.round(basePower * curve.bossPowerMultiplier),
          rewards: [{
            type: 'currency' as const,
            currencyId: ids.currency.gold,
            amount: Math.round(stageGold * curve.bossGoldMultiplier),
            source: `stage.${plan.slug}.5.boss`,
          }],
        }
      : undefined;

    return {
      id: `stage.${plan.slug}.${String(stageNumber).padStart(2, '0')}`,
      areaId: plan.id,
      stageNumber,
      ...(requiredPartyPower === undefined ? {} : { requiredPartyPower }),
      waves,
      ...(boss === undefined ? {} : { boss }),
      clearRewards: curvedStageClearRewards(plan.order, stageNumber),
    };
  });
}

const curvedStagesByArea = Object.fromEntries(
  CURVED_AREA_PLANS.map((plan) => [plan.id, buildCurvedAreaStages(plan)]),
) as Readonly<Record<Exclude<AreaId, 'area.clover-road'>, readonly StageDefinition[]>>;

export type AreaDefinition = Readonly<{
  id: AreaId;
  order: number;
  displayName: string;
  nextAreaId: AreaId | null;
  stages: readonly StageDefinition[];
}>;

export const areaDefinitions: Readonly<Record<AreaId, AreaDefinition>> = {
  'area.clover-road': {
    id: 'area.clover-road',
    order: 1,
    displayName: 'クローバー街道',
    nextAreaId: 'area.mushroom-forest',
    stages: cloverRoadStages,
  },
  'area.mushroom-forest': {
    id: 'area.mushroom-forest',
    order: 2,
    displayName: 'キノコの森',
    nextAreaId: 'area.amber-mine',
    stages: curvedStagesByArea['area.mushroom-forest'],
  },
  'area.amber-mine': {
    id: 'area.amber-mine',
    order: 3,
    displayName: '琥珀鉱山',
    nextAreaId: 'area.sunken-marsh',
    stages: curvedStagesByArea['area.amber-mine'],
  },
  'area.sunken-marsh': {
    id: 'area.sunken-marsh',
    order: 4,
    displayName: '沈み沼',
    nextAreaId: 'area.frost-ruins',
    stages: curvedStagesByArea['area.sunken-marsh'],
  },
  'area.frost-ruins': {
    id: 'area.frost-ruins',
    order: 5,
    displayName: '氷雪遺跡',
    nextAreaId: 'area.ember-canyon',
    stages: curvedStagesByArea['area.frost-ruins'],
  },
  'area.ember-canyon': {
    id: 'area.ember-canyon',
    order: 6,
    displayName: '灼熱峡谷',
    nextAreaId: 'area.moonlit-castle',
    stages: curvedStagesByArea['area.ember-canyon'],
  },
  'area.moonlit-castle': {
    id: 'area.moonlit-castle',
    order: 7,
    displayName: '月夜の城',
    nextAreaId: 'area.dragon-crater',
    stages: curvedStagesByArea['area.moonlit-castle'],
  },
  'area.dragon-crater': {
    id: 'area.dragon-crater',
    order: 8,
    displayName: '竜の火口',
    nextAreaId: null,
    stages: curvedStagesByArea['area.dragon-crater'],
  },
};

export const WORLD_STAGE_COUNT = Object.values(areaDefinitions)
  .reduce((total, area) => total + area.stages.length, 0);

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
