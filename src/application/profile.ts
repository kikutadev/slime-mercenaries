import type { LoadoutState, ProfileRepository, StoredProfile } from 'idle-game-kit';
import { advanceSlimeWorldFromWallClock } from '../domain/world';
import { assertSlimeStateInvariants } from '../domain/state-invariants';
import { balance } from '../domain/balance';
import { NORMAL_JOB_SLIME_IDS, type DispatchContractId, type JobSlimeId } from '../domain/definitions';
import { fusionSlimeCodexId, mutationSlimeCodexId, tier1SlimeCodexId, withLegacyViewedCodexDiscovery } from '../domain/codex';
import {
  SLIME_MERCENARIES_DEFINITION_VERSION,
  SLIME_MERCENARIES_SCHEMA_VERSION,
  createInitialAreaProgressState,
  createInitialCodexState,
  createInitialEquipmentState,
  createInitialMutationProgressState,
  createSlimeWeaponLoadout,
  createInitialSlimeMercenariesState,
  slimeInstanceIdForSerial,
  type CodexState,
  type EquipmentState,
  type SlimeMercenariesState,
  type SlimeProgress,
  type SlimeProgressionState,
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
  const resumed = advanceSlimeWorldFromWallClock(migrated, nowMs, {}, { allowFrontierFirstClear: false });
  if (resumed.appliedOfflineSec > 0 || migrated !== stored.state) {
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
  assertSlimeStateInvariants(state);
}

type LegacySlimeProgress = Readonly<{
  typeId: JobSlimeId;
  level: number;
  jobTier: number;
  fusionRank: number;
  fusionFormId: string;
  assignment: 'battle' | 'reserve' | 'dispatch';
}>;

type LegacyEquipment = Readonly<{
  inventory: EquipmentState['inventory'];
  loadouts: Readonly<Partial<Record<JobSlimeId, LoadoutState>>>;
}>;

type LegacyProgressionState = Readonly<{
  currentAreaId: string;
  currentStage: number;
  highestStageCleared: number;
}>;

type LegacyCombatState = Readonly<{
  currentWaveIndex: number;
  waveWorkRemaining: SlimeMercenariesState['gameData']['combat']['waveWorkRemaining'];
  blockedBossStage?: number | null;
  retryFarmClearsRemaining?: number;
  frontierDefeatTimeRemainingSec?: number | null;
  contentBoundaryReached: boolean;
}>;

type LegacyGameData = Omit<SlimeMercenariesState['gameData'], 'equipment' | 'combat' | 'roster' | 'dispatch' | 'progression' | 'mutationProgress' | 'codex'> & Readonly<{
  progression: LegacyProgressionState;
  equipment?: LegacyEquipment;
  combat: LegacyCombatState;
  roster: Readonly<{
    slimes: Readonly<Partial<Record<JobSlimeId, LegacySlimeProgress>>>;
    formationSlots: readonly (JobSlimeId | null)[];
  }>;
  dispatch: Readonly<{
    contracts: Readonly<Record<DispatchContractId, Readonly<{
      slimeId: JobSlimeId | null;
      activity: SlimeMercenariesState['gameData']['dispatch']['contracts'][DispatchContractId]['activity'];
    }>>>;
  }>;
}>;

type LegacyState = Omit<SlimeMercenariesState, 'gameData'> & { gameData: LegacyGameData };

type SchemaV4State = Omit<SlimeMercenariesState, 'gameData'> & {
  gameData: Omit<SlimeMercenariesState['gameData'], 'progression' | 'mutationProgress' | 'codex'> & {
    progression: LegacyProgressionState;
  };
};

type SchemaV5State = Omit<SlimeMercenariesState, 'gameData'> & {
  gameData: Omit<SlimeMercenariesState['gameData'], 'codex'>;
};

function normalizeCurrentState(state: SlimeMercenariesState): SlimeMercenariesState {
  const defaults = createInitialAreaProgressState();
  const hasAllKnownAreas = Object.keys(defaults).every((areaId) => state.gameData.progression.areas[areaId] !== undefined);
  if (hasAllKnownAreas) return state;

  return {
    ...state,
    gameData: {
      ...state.gameData,
      progression: {
        ...state.gameData.progression,
        areas: { ...defaults, ...state.gameData.progression.areas },
      },
    },
  };
}

function migrateStoredState(state: SlimeMercenariesState): SlimeMercenariesState {
  if (state.schemaVersion === SLIME_MERCENARIES_SCHEMA_VERSION) return normalizeCurrentState(state);
  if (state.schemaVersion === 5) return migrateSchemaV5State(state as unknown as SchemaV5State);
  if (state.schemaVersion === 4) return migrateSchemaV4State(state as unknown as SchemaV4State);
  if (![0, 1, 2, 3].includes(state.schemaVersion)) {
    throw new Error(`Unsupported Slime Mercenaries schemaVersion: ${state.schemaVersion}`);
  }

  const legacy = state as unknown as LegacyState;
  const normalizedCombat = normalizeLegacyCombat(legacy.gameData.combat, legacy.gameData.progression);
  const migratedRoster = migrateLegacyRoster(legacy.gameData.roster, legacy.gameData.equipment);

  const contracts = Object.fromEntries(
    Object.entries(legacy.gameData.dispatch.contracts).map(([contractId, contract]) => [
      contractId,
      {
        ...contract,
        slimeId: contract.slimeId === null ? null : migratedRoster.instanceIdByType[contract.slimeId] ?? null,
      },
    ]),
  ) as SlimeMercenariesState['gameData']['dispatch']['contracts'];

  const gameData: SlimeMercenariesState['gameData'] = {
    ...legacy.gameData,
    progression: normalizedCombat.progression,
    mutationProgress: createInitialMutationProgressState(),
    combat: normalizedCombat.combat,
    dispatch: { contracts },
    equipment: migratedRoster.equipment,
    roster: migratedRoster.roster,
    codex: inferLegacyViewedCodex(migratedRoster.roster, migratedRoster.equipment, legacy.simTimeSec),
  };
  return normalizeCurrentState({
    ...legacy,
    schemaVersion: SLIME_MERCENARIES_SCHEMA_VERSION,
    definitionVersion: SLIME_MERCENARIES_DEFINITION_VERSION,
    gameData,
  } as SlimeMercenariesState);
}

function migrateSchemaV5State(state: SchemaV5State): SlimeMercenariesState {
  return normalizeCurrentState({
    ...state,
    schemaVersion: SLIME_MERCENARIES_SCHEMA_VERSION,
    definitionVersion: SLIME_MERCENARIES_DEFINITION_VERSION,
    gameData: {
      ...state.gameData,
      codex: inferLegacyViewedCodex(state.gameData.roster, state.gameData.equipment, state.simTimeSec),
    },
  } as SlimeMercenariesState);
}

function migrateSchemaV4State(state: SchemaV4State): SlimeMercenariesState {
  const roster = {
    ...state.gameData.roster,
    slimes: Object.fromEntries(
      Object.entries(state.gameData.roster.slimes).map(([slimeId, slime]) => [
        slimeId,
        { ...slime, mutationId: (slime as SlimeProgress & { mutationId?: SlimeProgress['mutationId'] }).mutationId ?? null },
      ]),
    ) as SlimeMercenariesState['gameData']['roster']['slimes'],
  };
  return normalizeCurrentState({
    ...state,
    schemaVersion: SLIME_MERCENARIES_SCHEMA_VERSION,
    definitionVersion: SLIME_MERCENARIES_DEFINITION_VERSION,
    gameData: {
      ...state.gameData,
      progression: migrateLegacyProgression(state.gameData.progression),
      mutationProgress: createInitialMutationProgressState(),
      codex: inferLegacyViewedCodex(roster, state.gameData.equipment, state.simTimeSec),
      roster,
    },
  } as SlimeMercenariesState);
}

function inferLegacyViewedCodex(
  roster: SlimeMercenariesState['gameData']['roster'],
  equipment: SlimeMercenariesState['gameData']['equipment'],
  simTimeSec: number,
): CodexState {
  let codex = createInitialCodexState();
  for (const slime of Object.values(roster.slimes)) {
    codex = withLegacyViewedCodexDiscovery(codex, 'slime-form', tier1SlimeCodexId(slime.typeId), simTimeSec);
    if (slime.fusionFormId !== 'base') {
      codex = withLegacyViewedCodexDiscovery(
        codex,
        'slime-form',
        fusionSlimeCodexId(slime.typeId, slime.fusionFormId),
        simTimeSec,
      );
    }
    if (slime.mutationId !== null) {
      codex = withLegacyViewedCodexDiscovery(codex, 'slime-form', mutationSlimeCodexId(slime.mutationId), simTimeSec);
    }
  }
  for (const instance of Object.values(equipment.inventory)) {
    codex = withLegacyViewedCodexDiscovery(codex, 'weapon', instance.definitionId, simTimeSec);
  }
  return codex;
}

function migrateLegacyProgression(progression: LegacyProgressionState): SlimeProgressionState {
  return {
    currentAreaId: progression.currentAreaId,
    currentStage: progression.currentStage,
    areas: {
      ...createInitialAreaProgressState(),
      [progression.currentAreaId]: { highestStageCleared: progression.highestStageCleared },
    },
  };
}

function normalizeLegacyCombat(
  combat: LegacyCombatState,
  progression: LegacyGameData['progression'],
): Readonly<{
  progression: SlimeMercenariesState['gameData']['progression'];
  combat: SlimeMercenariesState['gameData']['combat'];
}> {
  const blockedBossStage = combat.blockedBossStage ?? null;
  const retryFarmClearsRemaining = combat.retryFarmClearsRemaining
    ?? (blockedBossStage === null ? 0 : balance.combat.frontier.retryFarmClears);
  const nextProgression = blockedBossStage === null
    ? progression
    : { ...progression, currentStage: Math.max(1, blockedBossStage - 1) };

  return {
    progression: migrateLegacyProgression(nextProgression),
    combat: {
      currentWaveIndex: blockedBossStage === null ? combat.currentWaveIndex : 0,
      waveWorkRemaining: blockedBossStage === null ? combat.waveWorkRemaining : null,
      retryFarmClearsRemaining,
      frontierDefeatTimeRemainingSec: combat.frontierDefeatTimeRemainingSec ?? null,
      contentBoundaryReached: combat.contentBoundaryReached,
    },
  };
}

function migrateLegacyRoster(
  legacyRoster: LegacyGameData['roster'],
  legacyEquipment: LegacyEquipment | undefined,
): Readonly<{
  roster: SlimeMercenariesState['gameData']['roster'];
  equipment: SlimeMercenariesState['gameData']['equipment'];
  instanceIdByType: Readonly<Partial<Record<JobSlimeId, string>>>;
}> {
  const slimes: Record<string, SlimeProgress> = {};
  const loadouts: Record<string, LoadoutState> = {};
  const instanceIdByType: Partial<Record<JobSlimeId, string>> = {};
  let serial = 1;

  for (const typeId of NORMAL_JOB_SLIME_IDS) {
    const legacySlime = legacyRoster.slimes[typeId];
    if (legacySlime === undefined) continue;
    const id = slimeInstanceIdForSerial(serial);
    instanceIdByType[typeId] = id;
    slimes[id] = { ...legacySlime, id, serial, typeId, mutationId: null };
    loadouts[id] = legacyEquipment?.loadouts[typeId] ?? createSlimeWeaponLoadout(typeId);
    serial += 1;
  }

  const formationSlots = legacyRoster.formationSlots.map((typeId) => typeId === null ? null : instanceIdByType[typeId] ?? null);
  const equipmentDefaults = createInitialEquipmentState();
  return {
    roster: { slimes, formationSlots, nextSlimeSerial: serial },
    equipment: {
      inventory: legacyEquipment?.inventory ?? equipmentDefaults.inventory,
      loadouts,
    },
    instanceIdByType,
  };
}
