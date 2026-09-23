import type { DomainEvent } from 'idle-game-kit';
import { WORLD_AREA_IDS, resolveAreaDefinition } from './definitions';

export const OFFLINE_PROGRESS_AGGREGATED_EVENT_TYPE = 'offlineProgressAggregated';

type RewardAggregate = Readonly<{
  kind: string;
  id: string;
  amount: number;
}>;

type WorldPosition = Readonly<{
  areaId: string;
  stageNumber: number;
}>;

export type OfflineProgressAccumulator = {
  stageClearCount: number;
  bossDefeatedCount: number;
  dispatchCompletedCount: number;
  materialDropCount: number;
  furthest: WorldPosition | null;
  frontier: WorldPosition | null;
  rewards: Map<string, RewardAggregate>;
};

export function createOfflineProgressAccumulator(): OfflineProgressAccumulator {
  return {
    stageClearCount: 0,
    bossDefeatedCount: 0,
    dispatchCompletedCount: 0,
    materialDropCount: 0,
    furthest: null,
    frontier: null,
    rewards: new Map(),
  };
}

export function accumulateOfflineProgressEvents(
  accumulator: OfflineProgressAccumulator,
  events: readonly DomainEvent[],
): void {
  for (const event of events) {
    for (const position of positionsFromEvent(event)) {
      accumulator.furthest = maxWorldPosition(accumulator.furthest, position);
    }

    if (event.type === 'stageCleared') {
      accumulator.stageClearCount += 1;
    } else if (event.type === 'bossDefeated') {
      accumulator.bossDefeatedCount += 1;
    } else if (event.type === 'dispatchCompleted') {
      accumulator.dispatchCompletedCount += 1;
    } else if (event.type === 'partyDefeated') {
      const position = positionFromEvent(event, 'stageNumber');
      if (position !== null) accumulator.frontier = maxWorldPosition(accumulator.frontier, position);
    } else if (event.type === 'frontierBreakthroughDeferred') {
      const position = positionFromEvent(event, 'frontierStageNumber');
      if (position !== null) accumulator.frontier = maxWorldPosition(accumulator.frontier, position);
    }

    if (event.type === 'combatWaveCleared') {
      accumulateRandomDropCount(accumulator, event.payload?.randomDrops);
    }

    if (event.type === 'combatWaveCleared' || event.type === 'bossDefeated' || event.type === 'stageCleared') {
      accumulateRewards(accumulator.rewards, event.payload?.grantedRewards);
    }
  }
}

export function createOfflineProgressAggregatedEvents(
  accumulator: OfflineProgressAccumulator,
  startSimTimeSec: number,
  targetSimTimeSec: number,
): readonly DomainEvent[] {
  const hasProgress = accumulator.stageClearCount > 0
    || accumulator.bossDefeatedCount > 0
    || accumulator.dispatchCompletedCount > 0
    || accumulator.materialDropCount > 0
    || accumulator.furthest !== null
    || accumulator.frontier !== null
    || accumulator.rewards.size > 0;
  if (!hasProgress) return [];

  return [{
    id: OFFLINE_PROGRESS_AGGREGATED_EVENT_TYPE + ':' + startSimTimeSec + ':' + targetSimTimeSec,
    type: OFFLINE_PROGRESS_AGGREGATED_EVENT_TYPE,
    simTimeSec: targetSimTimeSec,
    payload: {
      stageClearCount: accumulator.stageClearCount,
      bossDefeatedCount: accumulator.bossDefeatedCount,
      dispatchCompletedCount: accumulator.dispatchCompletedCount,
      materialDropCount: accumulator.materialDropCount,
      furthestAreaId: accumulator.furthest?.areaId ?? null,
      furthestStageNumber: accumulator.furthest?.stageNumber ?? null,
      frontierAreaId: accumulator.frontier?.areaId ?? null,
      frontierStageNumber: accumulator.frontier?.stageNumber ?? null,
      grantedRewards: [...accumulator.rewards.values()],
    },
  }];
}

function accumulateRandomDropCount(accumulator: OfflineProgressAccumulator, value: unknown): void {
  if (!Array.isArray(value)) return;
  for (const drop of value) {
    if (typeof drop !== 'object' || drop === null || !('count' in drop) || typeof drop.count !== 'number') continue;
    if (Number.isFinite(drop.count) && drop.count > 0) accumulator.materialDropCount += drop.count;
  }
}

function accumulateRewards(rewards: Map<string, RewardAggregate>, value: unknown): void {
  if (!Array.isArray(value)) return;
  for (const reward of value) {
    if (typeof reward !== 'object' || reward === null) continue;
    if (!('kind' in reward) || !('id' in reward) || !('amount' in reward)) continue;
    if (typeof reward.kind !== 'string' || typeof reward.id !== 'string' || typeof reward.amount !== 'number') continue;
    if (!Number.isFinite(reward.amount) || reward.amount <= 0) continue;

    const key = reward.kind + ':' + reward.id;
    const previous = rewards.get(key);
    rewards.set(key, {
      kind: reward.kind,
      id: reward.id,
      amount: (previous?.amount ?? 0) + reward.amount,
    });
  }
}

function positionsFromEvent(event: DomainEvent): readonly WorldPosition[] {
  const positions: WorldPosition[] = [];
  const areaId = stringPayload(event, 'areaId');
  if (areaId !== null) {
    for (const key of ['stageNumber', 'frontierStageNumber', 'failedStageNumber', 'farmStageNumber'] as const) {
      const stageNumber = numberPayload(event, key);
      if (stageNumber !== null) positions.push({ areaId, stageNumber });
    }
  }

  const nextStageNumber = numberPayload(event, 'nextStageNumber');
  if (nextStageNumber !== null) {
    const nextAreaId = stringPayload(event, 'nextAreaId') ?? areaId;
    if (nextAreaId !== null) positions.push({ areaId: nextAreaId, stageNumber: nextStageNumber });
  }
  return positions;
}

function positionFromEvent(event: DomainEvent, stageKey: string): WorldPosition | null {
  const areaId = stringPayload(event, 'areaId');
  const stageNumber = numberPayload(event, stageKey);
  return areaId === null || stageNumber === null ? null : { areaId, stageNumber };
}

function maxWorldPosition(current: WorldPosition | null, candidate: WorldPosition): WorldPosition {
  if (current === null) return candidate;
  return worldPositionOrdinal(candidate) > worldPositionOrdinal(current) ? candidate : current;
}

function worldPositionOrdinal(position: WorldPosition): number {
  let offset = 0;
  for (const areaId of WORLD_AREA_IDS) {
    const area = resolveAreaDefinition(areaId);
    if (area === undefined) continue;
    if (areaId === position.areaId) return offset + position.stageNumber;
    offset += area.stages.length;
  }
  return Number.MIN_SAFE_INTEGER;
}

function stringPayload(event: DomainEvent, key: string): string | null {
  const value = event.payload?.[key];
  return typeof value === 'string' ? value : null;
}

function numberPayload(event: DomainEvent, key: string): number | null {
  const value = event.payload?.[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}
