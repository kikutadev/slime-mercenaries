import {
  GameNumber,
  applyRewards,
  curveValueAt,
  grantToken,
  nextRandom,
  resolveOfflineElapsed,
  type CommandResult,
  type DomainEvent,
  type GameNumberSerialized,
  type OfflineTimePolicy,
} from 'idle-game-kit';
import { balance } from './balance';
import { equippedWeaponCombatMultiplier } from './equipment';
import {
  cloverRoadStageDefinitions,
  ids,
  resolveCurrencyDefinition,
  typeLevelDefinitions,
  type JobSlimeId,
  type StageBossDefinition,
  type StageDefinition,
  type StageWaveDefinition,
} from './definitions';
import type { SlimeMercenariesState, SlimeProgress } from './state';

export type CombatEncounter = Readonly<{
  kind: 'wave' | 'boss';
  work: number;
  waveIndex: number;
  wave?: StageWaveDefinition;
  boss?: StageBossDefinition;
}>;

/** Assign one canonical slime type to a battle slot while preserving the no-duplicate invariant. */
export function assignSlimeToFormation(
  state: SlimeMercenariesState,
  slimeId: JobSlimeId,
  slotIndex: number,
): CommandResult<SlimeMercenariesState, 'invalid-slot' | 'not-owned' | 'dispatched'> {
  if (!Number.isSafeInteger(slotIndex) || slotIndex < 0 || slotIndex >= state.gameData.roster.formationSlots.length) {
    return reject(state, 'invalid-slot');
  }
  const slime = state.gameData.roster.slimes[slimeId];
  if (slime === undefined) return reject(state, 'not-owned');
  if (slime.assignment === 'dispatch') return reject(state, 'dispatched');

  const slots = [...state.gameData.roster.formationSlots];
  const previousSlot = slots.findIndex((candidate) => candidate === slimeId);
  const displacedId = slots[slotIndex] ?? null;
  if (previousSlot === slotIndex) return accept(state, []);
  if (previousSlot >= 0) slots[previousSlot] = null;
  slots[slotIndex] = slimeId;

  const slimes = { ...state.gameData.roster.slimes };
  slimes[slimeId] = { ...slime, assignment: 'battle' };
  if (displacedId !== null && displacedId !== slimeId) {
    const displaced = slimes[displacedId];
    if (displaced !== undefined) slimes[displacedId] = { ...displaced, assignment: 'reserve' };
  }

  const nextState: SlimeMercenariesState = {
    ...state,
    gameData: {
      ...state.gameData,
      roster: { ...state.gameData.roster, slimes, formationSlots: slots },
    },
  };
  return accept(nextState, [semanticEvent(nextState, 'formationChanged', `${slimeId}:${slotIndex}`, { slimeId, slotIndex })]);
}

/** Remove a battle slime from its slot and return it to reserve. */
export function removeSlimeFromFormation(
  state: SlimeMercenariesState,
  slotIndex: number,
): CommandResult<SlimeMercenariesState, 'invalid-slot' | 'already-empty'> {
  if (!Number.isSafeInteger(slotIndex) || slotIndex < 0 || slotIndex >= state.gameData.roster.formationSlots.length) {
    return reject(state, 'invalid-slot');
  }
  const slimeId = state.gameData.roster.formationSlots[slotIndex] ?? null;
  if (slimeId === null) return reject(state, 'already-empty');
  const slots = [...state.gameData.roster.formationSlots];
  slots[slotIndex] = null;
  const slime = state.gameData.roster.slimes[slimeId];
  const slimes = slime === undefined
    ? state.gameData.roster.slimes
    : { ...state.gameData.roster.slimes, [slimeId]: { ...slime, assignment: 'reserve' as const } };
  const nextState: SlimeMercenariesState = {
    ...state,
    gameData: {
      ...state.gameData,
      roster: { ...state.gameData.roster, slimes, formationSlots: slots },
    },
  };
  return accept(nextState, [semanticEvent(nextState, 'formationChanged', `empty:${slotIndex}`, { slotIndex })]);
}

