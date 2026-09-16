import { describe, expect, it } from 'vitest';
import { addItemInstance, applyRewards, grantToken } from 'idle-game-kit';
import { ids, resolveCurrencyDefinition, weaponDefinitions } from './definitions';
import { createInitialSlimeMercenariesState } from './state';
import { evaluateFirstLoopBalance, runFirstLoopSimulation, slimeSimulatorAdapter } from './simulator';

describe('same-core first-loop simulation', () => {
  it('reaches first Fusion and the Clover Road boss through production commands', () => {
    const result = runFirstLoopSimulation(11, 900);
    const hits = Object.fromEntries(result.milestoneHits.map((hit) => [hit.id, hit.simTimeSec]));

    expect(hits['first-sword']).toBeDefined();
    expect(hits['first-sword-core']).toBeDefined();
    expect(hits['first-fusion']).toBeDefined();
    expect(hits['clover-road-boss']).toBeDefined();
    expect(result.finalState.gameData.progression.highestStageCleared).toBe(5);
    expect(result.stopReason).toBe('content-boundary');
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
});

it('exposes forge/equip/promote/dispatch through the same simulator command adapter', () => {
  let state = createInitialSlimeMercenariesState(0, 17);
  let result = slimeSimulatorAdapter.executeCommand(state, { type: 'craft-plain', count: 1 });
  if (!result.accepted) throw new Error(`craft rejected: ${result.reason}`);
  state = result.state;
  result = slimeSimulatorAdapter.executeCommand(state, { type: 'create-job', jobId: 'sword' });
  if (!result.accepted) throw new Error(`job rejected: ${result.reason}`);
  state = result.state;

  state = applyRewards(state, [{ type: 'currency', currencyId: ids.currency.gold, amount: 10_000, source: 'test' }], { resolveCurrencyDefinition }) as typeof state;
  state = {
    ...state,
    tokens: grantToken(grantToken(state.tokens, ids.token.promotionMaterial, 10), ids.token.forgeKey, 1),
  };
  result = slimeSimulatorAdapter.executeCommand(state, { type: 'level', jobId: 'sword', count: 19 });
  if (!result.accepted) throw new Error(`level rejected: ${result.reason}`);
  state = result.state;
  result = slimeSimulatorAdapter.executeCommand(state, { type: 'promote', jobId: 'sword' });
  if (!result.accepted) throw new Error(`promotion rejected: ${result.reason}`);
  state = result.state;

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
  result = slimeSimulatorAdapter.executeCommand(state, { type: 'equip', jobId: 'sword', weaponDefinitionId: saber.id });
  if (!result.accepted) throw new Error(`equip rejected: ${result.reason}`);
  state = result.state;

  result = slimeSimulatorAdapter.executeCommand(state, { type: 'start-dispatch', contractId: 'roadEscort', jobId: 'sword' });
  expect(result.accepted).toBe(true);
  if (!result.accepted) return;
  expect(result.state.gameData.roster.slimes.sword?.jobTier).toBe(2);
  expect(result.state.gameData.roster.slimes.sword?.assignment).toBe('dispatch');
  expect(Object.keys(result.state.gameData.equipment.inventory).length).toBeGreaterThan(0);
});
