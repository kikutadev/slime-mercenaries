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
  previewSlimePromotion,
  slimeCombatPower,
  type DispatchContractId,
  type JobSlimeId,
  type SlimeMercenariesState,
} from '../../domain';
import { FUSION_ITEMS, getSlimePresentation, getSlimePresentationForRank } from '../../game/slimes';

const JOB_IDS = Object.keys(jobCreationDefinitions) as JobSlimeId[];

export function selectGlobalHud(state: SlimeMercenariesState) {
  return {
    gold: formatGameNumber(readCurrency(state.currencies, ids.currency.gold)),
    forgeKeys: readToken(state.tokens, ids.token.forgeKey),
    areaLabel: 'クローバー街道',
    stageLabel: `${state.gameData.progression.currentStage}`,
  } as const;
}

export function selectEarlyGameCue(state: SlimeMercenariesState) {
  const sword = state.gameData.roster.slimes.sword;
  const plainStock = readToken(state.tokens, ids.token.plainSlime);
  if (sword === undefined) {
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

  const fusion = previewSlimeFusion(state, 'sword');
  if (fusion.canFuse) {
    return {
      title: '大剣士スライムへ合成',
      body: '必要素材とLv.10を満たしました。攻撃が横薙ぎの範囲攻撃へ変わります。',
      action: 'Fuse',
    } as const;
  }

  const duplicate = previewJobCreation(state, 'sword');
  if (!duplicate.isNewDiscovery && duplicate.canCreate && readToken(state.tokens, ids.token.swordCore) === 0) {
    return {
      title: '剣士スライムをもう一度作る',
      body: '発見済み職をもう一度作ると、同型を増やさず剣士の核へ変換されます。',
      action: 'Create Core',
    } as const;
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
    body: 'クローバー街道を進めて、大剣の原型と硬化ジェルを揃えます。',
    action: 'Battle',
  } as const;
}

export function selectOwnedSlimeIds(state: SlimeMercenariesState): readonly JobSlimeId[] {
  return JOB_IDS.filter((id) => state.gameData.roster.slimes[id] !== undefined);
}

export function selectSlimeDetail(state: SlimeMercenariesState, slimeId: JobSlimeId) {
  const slime = state.gameData.roster.slimes[slimeId];
  if (slime === undefined) return null;
  const presentation = getSlimePresentation(slime);
  const fusion = previewSlimeFusion(state, slimeId);
  const promotion = previewSlimePromotion(state, slimeId);
  const levelOne = previewSlimeLevelUp(state, slimeId, 1);
  const levelTen = previewSlimeLevelUp(state, slimeId, 10);
  const maxAffordableCount = findMaxAffordableLevelCount(state, slimeId);
  const levelMax = maxAffordableCount > 0 ? previewSlimeLevelUp(state, slimeId, maxAffordableCount) : null;
  const weapon = equippedWeaponDefinition(state, slimeId);
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
    name: presentation.name,
    role: presentation.role,
    asset: presentation.asset,
    icon: presentation.icon,
    tier: slime.jobTier,
    level: slime.level,
    fusionRank: slime.fusionRank,
    fusionFormId: slime.fusionFormId,
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
    promotion: promotion.step === null ? null : {
      canPromote: promotion.canPromote,
      levelMet: promotion.levelMet,
      minLevel: promotion.step.minLevel,
      resultName: promotion.step.resultDisplayName,
      goldCost: formatGameNumber(promotion.goldCost),
      canAffordGold: promotion.canAffordGold,
      requirements: promotion.requirements,
    },
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
    const presentation = slime === undefined ? getSlimePresentationForRank(slimeId, 1) : getSlimePresentation(slime);
    return {
      slotIndex,
      slimeId,
      name: presentation.name,
      icon: presentation.icon,
      assignment: slime?.assignment ?? null,
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
        name: presentation.name,
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

export function selectNavigationAttention(state: SlimeMercenariesState) {
  const owned = selectOwnedSlimeIds(state);
  const slimesReady = owned.some((slimeId) => previewSlimeFusion(state, slimeId).canFuse || previewSlimePromotion(state, slimeId).canPromote);
  const dispatchReady = Object.values(state.gameData.dispatch.contracts).some((contract) => contract.activity.status === 'completed-unclaimed');
  const forgeReady = readToken(state.tokens, ids.token.forgeKey) > 0;
  const summary = selectAttentionSummary([
    { id: 'nav.slimes', kind: 'slimes', urgency: 'action', priority: 30, available: slimesReady },
    { id: 'nav.dispatch', kind: 'dispatch', urgency: 'action', priority: 20, available: dispatchReady },
    { id: 'nav.forge', kind: 'forge', urgency: 'notice', priority: 10, available: forgeReady },
  ], state.simTimeSec);
  return new Set(summary.items.map((item) => item.kind));
}

function findMaxAffordableLevelCount(state: SlimeMercenariesState, slimeId: JobSlimeId): number {
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
