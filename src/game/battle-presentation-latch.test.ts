import { describe, expect, it } from 'vitest';
import type { BattleSceneModel } from '../application/selectors/battle-scene';
import {
  battleSceneModelKey,
  createBattlePresentationCursor,
  reconcileBattlePresentation,
} from './battle-presentation-latch';

function model(id: string, stageNumber: number, hasEncounter = true): BattleSceneModel {
  return {
    encounterKey: id,
    visualKey: 'party',
    stageNumber,
    waveIndex: 0,
    encounter: hasEncounter ? ({ id } as BattleSceneModel['encounter']) : null,
    authoritativeResult: hasEncounter ? 'victory' : null,
    authoritativeResultDeadlineMs: hasEncounter ? 1_000 : null,
    allies: [],
  };
}

describe('battle presentation latch', () => {
  it('holds an in-flight encounter when Domain advances ahead', () => {
    const first = model('stage-1', 1);
    const latest = model('stage-3', 3);
    const cursor = createBattlePresentationCursor(first, false);

    const next = reconcileBattlePresentation(cursor, latest, false, false);

    expect(battleSceneModelKey(next.model)).toBe(battleSceneModelKey(first));
    expect(next).toBe(cursor);
  });

  it('jumps directly to the latest encounter after the current result is readable', () => {
    const first = model('stage-1', 1);
    const latest = model('stage-4', 4);
    const cursor = createBattlePresentationCursor(first, false);

    const next = reconcileBattlePresentation(cursor, latest, true, false);

    expect(next.model).toBe(latest);
    expect(next.terminalReached).toBe(false);
  });

  it('plays the reconstructed terminal encounter before exposing the content boundary', () => {
    const current = model('stage-4-wave', 4);
    const terminalBoss = model('stage-5-boss', 5);
    const cursor = createBattlePresentationCursor(current, false);

    const switched = reconcileBattlePresentation(cursor, terminalBoss, true, true);
    expect(switched.model).toBe(terminalBoss);
    expect(switched.terminalReached).toBe(false);

    const held = reconcileBattlePresentation(switched, terminalBoss, false, true);
    expect(held.terminalReached).toBe(false);

    const finished = reconcileBattlePresentation(switched, terminalBoss, true, true);
    expect(finished.terminalReached).toBe(true);
  });

  it('keeps the last rendered battle while exposing a reached content boundary', () => {
    const lastBattle = model('stage-5-boss', 5);
    const boundary = model('content-boundary', 5, false);
    const cursor = createBattlePresentationCursor(lastBattle, false);

    const next = reconcileBattlePresentation(cursor, boundary, true, true);

    expect(next.model).toBe(lastBattle);
    expect(next.terminalReached).toBe(true);
  });

  it('leaves a terminal hold as soon as validation resets to a real encounter', () => {
    const lastBattle = model('stage-5-boss', 5);
    const boundary = model('content-boundary', 5, false);
    const terminal = reconcileBattlePresentation(
      createBattlePresentationCursor(lastBattle, false),
      boundary,
      true,
      true,
    );
    const reset = model('stage-1-reset', 1);

    const next = reconcileBattlePresentation(terminal, reset, true, false);

    expect(next.model).toBe(reset);
    expect(next.terminalReached).toBe(false);
  });
});
