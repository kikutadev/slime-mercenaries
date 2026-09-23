import { resolveOfflineElapsed, type DomainEvent, type OfflineTimePolicy } from 'idle-game-kit';
import { advanceCombatTo, type CombatAdvancePolicy } from './combat';
import { advanceDispatchTo } from './dispatch';
import {
  accumulateOfflineProgressEvents,
  createOfflineProgressAccumulator,
  createOfflineProgressAggregatedEvents,
} from './offline-progress';
import type { SlimeMercenariesState } from './state';

const LONG_OFFLINE_CHUNK_SEC = 60 * 60;

/** Advance all currently independent first-slice systems to one authoritative virtual time. */
export function advanceSlimeWorldTo(
  state: SlimeMercenariesState,
  targetSimTimeSec: number,
  combatPolicy: CombatAdvancePolicy = {},
): Readonly<{ state: SlimeMercenariesState; events: readonly DomainEvent[] }> {
  const combat = advanceCombatTo(state, targetSimTimeSec, combatPolicy);
  const dispatch = advanceDispatchTo(combat.state, targetSimTimeSec);
  return { state: dispatch.state, events: [...combat.events, ...dispatch.events] };
}

/** Resolve wall-clock elapsed once, then advance combat and dispatch through the same virtual-time target. */
export function advanceSlimeWorldFromWallClock(
  state: SlimeMercenariesState,
  currentWallClockMs: number,
  offlinePolicy: OfflineTimePolicy = {},
  combatPolicy: CombatAdvancePolicy = {},
): Readonly<{ state: SlimeMercenariesState; events: readonly DomainEvent[]; appliedOfflineSec: number }> {
  const elapsed = resolveOfflineElapsed(state.lastWallClockMs, currentWallClockMs, offlinePolicy);
  if (elapsed.observedElapsedSec === 0) return { state, events: [], appliedOfflineSec: 0 };

  const targetSimTimeSec = state.simTimeSec + elapsed.appliedElapsedSec;
  const shouldCompact = combatPolicy.allowFrontierFirstClear === false
    && elapsed.appliedElapsedSec > LONG_OFFLINE_CHUNK_SEC;

  if (!shouldCompact) {
    const advanced = advanceSlimeWorldTo(state, targetSimTimeSec, combatPolicy);
    return {
      state: { ...advanced.state, lastWallClockMs: elapsed.nextWallClockMs },
      events: advanced.events,
      appliedOfflineSec: elapsed.appliedElapsedSec,
    };
  }

  let nextState = state;
  const accumulator = createOfflineProgressAccumulator();

  while (nextState.simTimeSec < targetSimTimeSec) {
    const chunkTarget = Math.min(targetSimTimeSec, nextState.simTimeSec + LONG_OFFLINE_CHUNK_SEC);
    const advanced = advanceSlimeWorldTo(nextState, chunkTarget, combatPolicy);
    accumulateOfflineProgressEvents(accumulator, advanced.events);
    nextState = advanced.state;
  }

  return {
    state: { ...nextState, lastWallClockMs: elapsed.nextWallClockMs },
    events: createOfflineProgressAggregatedEvents(accumulator, state.simTimeSec, targetSimTimeSec),
    appliedOfflineSec: elapsed.appliedElapsedSec,
  };
}
