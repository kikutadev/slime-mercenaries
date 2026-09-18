import { describe, expect, it } from 'vitest';
import { grantToken } from 'idle-game-kit';
import { createJobSlime } from './commands';
import { ids, jobCreationDefinitions, type JobSlimeId } from './definitions';
import { grantMutationCatalyst, grantMutationFragments, mutateSlime, previewSlimeMutation } from './mutation';
import { firstSlimeIdByType } from './roster';
import { createInitialSlimeMercenariesState, type SlimeMercenariesState } from './state';

function createOwned(typeId: JobSlimeId, jobTier: number): Readonly<{ state: SlimeMercenariesState; slimeId: string }> {
  const definition = jobCreationDefinitions[typeId];
  let state = createInitialSlimeMercenariesState(0, 301);
  state = {
    ...state,
    tokens: grantToken(
      grantToken(state.tokens, ids.token.plainSlime, definition.plainSlimeCount),
      definition.jobGearTokenId,
      definition.jobGearCount,
    ),
  };
  const created = createJobSlime(state, typeId);
  if (!created.accepted) throw new Error(`setup ${typeId} creation failed`);
  const slimeId = firstSlimeIdByType(created.state, typeId);
  if (slimeId === null) throw new Error(`setup ${typeId} missing`);
  const slime = created.state.gameData.roster.slimes[slimeId]!;
  return {
    slimeId,
    state: {
      ...created.state,
      gameData: {
        ...created.state.gameData,
        roster: {
          ...created.state.gameData.roster,
          slimes: {
            ...created.state.gameData.roster.slimes,
            [slimeId]: { ...slime, jobTier },
          },
        },
      },
    },
  };
}

describe('rare mutation domain foundation', () => {
  it('persists fragment progress without inventing a conversion threshold', () => {
    const initial = createInitialSlimeMercenariesState(0, 1);
    const progressed = grantMutationFragments(grantMutationFragments(initial, 'king', 3), 'king', 2);
    expect(progressed.gameData.mutationProgress.king.fragments).toBe(5);
    expect(progressed.gameData.mutationProgress.king.catalysts).toBe(0);
  });

  it('consumes one catalyst and mutates an eligible Tier-2 body to Golden', () => {
    const setup = createOwned('sword', 2);
    const ready = grantMutationCatalyst(setup.state, 'golden');
    expect(previewSlimeMutation(ready, setup.slimeId, 'golden').canMutate).toBe(true);
    const result = mutateSlime(ready, setup.slimeId, 'golden');
    expect(result.accepted).toBe(true);
    if (!result.accepted) return;
    expect(result.state.gameData.roster.slimes[setup.slimeId]?.mutationId).toBe('golden');
    expect(result.state.gameData.mutationProgress.golden.catalysts).toBe(0);
    expect(result.state.gameData.codex.slimeForms['slime.mutation.golden']).toMatchObject({ viewedAtSimTimeSec: null });
  });

  it('keeps King Tier-3-only and Prism restricted to magic/ranged Tier-3 families', () => {
    const tier2 = createOwned('sword', 2);
    expect(previewSlimeMutation(grantMutationCatalyst(tier2.state, 'king'), tier2.slimeId, 'king').canMutate).toBe(false);

    const swordTier3 = createOwned('sword', 3);
    expect(previewSlimeMutation(grantMutationCatalyst(swordTier3.state, 'king'), swordTier3.slimeId, 'king').canMutate).toBe(true);
    expect(previewSlimeMutation(grantMutationCatalyst(swordTier3.state, 'prism'), swordTier3.slimeId, 'prism').canMutate).toBe(false);

    const wandTier3 = createOwned('wand', 3);
    expect(previewSlimeMutation(grantMutationCatalyst(wandTier3.state, 'prism'), wandTier3.slimeId, 'prism').canMutate).toBe(true);
  });

  it('does not silently enable Dragon for every Tier-3 family before selected origins are authored', () => {
    const tier3 = createOwned('sword', 3);
    const ready = grantMutationCatalyst(tier3.state, 'dragon');
    const result = mutateSlime(ready, tier3.slimeId, 'dragon');
    expect(result.accepted).toBe(false);
    if (result.accepted) return;
    expect(result.reason).toBe('not-eligible');
  });

  it('prevents stacking multiple mutation identities on one persistent body', () => {
    const setup = createOwned('wand', 3);
    const golden = mutateSlime(grantMutationCatalyst(setup.state, 'golden'), setup.slimeId, 'golden');
    if (!golden.accepted) throw new Error('golden setup failed');
    const prismReady = grantMutationCatalyst(golden.state, 'prism');
    const rejected = mutateSlime(prismReady, setup.slimeId, 'prism');
    expect(rejected.accepted).toBe(false);
    if (rejected.accepted) return;
    expect(rejected.reason).toBe('already-mutated');
  });
});
