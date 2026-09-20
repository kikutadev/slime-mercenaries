import { describe, expect, it } from 'vitest';
import { readCurrency, readToken } from 'idle-game-kit';
import { craftPlainSlime, createJobSlime, levelUpSlime } from './commands';
import {
  advanceCombatFromWallClock,
  advanceCombatTo,
  assignSlimeToFormation,
  nextCombatBoundarySec,
  partyCombatDps,
  partyCombatPower,
} from './combat';
import { balance } from './balance';
import { areaDefinitions, ids } from './definitions';
import { firstSlimeIdByType } from './roster';
import { createInitialSlimeMercenariesState, highestStageClearedForArea, type SlimeMercenariesState } from './state';

function createSwordParty(seed = 1): SlimeMercenariesState {
  const initial = createInitialSlimeMercenariesState(1_000, seed);
  const crafted = craftPlainSlime(initial);
  if (!crafted.accepted) throw new Error('test setup: craft failed');
  const created = createJobSlime(crafted.state, 'sword');
  if (!created.accepted) throw new Error('test setup: job creation failed');
  const swordId = firstSlimeIdByType(created.state, 'sword');
  if (swordId === null) throw new Error('test setup: sword missing');
  const assigned = assignSlimeToFormation(created.state, swordId, 0);
  if (!assigned.accepted) throw new Error('test setup: formation failed');
  return assigned.state;
}

