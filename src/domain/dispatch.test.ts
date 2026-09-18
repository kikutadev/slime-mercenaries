import { describe, expect, it } from 'vitest';
import { grantToken, readCurrency } from 'idle-game-kit';
import { craftPlainSlime, createJobSlime } from './commands';
import { assignSlimeToFormation } from './combat';
import { startDispatch } from './dispatch';
import { dispatchContractDefinitions, ids, jobCreationDefinitions } from './definitions';
import { firstSlimeIdByType, slimeIdsByType } from './roster';
import { createInitialSlimeMercenariesState, type SlimeMercenariesState } from './state';
import { advanceSlimeWorldTo } from './world';

function createReserveSword(): Readonly<{ state: SlimeMercenariesState; swordId: string }> {
  const initial = createInitialSlimeMercenariesState(1_000, 5);
  const crafted = craftPlainSlime(initial);
  if (!crafted.accepted) throw new Error('setup craft failed');
  const created = createJobSlime(crafted.state, 'sword');
  if (!created.accepted) throw new Error('setup job failed');
  const swordId = firstSlimeIdByType(created.state, 'sword');
  if (swordId === null) throw new Error('setup sword missing');
  return { state: created.state, swordId };
}

function addSecondSword(state: SlimeMercenariesState): Readonly<{ state: SlimeMercenariesState; swordIds: readonly string[] }> {
  const prepared = {
    ...state,
    tokens: grantToken(
      grantToken(state.tokens, ids.token.plainSlime, jobCreationDefinitions.sword.plainSlimeCount),
      ids.token.trainingSword,
      jobCreationDefinitions.sword.jobGearCount,
    ),
  };
  const created = createJobSlime(prepared, 'sword');
  if (!created.accepted) throw new Error('setup duplicate sword failed');
  return { state: created.state, swordIds: slimeIdsByType(created.state, 'sword') };
}

describe('dispatch integration', () => {
  it('uses Kit TimedActivity completion and automatically returns the selected instance to reserve', () => {
    const { state: initial, swordId } = createReserveSword();
    const started = startDispatch(initial, 'roadEscort', swordId);
    expect(started.accepted).toBe(true);
    if (!started.accepted) return;
    expect(started.state.gameData.roster.slimes[swordId]?.assignment).toBe('dispatch');

    const duration = dispatchContractDefinitions.roadEscort.activity.durationSec;
    const advanced = advanceSlimeWorldTo(started.state, started.state.simTimeSec + duration);

    expect(advanced.state.gameData.roster.slimes[swordId]?.assignment).toBe('reserve');
    expect(advanced.state.gameData.dispatch.contracts.roadEscort.slimeId).toBeNull();
    expect(advanced.state.gameData.dispatch.contracts.roadEscort.activity.status).toBe('available');
    expect(readCurrency(advanced.state.currencies, ids.currency.gold).toNumber()).toBeGreaterThan(0);
    expect(advanced.events.some((event) => event.type === 'timedActivityAutoResolved')).toBe(true);
    expect(advanced.events.some((event) => event.type === 'dispatchCompleted')).toBe(true);
  });

  it('does not allow one instance to battle and dispatch simultaneously', () => {
    const { state: initial, swordId } = createReserveSword();
    const assigned = assignSlimeToFormation(initial, swordId, 0);
    if (!assigned.accepted) throw new Error('setup formation failed');

    const rejected = startDispatch(assigned.state, 'roadEscort', swordId);
    expect(rejected.accepted).toBe(false);
    if (rejected.accepted) return;
    expect(rejected.reason).toBe('not-reserve');
    expect(rejected.state).toBe(assigned.state);
  });

  it('allows one Sword to battle while another Sword is dispatched', () => {
    const first = createReserveSword();
    const duplicated = addSecondSword(first.state);
    const [battleSwordId, dispatchSwordId] = duplicated.swordIds;
    if (battleSwordId === undefined || dispatchSwordId === undefined) throw new Error('setup duplicate IDs missing');

    const assigned = assignSlimeToFormation(duplicated.state, battleSwordId, 0);
    if (!assigned.accepted) throw new Error('setup formation failed');
    const dispatched = startDispatch(assigned.state, 'roadEscort', dispatchSwordId);

    expect(dispatched.accepted).toBe(true);
    if (!dispatched.accepted) return;
    expect(dispatched.state.gameData.roster.slimes[battleSwordId]?.assignment).toBe('battle');
    expect(dispatched.state.gameData.roster.slimes[dispatchSwordId]?.assignment).toBe('dispatch');
    expect(dispatched.state.gameData.roster.formationSlots[0]).toBe(battleSwordId);
    expect(dispatched.state.gameData.dispatch.contracts.roadEscort.slimeId).toBe(dispatchSwordId);
  });

  it('uses authored power thresholds without a random failure chance', () => {
    const { state: initial, swordId } = createReserveSword();
    const rejected = startDispatch(initial, 'materialGathering', swordId);
    expect(rejected.accepted).toBe(false);
    if (rejected.accepted) return;
    expect(rejected.reason).toBe('insufficient-power');
  });
});
