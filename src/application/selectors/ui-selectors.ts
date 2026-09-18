import { formatGameNumber, readCurrency, readToken, selectAttentionSummary } from 'idle-game-kit';
import {
  dispatchContractDefinitions,
  equippedWeaponDefinition,
  equipmentForgeDefinition,
  ids,
  jobCreationDefinitions,
  previewJobCreation,
  previewPlainSlimeCraft,
  previewPlainSlimePurchase,
  previewSlimeFusion,
  previewSlimeLevelUp,
  previewSlimeMutation,
  previewSlimePromotion,
  previewSlimePromotions,
  slimeCombatPower,
  resolveAreaDefinition,
  WORLD_AREA_IDS,
  mutationDefinitions,
  maxSelectableStageForArea,
  isCodexDiscoveryNew,
  firstSlimeByType,
  ownedSlimes,
  sameTypeCount,
  type DispatchContractId,
  type JobSlimeId,
  type SlimeInstanceId,
  type SlimeMercenariesState,
  type SlimeMutationId,
} from '../../domain';
import { FUSION_ITEMS, getSlimePresentation, getSlimePresentationForRank } from '../../game/slimes';

const JOB_IDS = Object.keys(jobCreationDefinitions) as JobSlimeId[];

export function selectCodexSummary(state: SlimeMercenariesState) {
  const projectBucket = (bucket: SlimeMercenariesState['gameData']['codex']['slimeForms']) =>
    Object.entries(bucket)
      .map(([id, entry]) => ({
        id,
        discoveredAtSimTimeSec: entry.discoveredAtSimTimeSec,
        viewedAtSimTimeSec: entry.viewedAtSimTimeSec,
        isNew: isCodexDiscoveryNew(entry),
      }))
      .sort((left, right) => left.discoveredAtSimTimeSec - right.discoveredAtSimTimeSec || left.id.localeCompare(right.id));
  const slimeForms = projectBucket(state.gameData.codex.slimeForms);
  const weapons = projectBucket(state.gameData.codex.weapons);
  return {
    slimeForms,
    weapons,
    newSlimeFormCount: slimeForms.filter((entry) => entry.isNew).length,
    newWeaponCount: weapons.filter((entry) => entry.isNew).length,
    newCount: [...slimeForms, ...weapons].filter((entry) => entry.isNew).length,
  } as const;
}

export function selectWorldAreas(state: SlimeMercenariesState) {
  return WORLD_AREA_IDS.map((areaId) => {
    const definition = resolveAreaDefinition(areaId)!;
    const progress = state.gameData.progression.areas[areaId];
    return {
      id: areaId,
      order: definition.order,
      name: definition.displayName,
      current: state.gameData.progression.currentAreaId === areaId,
      unlocked: progress !== undefined,
      contentAvailable: definition.stages.length > 0,
      highestStageCleared: progress?.highestStageCleared ?? 0,
      stageCount: definition.stages.length,
      maxSelectableStage: maxSelectableStageForArea(state, areaId),
    } as const;
  });
}

export function selectGlobalHud(state: SlimeMercenariesState) {
  return {
    gold: formatGameNumber(readCurrency(state.currencies, ids.currency.gold)),
    forgeKeys: readToken(state.tokens, ids.token.forgeKey),
    areaLabel: resolveAreaDefinition(state.gameData.progression.currentAreaId)?.displayName ?? state.gameData.progression.currentAreaId,
    stageLabel: `${state.gameData.progression.currentStage}`,
  } as const;
}

