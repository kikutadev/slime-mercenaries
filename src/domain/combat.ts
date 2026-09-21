import {
  GameNumber,
  grantToken,
  nextRandom,
  resolveOfflineElapsed,
  type DomainEvent,
  type GameNumberSerialized,
  type OfflineTimePolicy,
} from 'idle-game-kit';
import { balance } from './balance';
import {
  resolveStageDefinition,
  resolveNextWorldStageDefinition,
  ids,
  type StageBossDefinition,
  type StageDefinition,
  type StageWaveDefinition,
} from './definitions';
import { highestStageClearedForArea, withHighestStageClearedForArea, type SlimeMercenariesState } from './state';
import { applySlimeProductRewards, describeSlimeProductRewards, withActiveMutationRewardBonuses } from './rewards';
import { partyCombatDps, partyCombatPower } from './combat-power';

export { partyCombatDps, partyCombatPower, slimeCombatPower } from './combat-power';
export { assignSlimeToFormation, removeSlimeFromFormation } from './formation';

export type CombatEncounter = Readonly<{
  kind: 'wave' | 'boss';
  work: number;
  requiredPartyPower: number | null;
  waveIndex: number;
  wave?: StageWaveDefinition;
  boss?: StageBossDefinition;
}>;

export type CombatAdvancePolicy = Readonly<{
  /** Offline resume can farm indefinitely without silently clearing an uncleared major frontier. */
  allowFrontierFirstClear?: boolean;
}>;

/** Assign one persistent slime instance to a battle slot. Same-type instances may occupy other slots. */
/** Remove a battle slime from its slot and return it to reserve. */
/** Effective analytical DPS used by offline progression and the balance simulator. */
/** Coarse survivability/power gate used by authoritative frontier win/loss checks. */
/** Power of one owned slime instance independent from its current assignment. */
export function currentStageDefinition(state: SlimeMercenariesState): StageDefinition | null {
  return resolveStageDefinition(state.gameData.progression.currentAreaId, state.gameData.progression.currentStage);
}

export function resumeAvailableCombatContent(state: SlimeMercenariesState): SlimeMercenariesState {
  if (!state.gameData.combat.contentBoundaryReached) return state;
  const nextStage = resolveNextWorldStageDefinition(
    state.gameData.progression.currentAreaId,
    state.gameData.progression.currentStage,
  );
  if (nextStage === null) return state;

  return {
    ...state,
    gameData: {
      ...state.gameData,
      progression: {
        ...state.gameData.progression,
        currentAreaId: nextStage.areaId,
        currentStage: nextStage.stageNumber,
      },
      combat: {
        currentWaveIndex: 0,
        waveWorkRemaining: null,
        retryFarmClearsRemaining: 0,
        frontierDefeatTimeRemainingSec: null,
        contentBoundaryReached: false,
      },
    },
  };
}

export function currentCombatEncounter(state: SlimeMercenariesState): CombatEncounter | null {
  const stage = currentStageDefinition(state);
  if (stage === null || state.gameData.combat.contentBoundaryReached) return null;
  const index = state.gameData.combat.currentWaveIndex;
  const wave = stage.waves[index];
  if (wave !== undefined) {
    return {
      kind: 'wave',
      work: wave.work,
      requiredPartyPower: stage.requiredPartyPower ?? null,
      waveIndex: index,
      wave,
    };
  }
  if (index === stage.waves.length && stage.boss !== undefined) {
    return {
      kind: 'boss',
      work: stage.boss.work,
      requiredPartyPower: stage.boss.requiredPartyPower,
      waveIndex: index,
      boss: stage.boss,
    };
  }
  return null;
}