describe('analytical combat progression', () => {
  it('derives party DPS/power from the same Type Level and Fusion axes used by progression', () => {
    const state = createSwordParty();
    expect(partyCombatDps(state).toNumber()).toBeGreaterThan(0);
    expect(partyCombatPower(state).toNumber()).toBeGreaterThan(0);
    expect(nextCombatBoundarySec(state)).not.toBeNull();
  });

  it('clears a wave at its event boundary and grants authored Gold', () => {
    const state = createSwordParty();
    const boundary = requireCombatBoundary(state);
    const beforeGold = readCurrency(state.currencies, ids.currency.gold);
    const advanced = advanceCombatTo(state, boundary);

    expect(advanced.state.gameData.combat.currentWaveIndex).toBe(1);
    expect(readCurrency(advanced.state.currencies, ids.currency.gold).compare(beforeGold)).toBeGreaterThan(0);
    const waveEvent = advanced.events.find((event) => event.type === 'combatWaveCleared');
    expect(waveEvent).toBeDefined();
    const grantedRewards = waveEvent?.payload?.grantedRewards;
    expect(Array.isArray(grantedRewards)).toBe(true);
    expect((grantedRewards as readonly Record<string, unknown>[]).some((reward) => (
      reward.kind === 'currency'
      && reward.id === ids.currency.gold
      && typeof reward.amount === 'number'
      && reward.amount > 0
    ))).toBe(true);
  });

  it('moves to the next stage and grants deterministic stage-clear progression materials', () => {
    const state = createSwordParty();
    const advanced = advanceCombatTo(state, 30);

    expect(highestStageClearedForArea(advanced.state.gameData.progression)).toBeGreaterThanOrEqual(1);
    expect(advanced.state.gameData.progression.currentStage).toBeGreaterThanOrEqual(2);
    expect(readToken(advanced.state.tokens, ids.token.trainingSword)).toBeGreaterThanOrEqual(1);
    expect(readToken(advanced.state.tokens, ids.token.lifeWater)).toBeGreaterThanOrEqual(1);
    expect(readToken(advanced.state.tokens, ids.token.slimeGel)).toBeGreaterThanOrEqual(8);
    const stageEvent = advanced.events.find((event) => event.type === 'stageCleared');
    expect(stageEvent).toBeDefined();
    expect(Array.isArray(stageEvent?.payload?.grantedRewards)).toBe(true);
  });

  it('keeps random wave drops deterministic for the same seed and elapsed time', () => {
    const first = advanceCombatTo(createSwordParty(77), 90).state;
    const second = advanceCombatTo(createSwordParty(77), 90).state;

    expect(first.tokens).toEqual(second.tokens);
    expect(first.rngStreams[ids.rng.loot]).toEqual(second.rngStreams[ids.rng.loot]);
    expect(first.gameData.progression).toEqual(second.gameData.progression);
  });

  it('retreats one stage when a normal frontier stage exceeds party power', () => {
    const defeated = advanceUntilEvent(createSwordParty(), 'partyDefeated');

    expect(highestStageClearedForArea(defeated.state.gameData.progression)).toBe(2);
    expect(defeated.state.gameData.progression.currentStage).toBe(2);
    expect(defeated.state.gameData.combat.retryFarmClearsRemaining).toBe(balance.combat.frontier.retryFarmClears);
    expect(defeated.state.gameData.combat.contentBoundaryReached).toBe(false);
    expect(defeated.events.some((event) => event.type === 'stageRetreated')).toBe(true);
    expect(nextCombatBoundarySec(defeated.state)).not.toBeNull();
  });

  it('uses the same retreat loop for the stage-5 frontier', () => {
    const defeated = advanceUntilEvent(withSwordLevel(createSwordParty(), 4), 'partyDefeated');

    expect(highestStageClearedForArea(defeated.state.gameData.progression)).toBe(4);
    expect(defeated.state.gameData.progression.currentStage).toBe(4);
    expect(defeated.state.gameData.combat.retryFarmClearsRemaining).toBe(balance.combat.frontier.retryFarmClears);
    expect(defeated.events.some((event) => event.type === 'stageRetreated')).toBe(true);
  });

  it('continues granting normal farm rewards after defeat', () => {
    const defeated = advanceUntilEvent(createSwordParty(15), 'partyDefeated').state;
    const beforeGold = readCurrency(defeated.currencies, ids.currency.gold);
    const beforeHardeningGel = readToken(defeated.tokens, ids.token.hardeningGel);
    const farmed = advanceUntilRetryCountChanges(defeated);

    expect(farmed.gameData.combat.retryFarmClearsRemaining).toBe(balance.combat.frontier.retryFarmClears - 1);
    expect(readCurrency(farmed.currencies, ids.currency.gold).compare(beforeGold)).toBeGreaterThan(0);
    expect(readToken(farmed.tokens, ids.token.hardeningGel)).toBeGreaterThanOrEqual(beforeHardeningGel);
    expect(highestStageClearedForArea(farmed.gameData.progression)).toBe(2);
    expect(farmed.gameData.progression.currentStage).toBe(2);
  });

  it('retries the frontier automatically after the authored number of farm clears', () => {
    let state = advanceUntilEvent(createSwordParty(), 'partyDefeated').state;
    const events: string[] = [];

    for (let guard = 0; guard < 200 && state.gameData.combat.retryFarmClearsRemaining > 0; guard += 1) {
      const advanced = advanceCombatTo(state, requireCombatBoundary(state));
      state = advanced.state;
      events.push(...advanced.events.map((event) => event.type));
    }

    expect(state.gameData.combat.retryFarmClearsRemaining).toBe(0);
    expect(state.gameData.progression.currentStage).toBe(3);
    expect(highestStageClearedForArea(state.gameData.progression)).toBe(2);
    expect(events).toContain('frontierRetryStarted');
  });

  it('retreats and farms again when the automatic frontier retry is still too weak', () => {
    let state = advanceUntilEvent(createSwordParty(), 'partyDefeated').state;
    state = advanceUntilFrontierRetry(state);
    const defeatedAgain = advanceUntilEvent(state, 'partyDefeated');

    expect(defeatedAgain.state.gameData.progression.currentStage).toBe(2);
    expect(highestStageClearedForArea(defeatedAgain.state.gameData.progression)).toBe(2);
    expect(defeatedAgain.state.gameData.combat.retryFarmClearsRemaining).toBe(balance.combat.frontier.retryFarmClears);
  });

  it('breaks through the frontier after growth during the retreat farm cycle', () => {
    let state = advanceUntilEvent(createSwordParty(), 'partyDefeated').state;
    const requiredPower = areaDefinitions['area.clover-road'].stages[4]?.requiredPartyPower;
    if (requiredPower === undefined) throw new Error('test setup: missing stage-5 frontier gate');

    while (partyCombatPower(state).compare(requiredPower) < 0) {
      const swordId = firstSlimeIdByType(state, 'sword');
      if (swordId === null) throw new Error('test setup: sword missing');
      const leveled = levelUpSlime(state, swordId, 1);
      if (!leveled.accepted) throw new Error(`unable to grow through frontier gate: ${leveled.reason}`);
      state = leveled.state;
    }

    state = advanceUntilFrontierRetry(state);
    state = advanceUntilHighestStageCleared(state, 5, 'area.clover-road');

    expect(highestStageClearedForArea(state.gameData.progression, 'area.clover-road')).toBe(5);
    expect(state.gameData.progression.currentAreaId).toBe('area.mushroom-forest');
    expect(state.gameData.progression.currentStage).toBe(1);
    expect(state.gameData.combat.retryFarmClearsRemaining).toBe(0);
    expect(state.gameData.combat.contentBoundaryReached).toBe(false);
  });

  it('resolves the same frontier defeat under one-second live ticks', () => {
    let state = createSwordParty(91);
    let sawDefeat = false;
    for (let guard = 0; guard < 600 && !sawDefeat; guard += 1) {
      const advanced = advanceCombatTo(state, state.simTimeSec + 1);
      sawDefeat = advanced.events.some((event) => event.type === 'partyDefeated');
      state = advanced.state;
    }

    expect(sawDefeat).toBe(true);
    expect(state.gameData.progression.currentStage).toBe(2);
    expect(state.gameData.combat.retryFarmClearsRemaining).toBe(balance.combat.frontier.retryFarmClears);
    expect(state.gameData.combat.frontierDefeatTimeRemainingSec).toBeNull();
  });

  it('keeps farming during offline elapsed time instead of freezing at the failed frontier', () => {
    const initial = createSwordParty(123);
    const offline = advanceCombatFromWallClock(initial, initial.lastWallClockMs + 600_000);

    expect(offline.appliedOfflineSec).toBe(600);
    expect(offline.events.some((event) => event.type === 'partyDefeated')).toBe(true);
    expect(highestStageClearedForArea(offline.state.gameData.progression)).toBe(2);
    expect(readCurrency(offline.state.currencies, ids.currency.gold).toNumber()).toBeGreaterThan(500);
    expect(offline.state.gameData.combat.contentBoundaryReached).toBe(false);
  });

  it('uses the same combat/reward transition for live and offline elapsed time', () => {
    const initial = createSwordParty(123);
    const live = advanceCombatTo(initial, initial.simTimeSec + 600);
    const offline = advanceCombatFromWallClock(initial, initial.lastWallClockMs + 600_000);

    expect(offline.appliedOfflineSec).toBe(600);
    expect(offline.state.currencies).toEqual(live.state.currencies);
    expect(offline.state.tokens).toEqual(live.state.tokens);
    expect(offline.state.rngStreams).toEqual(live.state.rngStreams);
    expect(offline.state.gameData).toEqual(live.state.gameData);
    expect(offline.events).toEqual(live.events);
  });
});

