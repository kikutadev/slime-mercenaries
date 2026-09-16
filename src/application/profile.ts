import type { ProfileRepository, StoredProfile } from 'idle-game-kit';
import { advanceSlimeWorldFromWallClock } from '../domain/world';
import {
  SLIME_MERCENARIES_SCHEMA_VERSION,
  createInitialEquipmentState,
  createInitialSlimeMercenariesState,
  type SlimeMercenariesState,
} from '../domain/state';

export const DEFAULT_PROFILE_ID = 'default';

export type LoadedSlimeProfile = Readonly<{
  state: SlimeMercenariesState;
  created: boolean;
  appliedOfflineSec: number;
  offlineEvents: ReturnType<typeof advanceSlimeWorldFromWallClock>['events'];
}>;

/**
 * Load durable state, advance elapsed wall-clock time through the same combat model,
 * and checkpoint the resolved state so reload cannot reroll drops.
 */
export async function loadOrCreateSlimeProfile(args: Readonly<{
  repository: ProfileRepository<SlimeMercenariesState>;
  profileId?: string;
  nowMs?: number;
  seed?: number;
}>): Promise<LoadedSlimeProfile> {
  const profileId = args.profileId ?? DEFAULT_PROFILE_ID;
  const nowMs = args.nowMs ?? Date.now();
  const stored = await args.repository.load(profileId);

  if (stored === null) {
    const state = createInitialSlimeMercenariesState(nowMs, args.seed);
    await saveSlimeProfile(args.repository, profileId, state, nowMs);
    return { state, created: true, appliedOfflineSec: 0, offlineEvents: [] };
  }

  const migrated = migrateStoredState(stored.state);
  validateStoredState(migrated);
  const resumed = advanceSlimeWorldFromWallClock(migrated, nowMs);
  if (resumed.appliedOfflineSec > 0) {
    await saveSlimeProfile(args.repository, profileId, resumed.state, nowMs);
  }
  return {
    state: resumed.state,
    created: false,
    appliedOfflineSec: resumed.appliedOfflineSec,
    offlineEvents: resumed.events,
  };
}

/** Save one already-accepted authoritative state as a durable checkpoint. */
export async function saveSlimeProfile(
  repository: ProfileRepository<SlimeMercenariesState>,
  profileId: string,
  state: SlimeMercenariesState,
  savedAtMs = Date.now(),
): Promise<void> {
  validateStoredState(state);
  const profile: StoredProfile<SlimeMercenariesState> = { profileId, savedAtMs, state };
  await repository.save(profile);
}

function validateStoredState(state: SlimeMercenariesState): void {
  if (state.gameId !== 'slime-mercenaries') throw new Error(`Unexpected gameId: ${state.gameId}`);
  if (state.schemaVersion !== SLIME_MERCENARIES_SCHEMA_VERSION) {
    throw new Error(`Unsupported Slime Mercenaries schemaVersion: ${state.schemaVersion}`);
  }
}


function migrateStoredState(state: SlimeMercenariesState): SlimeMercenariesState {
  if (state.schemaVersion === SLIME_MERCENARIES_SCHEMA_VERSION) return state;
  if (state.schemaVersion !== 0) throw new Error(`Unsupported Slime Mercenaries schemaVersion: ${state.schemaVersion}`);
  const legacy = state as unknown as Omit<SlimeMercenariesState, 'gameData'> & {
    gameData: Omit<SlimeMercenariesState['gameData'], 'equipment'>;
  };
  return {
    ...legacy,
    schemaVersion: SLIME_MERCENARIES_SCHEMA_VERSION,
    gameData: {
      ...legacy.gameData,
      equipment: createInitialEquipmentState(),
    },
  };
}
