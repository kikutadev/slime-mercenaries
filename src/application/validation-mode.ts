import { GameNumber, type CommandResult } from 'idle-game-kit';
import {
  NORMAL_JOB_SLIME_IDS,
  assignSlimeToFormation,
  createJobSlime,
  firstSlimeIdByType,
  ids,
  jobCreationDefinitions,
  withAreaUnlocked,
  withHighestStageClearedForArea,
  type SlimeInstanceId,
  type SlimeMercenariesState,
} from '../domain';

/**
 * Current public build is intentionally a content-validation sandbox.
 * Set VITE_VALIDATION_MODE=false when switching the public deployment to the real economy.
 */
export const PUBLIC_VALIDATION_MODE = import.meta.env.VITE_VALIDATION_MODE !== 'false';

const VALIDATION_GOLD = GameNumber.from(1_000_000_000_000);
const VALIDATION_TOKEN_COUNT = 1_000_000;
const VALIDATION_TOKEN_IDS = Object.values(ids.token);

/**
 * Application-only replenishment policy. Product commands still validate and spend the authored
 * costs; this policy restores a large floor immediately afterwards so validation never runs out.
 */
export function applyValidationSandboxResources(state: SlimeMercenariesState): SlimeMercenariesState {
  if (!PUBLIC_VALIDATION_MODE) return state;

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
  const next = applyValidationSandboxResources({
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
  const next = applyValidationSandboxResources({
    ...state,
    gameData: {
      ...state.gameData,
      roster: {
        ...state.gameData.roster,
        slimes: {
          ...state.gameData.roster.slimes,
          [slimeId]: { ...slime, level: 1, jobTier: 1, promotionPathId: null, fusionRank: 1, fusionFormId: 'base' },
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
  const next = applyValidationSandboxResources({
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

  let next = applyValidationSandboxResources(state);
  let progression = next.gameData.progression;
  for (const typeId of NORMAL_JOB_SLIME_IDS) {
    progression = withAreaUnlocked(progression, jobCreationDefinitions[typeId].unlockAreaId);
  }
  // Tier-3 validation needs the earliest authored crest area without changing production gates.
  progression = withAreaUnlocked(progression, 'area.sunken-marsh');
  next = { ...next, gameData: { ...next.gameData, progression } };
  const events = [];
  for (const typeId of NORMAL_JOB_SLIME_IDS) {
    if (firstSlimeIdByType(next, typeId) !== null) continue;
    const created = createJobSlime(next, typeId);
    if (!created.accepted) return { accepted: false, state, events: [], reason: 'job-create-failed' };
    next = applyValidationSandboxResources(created.state);
    events.push(...created.events);
  }

  for (const [slotIndex, typeId] of NORMAL_JOB_SLIME_IDS.entries()) {
    const slimeId = firstSlimeIdByType(next, typeId);
    if (slimeId === null) return { accepted: false, state, events: [], reason: 'formation-failed' };
    const assigned = assignSlimeToFormation(next, slimeId, slotIndex);
    if (!assigned.accepted) return { accepted: false, state, events: [], reason: 'formation-failed' };
    next = assigned.state;
    events.push(...assigned.events);
  }

  return { accepted: true, state: applyValidationSandboxResources(next), events };
}
