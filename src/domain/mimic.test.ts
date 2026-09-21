import { grantToken, readToken } from 'idle-game-kit';
import { describe, expect, it } from 'vitest';
import {
  captureMimic,
  convertDuplicateToFusionCore,
  craftPlainSlime,
  createInitialSlimeMercenariesState,
  createJobSlime,
  firstSlimeIdByType,
  ids,
  isEligibleForMutation,
  mutationSlimeCodexId,
  previewMimicCapture,
  previewSlimeFusions,
  type SlimeMercenariesState,
} from './index';

function stateWithLevelledSword(level = 18): SlimeMercenariesState {
  let state = createInitialSlimeMercenariesState(0, 20260922);
  const crafted = craftPlainSlime(state);
  if (!crafted.accepted) throw new Error('test setup: craft failed');
  state = crafted.state;

  const created = createJobSlime(state, 'sword');
  if (!created.accepted) throw new Error('test setup: sword creation failed');
  state = created.state;

  const swordId = firstSlimeIdByType(state, 'sword');
  if (swordId === null) throw new Error('test setup: sword missing');
  const sword = state.gameData.roster.slimes[swordId]!;
  return {
    ...state,
    gameData: {
      ...state.gameData,
      roster: {
        ...state.gameData.roster,
        slimes: {
          ...state.gameData.roster.slimes,
          [swordId]: { ...sword, level },
        },
      },
    },
  };
}

describe('Mimic special capture', () => {
  it('consumes one Mimic Heart and creates one independent special body at catch-up level', () => {
    const setup = stateWithLevelledSword(18);
    const funded: SlimeMercenariesState = {
      ...setup,
      tokens: grantToken(setup.tokens, ids.token.mimicHeart, 1),
    };

    expect(previewMimicCapture(funded)).toEqual({
      alreadyOwned: false,
      hearts: 1,
      heartCost: 1,
      canCapture: true,
      captureLevel: 18,
    });

    const result = captureMimic(funded);
    expect(result.accepted).toBe(true);
    if (!result.accepted) return;

    const mimicId = firstSlimeIdByType(result.state, 'mimic');
    expect(mimicId).not.toBeNull();
    if (mimicId === null) return;
    const mimic = result.state.gameData.roster.slimes[mimicId]!;
    expect(mimic).toMatchObject({
      typeId: 'mimic',
      level: 18,
      jobTier: 3,
      fusionRank: 1,
      fusionFormId: 'mimic',
      mutationId: null,
      assignment: 'reserve',
    });
    expect(readToken(result.state.tokens, ids.token.mimicHeart)).toBe(0);
    expect(result.state.gameData.equipment.loadouts[mimicId]?.equipped).toEqual({ special: null });
    expect(result.state.gameData.codex.slimeForms[mutationSlimeCodexId('mimic')]).toBeDefined();
    expect(result.events).toEqual([
      expect.objectContaining({
        type: 'mimicCaptured',
        payload: expect.objectContaining({
          slimeId: mimicId,
          typeId: 'mimic',
          level: 18,
        }),
      }),
    ]);
  });

  it('rejects capture without a Heart and prevents duplicate Mimic ownership', () => {
    const state = stateWithLevelledSword();
    expect(captureMimic(state)).toMatchObject({ accepted: false, reason: 'missing-heart' });

    const funded = { ...state, tokens: grantToken(state.tokens, ids.token.mimicHeart, 2) };
    const first = captureMimic(funded);
    expect(first.accepted).toBe(true);
    if (!first.accepted) return;

    const second = captureMimic(first.state);
    expect(second).toMatchObject({ accepted: false, reason: 'already-owned' });
    expect(readToken(first.state.tokens, ids.token.mimicHeart)).toBe(1);
  });

  it('does not enter the normal Fusion, duplicate-core, or Rare Mutation systems', () => {
    const state = stateWithLevelledSword();
    const funded = { ...state, tokens: grantToken(state.tokens, ids.token.mimicHeart, 1) };
    const captured = captureMimic(funded);
    expect(captured.accepted).toBe(true);
    if (!captured.accepted) return;

    const mimicId = firstSlimeIdByType(captured.state, 'mimic');
    expect(mimicId).not.toBeNull();
    if (mimicId === null) return;
    const mimic = captured.state.gameData.roster.slimes[mimicId]!;

    expect(previewSlimeFusions(captured.state, mimicId)).toEqual([]);
    expect(convertDuplicateToFusionCore(captured.state, mimicId))
      .toMatchObject({ accepted: false, reason: 'special-slime' });
    expect(isEligibleForMutation(mimic, 'king')).toBe(false);
    expect(isEligibleForMutation(mimic, 'golden')).toBe(false);
    expect(isEligibleForMutation(mimic, 'dragon')).toBe(false);
    expect(isEligibleForMutation(mimic, 'prism')).toBe(false);
  });
});
