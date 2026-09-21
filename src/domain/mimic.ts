import { readToken, spendToken, type CommandResult, type DomainEvent } from 'idle-game-kit';
import { ids } from './definitions';
import { markCodexDiscovery, mutationSlimeCodexId } from './codex';
import { firstSlimeByType, ownedSlimes } from './roster';
import {
  createSlimeWeaponLoadout,
  slimeInstanceIdForSerial,
  type SlimeMercenariesState,
  type SlimeProgress,
} from './state';

export const MIMIC_HEART_COST = 1;

export type MimicCapturePreview = Readonly<{
  alreadyOwned: boolean;
  hearts: number;
  heartCost: number;
  canCapture: boolean;
  captureLevel: number;
}>;

/**
 * Mimic is a captured special body, not a mutation applied to one of the six normal jobs.
 * It joins at the strongest owned slime's level so a late-world rare capture is immediately usable.
 */
export function previewMimicCapture(state: SlimeMercenariesState): MimicCapturePreview {
  const alreadyOwned = firstSlimeByType(state, 'mimic') !== null;
  const hearts = readToken(state.tokens, ids.token.mimicHeart);
  const captureLevel = Math.max(1, ...ownedSlimes(state).map((slime) => slime.level));
  return {
    alreadyOwned,
    hearts,
    heartCost: MIMIC_HEART_COST,
    canCapture: !alreadyOwned && hearts >= MIMIC_HEART_COST,
    captureLevel,
  };
}

export function captureMimic(
  state: SlimeMercenariesState,
): CommandResult<SlimeMercenariesState, 'already-owned' | 'missing-heart'> {
  const preview = previewMimicCapture(state);
  if (preview.alreadyOwned) return reject(state, 'already-owned');

  const spent = spendToken(state.tokens, ids.token.mimicHeart, MIMIC_HEART_COST);
  if (!spent.accepted) return reject(state, 'missing-heart');

  const serial = state.gameData.roster.nextSlimeSerial;
  const slimeId = slimeInstanceIdForSerial(serial);
  const progress: SlimeProgress = {
    id: slimeId,
    serial,
    typeId: 'mimic',
    level: preview.captureLevel,
    jobTier: 3,
    fusionRank: 1,
    fusionFormId: 'mimic',
    mutationId: null,
    assignment: 'reserve',
  };

  let nextState: SlimeMercenariesState = {
    ...state,
    tokens: spent.tokens,
    gameData: {
      ...state.gameData,
      equipment: {
        ...state.gameData.equipment,
        loadouts: {
          ...state.gameData.equipment.loadouts,
          [slimeId]: createSlimeWeaponLoadout('mimic'),
        },
      },
      roster: {
        ...state.gameData.roster,
        slimes: { ...state.gameData.roster.slimes, [slimeId]: progress },
        nextSlimeSerial: serial + 1,
      },
    },
  };
  nextState = markCodexDiscovery(nextState, 'slime-form', mutationSlimeCodexId('mimic'));

  return {
    accepted: true,
    state: nextState,
    events: [semanticEvent(nextState, 'mimicCaptured', slimeId, {
      slimeId,
      typeId: 'mimic',
      level: progress.level,
      consumedTokenId: ids.token.mimicHeart,
      consumedCount: MIMIC_HEART_COST,
    })],
  };
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

function reject<TReason extends string>(
  state: SlimeMercenariesState,
  reason: TReason,
): CommandResult<SlimeMercenariesState, TReason> {
  return { accepted: false, state, events: [], reason };
}
