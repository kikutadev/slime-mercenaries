import { GameNumber, createLoadoutState, createRngStreams, createTimedActivityState, type GameNumberSerialized, type GameState, type InventoryState, type LoadoutState, type TimedActivityState } from 'idle-game-kit';
import { AREA_IDS, dispatchContractDefinitions, ids, initialEconomyBalance, slimeWeaponLoadoutDefinitions, type DispatchContractId, type JobSlimeId } from './definitions';

export const SLIME_MERCENARIES_SCHEMA_VERSION = 5;
export const SLIME_MERCENARIES_DEFINITION_VERSION = '2026-09-18.4';

export type SlimeInstanceId = string;
export type SlimeAssignment = 'battle' | 'reserve' | 'dispatch';
export type SlimeMutationId = 'king' | 'golden' | 'dragon' | 'prism';

export type MutationProgressEntry = Readonly<{
  fragments: number;
  catalysts: number;
}>;

export type MutationProgressState = Readonly<Record<SlimeMutationId, MutationProgressEntry>>;

export function createInitialMutationProgressState(): MutationProgressState {
  return {
    king: { fragments: 0, catalysts: 0 },
    golden: { fragments: 0, catalysts: 0 },
    dragon: { fragments: 0, catalysts: 0 },
    prism: { fragments: 0, catalysts: 0 },
  };
}

/** One persistent combat slime. Same-type bodies remain separate roster instances. */
export type SlimeProgress = Readonly<{
  id: SlimeInstanceId;
  serial: number;
  typeId: JobSlimeId;
  level: number;
  jobTier: number;
  fusionRank: number;
  fusionFormId: string;
  mutationId: SlimeMutationId | null;
  assignment: SlimeAssignment;
}>;

export type WeaponInstanceData = Readonly<{ refinementRank: number }>;

export type EquipmentState = Readonly<{
  inventory: InventoryState<WeaponInstanceData>;
  loadouts: Readonly<Record<SlimeInstanceId, LoadoutState>>;
}>;

export function createInitialEquipmentState(): EquipmentState {
  return { inventory: {}, loadouts: {} };
}

export function createSlimeWeaponLoadout(typeId: JobSlimeId): LoadoutState {
  return createLoadoutState(slimeWeaponLoadoutDefinitions[typeId]);
}

export function slimeInstanceIdForSerial(serial: number): SlimeInstanceId {
  if (!Number.isSafeInteger(serial) || serial <= 0) throw new RangeError('slime serial must be a positive safe integer.');
  return `slime.${serial}`;
}

export type AreaProgressState = Readonly<{
  highestStageCleared: number;
}>;

export function createInitialAreaProgressState(): Readonly<Record<string, AreaProgressState>> {
  return Object.fromEntries(AREA_IDS.map((areaId) => [areaId, { highestStageCleared: 0 }])) as Readonly<Record<string, AreaProgressState>>;
}

export type SlimeProgressionState = Readonly<{
  currentAreaId: string;
  currentStage: number;
  areas: Readonly<Record<string, AreaProgressState>>;
}>;

export function highestStageClearedForArea(
  progression: SlimeProgressionState,
  areaId = progression.currentAreaId,
): number {
  return progression.areas[areaId]?.highestStageCleared ?? 0;
}

export function withHighestStageClearedForArea(
  progression: SlimeProgressionState,
  areaId: string,
  highestStageCleared: number,
): SlimeProgressionState {
  return {
    ...progression,
    areas: {
      ...progression.areas,
      [areaId]: { highestStageCleared },
    },
  };
}

export type SlimeMercenariesData = Readonly<{
  progression: SlimeProgressionState;
  combat: Readonly<{
    currentWaveIndex: number;
    waveWorkRemaining: GameNumberSerialized | null;
    /** Number of completed farm-stage clears still required before retrying the frontier. */
    retryFarmClearsRemaining: number;
    /** Durable countdown for a losing frontier attempt so chunked live ticks equal offline simulation. */
    frontierDefeatTimeRemainingSec: number | null;
    contentBoundaryReached: boolean;
  }>;
  dispatch: Readonly<{
    contracts: Readonly<Record<DispatchContractId, Readonly<{ slimeId: SlimeInstanceId | null; activity: TimedActivityState }>>>;
  }>;
  mutationProgress: MutationProgressState;
  equipment: EquipmentState;
  economy: Readonly<{
    /** Index into the Plain Slime shop price curve. */
    plainSlimeShopPurchaseCount: number;
  }>;
  roster: Readonly<{
    slimes: Readonly<Record<SlimeInstanceId, SlimeProgress>>;
    formationSlots: readonly (SlimeInstanceId | null)[];
    nextSlimeSerial: number;
  }>;
}>;

export type SlimeMercenariesState = GameState<SlimeMercenariesData>;

/**
 * Create a clean authoritative product state. Bootstrap materials are balance data;
 * the initial Plain Slime itself is not silently granted.
 */
export function createInitialSlimeMercenariesState(
  nowMs = Date.now(),
  seed = 0x51_1e_0001,
): SlimeMercenariesState {
  return {
    schemaVersion: SLIME_MERCENARIES_SCHEMA_VERSION,
    gameId: 'slime-mercenaries',
    definitionVersion: SLIME_MERCENARIES_DEFINITION_VERSION,
    createdAtMs: nowMs,
    simTimeSec: 0,
    lastWallClockMs: nowMs,
    currencies: {
      [ids.currency.gold]: GameNumber.from(initialEconomyBalance.gold).serialize(),
    },
    tokens: { ...initialEconomyBalance.tokens },
    producers: {},
    characters: {},
    achievements: {},
    titles: {},
    progressionFlags: {},
    rngStreams: createRngStreams(seed, [ids.rng.loot, ids.rng.forge]),
    gachaStates: {},
    activeBoosts: {},
    recentExternalRewardGrantIds: [],
    prestigeStates: {},
    calendarRewardStates: {},
    statistics: {
      lifetimeCurrencyEarned: {},
      lifetimeCurrencySpent: {},
    },
    gameData: {
      progression: {
        currentAreaId: 'area.clover-road',
        currentStage: 1,
        areas: createInitialAreaProgressState(),
      },
      combat: {
        currentWaveIndex: 0,
        waveWorkRemaining: null,
        retryFarmClearsRemaining: 0,
        frontierDefeatTimeRemainingSec: null,
        contentBoundaryReached: false,
      },
      mutationProgress: createInitialMutationProgressState(),
      dispatch: {
        contracts: Object.fromEntries(
          Object.entries(dispatchContractDefinitions).map(([contractId, definition]) => [
            contractId,
            { slimeId: null, activity: createTimedActivityState(definition.activity.id) },
          ]),
        ) as SlimeMercenariesData['dispatch']['contracts'],
      },
      equipment: createInitialEquipmentState(),
      economy: {
        plainSlimeShopPurchaseCount: 0,
      },
      roster: {
        slimes: {},
        formationSlots: [null, null, null, null, null, null],
        nextSlimeSerial: 1,
      },
    },
  };
}
