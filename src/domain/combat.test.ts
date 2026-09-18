import { describe, expect, it } from 'vitest';
import { readCurrency, readToken } from 'idle-game-kit';
import { craftPlainSlime, createJobSlime, levelUpSlime } from './commands';
import {
  advanceCombatFromWallClock,
  advanceCombatTo,
  assignSlimeToFormation,
  currentCombatEncounter,
  nextCombatBoundarySec,
  partyCombatDps,
  partyCombatPower,
} from './combat';
import { cloverRoadStageDefinitions, ids } from './definitions';
import { createInitialSlimeMercenariesState, type SlimeMercenariesState } from './state';

function createSwordParty(seed = 1): SlimeMercenariesState {
  const initial = createInitialSlimeMercenariesState(1_000, seed);
  const crafted = craftPlainSlime(initial);
  if (!crafted.accepted) throw new Error('test setup: craft failed');
  const created = createJobSlime(crafted.state, 'sword');
  if (!created.accepted) throw new Error('test setup: job creation failed');
  const assigned = assignSlimeToFormation(created.state, 'sword', 0);
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
    const boundary = nextCombatBoundarySec(state);
    if (boundary === null) throw new Error('missing boundary');
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

    expect(advanced.state.gameData.progression.highestStageCleared).toBeGreaterThanOrEqual(1);
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

  it('retreats exactly one stage when party power is below the boss gate', () => {
    const retreated = advanceUntilBossRetreat(createSwordParty());

    expect(retreated.state.gameData.progression.highestStageCleared).toBe(4);
    expect(retreated.state.gameData.progression.currentStage).toBe(4);
    expect(retreated.state.gameData.combat.blockedBossStage).toBe(5);
    expect(retreated.state.gameData.combat.currentWaveIndex).toBe(0);
    expect(retreated.state.gameData.combat.contentBoundaryReached).toBe(false);
    expect(retreated.events.some((event) => event.type === 'bossBlocked')).toBe(true);
    expect(retreated.events.some((event) => event.type === 'combatRetreated')).toBe(true);
    expect(nextCombatBoundarySec(retreated.state)).not.toBeNull();
  });

  it('farms normal waves after retreat without duplicating one-time stage-clear rewards', () => {
    const retreated = advanceUntilBossRetreat(createSwordParty(19));
    const beforeReinforcedBow = readToken(retreated.state.tokens, ids.token.reinforcedBow);
    const replayed = advanceUntil(retreated.state, (state) => (
      state.gameData.progression.currentStage === 5 && state.gameData.combat.currentWaveIndex === 0
    ));

    expect(readToken(replayed.state.tokens, ids.token.reinforcedBow)).toBe(beforeReinforcedBow);
    expect(replayed.events.some((event) => event.type === 'stageCleared' && event.payload?.stageNumber === 4)).toBe(false);
    expect(replayed.state.gameData.combat.blockedBossStage).toBe(5);
  });

  it('re-enters the blocked boss and clears it after growth reaches the required power', () => {
    const retreated = advanceUntilBossRetreat(createSwordParty());
    let state = retreated.state;
    const boss = cloverRoadStageDefinitions[4]?.boss;
    if (boss === undefined) throw new Error('expected Stage 5 boss');

    while (partyCombatPower(state).compare(boss.requiredPartyPower) < 0) {
      const leveled = levelUpSlime(state, 'sword', 1);
      if (!leveled.accepted) throw new Error(`unable to grow through boss gate: ${leveled.reason}`);
      state = leveled.state;
    }

    const resumed = advanceUntil(state, (candidate) => candidate.gameData.combat.contentBoundaryReached);
    expect(resumed.state.gameData.progression.highestStageCleared).toBe(5);
    expect(resumed.state.gameData.combat.blockedBossStage).toBeNull();
    expect(resumed.state.gameData.combat.contentBoundaryReached).toBe(true);
    expect(resumed.events.some((event) => event.type === 'bossDefeated')).toBe(true);
  });

  it('uses the same combat/reward transition for live and offline elapsed time', () => {
    const initial = createSwordParty(123);
    const live = advanceCombatTo(initial, initial.simTimeSec + 60);
    const offline = advanceCombatFromWallClock(initial, initial.lastWallClockMs + 60_000);

    expect(offline.appliedOfflineSec).toBe(60);
    expect(offline.state.currencies).toEqual(live.state.currencies);
    expect(offline.state.tokens).toEqual(live.state.tokens);
    expect(offline.state.rngStreams).toEqual(live.state.rngStreams);
    expect(offline.state.gameData).toEqual(live.state.gameData);
    expect(offline.events).toEqual(live.events);
  });
});

function advanceUntilBossRetreat(initial: SlimeMercenariesState): Readonly<{ state: SlimeMercenariesState; events: readonly import('idle-game-kit').DomainEvent[] }> {
  return advanceUntil(initial, (state) => (
    state.gameData.combat.blockedBossStage !== null
      && state.gameData.progression.currentStage === state.gameData.combat.blockedBossStage - 1
  ));
}

function advanceUntil(
  initial: SlimeMercenariesState,
  done: (state: SlimeMercenariesState) => boolean,
): Readonly<{ state: SlimeMercenariesState; events: readonly import('idle-game-kit').DomainEvent[] }> {
  let state = initial;
  const events: import('idle-game-kit').DomainEvent[] = [];
  for (let guard = 0; guard < 300; guard += 1) {
    if (done(state)) return { state, events };
    const boundary = nextCombatBoundarySec(state);
    const advanced = advanceCombatTo(state, boundary ?? state.simTimeSec + 1);
    state = advanced.state;
    events.push(...advanced.events);
  }
  throw new Error('combat condition was not reached within the test guard');
}
