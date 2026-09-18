import {
  applyCurrencyTransaction,
  curveIntervalSum,
  grantToken,
  readCurrency,
  readToken,
  recordCurrencySpend,
  previewLevelUp,
  spendToken,
  type CommandResult,
  type DomainEvent,
  GameNumber,
} from 'idle-game-kit';
import {
  fusionStepDefinitions,
  ids,
  jobCreationDefinitions,
  plainSlimeBalance,
  promotionDefinitions,
  resolveCurrencyDefinition,
  typeLevelDefinitions,
  type FusionStepDefinition,
  type JobSlimeId,
  type PromotionDefinition,
  type TokenRequirement,
} from './definitions';
import { createSlimeWeaponLoadout, slimeInstanceIdForSerial, type SlimeInstanceId, type SlimeMercenariesState, type SlimeProgress } from './state';
import { isJobDiscovered, slimeIdsByType } from './roster';
import { markCodexDiscovery, promotionSlimeCodexId, tier1SlimeCodexId } from './codex';

export type TokenRequirementPreview = Readonly<{
  tokenId: string;
  required: number;
  owned: number;
  missing: number;
}>;

export type PlainSlimeCraftPreview = Readonly<{
  requestedCount: number;
  outputCount: number;
  requirements: readonly TokenRequirementPreview[];
  canCraft: boolean;
}>;

export type PlainSlimePurchasePreview = Readonly<{
  requestedCount: number;
  outputCount: number;
  totalCost: GameNumber;
  canAfford: boolean;
}>;

export type JobCreationPreview = Readonly<{
  jobId: JobSlimeId;
  isNewDiscovery: boolean;
  resultKind: 'discover-job' | 'recruit-duplicate';
  resultTokenId: string | null;
  requirements: readonly TokenRequirementPreview[];
  canCreate: boolean;
}>;

/** Return a UI/simulator-friendly craft preview from the same balance definition used by the command. */
export function previewPlainSlimeCraft(
  state: SlimeMercenariesState,
  requestedCount = 1,
): PlainSlimeCraftPreview {
  assertPositiveCount(requestedCount, 'requestedCount');
  const requirements = scaleRequirements(plainSlimeBalance.craft.recipe, requestedCount)
    .map((requirement) => previewRequirement(state, requirement));
  return {
    requestedCount,
    outputCount: safeMultiply(plainSlimeBalance.craft.outputCount, requestedCount),
    requirements,
    canCraft: requirements.every((requirement) => requirement.missing === 0),
  };
}

/** Craft Plain Slime stock atomically; no material is consumed when any recipe input is short. */
export function craftPlainSlime(
  state: SlimeMercenariesState,
  requestedCount = 1,
): CommandResult<SlimeMercenariesState, 'invalid-count' | 'insufficient-materials'> {
  if (!isPositiveCount(requestedCount)) return reject(state, 'invalid-count');
  const preview = previewPlainSlimeCraft(state, requestedCount);
  if (!preview.canCraft) return reject(state, 'insufficient-materials');

  const spent = spendRequirements(
    state.tokens,
    scaleRequirements(plainSlimeBalance.craft.recipe, requestedCount),
  );
  const outputCount = preview.outputCount;
  const nextState: SlimeMercenariesState = {
    ...state,
    tokens: grantToken(spent, ids.token.plainSlime, outputCount),
  };

  return accept(nextState, [semanticEvent(nextState, 'plainSlimeCrafted', `${readToken(nextState.tokens, ids.token.plainSlime)}`, {
    requestedCount,
    outputCount,
  })]);
}

/** Compute the exact current shop cost from the authored price curve and purchase history. */
export function plainSlimePurchaseCost(
  state: SlimeMercenariesState,
  requestedCount = 1,
): GameNumber {
  assertPositiveCount(requestedCount, 'requestedCount');
  return curveIntervalSum(
    plainSlimeBalance.shop.costCurve,
    state.gameData.economy.plainSlimeShopPurchaseCount,
    requestedCount,
  );
}

