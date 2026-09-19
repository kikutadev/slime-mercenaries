import { readCurrency, readToken, type DomainEvent } from 'idle-game-kit';
import {
  evaluateBalanceTargets,
  runSimulation,
  type BalancePercentile,
  type BalanceTargetDefinition,
  type BalanceTargetSource,
  type SimulatorAdapter,
  type SimulatorMilestone,
  type SimulatorPolicy,
} from 'idle-game-kit/simulator';
import {
  buyPlainSlime,
  craftPlainSlime,
  createJobSlime,
  convertDuplicateToFusionCore,
  fuseSlime,
  levelUpSlime,
  previewJobCreation,
  previewPlainSlimeCraft,
  previewPlainSlimePurchase,
  previewSlimeFusion,
  previewSlimeLevelUp,
} from './commands';
import { assignSlimeToFormation, nextCombatBoundarySec } from './combat';
import { startDispatch } from './dispatch';
import { equipWeapon, forgeEquipment } from './equipment';
import { advanceSlimeWorldTo } from './world';
import { balance } from './balance';
import { ids, type DispatchContractId, type JobSlimeId } from './definitions';
import { firstSlimeByType, slimeIdsByType } from './roster';
import { createInitialSlimeMercenariesState, highestStageClearedForArea, type SlimeInstanceId, type SlimeMercenariesState } from './state';

export type SlimeSimulatorCommand =
  | Readonly<{ type: 'craft-plain'; count: number }>
  | Readonly<{ type: 'buy-plain'; count: number }>
  | Readonly<{ type: 'create-job'; jobId: JobSlimeId }>
  | Readonly<{ type: 'assign'; slimeId: SlimeInstanceId; slotIndex: number }>
  | Readonly<{ type: 'level'; slimeId: SlimeInstanceId; count: number }>
  | Readonly<{ type: 'convert-to-core'; slimeId: SlimeInstanceId }>
  | Readonly<{ type: 'fuse'; slimeId: SlimeInstanceId; fusionStepId?: string }>
  | Readonly<{ type: 'forge'; drawCount: 1 | 10 }>
  | Readonly<{ type: 'equip'; slimeId: SlimeInstanceId; weaponDefinitionId: string }>
  | Readonly<{ type: 'start-dispatch'; contractId: DispatchContractId; slimeId: SlimeInstanceId }>;

export const slimeSimulatorAdapter: SimulatorAdapter<SlimeMercenariesState, SlimeSimulatorCommand> = {
  getSimTimeSec: (state) => state.simTimeSec,
  advanceTo: advanceSlimeWorldTo,
  executeCommand: (state, command) => {
    switch (command.type) {
      case 'craft-plain': return craftPlainSlime(state, command.count);
      case 'buy-plain': return buyPlainSlime(state, command.count);
      case 'create-job': return createJobSlime(state, command.jobId);
      case 'assign': return assignSlimeToFormation(state, command.slimeId, command.slotIndex);
      case 'level': return levelUpSlime(state, command.slimeId, command.count);
      case 'convert-to-core': return convertDuplicateToFusionCore(state, command.slimeId);
      case 'fuse': return fuseSlime(state, command.slimeId, command.fusionStepId);
      case 'forge': return forgeEquipment(state, command.drawCount);
      case 'equip': return equipWeapon(state, command.slimeId, command.weaponDefinitionId);
      case 'start-dispatch': return startDispatch(state, command.contractId, command.slimeId);
    }
  },
};

/**
 * Product simulator profiles intentionally share the same adapter and production commands.
 * `efficient` spends proactively toward Fusion. `defeat-loop` withholds proactive leveling until
 * an authored frontier defeat has happened. `paced-defeat` models a low-frequency player by issuing
 * at most one strengthening command per retreat-farm phase. All profiles use the same Domain adapter.
 */
export type FirstLoopPolicyProfileId = 'efficient' | 'defeat-loop' | 'paced-defeat';