export function selectEarlyGameCue(state: SlimeMercenariesState) {
  const sword = firstSlimeByType(state, 'sword');
  const plainStock = readToken(state.tokens, ids.token.plainSlime);
  if (sword === null) {
    if (plainStock === 0) {
      return {
        title: 'プレーンスライムを1匹作る',
        body: '最初の素材は揃っています。育成所から素体を生成します。',
        action: 'Create Slime',
      } as const;
    }
    return {
      title: 'プレーンスライムに剣を渡す',
      body: '訓練用の剣を渡すと、最初の剣士スライムが生まれます。',
      action: 'Create Job',
    } as const;
  }
  if (sword.fusionRank >= 2) return null;

  const fusion = previewSlimeFusion(state, sword.id);
  if (fusion.canFuse) {
    return {
      title: '大剣士スライムへ合成',
      body: '必要素材とLv.10を満たしました。攻撃が横薙ぎの範囲攻撃へ変わります。',
      action: 'Fuse',
    } as const;
  }

  if (sameTypeCount(state, 'sword') < 2) {
    const duplicate = previewJobCreation(state, 'sword');
    if (duplicate.canCreate) {
      return {
        title: '剣士スライムをもう1匹作る',
        body: '同じ職でも別個体として残ります。編成・派遣に使うか、あとで合成素材にするか選べます。',
        action: 'Create Job',
      } as const;
    }
  }

  if (sword.level < 10) {
    return {
      title: '戦闘でゴールドを集め、Lv.10へ強化',
      body: 'ゴールドと合成素材は自動戦闘で集まります。キャンプでレベルを上げると、その強さが戦闘へ反映されます。',
      action: 'Battle',
    } as const;
  }

  return {
    title: '合成素材を集める',
    body: '余剰の同職スライムは控えとして残し、必要な時だけ合成の核へ変換できます。',
    action: 'Fuse',
  } as const;
}

export function selectOwnedSlimeIds(state: SlimeMercenariesState): readonly SlimeInstanceId[] {
  return ownedSlimes(state).map((slime) => slime.id);
}

export function selectSlimeDetail(state: SlimeMercenariesState, slimeId: SlimeInstanceId) {
  const slime = state.gameData.roster.slimes[slimeId];
  if (slime === undefined) return null;
  const presentation = getSlimePresentation(slime);
  const fusion = previewSlimeFusion(state, slimeId);
  const promotions = previewSlimePromotions(state, slimeId);
  const levelOne = previewSlimeLevelUp(state, slimeId, 1);
  const levelTen = previewSlimeLevelUp(state, slimeId, 10);
  const maxAffordableCount = findMaxAffordableLevelCount(state, slimeId);
  const levelMax = maxAffordableCount > 0 ? previewSlimeLevelUp(state, slimeId, maxAffordableCount) : null;
  const weapon = equippedWeaponDefinition(state, slimeId);
  const mutationIds = Object.keys(mutationDefinitions) as SlimeMutationId[];
  const mutations = mutationIds.map((mutationId) => {
    const definition = mutationDefinitions[mutationId];
    const preview = previewSlimeMutation(state, slimeId, mutationId);
    return {
      id: mutationId,
      name: definition.displayName,
      eligibility: definition.eligibility,
      eligible: preview.eligible,
      canMutate: preview.canMutate,
      fragments: preview.fragments,
      catalysts: preview.catalysts,
    } as const;
  });
  const gold = readCurrency(state.currencies, ids.currency.gold);
  const toLevelAction = (preview: ReturnType<typeof previewSlimeLevelUp>, count: number) => {
    if (preview === null || !preview.available) return null;
    return {
      count,
      targetLevel: preview.targetLevel,
      cost: formatGameNumber(preview.totalCost),
      available: gold.compare(preview.totalCost) >= 0,
    } as const;
  };

  return {
    id: slimeId,
    typeId: slime.typeId,
    serial: slime.serial,
    name: sameTypeCount(state, slime.typeId) > 1 ? `${presentation.name} #${slime.serial}` : presentation.name,
    role: presentation.role,
    asset: presentation.asset,
    icon: presentation.icon,
    tier: slime.jobTier,
    level: slime.level,
    fusionRank: slime.fusionRank,
    fusionFormId: slime.fusionFormId,
    mutationId: slime.mutationId,
    mutationName: slime.mutationId === null ? null : mutationDefinitions[slime.mutationId].displayName,
    mutations,
    assignment: slime.assignment,
    weaponName: weapon?.displayName ?? '未装備',
    levelActions: {
      one: toLevelAction(levelOne, 1),
      ten: toLevelAction(levelTen, 10),
      max: toLevelAction(levelMax, maxAffordableCount),
    },
    fusion: fusion.step === null ? null : {
      canFuse: fusion.canFuse,
      levelMet: fusion.levelMet,
      minLevel: fusion.step.minLevel,
      resultFusionFormId: fusion.step.resultFusionFormId,
      behaviorUnlockId: fusion.step.behaviorUnlockId,
      requirements: fusion.requirements.map((requirement) => ({
        ...requirement,
        label: FUSION_ITEMS[requirement.tokenId as keyof typeof FUSION_ITEMS]?.shortName ?? requirement.tokenId,
      })),
    },
    promotions: promotions.flatMap((promotion) => promotion.step === null ? [] : [{
      id: promotion.step.id,
      canPromote: promotion.canPromote,
      levelMet: promotion.levelMet,
      minLevel: promotion.step.minLevel,
      resultName: promotion.step.resultDisplayName,
      resultPathId: promotion.step.resultPathId,
      goldCost: formatGameNumber(promotion.goldCost),
      canAffordGold: promotion.canAffordGold,
      requirements: promotion.requirements,
    }]),
  } as const;
}