/** Next analytical encounter completion boundary, or null when no party/progression is available. */
export function nextCombatBoundarySec(state: SlimeMercenariesState): number | null {
  const encounter = currentCombatEncounter(state);
  if (encounter === null) return null;
  // A failed frontier attempt is itself an authoritative boundary. Reserving a short authored
  // duration gives the presentation enough time to show the defeat while offline uses identical rules.
  if (encounter.requiredPartyPower !== null
    && partyCombatPower(state).compare(encounter.requiredPartyPower) < 0) {
    const remaining = state.gameData.combat.frontierDefeatTimeRemainingSec
      ?? balance.combat.frontier.defeatDurationSec;
    return state.simTimeSec + Math.max(1, Math.ceil(remaining));
  }
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
  policy: CombatAdvancePolicy = {},
): Readonly<{ state: SlimeMercenariesState; events: readonly DomainEvent[] }> {
  if (!Number.isSafeInteger(targetSimTimeSec) || targetSimTimeSec < state.simTimeSec) {
    throw new RangeError('targetSimTimeSec must be a safe integer at or after current sim time.');
  }
  const resumedState = resumeAvailableCombatContent(state);
  if (targetSimTimeSec === state.simTimeSec) return { state: resumedState, events: [] };

  let nextState = resumedState;
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

    const required = encounter.requiredPartyPower;
    const power = required === null ? null : partyCombatPower(nextState);
    if (encounter.kind === 'boss' && required !== null && power !== null) {
      const isUnclearedFrontier = nextState.gameData.progression.currentStage
        > highestStageClearedForArea(nextState.gameData.progression);
      if (isUnclearedFrontier && policy.allowFrontierFirstClear === false && power.compare(required) >= 0) {
        const deferred = resolveFrontierBreakthroughDeferred(nextState);
        nextState = deferred.state;
        events.push(...deferred.events);
        continue;
      }
    }

    if (required !== null && power !== null && power.compare(required) < 0) {
      const remaining = nextState.gameData.combat.frontierDefeatTimeRemainingSec
        ?? balance.combat.frontier.defeatDurationSec;
      const availableSeconds = targetSimTimeSec - nextState.simTimeSec;
      if (remaining > availableSeconds) {
        nextState = writeCombat(
          setSimTime(nextState, targetSimTimeSec),
          {
            waveWorkRemaining: null,
            frontierDefeatTimeRemainingSec: remaining - availableSeconds,
          },
        );
        break;
      }
      nextState = writeCombat(
        setSimTime(nextState, nextState.simTimeSec + remaining),
        { waveWorkRemaining: null, frontierDefeatTimeRemainingSec: null },
      );
      const defeated = resolveFrontierDefeat(nextState, required, power.toNumber());
      nextState = defeated.state;
      events.push(...defeated.events);
      continue;
    }

    if (nextState.gameData.combat.frontierDefeatTimeRemainingSec !== null) {
      // Power improved before the defeat resolved. Cancel the losing attempt and restart the
      // current frontier encounter cleanly instead of interpreting the countdown as encounter work.
      nextState = writeCombat(nextState, {
        frontierDefeatTimeRemainingSec: null,
        waveWorkRemaining: null,
      });
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
  const authoredRewards = withActiveMutationRewardBonuses(state, wave.rewards);
  let nextState = applySlimeProductRewards(state, authoredRewards);
  const random = resolveRandomDrops(nextState, wave);
  nextState = random.state;
  const waveNumber = state.gameData.combat.currentWaveIndex + 1;
  const events: DomainEvent[] = [semanticEvent(nextState, 'combatWaveCleared', `${stage.id}:${waveNumber}`, {
    areaId: stage.areaId,
    stageId: stage.id,
    stageNumber: stage.stageNumber,
    waveNumber,
    grantedRewards: [
      ...describeSlimeProductRewards(authoredRewards),
      ...random.granted.map((drop) => ({ kind: 'token' as const, id: drop.tokenId, amount: drop.count })),
    ],
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
  const authoredRewards = withActiveMutationRewardBonuses(state, boss.rewards);
  let nextState = applySlimeProductRewards(state, authoredRewards);
  nextState = writeCombat(nextState, { waveWorkRemaining: null, frontierDefeatTimeRemainingSec: null });
  const completed = completeStage(nextState);
  return {
    state: completed.state,
    events: [
      semanticEvent(nextState, 'bossDefeated', stage.id, {
        areaId: stage.areaId,
        stageId: stage.id,
        stageNumber: stage.stageNumber,
        grantedRewards: describeSlimeProductRewards(authoredRewards),
      }),
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

  const previousHighestStageCleared = highestStageClearedForArea(state.gameData.progression, stage.areaId);
  const firstClear = stage.stageNumber > previousHighestStageCleared;
  const authoredClearRewards = firstClear
    ? withActiveMutationRewardBonuses(state, stage.clearRewards)
    : stage.clearRewards;
  let nextState = firstClear ? applySlimeProductRewards(state, authoredClearRewards) : state;
  const isRetreatFarmClear = nextState.gameData.combat.retryFarmClearsRemaining > 0
    && stage.stageNumber <= previousHighestStageCleared;

  if (isRetreatFarmClear) {
    const remaining = Math.max(0, nextState.gameData.combat.retryFarmClearsRemaining - 1);
    const frontierStageNumber = previousHighestStageCleared + 1;
    const frontierStage = resolveStageDefinition(nextState.gameData.progression.currentAreaId, frontierStageNumber);
    const retryingFrontier = remaining === 0 && frontierStage !== null;

    nextState = {
      ...nextState,
      gameData: {
        ...nextState.gameData,
        progression: {
          ...nextState.gameData.progression,
          currentStage: retryingFrontier ? frontierStage.stageNumber : stage.stageNumber,
        },
        combat: {
          currentWaveIndex: 0,
          waveWorkRemaining: null,
          retryFarmClearsRemaining: remaining,
          frontierDefeatTimeRemainingSec: null,
          contentBoundaryReached: false,
        },
      },
    };

    const events: DomainEvent[] = [semanticEvent(nextState, 'stageCleared', stage.id, {
      areaId: stage.areaId,
      stageId: stage.id,
      stageNumber: stage.stageNumber,
      nextAreaId: stage.areaId,
      nextStageNumber: retryingFrontier ? frontierStage.stageNumber : stage.stageNumber,
      farming: true,
      retryFarmClearsRemaining: remaining,
      grantedRewards: [],
    })];
    if (retryingFrontier) {
      events.push(semanticEvent(nextState, 'frontierRetryStarted', `${frontierStage.stageNumber}`, {
        areaId: frontierStage.areaId,
        stageId: frontierStage.id,
        stageNumber: frontierStage.stageNumber,
      }));
    }
    return { state: nextState, events };
  }

  const nextHighestStageCleared = Math.max(previousHighestStageCleared, stage.stageNumber);
  const nextStage = resolveNextWorldStageDefinition(stage.areaId, stage.stageNumber);
  const clearedProgression = withHighestStageClearedForArea(
    nextState.gameData.progression,
    stage.areaId,
    nextHighestStageCleared,
  );
  const areaChanged = nextStage !== null && nextStage.areaId !== stage.areaId;

  if (nextStage === null) {
    nextState = {
      ...nextState,
      gameData: {
        ...nextState.gameData,
        progression: clearedProgression,
        combat: {
          currentWaveIndex: 0,
          waveWorkRemaining: null,
          retryFarmClearsRemaining: 0,
          frontierDefeatTimeRemainingSec: null,
          contentBoundaryReached: true,
        },
      },
    };
  } else {
    const progressed = clearedProgression;
    nextState = {
      ...nextState,
      gameData: {
        ...nextState.gameData,
        progression: {
          ...progressed,
          currentAreaId: nextStage.areaId,
          currentStage: nextStage.stageNumber,
        },
        combat: {
          currentWaveIndex: 0,
          waveWorkRemaining: null,
          retryFarmClearsRemaining: 0,
          frontierDefeatTimeRemainingSec: null,
          contentBoundaryReached: false,
        },
      },
    };
  }

  const events: DomainEvent[] = [semanticEvent(nextState, 'stageCleared', stage.id, {
    areaId: stage.areaId,
    stageId: stage.id,
    stageNumber: stage.stageNumber,
    nextAreaId: nextStage?.areaId ?? null,
    nextStageNumber: nextStage?.stageNumber ?? null,
    farming: false,
    grantedRewards: firstClear ? describeSlimeProductRewards(authoredClearRewards) : [],
  })];
  if (areaChanged && nextStage !== null) {
    events.push(semanticEvent(nextState, 'areaUnlocked', nextStage.areaId, {
      areaId: nextStage.areaId,
      stageNumber: nextStage.stageNumber,
    }));
  }
  return { state: nextState, events };
}


function resolveFrontierBreakthroughDeferred(
  state: SlimeMercenariesState,
): Readonly<{ state: SlimeMercenariesState; events: readonly DomainEvent[] }> {
  const frontierStage = state.gameData.progression.currentStage;
  const farmStage = Math.max(1, frontierStage - 1);
  const nextState: SlimeMercenariesState = {
    ...state,
    gameData: {
      ...state.gameData,
      progression: {
        ...state.gameData.progression,
        currentStage: farmStage,
      },
      combat: {
        currentWaveIndex: 0,
        waveWorkRemaining: null,
        retryFarmClearsRemaining: balance.combat.frontier.retryFarmClears,
        frontierDefeatTimeRemainingSec: null,
        contentBoundaryReached: false,
      },
    },
  };
  return {
    state: nextState,
    events: [semanticEvent(nextState, 'frontierBreakthroughDeferred', `${frontierStage}:${farmStage}`, {
      areaId: state.gameData.progression.currentAreaId,
      frontierStageNumber: frontierStage,
      farmStageNumber: farmStage,
      retryFarmClears: balance.combat.frontier.retryFarmClears,
    })],
  };
}

function resolveFrontierDefeat(
  state: SlimeMercenariesState,
  requiredPartyPower: number,
  currentPartyPower: number,
): Readonly<{ state: SlimeMercenariesState; events: readonly DomainEvent[] }> {
  const failedStage = state.gameData.progression.currentStage;
  const farmStage = Math.max(1, failedStage - 1);
  const nextState: SlimeMercenariesState = {
    ...state,
    gameData: {
      ...state.gameData,
      progression: {
        ...state.gameData.progression,
        currentStage: farmStage,
      },
      combat: {
        currentWaveIndex: 0,
        waveWorkRemaining: null,
        retryFarmClearsRemaining: balance.combat.frontier.retryFarmClears,
        frontierDefeatTimeRemainingSec: null,
        contentBoundaryReached: false,
      },
    },
  };
  return {
    state: nextState,
    events: [
      semanticEvent(nextState, 'partyDefeated', `${failedStage}`, {
        areaId: state.gameData.progression.currentAreaId,
        stageNumber: failedStage,
        requiredPartyPower,
        currentPartyPower,
      }),
      semanticEvent(nextState, 'stageRetreated', `${failedStage}:${farmStage}`, {
        areaId: state.gameData.progression.currentAreaId,
        failedStageNumber: failedStage,
        farmStageNumber: farmStage,
        retryFarmClears: balance.combat.frontier.retryFarmClears,
      }),
    ],
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

function setContentBoundary(state: SlimeMercenariesState): SlimeMercenariesState {
  return writeCombat(state, {
    contentBoundaryReached: true,
    waveWorkRemaining: null,
    frontierDefeatTimeRemainingSec: null,
  });
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