export function createFirstLoopPolicy(
  profileId: FirstLoopPolicyProfileId = 'efficient',
): SimulatorPolicy<SlimeMercenariesState, SlimeSimulatorCommand> {
  let handledRetreatPhase: string | null = null;
  return {
    id: `slime-mercenaries.first-loop-${profileId}`,
    version: '2',
    chooseAction: (state) => {
      if (state.gameData.combat.contentBoundaryReached) return { kind: 'stop', reason: 'content-boundary' };

      const sword = firstSlimeByType(state, 'sword');
      if (sword === null) {
        const create = previewJobCreation(state, 'sword');
        if (create.canCreate) return { kind: 'command', command: { type: 'create-job', jobId: 'sword' } };
        const craft = previewPlainSlimeCraft(state);
        if (craft.canCraft) return { kind: 'command', command: { type: 'craft-plain', count: 1 } };
        const shop = previewPlainSlimePurchase(state);
        if (shop.canAfford) return { kind: 'command', command: { type: 'buy-plain', count: 1 } };
        return { kind: 'stop', reason: 'opening-resource-wall' };
      }

      if (!state.gameData.roster.formationSlots.includes(sword.id)) {
        return { kind: 'command', command: { type: 'assign', slimeId: sword.id, slotIndex: 0 } };
      }

      // Create one spare Sword, then explicitly convert that reserve body into Fusion Core.
      if (readToken(state.tokens, ids.token.swordCore) === 0) {
        const spare = slimeIdsByType(state, 'sword')
          .map((id) => state.gameData.roster.slimes[id])
          .find((candidate) => candidate !== undefined && candidate.id !== sword.id && candidate.assignment === 'reserve');
        if (spare !== undefined) return { kind: 'command', command: { type: 'convert-to-core', slimeId: spare.id } };
        if (readToken(state.tokens, ids.token.trainingSword) > 0) {
          const create = previewJobCreation(state, 'sword');
          if (create.canCreate) return { kind: 'command', command: { type: 'create-job', jobId: 'sword' } };
          const craft = previewPlainSlimeCraft(state);
          if (craft.canCraft) return { kind: 'command', command: { type: 'craft-plain', count: 1 } };
        }
      }

      const fusion = previewSlimeFusion(state, sword.id);
      if (fusion.canFuse && fusion.step !== null) return { kind: 'command', command: { type: 'fuse', slimeId: sword.id, fusionStepId: fusion.step.id } };

      // Efficient policy anticipates the next unlock and spends before hitting the wall.
      if (profileId === 'efficient' && fusion.step !== null && !fusion.levelMet) {
        const level = previewSlimeLevelUp(state, sword.id, 1);
        if (level?.available === true
          && readCurrency(state.currencies, ids.currency.gold).compare(level.totalCost) >= 0) {
          return { kind: 'command', command: { type: 'level', slimeId: sword.id, count: 1 } };
        }
      }

      // Defeat profiles react to an actual retreat using the exact same progression commands as UI.
      // The paced profile deliberately limits interaction frequency without changing Domain rules.
      if (state.gameData.combat.retryFarmClearsRemaining > 0) {
        const retreatPhase = `${state.gameData.progression.currentStage}:${state.gameData.combat.retryFarmClearsRemaining}`;
        const canStrengthenThisPhase = profileId !== 'paced-defeat' || handledRetreatPhase !== retreatPhase;
        if (canStrengthenThisPhase) {
          const level = previewSlimeLevelUp(state, sword.id, 1);
          if (level?.available === true
            && readCurrency(state.currencies, ids.currency.gold).compare(level.totalCost) >= 0) {
            if (profileId === 'paced-defeat') handledRetreatPhase = retreatPhase;
            return { kind: 'command', command: { type: 'level', slimeId: sword.id, count: 1 } };
          }
        }
      }

      const boundary = nextCombatBoundarySec(state);
      if (boundary !== null) {
        return { kind: 'wait-until', simTimeSec: boundary, reason: 'auto-battle', classification: 'no-action' };
      }
      return { kind: 'stop', reason: 'no-combat-boundary' };
    },
  };
}

export const firstLoopMilestones: readonly SimulatorMilestone<SlimeMercenariesState>[] = [
  { id: 'first-sword', reached: (state) => firstSlimeByType(state, 'sword') !== null },
  { id: 'first-sword-core', reached: (state) => readToken(state.tokens, ids.token.swordCore) > 0 },
  { id: 'first-fusion', reached: (state) => (firstSlimeByType(state, 'sword')?.fusionRank ?? 0) >= 2 },
  { id: 'first-defeat', reached: (state) => state.gameData.combat.retryFarmClearsRemaining > 0 },
  { id: 'clover-road-boss', reached: (state) => highestStageClearedForArea(state.gameData.progression) >= 5 },
];

export function runFirstLoopSimulation(
  seed = 1,
  maxSimTimeSec = 900,
  profileId: FirstLoopPolicyProfileId = 'efficient',
) {
  return runSimulation({
    initialState: createInitialSlimeMercenariesState(0, seed),
    adapter: slimeSimulatorAdapter,
    policy: createFirstLoopPolicy(profileId),
    milestones: firstLoopMilestones,
    maxSimTimeSec,
  });
}

