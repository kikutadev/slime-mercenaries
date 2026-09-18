import type { CommandResult, DomainEvent } from 'idle-game-kit';
import type { JobSlimeId } from './definitions';
import type { SlimeInstanceId, SlimeMercenariesState, SlimeMutationId, SlimeProgress } from './state';

export type MutationEligibility = 'tier3' | 'tier2-plus' | 'magic-ranged-tier3' | 'selected-tier3';

export type MutationDefinition = Readonly<{
  id: SlimeMutationId;
  displayName: string;
  eligibility: MutationEligibility;
}>;

/**
 * Dragon origins are deliberately empty until content chooses the selected Tier-3 branches.
 * Keeping this data-driven avoids silently turning Dragon into a universal Tier-3 upgrade.
 */
export const dragonEligibleTypeIds: readonly JobSlimeId[] = [];

export const mutationDefinitions: Readonly<Record<SlimeMutationId, MutationDefinition>> = {
  king: { id: 'king', displayName: 'キングスライム', eligibility: 'tier3' },
  golden: { id: 'golden', displayName: 'ゴールデンスライム', eligibility: 'tier2-plus' },
  dragon: { id: 'dragon', displayName: 'ドラゴンスライム', eligibility: 'selected-tier3' },
  prism: { id: 'prism', displayName: 'プリズムスライム', eligibility: 'magic-ranged-tier3' },
};

const PRISM_TYPES = new Set<JobSlimeId>(['bow', 'wand', 'gun']);

export function isEligibleForMutation(slime: SlimeProgress, mutationId: SlimeMutationId): boolean {
  switch (mutationId) {
    case 'king': return slime.jobTier >= 3;
    case 'golden': return slime.jobTier >= 2;
    case 'dragon': return slime.jobTier >= 3 && dragonEligibleTypeIds.includes(slime.typeId);
    case 'prism': return slime.jobTier >= 3 && PRISM_TYPES.has(slime.typeId);
  }
}

export function previewSlimeMutation(
  state: SlimeMercenariesState,
  slimeId: SlimeInstanceId,
  mutationId: SlimeMutationId,
) {
  const slime = state.gameData.roster.slimes[slimeId];
  const progress = state.gameData.mutationProgress[mutationId];
  const eligible = slime !== undefined && slime.mutationId === null && isEligibleForMutation(slime, mutationId);
  return {
    slimeId,
    mutationId,
    owned: slime !== undefined,
    alreadyMutated: slime?.mutationId !== null && slime?.mutationId !== undefined,
    eligible,
    fragments: progress.fragments,
    catalysts: progress.catalysts,
    canMutate: eligible && progress.catalysts > 0,
  } as const;
}

/** Product reward hook used by rare events/cores and later deterministic backstop conversion. */
export function grantMutationCatalyst(
  state: SlimeMercenariesState,
  mutationId: SlimeMutationId,
  count = 1,
): SlimeMercenariesState {
  if (!Number.isSafeInteger(count) || count <= 0) throw new RangeError('Mutation catalyst count must be a positive safe integer.');
  const current = state.gameData.mutationProgress[mutationId];
  return {
    ...state,
    gameData: {
      ...state.gameData,
      mutationProgress: {
        ...state.gameData.mutationProgress,
        [mutationId]: { ...current, catalysts: current.catalysts + count },
      },
    },
  };
}

/** Fragment accumulation is durable even though conversion thresholds remain balance/content data. */
export function grantMutationFragments(
  state: SlimeMercenariesState,
  mutationId: SlimeMutationId,
  count: number,
): SlimeMercenariesState {
  if (!Number.isSafeInteger(count) || count <= 0) throw new RangeError('Mutation fragment count must be a positive safe integer.');
  const current = state.gameData.mutationProgress[mutationId];
  return {
    ...state,
    gameData: {
      ...state.gameData,
      mutationProgress: {
        ...state.gameData.mutationProgress,
        [mutationId]: { ...current, fragments: current.fragments + count },
      },
    },
  };
}

export function mutateSlime(
  state: SlimeMercenariesState,
  slimeId: SlimeInstanceId,
  mutationId: SlimeMutationId,
): CommandResult<SlimeMercenariesState, 'not-owned' | 'already-mutated' | 'not-eligible' | 'missing-catalyst'> {
  const slime = state.gameData.roster.slimes[slimeId];
  if (slime === undefined) return reject(state, 'not-owned');
  if (slime.mutationId !== null) return reject(state, 'already-mutated');
  if (!isEligibleForMutation(slime, mutationId)) return reject(state, 'not-eligible');
  const progress = state.gameData.mutationProgress[mutationId];
  if (progress.catalysts <= 0) return reject(state, 'missing-catalyst');

  const nextState: SlimeMercenariesState = {
    ...state,
    gameData: {
      ...state.gameData,
      mutationProgress: {
        ...state.gameData.mutationProgress,
        [mutationId]: { ...progress, catalysts: progress.catalysts - 1 },
      },
      roster: {
        ...state.gameData.roster,
        slimes: {
          ...state.gameData.roster.slimes,
          [slimeId]: { ...slime, mutationId },
        },
      },
    },
  };
  return {
    accepted: true,
    state: nextState,
    events: [semanticEvent(nextState, 'slimeMutated', `${slimeId}:${mutationId}`, {
      slimeId,
      typeId: slime.typeId,
      mutationId,
    })],
  };
}

function semanticEvent(
  state: SlimeMercenariesState,
  type: string,
  key: string,
  payload?: Readonly<Record<string, unknown>>,
): DomainEvent {
  return { id: `${type}:${key}:${state.simTimeSec}`, type, simTimeSec: state.simTimeSec, ...(payload === undefined ? {} : { payload }) };
}

function reject<TReason extends string>(state: SlimeMercenariesState, reason: TReason): CommandResult<SlimeMercenariesState, TReason> {
  return { accepted: false, state, events: [], reason };
}
