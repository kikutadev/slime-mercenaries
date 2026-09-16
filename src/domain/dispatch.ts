import {
  advanceTimedActivity,
  applyRewards,
  startTimedActivity,
  type CommandResult,
  type DomainEvent,
} from 'idle-game-kit';
import { slimeCombatPower } from './combat';
import {
  dispatchContractDefinitions,
  resolveCurrencyDefinition,
  type DispatchContractId,
  type JobSlimeId,
} from './definitions';
import type { SlimeMercenariesState } from './state';

/** Start one deterministic reserve dispatch. Battle-assigned slimes cannot be reused concurrently. */
export function startDispatch(
  state: SlimeMercenariesState,
  contractId: DispatchContractId,
  slimeId: JobSlimeId,
): CommandResult<SlimeMercenariesState, 'not-owned' | 'not-reserve' | 'contract-running' | 'insufficient-power'> {
  const slime = state.gameData.roster.slimes[slimeId];
  if (slime === undefined) return reject(state, 'not-owned');
  if (slime.assignment !== 'reserve') return reject(state, 'not-reserve');

  const definition = dispatchContractDefinitions[contractId];
  const contract = state.gameData.dispatch.contracts[contractId];
  if (contract.activity.status !== 'available' || contract.slimeId !== null) return reject(state, 'contract-running');
  if (slimeCombatPower(state, slimeId).compare(definition.requiredPower) < 0) return reject(state, 'insufficient-power');

  const started = startTimedActivity({
    state,
    activity: contract.activity,
    definition: definition.activity,
    startSimTimeSec: state.simTimeSec,
  });
  if (!started.accepted) return reject(state, 'contract-running');

  const nextState: SlimeMercenariesState = {
    ...started.state,
    gameData: {
      ...started.state.gameData,
      roster: {
        ...started.state.gameData.roster,
        slimes: {
          ...started.state.gameData.roster.slimes,
          [slimeId]: { ...slime, assignment: 'dispatch' },
        },
      },
      dispatch: {
        contracts: {
          ...started.state.gameData.dispatch.contracts,
          [contractId]: { slimeId, activity: started.activity },
        },
      },
    },
  };
  return {
    accepted: true,
    state: nextState,
    events: [
      ...started.events,
      semanticEvent(nextState, 'dispatchStarted', `${contractId}:${slimeId}`, { contractId, slimeId }),
    ],
  };
}

/**
 * Resolve all dispatch timers at the supplied virtual time.
 * Completion rewards are granted once by Kit TimedActivity, then the slime returns to reserve.
 */
export function advanceDispatchTo(
  state: SlimeMercenariesState,
  targetSimTimeSec: number,
): Readonly<{ state: SlimeMercenariesState; events: readonly DomainEvent[] }> {
  let nextState = state;
  const events: DomainEvent[] = [];

  for (const contractId of Object.keys(dispatchContractDefinitions) as DispatchContractId[]) {
    const definition = dispatchContractDefinitions[contractId];
    const contract = nextState.gameData.dispatch.contracts[contractId];
    if (contract.slimeId === null || contract.activity.status !== 'running') continue;

    const slimeId = contract.slimeId;
    const advanced = advanceTimedActivity({
      state: nextState,
      activity: contract.activity,
      definition: definition.activity,
      targetSimTimeSec,
      hooks: {
        grantRewards: (candidate, rewards) => applyRewards(candidate, rewards, { resolveCurrencyDefinition }) as SlimeMercenariesState,
      },
    });
    nextState = advanced.state;
    events.push(...advanced.events);

    const completed = advanced.activity.status !== 'running';
    const slime = nextState.gameData.roster.slimes[slimeId];
    nextState = {
      ...nextState,
      gameData: {
        ...nextState.gameData,
        roster: completed && slime !== undefined
          ? {
              ...nextState.gameData.roster,
              slimes: {
                ...nextState.gameData.roster.slimes,
                [slimeId]: { ...slime, assignment: 'reserve' },
              },
            }
          : nextState.gameData.roster,
        dispatch: {
          contracts: {
            ...nextState.gameData.dispatch.contracts,
            [contractId]: {
              slimeId: completed ? null : slimeId,
              activity: advanced.activity,
            },
          },
        },
      },
    };
    if (completed) {
      events.push(semanticEvent(nextState, 'dispatchCompleted', `${contractId}:${advanced.activity.completionCount}`, {
        contractId,
        slimeId,
        completionCount: advanced.activity.completionCount,
      }));
    }
  }

  return { state: nextState, events };
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

function reject<TReason extends string>(
  state: SlimeMercenariesState,
  reason: TReason,
): CommandResult<SlimeMercenariesState, TReason> {
  return { accepted: false, state, events: [], reason };
}