export function runDefeatLoopSimulation(seed = 1, maxSimTimeSec = 900) {
  return runFirstLoopSimulation(seed, maxSimTimeSec, 'defeat-loop');
}

export type FirstLoopSimulationSummary = Readonly<{
  seed: number;
  profileId: FirstLoopPolicyProfileId;
  stopReason: string;
  simTimeSec: number;
  highestStageCleared: number;
  firstFusionSec: number | null;
  cloverRoadBossSec: number | null;
  firstDefeatSec: number | null;
  firstFarmClearSec: number | null;
  firstRetrySec: number | null;
  levelUpsBeforeFirstFarmClear: number;
  levelUpsDuringFirstRetreat: number;
  defeats: number;
  retreats: number;
  farmClears: number;
  retries: number;
  levelUps: number;
  fusions: number;
  maxNoActionWindowSec: number;
  defeatsByStage: Readonly<Record<string, number>>;
}>;

/** Product-owned event summary used by CLI/CI; no gameplay rule is duplicated here. */
export function summarizeFirstLoopSimulation(
  seed: number,
  profileId: FirstLoopPolicyProfileId,
  run: ReturnType<typeof runFirstLoopSimulation>,
): FirstLoopSimulationSummary {
  const eventCount = (type: string) => run.events.filter((event) => event.type === type).length;
  const stageDefeats: Record<string, number> = {};
  let firstDefeatSec: number | null = null;
  let firstFarmClearSec: number | null = null;
  let firstRetrySec: number | null = null;
  let levelUpsBeforeFirstFarmClear = 0;
  let levelUpsDuringFirstRetreat = 0;
  for (const event of run.events) {
    if (event.type === 'partyDefeated') {
      if (firstDefeatSec === null) firstDefeatSec = event.simTimeSec;
      const stageNumber = numberEventPayload(event, 'stageNumber');
      const key = stageNumber === null ? 'unknown' : String(stageNumber);
      stageDefeats[key] = (stageDefeats[key] ?? 0) + 1;
      continue;
    }
    if (firstDefeatSec === null) continue;
    if (event.type === 'stageCleared' && event.payload?.farming === true && firstFarmClearSec === null) {
      firstFarmClearSec = event.simTimeSec;
      continue;
    }
    if (event.type === 'frontierRetryStarted' && firstRetrySec === null) {
      firstRetrySec = event.simTimeSec;
      continue;
    }
    if (event.type === 'slimeLeveled' && firstRetrySec === null) {
      levelUpsDuringFirstRetreat += 1;
      if (firstFarmClearSec === null) levelUpsBeforeFirstFarmClear += 1;
    }
  }
  const milestoneTime = (id: string) => run.milestoneHits.find((hit) => hit.id === id)?.simTimeSec ?? null;
  return {
    seed,
    profileId,
    stopReason: run.stopReason,
    simTimeSec: run.finalState.simTimeSec,
    highestStageCleared: highestStageClearedForArea(run.finalState.gameData.progression),
    firstFusionSec: milestoneTime('first-fusion'),
    cloverRoadBossSec: milestoneTime('clover-road-boss'),
    firstDefeatSec,
    firstFarmClearSec,
    firstRetrySec,
    levelUpsBeforeFirstFarmClear,
    levelUpsDuringFirstRetreat,
    defeats: eventCount('partyDefeated'),
    retreats: eventCount('stageRetreated'),
    farmClears: run.events.filter((event) => event.type === 'stageCleared' && event.payload?.farming === true).length,
    retries: eventCount('frontierRetryStarted'),
    levelUps: eventCount('slimeLeveled'),
    fusions: eventCount('slimeFused'),
    maxNoActionWindowSec: Math.max(0, ...run.waitWindows
      .filter((window) => window.classification === 'no-action')
      .map((window) => window.durationSec)),
    defeatsByStage: stageDefeats,
  };
}

function numberEventPayload(event: DomainEvent, key: string): number | null {
  const value = event.payload?.[key];
  return typeof value === 'number' ? value : null;
}


const FIRST_LOOP_PROFILE_ID = 'slime-mercenaries.first-loop-efficient';
const DEFEAT_LOOP_PROFILE_ID = 'slime-mercenaries.first-loop-defeat-loop';
const PACED_DEFEAT_PROFILE_ID = 'slime-mercenaries.first-loop-paced-defeat';