export function selectCreateSlimePanel(state: SlimeMercenariesState) {
  const craft = previewPlainSlimeCraft(state, 1);
  const purchase = previewPlainSlimePurchase(state, 1);
  return {
    plainStock: readToken(state.tokens, ids.token.plainSlime),
    craft: {
      canCraft: craft.canCraft,
      requirements: craft.requirements,
    },
    purchase: {
      canAfford: purchase.canAfford,
      cost: formatGameNumber(purchase.totalCost),
    },
    jobs: JOB_IDS.map((jobId) => {
      const preview = previewJobCreation(state, jobId);
      return {
        id: jobId,
        name: jobCreationDefinitions[jobId].displayName,
        canCreate: preview.canCreate,
        isNew: preview.isNewDiscovery,
        resultKind: preview.resultKind,
        requirements: preview.requirements,
        icon: getSlimePresentationForRank(jobId, 1).icon,
      };
    }),
  } as const;
}

export function selectFormation(state: SlimeMercenariesState) {
  return state.gameData.roster.formationSlots.map((slimeId, slotIndex) => {
    if (slimeId === null) return { slotIndex, slimeId: null, name: null, icon: null, assignment: null } as const;
    const slime = state.gameData.roster.slimes[slimeId];
    if (slime === undefined) return { slotIndex, slimeId: null, name: null, icon: null, assignment: null } as const;
    const presentation = getSlimePresentation(slime);
    return {
      slotIndex,
      slimeId,
      name: sameTypeCount(state, slime.typeId) > 1 ? `${presentation.name} #${slime.serial}` : presentation.name,
      icon: presentation.icon,
      assignment: slime.assignment,
    } as const;
  });
}

export function selectDispatchScreen(state: SlimeMercenariesState) {
  const reserve = selectOwnedSlimeIds(state)
    .filter((slimeId) => state.gameData.roster.slimes[slimeId]?.assignment === 'reserve')
    .map((slimeId) => {
      const slime = state.gameData.roster.slimes[slimeId]!;
      const presentation = getSlimePresentation(slime);
      return {
        id: slimeId,
        name: sameTypeCount(state, slime.typeId) > 1 ? `${presentation.name} #${slime.serial}` : presentation.name,
        icon: presentation.icon,
        power: slimeCombatPower(state, slimeId).toNumber(),
      };
    });

  const contracts = (Object.keys(dispatchContractDefinitions) as DispatchContractId[]).map((contractId) => {
    const definition = dispatchContractDefinitions[contractId];
    const runtime = state.gameData.dispatch.contracts[contractId];
    const remainingSec = runtime.activity.completesAtSimTimeSec === null
      ? 0
      : Math.max(0, runtime.activity.completesAtSimTimeSec - state.simTimeSec);
    return {
      id: contractId,
      name: definition.displayName,
      requiredPower: definition.requiredPower,
      durationSec: definition.activity.durationSec,
      status: runtime.activity.status,
      slimeId: runtime.slimeId,
      remainingSec,
      eligibleSlimes: reserve.filter((slime) => slime.power >= definition.requiredPower),
      rewardLabel: rewardLabelForContract(contractId),
    } as const;
  });

  return { reserve, contracts } as const;
}