/** Effective analytical DPS used by offline progression and the balance simulator. */
export function partyCombatDps(state: SlimeMercenariesState): GameNumber {
  return activeSlimes(state).reduce(
    (total, slime) => total.add(slimeDps(state, slime)),
    GameNumber.zero(),
  );
}

/** Coarse survivability/power gate used only for blocking bosses in the first headless model. */
export function partyCombatPower(state: SlimeMercenariesState): GameNumber {
  return activeSlimes(state).reduce(
    (total, slime) => total.add(slimePower(state, slime)),
    GameNumber.zero(),
  );
}

/** Power of one owned canonical slime independent from its current assignment. */
export function slimeCombatPower(state: SlimeMercenariesState, slimeId: JobSlimeId): GameNumber {
  const slime = state.gameData.roster.slimes[slimeId];
  return slime === undefined ? GameNumber.zero() : slimePower(state, slime);
}

export function currentStageDefinition(state: SlimeMercenariesState): StageDefinition | null {
  return cloverRoadStageDefinitions[state.gameData.progression.currentStage - 1] ?? null;
}

export function currentCombatEncounter(state: SlimeMercenariesState): CombatEncounter | null {
  const stage = currentStageDefinition(state);
  if (stage === null || state.gameData.combat.contentBoundaryReached) return null;
  const index = state.gameData.combat.currentWaveIndex;
  const wave = stage.waves[index];
  if (wave !== undefined) return { kind: 'wave', work: wave.work, waveIndex: index, wave };
  if (index === stage.waves.length && stage.boss !== undefined) {
    return { kind: 'boss', work: stage.boss.work, waveIndex: index, boss: stage.boss };
  }
  return null;
}

/** Next analytical encounter completion boundary, or null when no party/progression is available. */
export function nextCombatBoundarySec(state: SlimeMercenariesState): number | null {
  const encounter = currentCombatEncounter(state);
  if (encounter === null) return null;
  if (encounter.kind === 'boss' && partyCombatPower(state).compare(encounter.boss!.requiredPartyPower) < 0) return null;
  const dps = partyCombatDps(state);
  if (dps.compare(0) <= 0) return null;
  const remaining = state.gameData.combat.waveWorkRemaining === null
    ? GameNumber.from(encounter.work)
    : GameNumber.deserialize(state.gameData.combat.waveWorkRemaining);
  const seconds = Math.max(1, Math.ceil(remaining.divide(dps).toNumber()));
  return state.simTimeSec + seconds;
}

/**
 * Advance battle progression analytically to an integer virtual time.
 * Rendering/projectiles are deliberately absent; this is the authoritative progression/reward model.
 */