/** Return the same cost/affordability information used by the atomic purchase command. */
export function previewPlainSlimePurchase(
  state: SlimeMercenariesState,
  requestedCount = 1,
): PlainSlimePurchasePreview {
  const totalCost = plainSlimePurchaseCost(state, requestedCount);
  return {
    requestedCount,
    outputCount: safeMultiply(plainSlimeBalance.shop.outputCount, requestedCount),
    totalCost,
    canAfford: readCurrency(state.currencies, ids.currency.gold).compare(totalCost) >= 0,
  };
}

/** Buy renewable Plain Slime stock with Gold using a balance-authored bulk price curve. */
export function buyPlainSlime(
  state: SlimeMercenariesState,
  requestedCount = 1,
): CommandResult<SlimeMercenariesState, 'invalid-count' | 'insufficient-gold'> {
  if (!isPositiveCount(requestedCount)) return reject(state, 'invalid-count');
  const preview = previewPlainSlimePurchase(state, requestedCount);
  if (!preview.canAfford) return reject(state, 'insufficient-gold');

  const spend = applyCurrencyTransaction(state.currencies, {
    currencyId: ids.currency.gold,
    amount: preview.totalCost,
    kind: 'spend',
    source: 'shop.plain-slime',
  }, resolveCurrencyDefinition(ids.currency.gold));
  if (!spend.accepted) return reject(state, 'insufficient-gold');

  const purchaseCount = state.gameData.economy.plainSlimeShopPurchaseCount + requestedCount;
  let nextState: SlimeMercenariesState = {
    ...state,
    currencies: spend.balances,
    tokens: grantToken(state.tokens, ids.token.plainSlime, preview.outputCount),
    gameData: {
      ...state.gameData,
      economy: {
        ...state.gameData.economy,
        plainSlimeShopPurchaseCount: purchaseCount,
      },
    },
  };
  nextState = recordCurrencySpend(nextState, ids.currency.gold, spend.appliedAmount);

  return accept(nextState, [semanticEvent(nextState, 'plainSlimePurchased', `${purchaseCount}`, {
    requestedCount,
    outputCount: preview.outputCount,
    totalCost: spend.appliedAmount.serialize(),
  })]);
}

/** Preview normal-job creation without mutating roster or inventory. */
export function previewJobCreation(
  state: SlimeMercenariesState,
  jobId: JobSlimeId,
): JobCreationPreview {
  const definition = jobCreationDefinitions[jobId];
  const discovered = isJobDiscovered(state, jobId);
  const requirements: readonly TokenRequirement[] = [
    { tokenId: ids.token.plainSlime, count: definition.plainSlimeCount },
    { tokenId: definition.jobGearTokenId, count: definition.jobGearCount },
  ];
  const preview = requirements.map((requirement) => previewRequirement(state, requirement));
  return {
    jobId,
    isNewDiscovery: !discovered,
    resultKind: discovered ? 'recruit-duplicate' : 'discover-job',
    resultTokenId: null,
    requirements: preview,
    canCreate: preview.every((requirement) => requirement.missing === 0),
  };
}