export const firstLoopBalanceTargets: readonly BalanceTargetDefinition[] = [
  {
    id: 'target.first-fusion.p90',
    kind: 'milestone-time',
    profileId: FIRST_LOOP_PROFILE_ID,
    milestoneId: 'first-fusion',
    percentile: 'p90',
    minSec: balance.targets.firstFusion.minSec,
    maxSec: balance.targets.firstFusion.maxSec,
  },
  {
    id: 'target.clover-road-boss.p90',
    kind: 'milestone-time',
    profileId: FIRST_LOOP_PROFILE_ID,
    milestoneId: 'clover-road-boss',
    percentile: 'p90',
    minSec: balance.targets.cloverRoadBoss.minSec,
    maxSec: balance.targets.cloverRoadBoss.maxSec,
  },
  {
    id: 'target.first-loop-no-action.p90',
    kind: 'max-no-action-window',
    profileId: FIRST_LOOP_PROFILE_ID,
    percentile: 'p90',
    maxSec: balance.targets.maxNoActionWindowSec,
  },
];

export const defeatLoopBalanceTargets: readonly BalanceTargetDefinition[] = [
  {
    id: 'target.defeat-loop.first-defeat.p90',
    kind: 'milestone-time',
    profileId: DEFEAT_LOOP_PROFILE_ID,
    milestoneId: 'first-defeat',
    percentile: 'p90',
    minSec: balance.targets.defeatLoop.firstDefeat.minSec,
    maxSec: balance.targets.defeatLoop.firstDefeat.maxSec,
  },
  {
    id: 'target.defeat-loop.clover-road-boss.p90',
    kind: 'milestone-time',
    profileId: DEFEAT_LOOP_PROFILE_ID,
    milestoneId: 'clover-road-boss',
    percentile: 'p90',
    minSec: balance.targets.defeatLoop.cloverRoadBoss.minSec,
    maxSec: balance.targets.defeatLoop.cloverRoadBoss.maxSec,
  },
  {
    id: 'target.defeat-loop.defeats.p90',
    kind: 'repetition-count',
    profileId: DEFEAT_LOOP_PROFILE_ID,
    metricId: 'defeats',
    percentile: 'p90',
    minCount: balance.targets.defeatLoop.defeats.minCount,
    maxCount: balance.targets.defeatLoop.defeats.maxCount,
  },
  {
    id: 'target.defeat-loop.farm-clears.p90',
    kind: 'repetition-count',
    profileId: DEFEAT_LOOP_PROFILE_ID,
    metricId: 'farm-clears',
    percentile: 'p90',
    minCount: balance.targets.defeatLoop.farmClears.minCount,
    maxCount: balance.targets.defeatLoop.farmClears.maxCount,
  },
  {
    id: 'target.defeat-loop.retries.p90',
    kind: 'repetition-count',
    profileId: DEFEAT_LOOP_PROFILE_ID,
    metricId: 'retries',
    percentile: 'p90',
    minCount: balance.targets.defeatLoop.retries.minCount,
    maxCount: balance.targets.defeatLoop.retries.maxCount,
  },
  {
    id: 'target.defeat-loop.no-action.p90',
    kind: 'max-no-action-window',
    profileId: DEFEAT_LOOP_PROFILE_ID,
    percentile: 'p90',
    maxSec: balance.targets.maxNoActionWindowSec,
  },
];


export const pacedDefeatBalanceTargets: readonly BalanceTargetDefinition[] = [
  {
    id: 'target.paced-defeat.first-defeat.p90',
    kind: 'milestone-time',
    profileId: PACED_DEFEAT_PROFILE_ID,
    milestoneId: 'first-defeat',
    percentile: 'p90',
    minSec: balance.targets.pacedDefeat.firstDefeat.minSec,
    maxSec: balance.targets.pacedDefeat.firstDefeat.maxSec,
  },
  {
    id: 'target.paced-defeat.clover-road-boss.p90',
    kind: 'milestone-time',
    profileId: PACED_DEFEAT_PROFILE_ID,
    milestoneId: 'clover-road-boss',
    percentile: 'p90',
    minSec: balance.targets.pacedDefeat.cloverRoadBoss.minSec,
    maxSec: balance.targets.pacedDefeat.cloverRoadBoss.maxSec,
  },
  {
    id: 'target.paced-defeat.defeats.p90',
    kind: 'repetition-count',
    profileId: PACED_DEFEAT_PROFILE_ID,
    metricId: 'defeats',
    percentile: 'p90',
    minCount: balance.targets.pacedDefeat.defeats.minCount,
    maxCount: balance.targets.pacedDefeat.defeats.maxCount,
  },
  {
    id: 'target.paced-defeat.farm-clears.p90',
    kind: 'repetition-count',
    profileId: PACED_DEFEAT_PROFILE_ID,
    metricId: 'farm-clears',
    percentile: 'p90',
    minCount: balance.targets.pacedDefeat.farmClears.minCount,
    maxCount: balance.targets.pacedDefeat.farmClears.maxCount,
  },
  {
    id: 'target.paced-defeat.retries.p90',
    kind: 'repetition-count',
    profileId: PACED_DEFEAT_PROFILE_ID,
    metricId: 'retries',
    percentile: 'p90',
    minCount: balance.targets.pacedDefeat.retries.minCount,
    maxCount: balance.targets.pacedDefeat.retries.maxCount,
  },
  {
    id: 'target.paced-defeat.no-action.p90',
    kind: 'max-no-action-window',
    profileId: PACED_DEFEAT_PROFILE_ID,
    percentile: 'p90',
    maxSec: balance.targets.pacedDefeat.maxNoActionWindowSec,
  },
];