export function advanceCombatTo(
  state: SlimeMercenariesState,
  targetSimTimeSec: number,
): Readonly<{ state: SlimeMercenariesState; events: readonly DomainEvent[] }> {
  if (!Number.isSafeInteger(targetSimTimeSec) || targetSimTimeSec < state.simTimeSec) {
    throw new RangeError('targetSimTimeSec must be a safe integer at or after current sim time.');
  }
  if (targetSimTimeSec === state.simTimeSec) return { state, events: [] };

  let nextState = state;
  const events: DomainEvent[] = [];
  let guard = 0;

  while (nextState.simTimeSec < targetSimTimeSec) {
    guard += 1;
    if (guard > 10_000) throw new Error('Combat advancement exceeded safety iteration limit.');
    if (nextState.gameData.combat.contentBoundaryReached) {
      nextState = setSimTime(nextState, targetSimTimeSec);
      break;
    }

    const encounter = currentCombatEncounter(nextState);
    if (encounter === null) {
      const transitioned = completeStage(nextState);
      nextState = transitioned.state;
      events.push(...transitioned.events);
      continue;
    }

    if (encounter.kind === 'boss') {
      const required = encounter.boss!.requiredPartyPower;
      const power = partyCombatPower(nextState);
      if (power.compare(required) < 0) {
        const bossStageNumber = nextState.gameData.progression.currentStage;
        const firstBlock = nextState.gameData.combat.blockedBossStage !== bossStageNumber;
        nextState = retreatFromBlockedBoss(nextState, bossStageNumber);
        if (firstBlock) {
          events.push(semanticEvent(nextState, 'bossBlocked', `${bossStageNumber}`, {
            stageNumber: bossStageNumber,
            retreatStageNumber: nextState.gameData.progression.currentStage,
            requiredPartyPower: required,
            currentPartyPower: power.toNumber(),
          }));
        }
        events.push(semanticEvent(nextState, 'combatRetreated', `${bossStageNumber}`, {
          bossStageNumber,
          retreatStageNumber: nextState.gameData.progression.currentStage,
          requiredPartyPower: required,
          currentPartyPower: power.toNumber(),
        }));
        continue;
      }
      if (nextState.gameData.combat.blockedBossStage !== null) nextState = setBossBlocked(nextState, null);
    }

    const dps = partyCombatDps(nextState);
    if (dps.compare(0) <= 0) {
      nextState = setSimTime(nextState, targetSimTimeSec);
      break;
    }

    const remaining = nextState.gameData.combat.waveWorkRemaining === null
      ? GameNumber.from(encounter.work)
      : GameNumber.deserialize(nextState.gameData.combat.waveWorkRemaining);
    const secondsToFinish = Math.max(1, Math.ceil(remaining.divide(dps).toNumber()));
    const availableSeconds = targetSimTimeSec - nextState.simTimeSec;

    if (secondsToFinish > availableSeconds) {
      nextState = {
        ...setSimTime(nextState, targetSimTimeSec),
        gameData: {
          ...nextState.gameData,
          combat: {
            ...nextState.gameData.combat,
            waveWorkRemaining: clampWork(remaining.subtract(dps.multiply(availableSeconds))).serialize(),
          },
        },
      };
      break;
    }

    nextState = setSimTime(nextState, nextState.simTimeSec + secondsToFinish);
    const resolved = resolveEncounter(nextState, encounter);
    nextState = resolved.state;
    events.push(...resolved.events);
  }

  return { state: nextState, events };
}

function resolveEncounter(
  state: SlimeMercenariesState,
  encounter: CombatEncounter,
): Readonly<{ state: SlimeMercenariesState; events: readonly DomainEvent[] }> {
  if (encounter.kind === 'wave') return resolveNormalWave(state, encounter.wave!);
  return resolveBoss(state, encounter.boss!);
}

function resolveNormalWave(
  state: SlimeMercenariesState,
  wave: StageWaveDefinition,
): Readonly<{ state: SlimeMercenariesState; events: readonly DomainEvent[] }> {
  const stage = currentStageDefinition(state);
  if (stage === null) throw new Error('Cannot resolve a wave without a current Stage.');
  let nextState = applyGenericRewards(state, wave.rewards);
  const random = resolveRandomDrops(nextState, wave);
  nextState = random.state;
  const waveNumber = state.gameData.combat.currentWaveIndex + 1;
  const events: DomainEvent[] = [semanticEvent(nextState, 'combatWaveCleared', `${stage.id}:${waveNumber}`, {
    stageId: stage.id,
    stageNumber: stage.stageNumber,
    waveNumber,
    randomDrops: random.granted,
  })];

  const nextIndex = state.gameData.combat.currentWaveIndex + 1;
  nextState = writeCombat(nextState, { currentWaveIndex: nextIndex, waveWorkRemaining: null });
  if (nextIndex >= stage.waves.length && stage.boss === undefined) {
    const completed = completeStage(nextState);
    return { state: completed.state, events: [...events, ...completed.events] };
  }
  return { state: nextState, events };
}

function resolveBoss(
  state: SlimeMercenariesState,
  boss: StageBossDefinition,
): Readonly<{ state: SlimeMercenariesState; events: readonly DomainEvent[] }> {
  const stage = currentStageDefinition(state);
  if (stage === null) throw new Error('Cannot resolve a boss without a current Stage.');
  let nextState = applyGenericRewards(state, boss.rewards);
  nextState = writeCombat(nextState, { waveWorkRemaining: null, blockedBossStage: null });
  const completed = completeStage(nextState);
  return {
    state: completed.state,
    events: [
      semanticEvent(nextState, 'bossDefeated', stage.id, { stageId: stage.id, stageNumber: stage.stageNumber }),
      ...completed.events,
    ],
  };
}

