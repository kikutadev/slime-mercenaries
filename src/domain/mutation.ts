import type { CommandResult, DomainEvent } from 'idle-game-kit';
import { balance } from './balance';
import type { JobSlimeId } from './definitions';
import { markCodexDiscovery, mutationSlimeCodexId } from './codex';
import type { SlimeInstanceId, SlimeMercenariesState, SlimeMutationId, SlimeProgress } from './state';

export type MutationEligibility = 'tier3' | 'tier2-plus' | 'magic-ranged-tier3' | 'selected-tier3';

export type MutationDefinition = Readonly<{
  id: SlimeMutationId;
  displayName: string;
  eligibility: MutationEligibility;
  identity: string;
  fragmentName: string;
  fragmentThreshold: number;
}>;

/**
 * Dragon is a physical elite mutation. Keep it on martial/heavy Tier-3 forms rather than
 * silently making every ranged/support specialization a Dragon candidate.
 */
export const dragonEligibleFusionFormIds = new Set([
  'blademaster',
  'berserker',
  'paladin',
  'fortress',
  'ninja',
  'assassin',
  'cannoneer',
]);

export const mutationDefinitions: Readonly<Record<SlimeMutationId, MutationDefinition>> = {
  king: {
    id: 'king',
    displayName: 'キングスライム',
    eligibility: 'tier3',
    identity: '王冠のオーラで味方全体を強化',
    fragmentName: '王冠の欠片',
    fragmentThreshold: balance.mutation.fragmentThreshold,
  },
  golden: {
    id: 'golden',
    displayName: 'ゴールデンスライム',
    eligibility: 'tier2-plus',
    identity: '戦闘報酬のゴールドを増やす',
    fragmentName: '黄金ジェル',
    fragmentThreshold: balance.mutation.fragmentThreshold,
  },
  dragon: {
    id: 'dragon',
    displayName: 'ドラゴンスライム',
    eligibility: 'selected-tier3',
    identity: '火力と耐久を両立する竜化',
    fragmentName: '竜核片',
    fragmentThreshold: balance.mutation.fragmentThreshold,
  },
  prism: {
    id: 'prism',
    displayName: 'プリズムスライム',
    eligibility: 'magic-ranged-tier3',
    identity: '高い瞬間火力を持つ虹晶化',
    fragmentName: 'プリズムの欠片',
    fragmentThreshold: balance.mutation.fragmentThreshold,
  },
};

const PRISM_TYPES = new Set<JobSlimeId>(['bow', 'wand', 'gun']);

export function isEligibleForMutation(slime: SlimeProgress, mutationId: SlimeMutationId): boolean {
  switch (mutationId) {
    case 'king': return slime.jobTier >= 3;
    case 'golden': return slime.jobTier >= 2;
    case 'dragon': return slime.jobTier >= 3 && dragonEligibleFusionFormIds.has(slime.fusionFormId);
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
  const definition = mutationDefinitions[mutationId];
  const eligible = slime !== undefined && slime.mutationId === null && isEligibleForMutation(slime, mutationId);
  return {
    slimeId,
    mutationId,
    owned: slime !== undefined,
    alreadyMutated: slime?.mutationId !== null && slime?.mutationId !== undefined,
    eligible,
    fragments: progress.fragments,
    catalysts: progress.catalysts,
    fragmentThreshold: definition.fragmentThreshold,
    fragmentsNeeded: Math.max(0, definition.fragmentThreshold - progress.fragments),
    canMutate: eligible && progress.catalysts > 0,
  } as const;
}

/** Product reward hook used by rare events and deterministic first-world milestones. */
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

/**
 * Fragments are the deterministic backstop. Crossing the authored threshold immediately converts
 * whole threshold batches into catalysts so no separate hidden "craft mutation core" action exists.
 */
export function grantMutationFragments(
  state: SlimeMercenariesState,
  mutationId: SlimeMutationId,
  count: number,
): SlimeMercenariesState {
  if (!Number.isSafeInteger(count) || count <= 0) throw new RangeError('Mutation fragment count must be a positive safe integer.');
  const current = state.gameData.mutationProgress[mutationId];
  const threshold = mutationDefinitions[mutationId].fragmentThreshold;
  const totalFragments = current.fragments + count;
  const earnedCatalysts = Math.floor(totalFragments / threshold);
  const remainingFragments = totalFragments % threshold;
  return {
    ...state,
    gameData: {
      ...state.gameData,
      mutationProgress: {
        ...state.gameData.mutationProgress,
        [mutationId]: {
          fragments: remainingFragments,
          catalysts: current.catalysts + earnedCatalysts,
        },
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

  let nextState: SlimeMercenariesState = {
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
  nextState = markCodexDiscovery(nextState, 'slime-form', mutationSlimeCodexId(mutationId));
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
