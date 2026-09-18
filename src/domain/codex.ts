import type { CommandResult } from 'idle-game-kit';
import type { JobSlimeId } from './definitions';
import type { CodexDiscoveryState, CodexState, SlimeMercenariesState, SlimeMutationId } from './state';

export type CodexCategory = 'slime-form' | 'weapon';

export function tier1SlimeCodexId(typeId: JobSlimeId): string {
  return `slime.${typeId}`;
}

export function fusionSlimeCodexId(typeId: JobSlimeId, fusionFormId: string): string {
  return `slime.${typeId}.${fusionFormId}`;
}

export function mutationSlimeCodexId(mutationId: SlimeMutationId | 'mimic'): string {
  return `slime.mutation.${mutationId}`;
}

export function markCodexDiscovery(
  state: SlimeMercenariesState,
  category: CodexCategory,
  entryId: string,
): SlimeMercenariesState {
  const bucketName = category === 'slime-form' ? 'slimeForms' : 'weapons';
  const bucket = state.gameData.codex[bucketName];
  if (bucket[entryId] !== undefined) return state;
  return {
    ...state,
    gameData: {
      ...state.gameData,
      codex: {
        ...state.gameData.codex,
        [bucketName]: {
          ...bucket,
          [entryId]: { discoveredAtSimTimeSec: state.simTimeSec, viewedAtSimTimeSec: null },
        },
      },
    },
  };
}

export function markCodexEntriesViewed(
  state: SlimeMercenariesState,
  category: CodexCategory,
  entryIds: readonly string[],
): CommandResult<SlimeMercenariesState, 'not-discovered'> {
  const uniqueEntryIds = [...new Set(entryIds)];
  const bucketName = category === 'slime-form' ? 'slimeForms' : 'weapons';
  const bucket = state.gameData.codex[bucketName];
  if (uniqueEntryIds.some((entryId) => bucket[entryId] === undefined)) {
    return { accepted: false, state, events: [], reason: 'not-discovered' };
  }
  const viewedAtSimTimeSec = state.simTimeSec;
  const nextBucket = { ...bucket };
  for (const entryId of uniqueEntryIds) {
    const entry = nextBucket[entryId]!;
    if (entry.viewedAtSimTimeSec !== null) continue;
    nextBucket[entryId] = { ...entry, viewedAtSimTimeSec };
  }
  const nextState: SlimeMercenariesState = {
    ...state,
    gameData: {
      ...state.gameData,
      codex: { ...state.gameData.codex, [bucketName]: nextBucket },
    },
  };
  return { accepted: true, state: nextState, events: [] };
}

export function isCodexDiscoveryNew(entry: CodexDiscoveryState): boolean {
  return entry.viewedAtSimTimeSec === null;
}

export function createLegacyViewedCodexEntry(simTimeSec: number): CodexDiscoveryState {
  return { discoveredAtSimTimeSec: simTimeSec, viewedAtSimTimeSec: simTimeSec };
}

export function withLegacyViewedCodexDiscovery(
  codex: CodexState,
  category: CodexCategory,
  entryId: string,
  simTimeSec: number,
): CodexState {
  const bucketName = category === 'slime-form' ? 'slimeForms' : 'weapons';
  const bucket = codex[bucketName];
  if (bucket[entryId] !== undefined) return codex;
  return {
    ...codex,
    [bucketName]: { ...bucket, [entryId]: createLegacyViewedCodexEntry(simTimeSec) },
  };
}
