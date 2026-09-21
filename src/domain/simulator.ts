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
  isJobCreationUnlocked,
  previewJobCreation,
  previewPlainSlimeCraft,
  previewPlainSlimePurchase,
  previewSlimeFusion,
  previewSlimeLevelUp,
} from './commands';
import { assignSlimeToFormation, nextCombatBoundarySec } from './combat';
import { slimeCombatPower } from './combat-power';
import { startDispatch } from './dispatch';
import { equippedWeaponDefinition, equipWeapon, forgeEquipment } from './equipment';
import { advanceSlimeWorldTo } from './world';
import { balance } from './balance';
import {
  NORMAL_JOB_SLIME_IDS,
  dispatchContractDefinitions,
  ids,
  jobCreationDefinitions,
  weaponDefinitionsByDefinitionId,
  type DispatchContractId,
  type JobSlimeId,
} from './definitions';
import { previewSlimeMutation, mutateSlime } from './mutation';
import { captureMimic, previewMimicCapture } from './mimic';
import { firstSlimeByType, slimeIdsByType } from './roster';
import { createInitialSlimeMercenariesState, highestStageClearedForArea, type SlimeInstanceId, type SlimeMercenariesState, type SlimeMutationId } from './state';

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
  | Readonly<{ type: 'start-dispatch'; contractId: DispatchContractId; slimeId: SlimeInstanceId }>
  | Readonly<{ type: 'mutate'; slimeId: SlimeInstanceId; mutationId: SlimeMutationId }>
  | Readonly<{ type: 'capture-mimic' }>;

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
      case 'mutate': return mutateSlime(state, command.slimeId, command.mutationId);
      case 'capture-mimic': return captureMimic(state);
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
      if (state.gameData.progression.currentAreaId !== 'area.clover-road') return { kind: 'stop', reason: 'clover-road-clear' };
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
  { id: 'clover-road-clear', reached: (state) => highestStageClearedForArea(state.gameData.progression, 'area.clover-road') >= 5 },
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
  cloverRoadClearSec: number | null;
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
    highestStageCleared: highestStageClearedForArea(run.finalState.gameData.progression, 'area.clover-road'),
    firstFusionSec: milestoneTime('first-fusion'),
    cloverRoadClearSec: milestoneTime('clover-road-clear'),
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
    id: 'target.clover-road-clear.p90',
    kind: 'milestone-time',
    profileId: FIRST_LOOP_PROFILE_ID,
    milestoneId: 'clover-road-clear',
    percentile: 'p90',
    minSec: balance.targets.cloverRoadClear.minSec,
    maxSec: balance.targets.cloverRoadClear.maxSec,
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
    id: 'target.defeat-loop.clover-road-clear.p90',
    kind: 'milestone-time',
    profileId: DEFEAT_LOOP_PROFILE_ID,
    milestoneId: 'clover-road-clear',
    percentile: 'p90',
    minSec: balance.targets.defeatLoop.cloverRoadClear.minSec,
    maxSec: balance.targets.defeatLoop.cloverRoadClear.maxSec,
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
    id: 'target.paced-defeat.clover-road-clear.p90',
    kind: 'milestone-time',
    profileId: PACED_DEFEAT_PROFILE_ID,
    milestoneId: 'clover-road-clear',
    percentile: 'p90',
    minSec: balance.targets.pacedDefeat.cloverRoadClear.minSec,
    maxSec: balance.targets.pacedDefeat.cloverRoadClear.maxSec,
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
  return evaluateProfileBalance('efficient', seeds, firstLoopBalanceTargets, balance.targets.cloverRoadClear.maxSec * 3);
}

/** Evaluate the authored defeat -> retreat -> farm -> retry loop across deterministic seeds. */
export function evaluateDefeatLoopBalance(seeds: readonly number[] = Array.from({ length: 20 }, (_, index) => index + 1)) {
  return evaluateProfileBalance('defeat-loop', seeds, defeatLoopBalanceTargets, balance.targets.defeatLoop.cloverRoadClear.maxSec * 3);
}

