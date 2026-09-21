import { describe, expect, it } from 'vitest';
import { grantToken } from 'idle-game-kit';
import { assignSlimeToFormation } from './combat';
import { slimeCombatPower, partyCombatDps, partyCombatPower } from './combat-power';
import { createJobSlime } from './commands';
import { areaDefinitions, ids, jobCreationDefinitions, type JobSlimeId } from './definitions';
import { applySlimeProductRewards } from './rewards';
import { grantMutationCatalyst, grantMutationFragments, mutateSlime, previewSlimeMutation } from './mutation';
import { firstSlimeIdByType } from './roster';
import { createInitialSlimeMercenariesState, type SlimeMercenariesState } from './state';

function createOwned(
  typeId: JobSlimeId,
  jobTier: number,
  fusionFormId = 'base',
  fusionRank = jobTier >= 3 ? 4 : jobTier >= 2 ? 3 : 1,
): Readonly<{ state: SlimeMercenariesState; slimeId: string }> {
  const definition = jobCreationDefinitions[typeId];
  let state = createInitialSlimeMercenariesState(0, 301);
  state = {
    ...state,
    tokens: grantToken(
      grantToken(state.tokens, ids.token.plainSlime, definition.plainSlimeCount),
      definition.jobGearTokenId,
      definition.jobGearCount,
    ),
    gameData: {
      ...state.gameData,
      progression: { ...state.gameData.progression, currentAreaId: definition.unlockAreaId },
    },
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
            [slimeId]: { ...slime, jobTier, fusionFormId, fusionRank },
          },
        },
      },
    },
  };
}

function mutateOwned(
  setup: Readonly<{ state: SlimeMercenariesState; slimeId: string }>,
  mutationId: 'king' | 'golden' | 'dragon' | 'prism',
): SlimeMercenariesState {
  const result = mutateSlime(grantMutationCatalyst(setup.state, mutationId), setup.slimeId, mutationId);
  if (!result.accepted) throw new Error(`setup ${mutationId} mutation failed: ${result.reason}`);
  return result.state;
}