/** Consume Plain Slime + Job Gear atomically and always create one persistent slime body. */
export function createJobSlime(
  state: SlimeMercenariesState,
  jobId: JobSlimeId,
): CommandResult<SlimeMercenariesState, 'insufficient-inputs'> {
  const definition = jobCreationDefinitions[jobId];
  const preview = previewJobCreation(state, jobId);
  if (!preview.canCreate) return reject(state, 'insufficient-inputs');

  const requirements: readonly TokenRequirement[] = [
    { tokenId: ids.token.plainSlime, count: definition.plainSlimeCount },
    { tokenId: definition.jobGearTokenId, count: definition.jobGearCount },
  ];
  const tokens = spendRequirements(state.tokens, requirements);
  const serial = state.gameData.roster.nextSlimeSerial;
  const slimeId = slimeInstanceIdForSerial(serial);
  const progress: SlimeProgress = {
    id: slimeId,
    serial,
    typeId: jobId,
    level: definition.startingLevel,
    jobTier: definition.startingJobTier,
    promotionPathId: null,
    fusionRank: 1,
    fusionFormId: 'base',
    mutationId: null,
    assignment: 'reserve',
  };
  let nextState: SlimeMercenariesState = {
    ...state,
    tokens,
    gameData: {
      ...state.gameData,
      equipment: {
        ...state.gameData.equipment,
        loadouts: { ...state.gameData.equipment.loadouts, [slimeId]: createSlimeWeaponLoadout(jobId) },
      },
      roster: {
        ...state.gameData.roster,
        slimes: { ...state.gameData.roster.slimes, [slimeId]: progress },
        nextSlimeSerial: serial + 1,
      },
    },
  };
  nextState = markCodexDiscovery(nextState, 'slime-form', tier1SlimeCodexId(jobId));
  const eventType = preview.isNewDiscovery ? 'slimeJobDiscovered' : 'slimeJobCreated';
  return accept(nextState, [semanticEvent(nextState, eventType, slimeId, {
    slimeId,
    jobId,
    typeId: jobId,
    level: progress.level,
    jobTier: progress.jobTier,
  })]);
}

/** Explicitly convert one spare reserve body into that family's Fusion Core. */
export function convertDuplicateToFusionCore(
  state: SlimeMercenariesState,
  slimeId: SlimeInstanceId,
): CommandResult<SlimeMercenariesState, 'not-owned' | 'not-reserve' | 'last-of-type'> {
  const slime = state.gameData.roster.slimes[slimeId];
  if (slime === undefined) return reject(state, 'not-owned');
  if (slime.assignment !== 'reserve') return reject(state, 'not-reserve');
  if (slimeIdsByType(state, slime.typeId).length <= 1) return reject(state, 'last-of-type');

  const definition = jobCreationDefinitions[slime.typeId];
  const slimes = { ...state.gameData.roster.slimes };
  delete slimes[slimeId];
  const loadouts = { ...state.gameData.equipment.loadouts };
  delete loadouts[slimeId];
  const tokens = grantToken(state.tokens, definition.fusionCoreTokenId, 1);
  const nextState: SlimeMercenariesState = {
    ...state,
    tokens,
    gameData: {
      ...state.gameData,
      equipment: { ...state.gameData.equipment, loadouts },
      roster: { ...state.gameData.roster, slimes },
    },
  };
  return accept(nextState, [semanticEvent(nextState, 'slimeConvertedToFusionCore', slimeId, {
    slimeId, typeId: slime.typeId, coreTokenId: definition.fusionCoreTokenId, coreCount: 1,
  })]);
}

function previewRequirement(state: SlimeMercenariesState, requirement: TokenRequirement): TokenRequirementPreview {
  const owned = readToken(state.tokens, requirement.tokenId);
  return {
    tokenId: requirement.tokenId,
    required: requirement.count,
    owned,
    missing: Math.max(0, requirement.count - owned),
  };
}

function scaleRequirements(
  requirements: readonly TokenRequirement[],
  multiplier: number,
): readonly TokenRequirement[] {
  return requirements.map((requirement) => ({
    tokenId: requirement.tokenId,
    count: safeMultiply(requirement.count, multiplier),
  }));
}

/** Spend a fully prevalidated token recipe. A defensive failure indicates a command bug. */
function spendRequirements(
  tokens: SlimeMercenariesState['tokens'],
  requirements: readonly TokenRequirement[],
): SlimeMercenariesState['tokens'] {
  for (const requirement of requirements) {
    if (readToken(tokens, requirement.tokenId) < requirement.count) {
      throw new Error(`Token recipe was not prevalidated: ${requirement.tokenId}`);
    }
  }
  let next = tokens;
  for (const requirement of requirements) {
    const spent = spendToken(next, requirement.tokenId, requirement.count);
    if (!spent.accepted) throw new Error(`Prevalidated token spend failed: ${requirement.tokenId}`);
    next = spent.tokens;
  }
  return next;
}

