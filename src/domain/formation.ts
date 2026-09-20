import type { CommandResult, DomainEvent } from 'idle-game-kit';
import type { SlimeInstanceId, SlimeMercenariesState } from './state';

export function assignSlimeToFormation(
  state: SlimeMercenariesState,
  slimeId: SlimeInstanceId,
  slotIndex: number,
): CommandResult<SlimeMercenariesState, 'invalid-slot' | 'not-owned' | 'dispatched'> {
  if (!Number.isSafeInteger(slotIndex) || slotIndex < 0 || slotIndex >= state.gameData.roster.formationSlots.length) {
    return rejectFormation(state, 'invalid-slot');
  }
  const slime = state.gameData.roster.slimes[slimeId];
  if (slime === undefined) return rejectFormation(state, 'not-owned');
  if (slime.assignment === 'dispatch') return rejectFormation(state, 'dispatched');

  const slots = [...state.gameData.roster.formationSlots];
  const previousSlot = slots.findIndex((candidate) => candidate === slimeId);
  const displacedId = slots[slotIndex] ?? null;
  if (previousSlot === slotIndex) return acceptFormation(state, []);

  const slimes = { ...state.gameData.roster.slimes };
  slimes[slimeId] = { ...slime, assignment: 'battle' };

  if (previousSlot >= 0) {
    // Moving one fielded slime onto another is a true swap. The displaced slime
    // stays in battle and takes the mover's previous slot.
    slots[previousSlot] = displacedId;
    slots[slotIndex] = slimeId;
  } else {
    // A reserve slime entering an occupied slot replaces that member.
    slots[slotIndex] = slimeId;
    if (displacedId !== null && displacedId !== slimeId) {
      const displaced = slimes[displacedId];
      if (displaced !== undefined) slimes[displacedId] = { ...displaced, assignment: 'reserve' };
    }
  }

  const nextState: SlimeMercenariesState = {
    ...state,
    gameData: {
      ...state.gameData,
      roster: { ...state.gameData.roster, slimes, formationSlots: slots },
    },
  };
  return acceptFormation(nextState, [formationEvent(nextState, `${slimeId}:${slotIndex}`, { slimeId, slotIndex, previousSlot, displacedId })]);
}

export function removeSlimeFromFormation(
  state: SlimeMercenariesState,
  slotIndex: number,
): CommandResult<SlimeMercenariesState, 'invalid-slot' | 'already-empty'> {
  if (!Number.isSafeInteger(slotIndex) || slotIndex < 0 || slotIndex >= state.gameData.roster.formationSlots.length) {
    return rejectFormation(state, 'invalid-slot');
  }
  const slimeId = state.gameData.roster.formationSlots[slotIndex] ?? null;
  if (slimeId === null) return rejectFormation(state, 'already-empty');
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
  return acceptFormation(nextState, [formationEvent(nextState, `empty:${slotIndex}`, { slotIndex })]);
}


function formationEvent(
  state: SlimeMercenariesState,
  key: string,
  payload: Readonly<Record<string, unknown>>,
): DomainEvent {
  return {
    id: `formationChanged:${key}:${state.simTimeSec}`,
    type: 'formationChanged',
    simTimeSec: state.simTimeSec,
    payload,
  };
}

function acceptFormation(
  state: SlimeMercenariesState,
  events: readonly DomainEvent[],
): CommandResult<SlimeMercenariesState, never> {
  return { accepted: true, state, events };
}

function rejectFormation<TReason extends string>(
  state: SlimeMercenariesState,
  reason: TReason,
): CommandResult<SlimeMercenariesState, TReason> {
  return { accepted: false, state, events: [], reason };
}