export function evaluatePacedDefeatBalance(seeds: readonly number[] = Array.from({ length: 20 }, (_, index) => index + 1)) {
  return evaluateProfileBalance('paced-defeat', seeds, pacedDefeatBalanceTargets, balance.targets.pacedDefeat.cloverRoadClear.maxSec * 2);
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


export type WorldProgressionPolicyProfileId = 'world-reactive';

/**
 * Full-world policy for production reachability/balance checks.
 *
 * It never grants resources or edits state directly: every body, level and Fusion goes through the
 * same production commands as the UI. It discovers newly unlocked jobs immediately, prepares a
 * Fusion Core only when the rest of that Fusion is ready, spends one level-up on each newly entered
 * stage and one per retreat-farm phase so defeat -> farm -> strengthen -> retry stays observable.
 */
export function createWorldProgressionPolicy(): SimulatorPolicy<SlimeMercenariesState, SlimeSimulatorCommand> {
  let handledRetreatPhase: string | null = null;
  const startedDispatches = new Set<DispatchContractId>();

  return {
    id: 'slime-mercenaries.world-reactive',
    version: '2',
    chooseAction: (state) => {
      if (state.gameData.combat.contentBoundaryReached) return { kind: 'stop', reason: 'world-clear' };

      // Discover each family as soon as its authored area gate and deterministic Job Gear allow it.
      for (const jobId of NORMAL_JOB_SLIME_IDS) {
        if (!isJobCreationUnlocked(state, jobId) || firstSlimeByType(state, jobId) !== null) continue;
        const create = previewJobCreation(state, jobId);
        if (create.canCreate) return { kind: 'command', command: { type: 'create-job', jobId } };
        if (readToken(state.tokens, jobCreationDefinitions[jobId].jobGearTokenId) <= 0) continue;
        const plain = prepareOnePlainSlime(state);
        if (plain !== null) return { kind: 'command', command: plain };
      }

      // Keep one representative of every discovered family in the six-slot battle party.
      for (const [slotIndex, jobId] of NORMAL_JOB_SLIME_IDS.entries()) {
        const primary = firstSlimeByType(state, jobId);
        if (primary === null || state.gameData.roster.formationSlots.includes(primary.id)) continue;
        if (state.gameData.roster.formationSlots[slotIndex] === null) {
          return { kind: 'command', command: { type: 'assign', slimeId: primary.id, slotIndex } };
        }
        const freeSlot = state.gameData.roster.formationSlots.findIndex((slimeId) => slimeId === null);
        if (freeSlot >= 0) return { kind: 'command', command: { type: 'assign', slimeId: primary.id, slotIndex: freeSlot } };
      }

      // Forge Keys are a progression resource, not a post-game collectible. Spend them as they arrive.
      if (readToken(state.tokens, ids.token.forgeKey) >= balance.equipment.forgeKeyCostPerDraw) {
        return { kind: 'command', command: { type: 'forge', drawCount: 1 } };
      }

      const weaponUpgrade = worldWeaponUpgradeAction(state);
      if (weaponUpgrade !== null) return { kind: 'command', command: weaponUpgrade };

      const mutation = worldMutationAction(state);
      if (mutation !== null) return { kind: 'command', command: mutation };

      const mimic = previewMimicCapture(state);
      if (mimic.canCapture) return { kind: 'command', command: { type: 'capture-mimic' } };

      // Resolve any Fusion that is already fully ready before spending on new preparation.
      for (const jobId of NORMAL_JOB_SLIME_IDS) {
        const primary = firstSlimeByType(state, jobId);
        if (primary === null) continue;
        const fusion = previewSlimeFusion(state, primary.id);
        if (fusion.canFuse && fusion.step !== null) {
          return { kind: 'command', command: { type: 'fuse', slimeId: primary.id, fusionStepId: fusion.step.id } };
        }
      }

      /**
       * Prepare only Fusions whose entire non-Core recipe and future Core-body supply are already
       * authored/owned. This lets the world reward cadence decide when Tier 2/3 appears instead of
       * blindly grinding every slime to the maximum level on Area 1.
       */
      for (const jobId of NORMAL_JOB_SLIME_IDS) {
        const primary = firstSlimeByType(state, jobId);
        if (primary === null) continue;
        const fusion = previewSlimeFusion(state, primary.id);
        if (fusion.step === null || !fusion.unlocked) continue;

        const coreTokenId = jobCreationDefinitions[jobId].fusionCoreTokenId;
        const coreRequirement = fusion.requirements.find((requirement) => requirement.tokenId === coreTokenId);
        const otherInputsReady = fusion.requirements
          .filter((requirement) => requirement.tokenId !== coreTokenId)
          .every((requirement) => requirement.missing === 0);
        if (!otherInputsReady) continue;

        if (coreRequirement !== undefined) {
          const futureBodySupply = slimeIdsByType(state, jobId)
            .filter((slimeId) => slimeId !== primary.id).length
            + readToken(state.tokens, jobCreationDefinitions[jobId].jobGearTokenId)
            + readToken(state.tokens, coreTokenId);
          if (futureBodySupply < coreRequirement.required) continue;
        }

        if (!fusion.levelMet) {
          const level = previewSlimeLevelUp(state, primary.id, 1);
          if (level?.available === true
            && readCurrency(state.currencies, ids.currency.gold).compare(level.totalCost) >= 0) {
            return { kind: 'command', command: { type: 'level', slimeId: primary.id, count: 1 } };
          }
          continue;
        }

        if (coreRequirement !== undefined && coreRequirement.missing > 0) {
          const spare = slimeIdsByType(state, jobId)
            .map((slimeId) => state.gameData.roster.slimes[slimeId])
            .find((candidate) => candidate !== undefined
              && candidate.id !== primary.id
              && candidate.assignment === 'reserve');

          if (spare !== undefined) {
            const dispatch = worldDispatchForCandidate(state, spare.id, startedDispatches);
            if (dispatch !== null) return { kind: 'command', command: dispatch };
            return { kind: 'command', command: { type: 'convert-to-core', slimeId: spare.id } };
          }

          if (readToken(state.tokens, jobCreationDefinitions[jobId].jobGearTokenId) > 0) {
            const duplicate = previewJobCreation(state, jobId);
            if (duplicate.canCreate) return { kind: 'command', command: { type: 'create-job', jobId } };
            const plain = prepareOnePlainSlime(state);
            if (plain !== null) return { kind: 'command', command: plain };
          }
        }
      }

      // Frontier failures remain meaningful even when no Fusion is immediately available.
      if (state.gameData.combat.retryFarmClearsRemaining > 0) {
        const phase = [
          state.gameData.progression.currentAreaId,
          state.gameData.progression.currentStage,
          state.gameData.combat.retryFarmClearsRemaining,
        ].join(':');
        if (phase !== handledRetreatPhase) {
          const candidates = worldActivePrimariesByLevel(state);
          for (const slime of candidates) {
            const level = previewSlimeLevelUp(state, slime.id, 1);
            if (level?.available !== true) continue;
            if (readCurrency(state.currencies, ids.currency.gold).compare(level.totalCost) < 0) continue;
            handledRetreatPhase = phase;
            return { kind: 'command', command: { type: 'level', slimeId: slime.id, count: 1 } };
          }
          handledRetreatPhase = phase;
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

const WORLD_DISPATCH_ORDER: readonly DispatchContractId[] = [
  'roadEscort',
  'forestExploration',
  'materialGathering',
];

function worldDispatchForCandidate(
  state: SlimeMercenariesState,
  slimeId: SlimeInstanceId,
  startedDispatches: Set<DispatchContractId>,
): SlimeSimulatorCommand | null {
  for (const contractId of WORLD_DISPATCH_ORDER) {
    if (startedDispatches.has(contractId)) continue;
    const contract = state.gameData.dispatch.contracts[contractId];
    if (contract.slimeId !== null || contract.activity.status !== 'available') continue;
    if (slimeCombatPower(state, slimeId).compare(dispatchContractDefinitions[contractId].requiredPower) < 0) continue;
    startedDispatches.add(contractId);
    return { type: 'start-dispatch', contractId, slimeId };
  }
  return null;
}

const WORLD_MUTATION_TARGETS: readonly Readonly<{ mutationId: SlimeMutationId; jobId: JobSlimeId }>[] = [
  { mutationId: 'golden', jobId: 'dagger' },
  { mutationId: 'king', jobId: 'sword' },
  { mutationId: 'dragon', jobId: 'gun' },
  { mutationId: 'prism', jobId: 'bow' },
];

function worldMutationAction(state: SlimeMercenariesState): SlimeSimulatorCommand | null {
  for (const target of WORLD_MUTATION_TARGETS) {
    const slime = firstSlimeByType(state, target.jobId);
    if (slime === null) continue;
    const preview = previewSlimeMutation(state, slime.id, target.mutationId);
    if (preview.canMutate) {
      return { type: 'mutate', slimeId: slime.id, mutationId: target.mutationId };
    }
  }
  return null;
}

function worldWeaponUpgradeAction(state: SlimeMercenariesState): SlimeSimulatorCommand | null {
  for (const jobId of NORMAL_JOB_SLIME_IDS) {
    const primary = firstSlimeByType(state, jobId);
    if (primary === null) continue;
    const current = equippedWeaponDefinition(state, primary.id);
    const best = Object.values(state.gameData.equipment.inventory)
      .map((instance) => weaponDefinitionsByDefinitionId[instance.definitionId])
      .filter((definition) => definition?.family === jobId)
      .sort((left, right) => (right?.dpsMultiplier ?? 0) - (left?.dpsMultiplier ?? 0))[0];
    if (best === undefined) continue;
    if (current !== null && current.dpsMultiplier >= best.dpsMultiplier) continue;
    return { type: 'equip', slimeId: primary.id, weaponDefinitionId: best.id };
  }
  return null;
}

function worldActivePrimariesByLevel(state: SlimeMercenariesState) {
  return NORMAL_JOB_SLIME_IDS
    .flatMap((jobId) => {
      const slime = firstSlimeByType(state, jobId);
      return slime === null || !state.gameData.roster.formationSlots.includes(slime.id) ? [] : [slime];
    })
    .sort((left, right) => left.level - right.level || left.serial - right.serial);
}

function prepareOnePlainSlime(state: SlimeMercenariesState): SlimeSimulatorCommand | null {
  const craft = previewPlainSlimeCraft(state);
  if (craft.canCraft) return { type: 'craft-plain', count: 1 };
  const shop = previewPlainSlimePurchase(state);
  if (shop.canAfford) return { type: 'buy-plain', count: 1 };
  return null;
}

export function runWorldProgressionSimulation(seed = 1, maxSimTimeSec = 14_400) {
  return runSimulation({
    initialState: createInitialSlimeMercenariesState(0, seed),
    adapter: slimeSimulatorAdapter,
    policy: createWorldProgressionPolicy(),
    milestones: [],
    maxSimTimeSec,
  });
}

export type WorldProgressionSimulationSummary = Readonly<{
  seed: number;
  stopReason: string;
  simTimeSec: number;
  clearedStages: number;
  areaUnlocks: number;
  defeats: number;
  farmClears: number;
  retries: number;
  levelUps: number;
  fusions: number;
  tier2Fusions: number;
  tier3Fusions: number;
  firstTier2AreaId: string | null;
  firstTier3AreaId: string | null;
  jobsDiscovered: number;
  forgeDraws: number;
  dispatchStarts: number;
  dispatchCompletions: number;
  equippedWeapons: number;
  mutations: number;
  mutationIds: readonly SlimeMutationId[];
  mimicCaptured: boolean;
  defeatsByArea: Readonly<Record<string, number>>;
  clearTimeByArea: Readonly<Record<string, number>>;
  finalParty: readonly Readonly<{
    jobId: JobSlimeId;
    level: number;
    fusionRank: number;
    fusionFormId: string;
    jobTier: number;
  }>[];
  maxNoActionWindowSec: number;
}>;

export function summarizeWorldProgressionSimulation(
  seed: number,
  run: ReturnType<typeof runWorldProgressionSimulation>,
): WorldProgressionSimulationSummary {
  const defeatsByArea: Record<string, number> = {};
  const clearTimeByArea: Record<string, number> = {};
  for (const event of run.events) {
    if (event.type === 'partyDefeated') {
      const areaId = typeof event.payload?.areaId === 'string' ? event.payload.areaId : 'unknown';
      defeatsByArea[areaId] = (defeatsByArea[areaId] ?? 0) + 1;
    }
    if (event.type === 'stageCleared' && event.payload?.farming !== true && event.payload?.stageNumber === 5) {
      const areaId = typeof event.payload?.areaId === 'string' ? event.payload.areaId : 'unknown';
      clearTimeByArea[areaId] = event.simTimeSec;
    }
  }

  const fusionEvents = run.events.filter((event) => event.type === 'slimeFused');
  const tier2FusionEvents = fusionEvents.filter((event) => event.payload?.jobTier === 2);
  const tier3FusionEvents = fusionEvents.filter((event) => event.payload?.jobTier === 3);
  const firstTierArea = (events: readonly DomainEvent[]) => {
    const areaId = events[0]?.payload?.areaId;
    return typeof areaId === 'string' ? areaId : null;
  };

  const finalParty = NORMAL_JOB_SLIME_IDS.flatMap((jobId) => {
    const slime = firstSlimeByType(run.finalState, jobId);
    return slime === null ? [] : [{
      jobId,
      level: slime.level,
      fusionRank: slime.fusionRank,
      fusionFormId: slime.fusionFormId,
      jobTier: slime.jobTier,
    }];
  });

  const equippedWeapons = finalParty.filter(({ jobId }) => {
    const slime = firstSlimeByType(run.finalState, jobId);
    return slime !== null && equippedWeaponDefinition(run.finalState, slime.id) !== null;
  }).length;

  return {
    seed,
    stopReason: run.stopReason,
    simTimeSec: run.finalState.simTimeSec,
    clearedStages: run.events.filter((event) => event.type === 'stageCleared' && event.payload?.farming !== true).length,
    areaUnlocks: run.events.filter((event) => event.type === 'areaUnlocked').length,
    defeats: run.events.filter((event) => event.type === 'partyDefeated').length,
    farmClears: run.events.filter((event) => event.type === 'stageCleared' && event.payload?.farming === true).length,
    retries: run.events.filter((event) => event.type === 'frontierRetryStarted').length,
    levelUps: run.events.filter((event) => event.type === 'slimeLeveled').length,
    fusions: fusionEvents.length,
    tier2Fusions: tier2FusionEvents.length,
    tier3Fusions: tier3FusionEvents.length,
    firstTier2AreaId: firstTierArea(tier2FusionEvents),
    firstTier3AreaId: firstTierArea(tier3FusionEvents),
    jobsDiscovered: run.events.filter((event) => event.type === 'slimeJobDiscovered').length,
    forgeDraws: run.events.filter((event) => event.type === 'equipmentForgeResolved').length,
    dispatchStarts: run.events.filter((event) => event.type === 'dispatchStarted').length,
    dispatchCompletions: run.events.filter((event) => event.type === 'dispatchCompleted').length,
    equippedWeapons,
    mutations: run.events.filter((event) => event.type === 'slimeMutated').length,
    mutationIds: [...new Set(run.events
      .filter((event) => event.type === 'slimeMutated')
      .flatMap((event) => typeof event.payload?.mutationId === 'string' ? [event.payload.mutationId as SlimeMutationId] : []))],
    mimicCaptured: run.events.some((event) => event.type === 'mimicCaptured'),
    defeatsByArea,
    clearTimeByArea,
    finalParty,
    maxNoActionWindowSec: Math.max(0, ...run.waitWindows
      .filter((window) => window.classification === 'no-action')
      .map((window) => window.durationSec)),
  };
}


export function validateWorldProgressionSummary(summary: WorldProgressionSimulationSummary): readonly string[] {
  const failures: string[] = [];
  const targets = balance.targets.world;

  if (summary.stopReason !== 'world-clear') failures.push(`stop=${summary.stopReason}`);
  if (summary.clearedStages !== 40) failures.push(`clearedStages=${summary.clearedStages}`);
  if (summary.areaUnlocks !== 7) failures.push(`areaUnlocks=${summary.areaUnlocks}`);
  if (summary.jobsDiscovered !== NORMAL_JOB_SLIME_IDS.length) failures.push(`jobsDiscovered=${summary.jobsDiscovered}`);
  if (summary.finalParty.length !== NORMAL_JOB_SLIME_IDS.length) failures.push(`finalParty=${summary.finalParty.length}`);
  if (summary.defeats < targets.minDefeats || summary.defeats > targets.maxDefeats) {
    failures.push(`defeats=${summary.defeats} outside ${targets.minDefeats}..${targets.maxDefeats}`);
  }
  if (Object.keys(summary.defeatsByArea).length < targets.requiredDefeatAreas) {
    failures.push(`defeatAreas=${Object.keys(summary.defeatsByArea).length} < ${targets.requiredDefeatAreas}`);
  }
  if (summary.retries !== summary.defeats) {
    failures.push(`defeats/retries=${summary.defeats}/${summary.retries}`);
  }
  if (summary.farmClears !== summary.defeats * balance.combat.frontier.retryFarmClears) {
    failures.push(`farmClears=${summary.farmClears}, expected=${summary.defeats * balance.combat.frontier.retryFarmClears}`);
  }
  if (summary.maxNoActionWindowSec > targets.maxNoActionWindowSec) {
    failures.push(`maxNoActionWindowSec=${summary.maxNoActionWindowSec} > ${targets.maxNoActionWindowSec}`);
  }
  const underFused = summary.finalParty.filter((slime) => slime.fusionRank < targets.minFinalFusionRank);
  if (underFused.length > 0) {
    failures.push(`underFused=${underFused.map((slime) => slime.jobId).join(',')}`);
  }
  if (summary.tier2Fusions < targets.minTier2Fusions) {
    failures.push(`tier2Fusions=${summary.tier2Fusions} < ${targets.minTier2Fusions}`);
  }
  if (summary.tier3Fusions < targets.minTier3Fusions) {
    failures.push(`tier3Fusions=${summary.tier3Fusions} < ${targets.minTier3Fusions}`);
  }
  if (summary.firstTier2AreaId !== targets.firstTier2AreaId) {
    failures.push(`firstTier2AreaId=${summary.firstTier2AreaId}, expected=${targets.firstTier2AreaId}`);
  }
  if (summary.firstTier3AreaId !== targets.firstTier3AreaId) {
    failures.push(`firstTier3AreaId=${summary.firstTier3AreaId}, expected=${targets.firstTier3AreaId}`);
  }
  if (summary.forgeDraws < targets.minForgeDraws) {
    failures.push(`forgeDraws=${summary.forgeDraws} < ${targets.minForgeDraws}`);
  }
  if (summary.dispatchStarts < targets.minDispatchStarts) {
    failures.push(`dispatchStarts=${summary.dispatchStarts} < ${targets.minDispatchStarts}`);
  }
  if (summary.dispatchCompletions < targets.minDispatchCompletions) {
    failures.push(`dispatchCompletions=${summary.dispatchCompletions} < ${targets.minDispatchCompletions}`);
  }
  if (summary.equippedWeapons < targets.minEquippedWeapons) {
    failures.push(`equippedWeapons=${summary.equippedWeapons} < ${targets.minEquippedWeapons}`);
  }
  if (summary.mutations < targets.minMutations) {
    failures.push(`mutations=${summary.mutations} < ${targets.minMutations}`);
  }
  const missingMutations = targets.requiredMutationIds.filter((mutationId) => !summary.mutationIds.includes(mutationId));
  if (missingMutations.length > 0) {
    failures.push(`missingMutations=${missingMutations.join(',')}`);
  }
  if (targets.requireMimicCapture && !summary.mimicCaptured) failures.push('mimicCaptured=false');

  return failures;
}