function semanticEvent(
  state: SlimeMercenariesState,
  type: string,
  key: string,
  payload?: Readonly<Record<string, unknown>>,
): DomainEvent {
  return {
    id: `${type}:${key}:${state.simTimeSec}`,
    type,
    simTimeSec: state.simTimeSec,
    ...(payload === undefined ? {} : { payload }),
  };
}

function safeMultiply(left: number, right: number): number {
  const result = left * right;
  if (!Number.isSafeInteger(result) || result < 0) throw new RangeError('Token count exceeds safe integer range.');
  return result;
}

function isPositiveCount(value: number): boolean {
  return Number.isSafeInteger(value) && value > 0;
}

function assertPositiveCount(value: number, label: string): void {
  if (!isPositiveCount(value)) throw new RangeError(`${label} must be a positive safe integer.`);
}

function accept(
  state: SlimeMercenariesState,
  events: readonly DomainEvent[],
): CommandResult<SlimeMercenariesState, never> {
  return { accepted: true, state, events };
}

function reject<TReason extends string>(
  state: SlimeMercenariesState,
  reason: TReason,
): CommandResult<SlimeMercenariesState, TReason> {
  return { accepted: false, state, events: [], reason };
}

export type SlimeFusionPreview = Readonly<{
  slimeId: SlimeInstanceId;
  step: FusionStepDefinition | null;
  levelMet: boolean;
  requirements: readonly TokenRequirementPreview[];
  canFuse: boolean;
}>;

/** Resolve the next authored Fusion step from the canonical rank without mutating state. */
export function previewSlimeFusion(
  state: SlimeMercenariesState,
  slimeId: SlimeInstanceId,
): SlimeFusionPreview {
  const slime = state.gameData.roster.slimes[slimeId];
  if (slime === undefined) {
    return { slimeId, step: null, levelMet: false, requirements: [], canFuse: false };
  }
  const step = fusionStepDefinitions[slime.typeId].find((candidate) => candidate.fromRank === slime.fusionRank) ?? null;
  if (step === null) {
    return { slimeId, step: null, levelMet: true, requirements: [], canFuse: false };
  }
  const requirements = step.recipe.map((requirement) => previewRequirement(state, requirement));
  const levelMet = slime.level >= step.minLevel;
  return {
    slimeId,
    step,
    levelMet,
    requirements,
    canFuse: levelMet && requirements.every((requirement) => requirement.missing === 0),
  };
}

/**
 * Apply one Fusion recipe atomically. Fusion changes only fusionRank/form and never consumes
 * a promotion tier, which keeps Greatsword independent from Fighter promotion.
 */
export function fuseSlime(
  state: SlimeMercenariesState,
  slimeId: SlimeInstanceId,
): CommandResult<SlimeMercenariesState, 'not-owned' | 'max-rank' | 'level-too-low' | 'insufficient-materials'> {
  const slime = state.gameData.roster.slimes[slimeId];
  if (slime === undefined) return reject(state, 'not-owned');
  const preview = previewSlimeFusion(state, slimeId);
  if (preview.step === null) return reject(state, 'max-rank');
  if (!preview.levelMet) return reject(state, 'level-too-low');
  if (!preview.canFuse) return reject(state, 'insufficient-materials');

  const tokens = spendRequirements(state.tokens, preview.step.recipe);
  const updated: SlimeProgress = {
    ...slime,
    fusionRank: preview.step.toRank,
    fusionFormId: preview.step.resultFusionFormId,
  };
  const nextState: SlimeMercenariesState = {
    ...state,
    tokens,
    gameData: {
      ...state.gameData,
      roster: {
        ...state.gameData.roster,
        slimes: {
          ...state.gameData.roster.slimes,
          [slimeId]: updated,
        },
      },
    },
  };
  return accept(nextState, [semanticEvent(nextState, 'slimeFused', preview.step.id, {
    slimeId,
    fusionStepId: preview.step.id,
    fusionRank: preview.step.toRank,
    fusionFormId: preview.step.resultFusionFormId,
    behaviorUnlockId: preview.step.behaviorUnlockId,
  })]);
}