export function selectForgeScreen(state: SlimeMercenariesState) {
  const runtime = state.gachaStates[ids.gacha.forge];
  const pityThreshold = equipmentForgeDefinition.pity?.threshold ?? 0;
  const pityMissCount = runtime?.pityMissCount ?? 0;
  const inventory = Object.values(state.gameData.equipment.inventory).map((instance) => ({
    instanceId: instance.instanceId,
    definitionId: instance.definitionId,
    refinementRank: (instance.data as { refinementRank?: number } | undefined)?.refinementRank ?? 0,
  }));
  const keys = readToken(state.tokens, ids.token.forgeKey);
  const keyCostPerDraw = 'tokenId' in equipmentForgeDefinition.cost ? equipmentForgeDefinition.cost.countPerDraw : 0;
  return {
    keys,
    singleCost: keyCostPerDraw,
    tenCost: keyCostPerDraw * 10,
    canSingle: keys >= keyCostPerDraw,
    canTen: keys >= keyCostPerDraw * 10,
    totalDrawCount: runtime?.totalDrawCount ?? 0,
    pityMissCount,
    pityThreshold,
    pityProgress: pityThreshold <= 0 ? 0 : Math.min(1, pityMissCount / pityThreshold),
    inventory,
  } as const;
}


export type CampUpgradeOpportunity = Readonly<{
  slimeId: SlimeInstanceId;
  kind: 'level' | 'fusion' | 'promotion';
  label: string;
  priority: number;
}>;

/**
 * Headless camp-upgrade opportunities. UI/navigation consume this instead of repeating affordability rules.
 */
export function selectCampUpgradeOpportunities(state: SlimeMercenariesState): readonly CampUpgradeOpportunity[] {
  const gold = readCurrency(state.currencies, ids.currency.gold);
  return selectOwnedSlimeIds(state).flatMap((slimeId) => {
    const opportunities: CampUpgradeOpportunity[] = [];
    const promotions = previewSlimePromotions(state, slimeId);
    if (promotions.some((promotion) => promotion.canPromote)) {
      opportunities.push({ slimeId, kind: 'promotion', label: '昇格可能', priority: 30 });
    }
    const fusion = previewSlimeFusion(state, slimeId);
    if (fusion.canFuse) {
      opportunities.push({ slimeId, kind: 'fusion', label: '合成可能', priority: 20 });
    }
    const level = previewSlimeLevelUp(state, slimeId, 1);
    if (level?.available === true && gold.compare(level.totalCost) >= 0) {
      opportunities.push({ slimeId, kind: 'level', label: 'レベルアップ可能', priority: 10 });
    }
    return opportunities;
  }).sort((left, right) => right.priority - left.priority || left.slimeId.localeCompare(right.slimeId));
}

export function selectNavigationAttention(state: SlimeMercenariesState) {
  const upgrades = selectCampUpgradeOpportunities(state);
  const codex = selectCodexSummary(state);
  const slimesReady = codex.newCount > 0
    || upgrades.some((opportunity) => opportunity.kind !== 'level')
    || (state.gameData.combat.retryFarmClearsRemaining > 0 && upgrades.some((opportunity) => opportunity.kind === 'level'));
  const dispatchReady = Object.values(state.gameData.dispatch.contracts).some((contract) => contract.activity.status === 'completed-unclaimed');
  const forgeReady = readToken(state.tokens, ids.token.forgeKey) > 0;
  const summary = selectAttentionSummary([
    { id: 'nav.slimes', kind: 'slimes', urgency: 'action', priority: 30, available: slimesReady },
    { id: 'nav.dispatch', kind: 'dispatch', urgency: 'action', priority: 20, available: dispatchReady },
    { id: 'nav.forge', kind: 'forge', urgency: 'notice', priority: 10, available: forgeReady },
  ], state.simTimeSec);
  return new Set(summary.items.map((item) => item.kind));
}

function findMaxAffordableLevelCount(state: SlimeMercenariesState, slimeId: SlimeInstanceId): number {
  const slime = state.gameData.roster.slimes[slimeId];
  if (slime === undefined) return 0;
  const gold = readCurrency(state.currencies, ids.currency.gold);
  let affordable = 0;
  for (let count = 1; count <= 100; count += 1) {
    const preview = previewSlimeLevelUp(state, slimeId, count);
    if (preview === null || !preview.available || gold.compare(preview.totalCost) < 0) break;
    affordable = count;
  }
  return affordable;
}

function rewardLabelForContract(contractId: DispatchContractId): string {
  switch (contractId) {
    case 'roadEscort': return 'ゴールド';
    case 'forestExploration': return '鍛造キー';
    case 'materialGathering': return '進化素材';
  }
}
