import { describe, expect, it } from 'vitest';
import { readCurrency } from 'idle-game-kit';
import { craftPlainSlime, createJobSlime } from './commands';
import { assignSlimeToFormation } from './combat';
import { startDispatch } from './dispatch';
import { dispatchContractDefinitions, ids } from './definitions';
import { createInitialSlimeMercenariesState, type SlimeMercenariesState } from './state';
import { advanceSlimeWorldTo } from './world';

function createReserveSword(): SlimeMercenariesState {
  const initial = createInitialSlimeMercenariesState(1_000, 5);
  const crafted = craftPlainSlime(initial);
  if (!crafted.accepted) throw new Error('setup craft failed');
  const created = createJobSlime(crafted.state, 'sword');
  if (!created.accepted) throw new Error('setup job failed');
  return created.state;
}

describe('dispatch integration', () => {
  it('uses Kit TimedActivity completion and automatically returns the slime to reserve', () => {
    const initial = createReserveSword();
    const started = startDispatch(initial, 'roadEscort', 'sword');
    expect(started.accepted).toBe(true);
    if (!started.accepted) return;
    expect(started.state.gameData.roster.slimes.sword?.assignment).toBe('dispatch');

    const duration = dispatchContractDefinitions.roadEscort.activity.durationSec;
    const advanced = advanceSlimeWorldTo(started.state, started.state.simTimeSec + duration);

    expect(advanced.state.gameData.roster.slimes.sword?.assignment).toBe('reserve');
    expect(advanced.state.gameData.dispatch.contracts.roadEscort.slimeId).toBeNull();
    expect(advanced.state.gameData.dispatch.contracts.roadEscort.activity.status).toBe('available');
    expect(readCurrency(advanced.state.currencies, ids.currency.gold).toNumber()).toBeGreaterThan(0);
    expect(advanced.events.some((event) => event.type === 'timedActivityAutoResolved')).toBe(true);
    expect(advanced.events.some((event) => event.type === 'dispatchCompleted')).toBe(true);
  });

  it('does not allow the same canonical slime to battle and dispatch simultaneously', () => {
    const initial = createReserveSword();
    const assigned = assignSlimeToFormation(initial, 'sword', 0);
    if (!assigned.accepted) throw new Error('setup formation failed');

    const rejected = startDispatch(assigned.state, 'roadEscort', 'sword');
    expect(rejected.accepted).toBe(false);
    if (rejected.accepted) return;
    expect(rejected.reason).toBe('not-reserve');
    expect(rejected.state).toBe(assigned.state);
  });

  it('uses authored power thresholds without a random failure chance', () => {
    const initial = createReserveSword();
    const rejected = startDispatch(initial, 'materialGathering', 'sword');
    expect(rejected.accepted).toBe(false);
    if (rejected.accepted) return;
    expect(rejected.reason).toBe('insufficient-power');
  });
});
