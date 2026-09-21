import { GameNumber, type CommandResult } from 'idle-game-kit';
import {
  NORMAL_JOB_SLIME_IDS,
  assignSlimeToFormation,
  createInitialSlimeMercenariesState,
  createJobSlime,
  firstSlimeIdByType,
  ids,
  jobCreationDefinitions,
  withHighestStageClearedForArea,
  type SlimeInstanceId,
  type SlimeMercenariesState,
} from '../domain';

/**
 * Validation builds expose internal QA shortcuts with ?validation-tools=1.
 * Economy mode is a separate runtime user setting and is never decided by this flag after bootstrap.
 */
export const PUBLIC_VALIDATION_MODE = import.meta.env.VITE_VALIDATION_MODE !== 'false';

/**
 * Keep validation-only shortcuts out of the product presentation by default.
 * Internal/headless QA can opt in with ?validation-tools=1. Runtime economy mode is configured
 * separately from this QA surface.
 */
export function validationToolsVisible(): boolean {
  if (!PUBLIC_VALIDATION_MODE || typeof window === 'undefined') return false;
  return new URLSearchParams(window.location.search).get('validation-tools') === '1';
}

const VALIDATION_GOLD = GameNumber.from(1_000_000_000_000);
const VALIDATION_TOKEN_COUNT = 1_000_000;
const VALIDATION_TOKEN_IDS = Object.values(ids.token);

/**
 * Application-only replenishment policy. Product commands still validate and spend the authored
 * costs; this policy restores a large floor immediately afterwards so validation never runs out.
 */
export function hasLegacyDevelopmentSandboxResources(state: SlimeMercenariesState): boolean {
  const gold = GameNumber.deserialize(state.currencies[ids.currency.gold] ?? GameNumber.zero().serialize());
  return gold.compare(VALIDATION_GOLD) >= 0
    && VALIDATION_TOKEN_IDS.every((tokenId) => (state.tokens[tokenId] ?? 0) >= VALIDATION_TOKEN_COUNT);
}

/**
 * Public validation builds before runtime settings persisted the artificial resource floor into the
 * save itself. Strip that one-time legacy subsidy while preserving roster/progression.
 */
export function stripLegacyDevelopmentSandboxResources(state: SlimeMercenariesState): SlimeMercenariesState {
  if (!hasLegacyDevelopmentSandboxResources(state)) return state;
  const initial = createInitialSlimeMercenariesState(state.lastWallClockMs);
  return {
    ...state,
    currencies: initial.currencies,
    tokens: initial.tokens,
  };
}

export function applyDevelopmentSandboxResources(state: SlimeMercenariesState): SlimeMercenariesState {
  let changed = false;
  const currentGold = GameNumber.deserialize(state.currencies[ids.currency.gold] ?? GameNumber.zero().serialize());
  const currencies = currentGold.compare(VALIDATION_GOLD) >= 0
    ? state.currencies
    : (() => {
        changed = true;
        return { ...state.currencies, [ids.currency.gold]: VALIDATION_GOLD.serialize() };
      })();

  let tokens: Readonly<Record<string, number>> | Record<string, number> = state.tokens;
  for (const tokenId of VALIDATION_TOKEN_IDS) {
    if ((tokens[tokenId] ?? 0) >= VALIDATION_TOKEN_COUNT) continue;
    if (tokens === state.tokens) tokens = { ...state.tokens };
    (tokens as Record<string, number>)[tokenId] = VALIDATION_TOKEN_COUNT;
    changed = true;
  }

  return changed ? { ...state, currencies, tokens } : state;
}

