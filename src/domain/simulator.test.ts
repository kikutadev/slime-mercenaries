import { describe, expect, it } from 'vitest';
import { addItemInstance, applyRewards, grantToken } from 'idle-game-kit';
import { fusionStepDefinitions, ids, resolveCurrencyDefinition, weaponDefinitions } from './definitions';
import { firstSlimeIdByType } from './roster';
import { highestStageClearedForArea, createInitialSlimeMercenariesState } from './state';
import {
  evaluateDefeatLoopBalance,
  evaluateFirstLoopBalance,
  evaluatePacedDefeatBalance,
  runDefeatLoopSimulation,
  runFirstLoopSimulation,
  slimeSimulatorAdapter,
  summarizeFirstLoopSimulation,
} from './simulator';

describe('same-core first-loop simulation', () => {
  it('reaches first Fusion and the Clover Road boss through production commands', () => {
    const result = runFirstLoopSimulation(11, 900);
    const hits = Object.fromEntries(result.milestoneHits.map((hit) => [hit.id, hit.simTimeSec]));

    expect(hits['first-sword']).toBeDefined();
    expect(hits['first-sword-core']).toBeDefined();
    expect(hits['first-fusion']).toBeDefined();
    expect(hits['clover-road-boss']).toBeDefined();
    expect(highestStageClearedForArea(result.finalState.gameData.progression)).toBe(5);
    expect(result.stopReason).toBe('content-boundary');
  });

  it('exercises defeat -> retreat -> farm -> strengthen -> retry through the same production domain', () => {
    const result = runDefeatLoopSimulation(11, 900);
    const summary = summarizeFirstLoopSimulation(11, 'defeat-loop', result);

    expect(summary.stopReason).toBe('content-boundary');
    expect(summary.highestStageCleared).toBe(5);
    expect(summary.firstDefeatSec).not.toBeNull();
    expect(summary.defeats).toBeGreaterThanOrEqual(1);
    expect(summary.retreats).toBe(summary.defeats);
    expect(summary.farmClears).toBeGreaterThanOrEqual(3);
    expect(summary.retries).toBeGreaterThanOrEqual(1);
    expect(summary.levelUps).toBeGreaterThan(0);
    expect(summary.defeatsByStage['3']).toBeGreaterThanOrEqual(1);
    expect(summary.cloverRoadBossSec).not.toBeNull();
    expect(summary.firstDefeatSec!).toBeLessThan(summary.cloverRoadBossSec!);
  });

  it('keeps the defeat-loop simulator deterministic for the same seed', () => {
    const first = runDefeatLoopSimulation(23, 900);
    const second = runDefeatLoopSimulation(23, 900);
    expect(first.milestoneHits).toEqual(second.milestoneHits);
    expect(first.events).toEqual(second.events);
    expect(first.finalState.gameData).toEqual(second.finalState.gameData);
  });

  it('is deterministic for the same seed and policy', () => {
    const first = runFirstLoopSimulation(99, 900);
    const second = runFirstLoopSimulation(99, 900);

    expect(first.milestoneHits).toEqual(second.milestoneHits);
    expect(first.finalState.tokens).toEqual(second.finalState.tokens);
    expect(first.finalState.currencies).toEqual(second.finalState.currencies);
    expect(first.finalState.gameData).toEqual(second.finalState.gameData);
  });

  it('keeps authored first-loop balance targets inside their configured bands across seeds', () => {
    const evaluations = evaluateFirstLoopBalance(Array.from({ length: 20 }, (_, index) => index + 1));
    expect(evaluations.every((entry) => entry.status === 'pass')).toBe(true);
    expect(evaluations.every((entry) => entry.observed !== null)).toBe(true);
  });

  it('keeps authored defeat-loop repetition targets inside their configured bands across seeds', () => {
    const evaluations = evaluateDefeatLoopBalance(Array.from({ length: 20 }, (_, index) => index + 1));
    expect(evaluations.every((entry) => entry.status === 'pass')).toBe(true);
    expect(evaluations.map((entry) => entry.target.kind)).toContain('repetition-count');
    expect(evaluations.every((entry) => entry.observed !== null)).toBe(true);
  });

  it('keeps low-frequency paced-defeat targets inside their configured bands across seeds', () => {
    const evaluations = evaluatePacedDefeatBalance(Array.from({ length: 20 }, (_, index) => index + 1));
    expect(evaluations.every((entry) => entry.status === 'pass')).toBe(true);
    expect(evaluations.map((entry) => entry.target.kind)).toContain('repetition-count');
    expect(evaluations.every((entry) => entry.observed !== null)).toBe(true);
  });
});