/** Return the Kit Level preview that both UI and simulator should display/use. */
export function previewSlimeLevelUp(
  state: SlimeMercenariesState,
  slimeId: SlimeInstanceId,
  count = 1,
) {
  const slime = state.gameData.roster.slimes[slimeId];
  if (slime === undefined) return null;
  return previewLevelUp({
    definition: typeLevelDefinitions[slime.typeId],
    currentLevel: slime.level,
    count,
  });
}

/** Spend Gold and update one slime instance level using the Kit-authored curve preview. */
export function levelUpSlime(
  state: SlimeMercenariesState,
  slimeId: SlimeInstanceId,
  count = 1,
): CommandResult<SlimeMercenariesState, 'invalid-count' | 'not-owned' | 'level-limit' | 'insufficient-gold'> {
  if (!isPositiveCount(count)) return reject(state, 'invalid-count');
  const slime = state.gameData.roster.slimes[slimeId];
  if (slime === undefined) return reject(state, 'not-owned');

  const preview = previewLevelUp({
    definition: typeLevelDefinitions[slime.typeId],
    currentLevel: slime.level,
    count,
  });
  if (!preview.available) return reject(state, 'level-limit');

  const spend = applyCurrencyTransaction(state.currencies, {
    currencyId: ids.currency.gold,
    amount: preview.totalCost,
    kind: 'spend',
    source: `level.${slime.typeId}`,
  }, resolveCurrencyDefinition(ids.currency.gold));
  if (!spend.accepted) return reject(state, 'insufficient-gold');

  const updated: SlimeProgress = { ...slime, level: preview.targetLevel };
  let nextState: SlimeMercenariesState = {
    ...state,
    currencies: spend.balances,
    gameData: {
      ...state.gameData,
      roster: {
        ...state.gameData.roster,
        slimes: {
          ...state.gameData.roster.slimes,
          [slimeId]: updated,
        },
      },
    },
  };
  nextState = recordCurrencySpend(nextState, ids.currency.gold, spend.appliedAmount);

  return accept(nextState, [semanticEvent(nextState, 'slimeLeveled', `${slimeId}:${preview.targetLevel}`, {
    slimeId,
    levelBefore: preview.currentLevel,
    levelAfter: preview.targetLevel,
    count: preview.count,
    totalCost: spend.appliedAmount.serialize(),
  })]);
}


export type SlimePromotionPreview = Readonly<{
  slimeId: SlimeInstanceId;
  step: PromotionDefinition | null;
  levelMet: boolean;
  goldCost: GameNumber;
  canAffordGold: boolean;
  requirements: readonly TokenRequirementPreview[];
  canPromote: boolean;
}>;

function promotionPreviewForStep(
  state: SlimeMercenariesState,
  slimeId: SlimeInstanceId,
  step: PromotionDefinition,
): SlimePromotionPreview {
  const slime = state.gameData.roster.slimes[slimeId];
  if (slime === undefined) {
    return { slimeId, step: null, levelMet: false, goldCost: GameNumber.zero(), canAffordGold: false, requirements: [], canPromote: false };
  }
  const requirements = step.recipe.map((requirement) => previewRequirement(state, requirement));
  const goldCost = GameNumber.from(step.goldCost);
  const levelMet = slime.level >= step.minLevel;
  const canAffordGold = readCurrency(state.currencies, ids.currency.gold).compare(goldCost) >= 0;
  return {
    slimeId, step, levelMet, goldCost, canAffordGold, requirements,
    canPromote: levelMet && canAffordGold && requirements.every((requirement) => requirement.missing === 0),
  };
}

