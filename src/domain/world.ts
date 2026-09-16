import { resolveOfflineElapsed, type DomainEvent, type OfflineTimePolicy } from 'idle-game-kit';
import { advanceCombatTo } from './combat';
import { advanceDispatchTo } from './dispatch';
import type { SlimeMercenariesState } from './state';

/** Advance all currently independent first-slice systems to one authoritative virtual time. */
export function advanceSlimeWorldTo(
  state: SlimeMercenariesState,
  targetSimTimeSec: number,
): Readonly<{ state: SlimeMercenariesState; events: readonly DomainEvent[] }> {
  const combat = advanceCombatTo(state, targetSimTimeSec);
  const dispatch = advanceDispatchTo(combat.state, targetSimTimeSec);
  return { state: dispatch.state, events: [...combat.events, ...dispatch.events] };
}

/** Resolve wall-clock elapsed once, then advance combat and dispatch through the same virtual-time target. */
export function advanceSlimeWorldFromWallClock(
  state: SlimeMercenariesState,
  currentWallClockMs: number,
  offlinePolicy: OfflineTimePolicy = {},
): Readonly<{ state: SlimeMercenariesState; events: readonly DomainEvent[]; appliedOfflineSec: number }> {
  const elapsed = resolveOfflineElapsed(state.lastWallClockMs, currentWallClockMs, offlinePolicy);
  if (elapsed.observedElapsedSec === 0) return { state, events: [], appliedOfflineSec: 0 };
  const advanced = advanceSlimeWorldTo(state, state.simTimeSec + elapsed.appliedElapsedSec);
  return {
    state: { ...advanced.state, lastWallClockMs: elapsed.nextWallClockMs },
    events: advanced.events,
    appliedOfflineSec: elapsed.appliedElapsedSec,
  };
}
