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
  type GameNumber,
} from 'idle-game-kit';
import {
  fusionStepDefinitions,
  ids,
  jobCreationDefinitions,
  plainSlimeBalance,
  resolveCurrencyDefinition,
  typeLevelDefinitions,
  type FusionStepDefinition,
  type JobSlimeId,
  type TokenRequirement,
} from './definitions';
import type { SlimeMercenariesState, SlimeProgress } from './state';

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
  resultKind: 'discover-job' | 'fusion-core';
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
  const existing = state.gameData.roster.slimes[jobId];
  const requirements: readonly TokenRequirement[] = [
    { tokenId: ids.token.plainSlime, count: definition.plainSlimeCount },
    { tokenId: definition.jobGearTokenId, count: definition.jobGearCount },
  ];
  const preview = requirements.map((requirement) => previewRequirement(state, requirement));
  return {
    jobId,
    isNewDiscovery: existing === undefined,
    resultKind: existing === undefined ? 'discover-job' : 'fusion-core',
    resultTokenId: existing === undefined ? null : definition.fusionCoreTokenId,
    requirements: preview,
    canCreate: preview.every((requirement) => requirement.missing === 0),
  };
}

/**
 * Consume Plain Slime + Job Gear atomically.
 * First creation adds one canonical roster record; later creations become Fusion Core input.
 */
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
  let tokens = spendRequirements(state.tokens, requirements);
  const existing = state.gameData.roster.slimes[jobId];

  if (existing !== undefined) {
    tokens = grantToken(tokens, definition.fusionCoreTokenId, 1);
    const nextState: SlimeMercenariesState = { ...state, tokens };
    return accept(nextState, [semanticEvent(nextState, 'slimeFusionCoreCreated', `${jobId}:${readToken(tokens, definition.fusionCoreTokenId)}`, {
      jobId,
      coreTokenId: definition.fusionCoreTokenId,
      coreCount: 1,
    })]);
  }

  const progress: SlimeProgress = {
    typeId: jobId,
    level: definition.startingLevel,
    jobTier: definition.startingJobTier,
    promotionPathId: null,
    fusionRank: 1,
    fusionFormId: 'base',
    assignment: 'reserve',
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
          [jobId]: progress,
        },
      },
    },
  };
  return accept(nextState, [semanticEvent(nextState, 'slimeJobDiscovered', jobId, {
    jobId,
    level: progress.level,
    jobTier: progress.jobTier,
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
  slimeId: JobSlimeId;
  step: FusionStepDefinition | null;
  levelMet: boolean;
  requirements: readonly TokenRequirementPreview[];
  canFuse: boolean;
}>;

/** Resolve the next authored Fusion step from the canonical rank without mutating state. */
export function previewSlimeFusion(
  state: SlimeMercenariesState,
  slimeId: JobSlimeId,
): SlimeFusionPreview {
  const slime = state.gameData.roster.slimes[slimeId];
  if (slime === undefined) {
    return { slimeId, step: null, levelMet: false, requirements: [], canFuse: false };
  }
  const step = fusionStepDefinitions[slimeId].find((candidate) => candidate.fromRank === slime.fusionRank) ?? null;
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
  slimeId: JobSlimeId,
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
  slimeId: JobSlimeId,
  count = 1,
) {
  const slime = state.gameData.roster.slimes[slimeId];
  if (slime === undefined) return null;
  return previewLevelUp({
    definition: typeLevelDefinitions[slimeId],
    currentLevel: slime.level,
    count,
  });
}

/** Spend Gold and update one canonical slime type level using the Kit-authored curve preview. */
export function levelUpSlime(
  state: SlimeMercenariesState,
  slimeId: JobSlimeId,
  count = 1,
): CommandResult<SlimeMercenariesState, 'invalid-count' | 'not-owned' | 'level-limit' | 'insufficient-gold'> {
  if (!isPositiveCount(count)) return reject(state, 'invalid-count');
  const slime = state.gameData.roster.slimes[slimeId];
  if (slime === undefined) return reject(state, 'not-owned');

  const preview = previewLevelUp({
    definition: typeLevelDefinitions[slimeId],
    currentLevel: slime.level,
    count,
  });
  if (!preview.available) return reject(state, 'level-limit');

  const spend = applyCurrencyTransaction(state.currencies, {
    currencyId: ids.currency.gold,
    amount: preview.totalCost,
    kind: 'spend',
    source: `level.${slimeId}`,
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
