import { GameNumber, createLoadoutState, createRngStreams, createTimedActivityState, type GameNumberSerialized, type GameState, type InventoryState, type LoadoutState, type TimedActivityState } from 'idle-game-kit';
import { dispatchContractDefinitions, ids, initialEconomyBalance, slimeWeaponLoadoutDefinitions, type DispatchContractId, type JobSlimeId } from './definitions';

export const SLIME_MERCENARIES_SCHEMA_VERSION = 1;
export const SLIME_MERCENARIES_DEFINITION_VERSION = '2026-09-16.3';

export type SlimeAssignment = 'battle' | 'reserve' | 'dispatch';

/**
 * One canonical progression record per discovered job type.
 * Promotion and Fusion remain separate axes by design.
 */
export type SlimeProgress = Readonly<{
  typeId: JobSlimeId;
  level: number;
  jobTier: number;
  promotionPathId: string | null;
  fusionRank: number;
  fusionFormId: string;
  assignment: SlimeAssignment;
}>;


export type WeaponInstanceData = Readonly<{ refinementRank: number }>;

export type EquipmentState = Readonly<{
  inventory: InventoryState<WeaponInstanceData>;
  loadouts: Readonly<Record<JobSlimeId, LoadoutState>>;
}>;

export function createInitialEquipmentState(): EquipmentState {
  return {
    inventory: {},
    loadouts: {
      sword: createLoadoutState(slimeWeaponLoadoutDefinitions.sword),
      bow: createLoadoutState(slimeWeaponLoadoutDefinitions.bow),
    },
  };
}

export type SlimeMercenariesData = Readonly<{
  progression: Readonly<{
    currentAreaId: string;
    currentStage: number;
    highestStageCleared: number;
  }>;
  combat: Readonly<{
    currentWaveIndex: number;
    waveWorkRemaining: GameNumberSerialized | null;
    blockedBossStage: number | null;
    contentBoundaryReached: boolean;
  }>;
  dispatch: Readonly<{
    contracts: Readonly<Record<DispatchContractId, Readonly<{ slimeId: JobSlimeId | null; activity: TimedActivityState }>>>;
  }>;
  equipment: EquipmentState;
  economy: Readonly<{
    /** Index into the Plain Slime shop price curve. */
    plainSlimeShopPurchaseCount: number;
  }>;
  roster: Readonly<{
    slimes: Readonly<Partial<Record<JobSlimeId, SlimeProgress>>>;
    formationSlots: readonly (JobSlimeId | null)[];
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
        highestStageCleared: 0,
      },
      combat: {
        currentWaveIndex: 0,
        waveWorkRemaining: null,
        blockedBossStage: null,
        contentBoundaryReached: false,
      },
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
      },
    },
  };
}
