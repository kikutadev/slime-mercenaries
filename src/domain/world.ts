import { advanceOfflineInChunks, resolveOfflineElapsed, type DomainEvent, type OfflineTimePolicy } from 'idle-game-kit';
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

  const advanced = advanceOfflineInChunks({
    initialState: state,
    targetSimTimeSec,
    maxChunkSec: LONG_OFFLINE_CHUNK_SEC,
    getSimTimeSec: (current) => current.simTimeSec,
    advanceChunk: (current, chunkTargetSimTimeSec) =>
      advanceSlimeWorldTo(current, chunkTargetSimTimeSec, combatPolicy),
    initialAccumulator: createOfflineProgressAccumulator(),
    accumulate: (accumulator, events) => {
      accumulateOfflineProgressEvents(accumulator, events);
      return accumulator;
    },
  });

  return {
    state: { ...advanced.state, lastWallClockMs: elapsed.nextWallClockMs },
    events: createOfflineProgressAggregatedEvents(advanced.accumulator, state.simTimeSec, targetSimTimeSec),
    appliedOfflineSec: elapsed.appliedElapsedSec,
  };
}
