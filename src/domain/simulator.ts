import { readCurrency, readToken } from 'idle-game-kit';
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
  fuseSlime,
  levelUpSlime,
  previewJobCreation,
  previewPlainSlimeCraft,
  previewPlainSlimePurchase,
  previewSlimeFusion,
  previewSlimeLevelUp,
} from './commands';
import { assignSlimeToFormation, nextCombatBoundarySec } from './combat';
import { advanceSlimeWorldTo } from './world';
import { balance } from './balance';
import { ids, type JobSlimeId } from './definitions';
import { createInitialSlimeMercenariesState, type SlimeMercenariesState } from './state';

export type SlimeSimulatorCommand =
  | Readonly<{ type: 'craft-plain'; count: number }>
  | Readonly<{ type: 'buy-plain'; count: number }>
  | Readonly<{ type: 'create-job'; jobId: JobSlimeId }>
  | Readonly<{ type: 'assign'; jobId: JobSlimeId; slotIndex: number }>
  | Readonly<{ type: 'level'; jobId: JobSlimeId; count: number }>
  | Readonly<{ type: 'fuse'; jobId: JobSlimeId }>;

export const slimeSimulatorAdapter: SimulatorAdapter<SlimeMercenariesState, SlimeSimulatorCommand> = {
  getSimTimeSec: (state) => state.simTimeSec,
  advanceTo: advanceSlimeWorldTo,
  executeCommand: (state, command) => {
    switch (command.type) {
      case 'craft-plain': return craftPlainSlime(state, command.count);
      case 'buy-plain': return buyPlainSlime(state, command.count);
      case 'create-job': return createJobSlime(state, command.jobId);
      case 'assign': return assignSlimeToFormation(state, command.jobId, command.slotIndex);
      case 'level': return levelUpSlime(state, command.jobId, command.count);
      case 'fuse': return fuseSlime(state, command.jobId);
    }
  },
};

/**
 * Baseline no-ad policy for the first vertical slice.
 * It is intentionally simple: guarantee Sword access, create one duplicate, level toward Fusion,
 * fuse when ready, and otherwise wait exactly to the next combat reward boundary.
 */
export function createFirstLoopPolicy(): SimulatorPolicy<SlimeMercenariesState, SlimeSimulatorCommand> {
  return {
    id: 'slime-mercenaries.first-loop-efficient',
    version: '1',
    chooseAction: (state) => {
      if (state.gameData.combat.contentBoundaryReached) return { kind: 'stop', reason: 'content-boundary' };

      const sword = state.gameData.roster.slimes.sword;
      if (sword === undefined) {
        const create = previewJobCreation(state, 'sword');
        if (create.canCreate) return { kind: 'command', command: { type: 'create-job', jobId: 'sword' } };
        const craft = previewPlainSlimeCraft(state);
        if (craft.canCraft) return { kind: 'command', command: { type: 'craft-plain', count: 1 } };
        const shop = previewPlainSlimePurchase(state);
        if (shop.canAfford) return { kind: 'command', command: { type: 'buy-plain', count: 1 } };
        return { kind: 'stop', reason: 'opening-resource-wall' };
      }

      if (!state.gameData.roster.formationSlots.includes('sword')) {
        return { kind: 'command', command: { type: 'assign', jobId: 'sword', slotIndex: 0 } };
      }

      // Create one repeated Sword as soon as the deterministic Stage-1 supply makes it possible.
      if (readToken(state.tokens, ids.token.swordCore) === 0 && readToken(state.tokens, ids.token.trainingSword) > 0) {
        const create = previewJobCreation(state, 'sword');
        if (create.canCreate) return { kind: 'command', command: { type: 'create-job', jobId: 'sword' } };
        const craft = previewPlainSlimeCraft(state);
        if (craft.canCraft) return { kind: 'command', command: { type: 'craft-plain', count: 1 } };
      }

      const fusion = previewSlimeFusion(state, 'sword');
      if (fusion.canFuse) return { kind: 'command', command: { type: 'fuse', jobId: 'sword' } };

      // Before first Fusion, spend spare Gold on the same authored Type Level curve used in production.
      if (fusion.step !== null && !fusion.levelMet) {
        const level = previewSlimeLevelUp(state, 'sword', 1);
        if (level?.available === true
          && readCurrency(state.currencies, ids.currency.gold).compare(level.totalCost) >= 0) {
          return { kind: 'command', command: { type: 'level', jobId: 'sword', count: 1 } };
        }
      }

      // If a boss is blocking progression, grow one level at a time whenever Gold allows it.
      if (state.gameData.combat.blockedBossStage !== null) {
        const level = previewSlimeLevelUp(state, 'sword', 1);
        if (level?.available === true
          && readCurrency(state.currencies, ids.currency.gold).compare(level.totalCost) >= 0) {
          return { kind: 'command', command: { type: 'level', jobId: 'sword', count: 1 } };
        }
        return { kind: 'stop', reason: 'boss-blocked-no-affordable-growth' };
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
  { id: 'first-sword', reached: (state) => state.gameData.roster.slimes.sword !== undefined },
  { id: 'first-sword-core', reached: (state) => readToken(state.tokens, ids.token.swordCore) > 0 },
  { id: 'first-fusion', reached: (state) => (state.gameData.roster.slimes.sword?.fusionRank ?? 0) >= 2 },
  { id: 'clover-road-boss', reached: (state) => state.gameData.progression.highestStageCleared >= 5 },
];

export function runFirstLoopSimulation(seed = 1, maxSimTimeSec = 900) {
  return runSimulation({
    initialState: createInitialSlimeMercenariesState(0, seed),
    adapter: slimeSimulatorAdapter,
    policy: createFirstLoopPolicy(),
    milestones: firstLoopMilestones,
    maxSimTimeSec,
  });
}


const FIRST_LOOP_PROFILE_ID = 'slime-mercenaries.first-loop-efficient';

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

/** Evaluate authored first-loop target bands across deterministic seeds. */
export function evaluateFirstLoopBalance(seeds: readonly number[] = Array.from({ length: 20 }, (_, index) => index + 1)) {
  if (seeds.length === 0) throw new RangeError('Balance evaluation requires at least one seed.');
  const runs = seeds.map((seed) => runFirstLoopSimulation(seed, balance.targets.cloverRoadBoss.maxSec * 3));
  const source: BalanceTargetSource = {
    milestoneTimeSec: (profileId, milestoneId, percentile) => {
      if (profileId !== FIRST_LOOP_PROFILE_ID) return null;
      const values = runs.flatMap((run) => {
        const hit = run.milestoneHits.find((candidate) => candidate.id === milestoneId);
        return hit === undefined ? [] : [hit.simTimeSec];
      });
      return percentileValue(values, percentile);
    },
    maxNoActionWindowSec: (profileId, percentile) => {
      if (profileId !== FIRST_LOOP_PROFILE_ID) return null;
      const values = runs.map((run) => Math.max(0, ...run.waitWindows
        .filter((window) => window.classification === 'no-action')
        .map((window) => window.durationSec)));
      return percentileValue(values, percentile);
    },
    wallP90WaitSec: () => null,
    wallStuckProbability: () => null,
  };
  return evaluateBalanceTargets(firstLoopBalanceTargets, source);
}

function percentileValue(values: readonly number[], percentile: BalancePercentile): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((left, right) => left - right);
  const ratio = percentile === 'p90' ? 0.9 : 0.5;
  const index = Math.max(0, Math.ceil(sorted.length * ratio) - 1);
  return sorted[index] ?? null;
}