describe('rare mutation production rules', () => {
  it('converts fragment thresholds into deterministic catalysts and keeps the remainder', () => {
    const initial = createInitialSlimeMercenariesState(0, 1);
    const almost = grantMutationFragments(initial, 'king', 7);
    expect(almost.gameData.mutationProgress.king).toEqual({ fragments: 7, catalysts: 0 });

    const crossed = grantMutationFragments(almost, 'king', 8);
    expect(crossed.gameData.mutationProgress.king).toEqual({ fragments: 5, catalysts: 1 });

    const multi = grantMutationFragments(crossed, 'king', 21);
    expect(multi.gameData.mutationProgress.king).toEqual({ fragments: 6, catalysts: 3 });
    expect(previewSlimeMutation(multi, 'missing', 'king').fragmentThreshold).toBe(10);
  });

  it('consumes one catalyst and mutates an eligible Tier-2 body to Golden', () => {
    const setup = createOwned('sword', 2, 'fighter');
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
    const tier2 = createOwned('sword', 2, 'fighter');
    expect(previewSlimeMutation(grantMutationCatalyst(tier2.state, 'king'), tier2.slimeId, 'king').canMutate).toBe(false);

    const swordTier3 = createOwned('sword', 3, 'blademaster');
    expect(previewSlimeMutation(grantMutationCatalyst(swordTier3.state, 'king'), swordTier3.slimeId, 'king').canMutate).toBe(true);
    expect(previewSlimeMutation(grantMutationCatalyst(swordTier3.state, 'prism'), swordTier3.slimeId, 'prism').canMutate).toBe(false);

    const wandTier3 = createOwned('wand', 3, 'archmage');
    expect(previewSlimeMutation(grantMutationCatalyst(wandTier3.state, 'prism'), wandTier3.slimeId, 'prism').canMutate).toBe(true);
  });

  it('authors Dragon only for selected physical Tier-3 forms', () => {
    const blademaster = createOwned('sword', 3, 'blademaster');
    expect(previewSlimeMutation(grantMutationCatalyst(blademaster.state, 'dragon'), blademaster.slimeId, 'dragon').canMutate).toBe(true);

    const archmage = createOwned('wand', 3, 'archmage');
    const rejected = mutateSlime(grantMutationCatalyst(archmage.state, 'dragon'), archmage.slimeId, 'dragon');
    expect(rejected.accepted).toBe(false);
    if (rejected.accepted) return;
    expect(rejected.reason).toBe('not-eligible');
  });

  it('prevents stacking multiple mutation identities on one persistent body', () => {
    const setup = createOwned('wand', 3, 'archmage');
    const golden = mutateSlime(grantMutationCatalyst(setup.state, 'golden'), setup.slimeId, 'golden');
    if (!golden.accepted) throw new Error('golden setup failed');
    const prismReady = grantMutationCatalyst(golden.state, 'prism');
    const rejected = mutateSlime(prismReady, setup.slimeId, 'prism');
    expect(rejected.accepted).toBe(false);
    if (rejected.accepted) return;
    expect(rejected.reason).toBe('already-mutated');
  });

  it('gives King a party aura and Dragon/Prism distinct combat modifiers', () => {
    const kingSetup = createOwned('sword', 3, 'blademaster');
    const assignedKing = assignSlimeToFormation(kingSetup.state, kingSetup.slimeId, 0);
    if (!assignedKing.accepted) throw new Error('king formation setup failed');
    const baselinePower = partyCombatPower(assignedKing.state).toNumber();
    const baselineDps = partyCombatDps(assignedKing.state).toNumber();
    const kingState = mutateOwned({ state: assignedKing.state, slimeId: kingSetup.slimeId }, 'king');
    expect(partyCombatPower(kingState).toNumber()).toBeCloseTo(baselinePower * 1.08, 6);
    expect(partyCombatDps(kingState).toNumber()).toBeCloseTo(baselineDps * 1.08, 6);

    const dragonSetup = createOwned('sword', 3, 'blademaster');
    const dragonBase = slimeCombatPower(dragonSetup.state, dragonSetup.slimeId).toNumber();
    const dragonState = mutateOwned(dragonSetup, 'dragon');
    expect(slimeCombatPower(dragonState, dragonSetup.slimeId).toNumber()).toBeCloseTo(dragonBase * 1.18, 6);

    const prismSetup = createOwned('wand', 3, 'archmage');
    const assignedPrism = assignSlimeToFormation(prismSetup.state, prismSetup.slimeId, 3);
    if (!assignedPrism.accepted) throw new Error('prism formation setup failed');
    const prismBaseDps = partyCombatDps(assignedPrism.state).toNumber();
    const prismState = mutateOwned({ state: assignedPrism.state, slimeId: prismSetup.slimeId }, 'prism');
    expect(partyCombatDps(prismState).toNumber()).toBeCloseTo(prismBaseDps * 1.16, 6);
  });

  it('places deterministic first-world backstops before world clear', () => {
    let state = createInitialSlimeMercenariesState(0, 9);
    const applyClear = (areaId: keyof typeof areaDefinitions, stageNumber: number) => {
      state = applySlimeProductRewards(state, areaDefinitions[areaId].stages[stageNumber - 1]!.clearRewards);
    };

    applyClear('area.sunken-marsh', 5);
    applyClear('area.frost-ruins', 2);
    expect(state.gameData.mutationProgress.golden).toEqual({ fragments: 0, catalysts: 1 });

    applyClear('area.moonlit-castle', 2);
    applyClear('area.moonlit-castle', 3);
    applyClear('area.moonlit-castle', 5);
    expect(state.gameData.mutationProgress.king).toEqual({ fragments: 0, catalysts: 1 });
    expect(state.gameData.mutationProgress.prism).toEqual({ fragments: 5, catalysts: 0 });

    applyClear('area.dragon-crater', 2);
    applyClear('area.dragon-crater', 4);
    expect(state.gameData.mutationProgress.prism).toEqual({ fragments: 0, catalysts: 1 });
    expect(state.gameData.mutationProgress.dragon).toEqual({ fragments: 0, catalysts: 1 });
  });
});