function completeStage(state: SlimeMercenariesState): Readonly<{ state: SlimeMercenariesState; events: readonly DomainEvent[] }> {
  const stage = currentStageDefinition(state);
  if (stage === null) {
    const ended = setContentBoundary(state);
    return { state: ended, events: [] };
  }
  const firstClear = stage.stageNumber > state.gameData.progression.highestStageCleared;
  let nextState = firstClear ? applyGenericRewards(state, stage.clearRewards) : state;
  const highestStageCleared = Math.max(nextState.gameData.progression.highestStageCleared, stage.stageNumber);
  const blockedBossStage = nextState.gameData.combat.blockedBossStage;
  const nextStage = cloverRoadStageDefinitions[stage.stageNumber];
  if (nextStage === undefined) {
    nextState = {
      ...nextState,
      gameData: {
        ...nextState.gameData,
        progression: { ...nextState.gameData.progression, highestStageCleared },
        combat: {
          currentWaveIndex: 0,
          waveWorkRemaining: null,
          blockedBossStage,
          contentBoundaryReached: true,
        },
      },
    };
  } else {
    nextState = {
      ...nextState,
      gameData: {
        ...nextState.gameData,
        progression: {
          ...nextState.gameData.progression,
          currentStage: nextStage.stageNumber,
          highestStageCleared,
        },
        combat: {
          currentWaveIndex: 0,
          waveWorkRemaining: null,
          blockedBossStage,
          contentBoundaryReached: false,
        },
      },
    };
  }
  return {
    state: nextState,
    events: firstClear
      ? [semanticEvent(nextState, 'stageCleared', stage.id, {
          stageId: stage.id,
          stageNumber: stage.stageNumber,
          nextStageNumber: nextStage?.stageNumber ?? null,
        })]
      : [],
  };
}

function resolveRandomDrops(
  state: SlimeMercenariesState,
  wave: StageWaveDefinition,
): Readonly<{ state: SlimeMercenariesState; granted: readonly Readonly<{ tokenId: string; count: number }>[] }> {
  let nextState = state;
  const granted: { tokenId: string; count: number }[] = [];
  for (const drop of wave.randomDrops) {
    const stream = nextState.rngStreams[ids.rng.loot];
    if (stream === undefined) throw new Error(`Missing RNG stream: ${ids.rng.loot}`);
    const random = nextRandom(stream);
    nextState = {
      ...nextState,
      rngStreams: { ...nextState.rngStreams, [ids.rng.loot]: random.stream },
    };
    if (random.value >= drop.chance) continue;
    nextState = { ...nextState, tokens: grantToken(nextState.tokens, drop.tokenId, drop.count) };
    granted.push({ tokenId: drop.tokenId, count: drop.count });
  }
  return { state: nextState, granted };
}

function applyGenericRewards(
  state: SlimeMercenariesState,
  rewards: Parameters<typeof applyRewards>[1],
): SlimeMercenariesState {
  return applyRewards(state, rewards, { resolveCurrencyDefinition }) as SlimeMercenariesState;
}

function activeSlimes(state: SlimeMercenariesState): readonly SlimeProgress[] {
  return state.gameData.roster.formationSlots.flatMap((slimeId) => {
    if (slimeId === null) return [];
    const slime = state.gameData.roster.slimes[slimeId];
    return slime === undefined ? [] : [slime];
  });
}

function slimeDps(state: SlimeMercenariesState, slime: SlimeProgress): GameNumber {
  const base = balance.combat.baseDpsByJob[slime.typeId];
  const levelMultiplier = curveValueAtForSlime(slime);
  const fusionMultiplier = balance.combat.fusionDpsMultiplierByRank[Math.max(0, slime.fusionRank - 1)]
    ?? balance.combat.fusionDpsMultiplierByRank.at(-1)!;
  const promotionMultiplier = balance.promotion.dpsMultiplierByTier[Math.max(0, slime.jobTier - 1)]
    ?? balance.promotion.dpsMultiplierByTier.at(-1)!;
  return GameNumber.from(base)
    .multiply(levelMultiplier)
    .multiply(fusionMultiplier)
    .multiply(promotionMultiplier)
    .multiply(equippedWeaponCombatMultiplier(state, slime.typeId));
}

