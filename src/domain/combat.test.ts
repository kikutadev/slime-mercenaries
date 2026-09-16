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
import { ids } from './definitions';
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
    expect(advanced.events.some((event) => event.type === 'combatWaveCleared')).toBe(true);
  });

  it('moves to the next stage and grants deterministic stage-clear progression materials', () => {
    const state = createSwordParty();
    const advanced = advanceCombatTo(state, 30);

    expect(advanced.state.gameData.progression.highestStageCleared).toBeGreaterThanOrEqual(1);
    expect(advanced.state.gameData.progression.currentStage).toBeGreaterThanOrEqual(2);
    expect(readToken(advanced.state.tokens, ids.token.trainingSword)).toBeGreaterThanOrEqual(1);
    expect(readToken(advanced.state.tokens, ids.token.lifeWater)).toBeGreaterThanOrEqual(1);
    expect(readToken(advanced.state.tokens, ids.token.slimeGel)).toBeGreaterThanOrEqual(8);
  });

  it('keeps random wave drops deterministic for the same seed and elapsed time', () => {
    const first = advanceCombatTo(createSwordParty(77), 90).state;
    const second = advanceCombatTo(createSwordParty(77), 90).state;

    expect(first.tokens).toEqual(second.tokens);
    expect(first.rngStreams[ids.rng.loot]).toEqual(second.rngStreams[ids.rng.loot]);
    expect(first.gameData.progression).toEqual(second.gameData.progression);
  });

  it('stops progression at the first boss when party power is below the authored threshold', () => {
    const advanced = advanceUntilBossBlock(createSwordParty());

    expect(advanced.gameData.progression.highestStageCleared).toBe(4);
    expect(advanced.gameData.combat.blockedBossStage).toBe(advanced.gameData.progression.currentStage);
    expect(advanced.gameData.combat.contentBoundaryReached).toBe(false);
  });

  it('resumes from a boss block after level growth raises party power enough', () => {
    let state = advanceUntilBossBlock(createSwordParty());
    const encounter = currentCombatEncounter(state);
    if (encounter?.kind !== 'boss') throw new Error('expected boss encounter');

    while (partyCombatPower(state).compare(encounter.boss!.requiredPartyPower) < 0) {
      const leveled = levelUpSlime(state, 'sword', 1);
      if (!leveled.accepted) throw new Error(`unable to grow through boss gate: ${leveled.reason}`);
      state = leveled.state;
    }

    const boundary = nextCombatBoundarySec(state);
    if (boundary === null) throw new Error('boss should have a completion boundary after growth');
    const resumed = advanceCombatTo(state, boundary);
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

function advanceUntilBossBlock(initial: SlimeMercenariesState): SlimeMercenariesState {
  let state = initial;
  for (let guard = 0; guard < 100; guard += 1) {
    const boundary = nextCombatBoundarySec(state);
    if (boundary === null) {
      const marked = advanceCombatTo(state, state.simTimeSec + 1);
      if (marked.state.gameData.combat.blockedBossStage !== null) return marked.state;
      throw new Error('combat stopped before reaching a boss block');
    }
    state = advanceCombatTo(state, boundary).state;
  }
  throw new Error('boss block was not reached within the test guard');
}