export function setValidationSlimeLevel(
  state: SlimeMercenariesState,
  slimeId: SlimeInstanceId,
  level = 40,
): CommandResult<SlimeMercenariesState, 'validation-mode-disabled' | 'not-owned'> {
  if (!PUBLIC_VALIDATION_MODE) return { accepted: false, state, events: [], reason: 'validation-mode-disabled' };
  const slime = state.gameData.roster.slimes[slimeId];
  if (slime === undefined) return { accepted: false, state, events: [], reason: 'not-owned' };
  const next = applyDevelopmentSandboxResources({
    ...state,
    gameData: {
      ...state.gameData,
      roster: {
        ...state.gameData.roster,
        slimes: { ...state.gameData.roster.slimes, [slimeId]: { ...slime, level } },
      },
    },
  });
  return { accepted: true, state: next, events: [] };
}

export function resetValidationSlimeProgress(
  state: SlimeMercenariesState,
  slimeId: SlimeInstanceId,
): CommandResult<SlimeMercenariesState, 'validation-mode-disabled' | 'not-owned'> {
  if (!PUBLIC_VALIDATION_MODE) return { accepted: false, state, events: [], reason: 'validation-mode-disabled' };
  const slime = state.gameData.roster.slimes[slimeId];
  if (slime === undefined) return { accepted: false, state, events: [], reason: 'not-owned' };
  const next = applyDevelopmentSandboxResources({
    ...state,
    gameData: {
      ...state.gameData,
      roster: {
        ...state.gameData.roster,
        slimes: {
          ...state.gameData.roster.slimes,
          [slimeId]: { ...slime, level: 1, jobTier: 1, fusionRank: 1, fusionFormId: 'base' },
        },
      },
    },
  });
  return { accepted: true, state: next, events: [] };
}

export function resetValidationBattle(
  state: SlimeMercenariesState,
): CommandResult<SlimeMercenariesState, 'validation-mode-disabled'> {
  if (!PUBLIC_VALIDATION_MODE) return { accepted: false, state, events: [], reason: 'validation-mode-disabled' };
  const next = applyDevelopmentSandboxResources({
    ...state,
    gameData: {
      ...state.gameData,
      progression: {
        ...withHighestStageClearedForArea(state.gameData.progression, state.gameData.progression.currentAreaId, 0),
        currentStage: 1,
      },
      combat: {
        ...state.gameData.combat,
        currentWaveIndex: 0,
        waveWorkRemaining: null,
        retryFarmClearsRemaining: 0,
        frontierDefeatTimeRemainingSec: null,
        contentBoundaryReached: false,
      },
    },
  });
  return { accepted: true, state: next, events: [] };
}

export function prepareValidationRoster(
  state: SlimeMercenariesState,
): CommandResult<SlimeMercenariesState, 'validation-mode-disabled' | 'job-create-failed' | 'formation-failed'> {
  if (!PUBLIC_VALIDATION_MODE) return { accepted: false, state, events: [], reason: 'validation-mode-disabled' };

  let next = applyDevelopmentSandboxResources(state);
  for (const typeId of NORMAL_JOB_SLIME_IDS) {
    if (firstSlimeIdByType(next, typeId) !== null) continue;
    const progression = next.gameData.progression;
    const commandState: SlimeMercenariesState = {
      ...next,
      gameData: {
        ...next.gameData,
        progression: { ...progression, currentAreaId: jobCreationDefinitions[typeId].unlockAreaId },
      },
    };
    const created = createJobSlime(commandState, typeId);
    if (!created.accepted) return { accepted: false, state, events: [], reason: 'job-create-failed' };
    next = applyDevelopmentSandboxResources({
      ...created.state,
      gameData: { ...created.state.gameData, progression },
    });
  }

  for (const [slotIndex, typeId] of NORMAL_JOB_SLIME_IDS.entries()) {
    const slimeId = firstSlimeIdByType(next, typeId);
    if (slimeId === null) return { accepted: false, state, events: [], reason: 'formation-failed' };
    const assigned = assignSlimeToFormation(next, slimeId, slotIndex);
    if (!assigned.accepted) return { accepted: false, state, events: [], reason: 'formation-failed' };
    next = assigned.state;
  }

  return { accepted: true, state: applyDevelopmentSandboxResources(next), events: [] };
}