function slimePower(state: SlimeMercenariesState, slime: SlimeProgress): GameNumber {
  const base = balance.combat.basePowerByJob[slime.typeId];
  const levelMultiplier = curveValueAtForSlime(slime);
  const fusionMultiplier = balance.combat.fusionPowerMultiplierByRank[Math.max(0, slime.fusionRank - 1)]
    ?? balance.combat.fusionPowerMultiplierByRank.at(-1)!;
  const promotionMultiplier = balance.promotion.powerMultiplierByTier[Math.max(0, slime.jobTier - 1)]
    ?? balance.promotion.powerMultiplierByTier.at(-1)!;
  return GameNumber.from(base)
    .multiply(levelMultiplier)
    .multiply(fusionMultiplier)
    .multiply(promotionMultiplier)
    .multiply(equippedWeaponCombatMultiplier(state, slime.typeId));
}

function curveValueAtForSlime(slime: SlimeProgress): GameNumber {
  // Keep analytical combat on the same stat curve used by Type Level progression.
  return curveValueAt(typeLevelDefinitions[slime.typeId].statCurve!, slime.level - 1);
}

function writeCombat(
  state: SlimeMercenariesState,
  patch: Partial<SlimeMercenariesState['gameData']['combat']>,
): SlimeMercenariesState {
  return {
    ...state,
    gameData: {
      ...state.gameData,
      combat: { ...state.gameData.combat, ...patch },
    },
  };
}

function retreatFromBlockedBoss(state: SlimeMercenariesState, bossStageNumber: number): SlimeMercenariesState {
  const retreatStageNumber = Math.max(1, bossStageNumber - 1);
  return {
    ...state,
    gameData: {
      ...state.gameData,
      progression: {
        ...state.gameData.progression,
        currentStage: retreatStageNumber,
      },
      combat: {
        ...state.gameData.combat,
        currentWaveIndex: 0,
        waveWorkRemaining: null,
        blockedBossStage: bossStageNumber,
        contentBoundaryReached: false,
      },
    },
  };
}

function setBossBlocked(state: SlimeMercenariesState, stageNumber: number | null): SlimeMercenariesState {
  return writeCombat(state, { blockedBossStage: stageNumber, waveWorkRemaining: null });
}

function setContentBoundary(state: SlimeMercenariesState): SlimeMercenariesState {
  return writeCombat(state, { contentBoundaryReached: true, waveWorkRemaining: null });
}

function setSimTime(state: SlimeMercenariesState, simTimeSec: number): SlimeMercenariesState {
  return { ...state, simTimeSec };
}

function clampWork(value: GameNumber): GameNumber {
  return value.compare(0) < 0 ? GameNumber.zero() : value;
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

function accept(
  state: SlimeMercenariesState,
  events: readonly DomainEvent[],
): CommandResult<SlimeMercenariesState, never> {
  return { accepted: true, state, events };
}

function reject<TReason extends string>(
  state: SlimeMercenariesState,
  reason: TReason,
): CommandResult<SlimeMercenariesState, TReason> {
  return { accepted: false, state, events: [], reason };
}

/** Convenience for tests/debug snapshots. */
export function currentWaveWorkRemaining(state: SlimeMercenariesState): GameNumberSerialized | null {
  return state.gameData.combat.waveWorkRemaining;
}


/** Advance from wall clock through the exact same analytical combat transition used online/simulator. */
export function advanceCombatFromWallClock(
  state: SlimeMercenariesState,
  currentWallClockMs: number,
  offlinePolicy: OfflineTimePolicy = {},
): Readonly<{ state: SlimeMercenariesState; events: readonly DomainEvent[]; appliedOfflineSec: number }> {
  const elapsed = resolveOfflineElapsed(state.lastWallClockMs, currentWallClockMs, offlinePolicy);
  if (elapsed.observedElapsedSec === 0) return { state, events: [], appliedOfflineSec: 0 };
  const advanced = advanceCombatTo(state, state.simTimeSec + elapsed.appliedElapsedSec);
  return {
    state: { ...advanced.state, lastWallClockMs: elapsed.nextWallClockMs },
    events: advanced.events,
    appliedOfflineSec: elapsed.appliedElapsedSec,
  };
}
