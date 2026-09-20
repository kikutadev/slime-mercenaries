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