it('exposes forge/equip/fuse/dispatch through the same simulator command adapter', () => {
  let state = createInitialSlimeMercenariesState(0, 17);
  let result = slimeSimulatorAdapter.executeCommand(state, { type: 'craft-plain', count: 1 });
  if (!result.accepted) throw new Error(`craft rejected: ${result.reason}`);
  state = result.state;
  result = slimeSimulatorAdapter.executeCommand(state, { type: 'create-job', jobId: 'sword' });
  if (!result.accepted) throw new Error(`job rejected: ${result.reason}`);
  state = result.state;

  const swordId = firstSlimeIdByType(state, 'sword');
  if (swordId === null) throw new Error('sword missing after creation');

  state = applyRewards(state, [{ type: 'currency', currencyId: ids.currency.gold, amount: 10_000, source: 'test' }], { resolveCurrencyDefinition }) as typeof state;
  let tokens = grantToken(state.tokens, ids.token.forgeKey, 1);
  const fusionSteps = fusionStepDefinitions.sword.slice(0, 2);
  for (const step of fusionSteps) {
    for (const requirement of step.recipe) tokens = grantToken(tokens, requirement.tokenId, requirement.count);
  }
  state = { ...state, tokens };
  result = slimeSimulatorAdapter.executeCommand(state, { type: 'level', slimeId: swordId, count: 19 });
  if (!result.accepted) throw new Error(`level rejected: ${result.reason}`);
  state = result.state;
  for (const step of fusionSteps) {
    result = slimeSimulatorAdapter.executeCommand(state, { type: 'fuse', slimeId: swordId, fusionStepId: step.id });
    if (!result.accepted) throw new Error(`fusion rejected: ${result.reason}`);
    state = result.state;
  }

  result = slimeSimulatorAdapter.executeCommand(state, { type: 'forge', drawCount: 1 });
  if (!result.accepted) throw new Error(`forge rejected: ${result.reason}`);
  state = result.state;

  const saber = weaponDefinitions.bronzeSaber;
  const added = addItemInstance(state.gameData.equipment.inventory, {
    instanceId: `test.${saber.id}`,
    definitionId: saber.id,
    quantity: 1,
    data: { refinementRank: 0 },
  });
  if (!added.accepted && added.reason !== 'duplicate-instance') throw new Error(`inventory setup rejected: ${added.reason}`);
  if (added.accepted) state = { ...state, gameData: { ...state.gameData, equipment: { ...state.gameData.equipment, inventory: added.inventory } } };
  result = slimeSimulatorAdapter.executeCommand(state, { type: 'equip', slimeId: swordId, weaponDefinitionId: saber.id });
  if (!result.accepted) throw new Error(`equip rejected: ${result.reason}`);
  state = result.state;

  result = slimeSimulatorAdapter.executeCommand(state, { type: 'start-dispatch', contractId: 'roadEscort', slimeId: swordId });
  expect(result.accepted).toBe(true);
  if (!result.accepted) return;
  expect(result.state.gameData.roster.slimes[swordId]?.jobTier).toBe(2);
  expect(result.state.gameData.roster.slimes[swordId]?.assignment).toBe('dispatch');
  expect(Object.keys(result.state.gameData.equipment.inventory).length).toBeGreaterThan(0);
});