/** Return every authored branch available from the slime's current job tier. */
export function previewSlimePromotions(
  state: SlimeMercenariesState,
  slimeId: SlimeInstanceId,
): readonly SlimePromotionPreview[] {
  const slime = state.gameData.roster.slimes[slimeId];
  if (slime === undefined) return [];
  return promotionDefinitions[slime.typeId]
    .filter((candidate) => candidate.fromTier === slime.jobTier)
    .map((step) => promotionPreviewForStep(state, slimeId, step));
}

/** Compatibility preview for tiers with exactly one next promotion. */
export function previewSlimePromotion(
  state: SlimeMercenariesState,
  slimeId: SlimeInstanceId,
  promotionId?: string,
): SlimePromotionPreview {
  const choices = previewSlimePromotions(state, slimeId);
  const selected = promotionId === undefined
    ? (choices.length === 1 ? choices[0] : undefined)
    : choices.find((choice) => choice.step?.id === promotionId);
  return selected ?? {
    slimeId,
    step: null,
    levelMet: state.gameData.roster.slimes[slimeId] !== undefined,
    goldCost: GameNumber.zero(),
    canAffordGold: true,
    requirements: [],
    canPromote: false,
  };
}

export function promoteSlime(
  state: SlimeMercenariesState,
  slimeId: SlimeInstanceId,
  promotionId?: string,
): CommandResult<SlimeMercenariesState, 'not-owned' | 'max-tier' | 'promotion-choice-required' | 'invalid-promotion' | 'level-too-low' | 'insufficient-materials' | 'insufficient-gold'> {
  const slime = state.gameData.roster.slimes[slimeId];
  if (slime === undefined) return reject(state, 'not-owned');
  const choices = previewSlimePromotions(state, slimeId);
  if (choices.length === 0) return reject(state, 'max-tier');
  if (promotionId === undefined && choices.length > 1) return reject(state, 'promotion-choice-required');
  const preview = promotionId === undefined
    ? choices[0]!
    : choices.find((choice) => choice.step?.id === promotionId);
  if (preview === undefined || preview.step === null) return reject(state, 'invalid-promotion');
  if (!preview.levelMet) return reject(state, 'level-too-low');
  if (preview.requirements.some((requirement) => requirement.missing > 0)) return reject(state, 'insufficient-materials');
  if (!preview.canAffordGold) return reject(state, 'insufficient-gold');

  const spend = applyCurrencyTransaction(state.currencies, {
    currencyId: ids.currency.gold, amount: preview.goldCost, kind: 'spend', source: preview.step.id,
  }, resolveCurrencyDefinition(ids.currency.gold));
  if (!spend.accepted) return reject(state, 'insufficient-gold');

  const tokens = spendRequirements(state.tokens, preview.step.recipe);
  const updated: SlimeProgress = { ...slime, jobTier: preview.step.toTier, promotionPathId: preview.step.resultPathId };
  let nextState: SlimeMercenariesState = {
    ...state, currencies: spend.balances, tokens,
    gameData: {
      ...state.gameData,
      roster: { ...state.gameData.roster, slimes: { ...state.gameData.roster.slimes, [slimeId]: updated } },
    },
  };
  nextState = recordCurrencySpend(nextState, ids.currency.gold, spend.appliedAmount);
  nextState = markCodexDiscovery(nextState, 'slime-form', promotionSlimeCodexId(preview.step.resultPathId));
  return accept(nextState, [semanticEvent(nextState, 'slimePromoted', preview.step.id, {
    slimeId, promotionId: preview.step.id, jobTier: preview.step.toTier, promotionPathId: preview.step.resultPathId,
    fusionRank: updated.fusionRank, fusionFormId: updated.fusionFormId,
  })]);
}