/** Evaluate authored efficient first-loop target bands across deterministic seeds. */
export function evaluateFirstLoopBalance(seeds: readonly number[] = Array.from({ length: 20 }, (_, index) => index + 1)) {
  return evaluateProfileBalance('efficient', seeds, firstLoopBalanceTargets, balance.targets.cloverRoadBoss.maxSec * 3);
}

/** Evaluate the authored defeat -> retreat -> farm -> retry loop across deterministic seeds. */
export function evaluateDefeatLoopBalance(seeds: readonly number[] = Array.from({ length: 20 }, (_, index) => index + 1)) {
  return evaluateProfileBalance('defeat-loop', seeds, defeatLoopBalanceTargets, balance.targets.defeatLoop.cloverRoadBoss.maxSec * 3);
}

export function evaluatePacedDefeatBalance(seeds: readonly number[] = Array.from({ length: 20 }, (_, index) => index + 1)) {
  return evaluateProfileBalance('paced-defeat', seeds, pacedDefeatBalanceTargets, balance.targets.pacedDefeat.cloverRoadBoss.maxSec * 2);
}

function evaluateProfileBalance(
  profileId: FirstLoopPolicyProfileId,
  seeds: readonly number[],
  targets: readonly BalanceTargetDefinition[],
  maxSimTimeSec: number,
) {
  if (seeds.length === 0) throw new RangeError('Balance evaluation requires at least one seed.');
  const runs = seeds.map((seed) => runFirstLoopSimulation(seed, maxSimTimeSec, profileId));
  const summaries = runs.map((run, index) => summarizeFirstLoopSimulation(seeds[index]!, profileId, run));
  const sourceProfileId = profileId === 'efficient'
    ? FIRST_LOOP_PROFILE_ID
    : profileId === 'defeat-loop'
      ? DEFEAT_LOOP_PROFILE_ID
      : PACED_DEFEAT_PROFILE_ID;
  const source: BalanceTargetSource = {
    milestoneTimeSec: (requestedProfileId, milestoneId, percentile) => {
      if (requestedProfileId !== sourceProfileId) return null;
      const values = runs.flatMap((run) => {
        const hit = run.milestoneHits.find((candidate) => candidate.id === milestoneId);
        return hit === undefined ? [] : [hit.simTimeSec];
      });
      return percentileValue(values, percentile);
    },
    maxNoActionWindowSec: (requestedProfileId, percentile) => {
      if (requestedProfileId !== sourceProfileId) return null;
      return percentileValue(summaries.map((summary) => summary.maxNoActionWindowSec), percentile);
    },
    wallP90WaitSec: () => null,
    wallStuckProbability: () => null,
    repetitionCount: (requestedProfileId, metricId, percentile) => {
      if (requestedProfileId !== sourceProfileId) return null;
      const values = summaries.map((summary) => repetitionMetric(summary, metricId)).filter((value): value is number => value !== null);
      return percentileValue(values, percentile);
    },
  };
  return evaluateBalanceTargets(targets, source);
}

function repetitionMetric(summary: FirstLoopSimulationSummary, metricId: string): number | null {
  switch (metricId) {
    case 'defeats': return summary.defeats;
    case 'farm-clears': return summary.farmClears;
    case 'retries': return summary.retries;
    case 'level-ups': return summary.levelUps;
    case 'fusions': return summary.fusions;
    default: return null;
  }
}

function percentileValue(values: readonly number[], percentile: BalancePercentile): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((left, right) => left - right);
  const ratio = percentile === 'p90' ? 0.9 : 0.5;
  const index = Math.max(0, Math.ceil(sorted.length * ratio) - 1);
  return sorted[index] ?? null;
}
