import type { CommandResult, DomainEvent } from 'idle-game-kit';
import { resolveAreaDefinition, resolveStageDefinition } from './definitions';
import { highestStageClearedForArea, type SlimeMercenariesState } from './state';

export function maxSelectableStageForArea(state: SlimeMercenariesState, areaId: string): number {
  const area = resolveAreaDefinition(areaId);
  if (area === undefined || state.gameData.progression.areas[areaId] === undefined || area.stages.length === 0) return 0;
  return Math.min(area.stages.length, highestStageClearedForArea(state.gameData.progression, areaId) + 1);
}

/**
 * Move active combat to an already-unlocked stage. This is the single authoritative path used
 * when the world map later allows revisiting earlier areas; it never unlocks progression itself.
 */
export function enterAreaStage(
  state: SlimeMercenariesState,
  areaId: string,
  stageNumber: number,
): CommandResult<SlimeMercenariesState, 'unknown-area' | 'locked-area' | 'no-content' | 'locked-stage'> {
  const area = resolveAreaDefinition(areaId);
  if (area === undefined) return reject(state, 'unknown-area');
  if (state.gameData.progression.areas[areaId] === undefined) return reject(state, 'locked-area');
  if (area.stages.length === 0) return reject(state, 'no-content');
  const maxSelectableStage = maxSelectableStageForArea(state, areaId);
  if (!Number.isSafeInteger(stageNumber) || stageNumber <= 0 || stageNumber > maxSelectableStage) {
    return reject(state, 'locked-stage');
  }
  const stage = resolveStageDefinition(areaId, stageNumber);
  if (stage === null) return reject(state, 'locked-stage');

  const nextState: SlimeMercenariesState = {
    ...state,
    gameData: {
      ...state.gameData,
      progression: {
        ...state.gameData.progression,
        currentAreaId: areaId,
        currentStage: stageNumber,
      },
      combat: {
        currentWaveIndex: 0,
        waveWorkRemaining: null,
        retryFarmClearsRemaining: 0,
        frontierDefeatTimeRemainingSec: null,
        contentBoundaryReached: false,
      },
    },
  };
  return {
    accepted: true,
    state: nextState,
    events: [semanticEvent(nextState, 'areaStageEntered', `${areaId}:${stageNumber}`, {
      areaId,
      areaOrder: area.order,
      stageId: stage.id,
      stageNumber,
    })],
  };
}

function semanticEvent(
  state: SlimeMercenariesState,
  type: string,
  key: string,
  payload?: Readonly<Record<string, unknown>>,
): DomainEvent {
  return { id: `${type}:${key}:${state.simTimeSec}`, type, simTimeSec: state.simTimeSec, ...(payload === undefined ? {} : { payload }) };
}

function reject<TReason extends string>(
  state: SlimeMercenariesState,
  reason: TReason,
): CommandResult<SlimeMercenariesState, TReason> {
  return { accepted: false, state, events: [], reason };
}