function requireCombatBoundary(state: SlimeMercenariesState): number {
  const boundary = nextCombatBoundarySec(state);
  if (boundary === null) throw new Error('combat unexpectedly has no next boundary');
  return boundary;
}

function advanceUntilEvent(
  initial: SlimeMercenariesState,
  eventType: string,
): ReturnType<typeof advanceCombatTo> {
  let state = initial;
  for (let guard = 0; guard < 500; guard += 1) {
    const advanced = advanceCombatTo(state, requireCombatBoundary(state));
    if (advanced.events.some((event) => event.type === eventType)) return advanced;
    state = advanced.state;
  }
  throw new Error(`${eventType} was not reached within the test guard`);
}

function advanceUntilRetryCountChanges(initial: SlimeMercenariesState): SlimeMercenariesState {
  const initialCount = initial.gameData.combat.retryFarmClearsRemaining;
  let state = initial;
  for (let guard = 0; guard < 100; guard += 1) {
    state = advanceCombatTo(state, requireCombatBoundary(state)).state;
    if (state.gameData.combat.retryFarmClearsRemaining !== initialCount) return state;
  }
  throw new Error('farm clear was not reached within the test guard');
}

function advanceUntilFrontierRetry(initial: SlimeMercenariesState): SlimeMercenariesState {
  let state = initial;
  for (let guard = 0; guard < 300; guard += 1) {
    if (state.gameData.combat.retryFarmClearsRemaining === 0
      && state.gameData.progression.currentStage === highestStageClearedForArea(state.gameData.progression) + 1) {
      return state;
    }
    state = advanceCombatTo(state, requireCombatBoundary(state)).state;
  }
  throw new Error('frontier retry was not reached within the test guard');
}

function advanceUntilHighestStageCleared(
  initial: SlimeMercenariesState,
  targetStage: number,
  areaId = initial.gameData.progression.currentAreaId,
): SlimeMercenariesState {
  let state = initial;
  for (let guard = 0; guard < 300; guard += 1) {
    if (highestStageClearedForArea(state.gameData.progression, areaId) >= targetStage) return state;
    state = advanceCombatTo(state, requireCombatBoundary(state)).state;
  }
  throw new Error(`stage ${targetStage} was not cleared within the test guard`);
}

function withSwordLevel(state: SlimeMercenariesState, level: number): SlimeMercenariesState {
  const swordId = firstSlimeIdByType(state, 'sword');
  if (swordId === null) throw new Error('test setup: sword missing');
  const sword = state.gameData.roster.slimes[swordId]!;
  return {
    ...state,
    gameData: {
      ...state.gameData,
      roster: {
        ...state.gameData.roster,
        slimes: {
          ...state.gameData.roster.slimes,
          [swordId]: { ...sword, level },
        },
      },
    },
  };
}
