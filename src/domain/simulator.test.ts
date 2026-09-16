import { describe, expect, it } from 'vitest';
import { evaluateFirstLoopBalance, runFirstLoopSimulation } from './simulator';

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
