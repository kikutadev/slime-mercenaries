import { describe, expect, it } from 'vitest';
import { grantToken } from 'idle-game-kit';
import { assignSlimeToFormation, partyCombatDps } from './combat';
import { convertDuplicateToFusionCore, craftPlainSlime, createJobSlime, fuseSlime, levelUpSlime } from './commands';
import { fusionStepDefinitions, ids, jobCreationDefinitions, NORMAL_JOB_SLIME_IDS, resolveCurrencyDefinition } from './definitions';
import { slimeIdsByType } from './roster';
import { createInitialSlimeMercenariesState, type SlimeMercenariesState } from './state';
import { applyRewards } from 'idle-game-kit';

function createTwoSwords(): Readonly<{ state: SlimeMercenariesState; ids: readonly string[] }> {
  const initial = createInitialSlimeMercenariesState(0, 77);
  const crafted = craftPlainSlime(initial);
  if (!crafted.accepted) throw new Error('first craft failed');
  const first = createJobSlime(crafted.state, 'sword');
  if (!first.accepted) throw new Error('first sword failed');
  const prepared: SlimeMercenariesState = {
    ...first.state,
    tokens: grantToken(
      grantToken(first.state.tokens, ids.token.plainSlime, jobCreationDefinitions.sword.plainSlimeCount),
      ids.token.trainingSword,
      jobCreationDefinitions.sword.jobGearCount,
    ),
  };
  const second = createJobSlime(prepared, 'sword');
  if (!second.accepted) throw new Error('second sword failed');
  return { state: second.state, ids: slimeIdsByType(second.state, 'sword') };
}

describe('multi-slime roster', () => {
  it('allows two same-type slime instances in separate formation slots', () => {
    const setup = createTwoSwords();
    const [firstId, secondId] = setup.ids;
    if (firstId === undefined || secondId === undefined) throw new Error('duplicate IDs missing');

    const firstAssigned = assignSlimeToFormation(setup.state, firstId, 0);
    if (!firstAssigned.accepted) throw new Error(`first assign failed: ${firstAssigned.reason}`);
    const secondAssigned = assignSlimeToFormation(firstAssigned.state, secondId, 1);
    if (!secondAssigned.accepted) throw new Error(`second assign failed: ${secondAssigned.reason}`);

    expect(secondAssigned.state.gameData.roster.formationSlots.slice(0, 2)).toEqual([firstId, secondId]);
    expect(secondAssigned.state.gameData.roster.slimes[firstId]?.assignment).toBe('battle');
    expect(secondAssigned.state.gameData.roster.slimes[secondId]?.assignment).toBe('battle');
    expect(partyCombatDps(secondAssigned.state).toNumber()).toBeGreaterThan(partyCombatDps(firstAssigned.state).toNumber());
  });

  it('swaps two fielded slimes when one is moved onto the other slot', () => {
    const setup = createTwoSwords();
    const [firstId, secondId] = setup.ids;
    if (firstId === undefined || secondId === undefined) throw new Error('duplicate IDs missing');

    const firstAssigned = assignSlimeToFormation(setup.state, firstId, 0);
    if (!firstAssigned.accepted) throw new Error(`first assign failed: ${firstAssigned.reason}`);
    const secondAssigned = assignSlimeToFormation(firstAssigned.state, secondId, 1);
    if (!secondAssigned.accepted) throw new Error(`second assign failed: ${secondAssigned.reason}`);
    const swapped = assignSlimeToFormation(secondAssigned.state, firstId, 1);
    if (!swapped.accepted) throw new Error(`swap failed: ${swapped.reason}`);

    expect(swapped.state.gameData.roster.formationSlots.slice(0, 2)).toEqual([secondId, firstId]);
    expect(swapped.state.gameData.roster.slimes[firstId]?.assignment).toBe('battle');
    expect(swapped.state.gameData.roster.slimes[secondId]?.assignment).toBe('battle');
  });

  it('sends the displaced member to reserve when a reserve slime enters an occupied slot', () => {
    const setup = createTwoSwords();
    const [firstId, secondId] = setup.ids;
    if (firstId === undefined || secondId === undefined) throw new Error('duplicate IDs missing');

    const firstAssigned = assignSlimeToFormation(setup.state, firstId, 0);
    if (!firstAssigned.accepted) throw new Error(`first assign failed: ${firstAssigned.reason}`);
    const replaced = assignSlimeToFormation(firstAssigned.state, secondId, 0);
    if (!replaced.accepted) throw new Error(`replace failed: ${replaced.reason}`);

    expect(replaced.state.gameData.roster.formationSlots[0]).toBe(secondId);
    expect(replaced.state.gameData.roster.slimes[firstId]?.assignment).toBe('reserve');
    expect(replaced.state.gameData.roster.slimes[secondId]?.assignment).toBe('battle');
  });

  it('keeps progression independent between same-type instances', () => {
    const setup = createTwoSwords();
    const [firstId, secondId] = setup.ids;
    if (firstId === undefined || secondId === undefined) throw new Error('duplicate IDs missing');
    const funded = applyRewards(setup.state, [{ type: 'currency', currencyId: ids.currency.gold, amount: 10_000, source: 'test' }], { resolveCurrencyDefinition }) as SlimeMercenariesState;
    const leveled = levelUpSlime(funded, firstId, 5);
    if (!leveled.accepted) throw new Error(`level failed: ${leveled.reason}`);

    expect(leveled.state.gameData.roster.slimes[firstId]?.level).toBe(6);
    expect(leveled.state.gameData.roster.slimes[secondId]?.level).toBe(1);
  });

  it('lets every normal family convert a spare body into its Core and consume that Core in Fusion', () => {
    for (const typeId of NORMAL_JOB_SLIME_IDS) {
      const definition = jobCreationDefinitions[typeId];
      let state = createInitialSlimeMercenariesState(0, 91);
      state = {
        ...state,
        tokens: grantToken(
          grantToken(state.tokens, ids.token.plainSlime, definition.plainSlimeCount * 2),
          definition.jobGearTokenId,
          definition.jobGearCount * 2,
        ),
      };
      const first = createJobSlime(state, typeId);
      if (!first.accepted) throw new Error(`${typeId} first creation failed`);
      const second = createJobSlime(first.state, typeId);
      if (!second.accepted) throw new Error(`${typeId} second creation failed`);
      const [primaryId, spareId] = slimeIdsByType(second.state, typeId);
      if (primaryId === undefined || spareId === undefined) throw new Error(`${typeId} duplicate IDs missing`);

      const converted = convertDuplicateToFusionCore(second.state, spareId);
      if (!converted.accepted) throw new Error(`${typeId} Core conversion failed: ${converted.reason}`);
      const step = fusionStepDefinitions[typeId][0];
      if (step === undefined) throw new Error(`${typeId} Fusion step missing`);

      let tokens = converted.state.tokens;
      for (const requirement of step.recipe) {
        if (requirement.tokenId === definition.fusionCoreTokenId) continue;
        tokens = grantToken(tokens, requirement.tokenId, requirement.count);
      }
      const primary = converted.state.gameData.roster.slimes[primaryId];
      if (primary === undefined) throw new Error(`${typeId} primary missing`);
      const prepared: SlimeMercenariesState = {
        ...converted.state,
        tokens,
        gameData: {
          ...converted.state.gameData,
          roster: {
            ...converted.state.gameData.roster,
            slimes: {
              ...converted.state.gameData.roster.slimes,
              [primaryId]: { ...primary, level: step.minLevel },
            },
          },
        },
      };

      const fused = fuseSlime(prepared, primaryId);
      expect(fused.accepted, `${typeId} Fusion accepted`).toBe(true);
      if (!fused.accepted) continue;
      expect(fused.state.gameData.roster.slimes[primaryId]?.fusionRank).toBe(step.toRank);
      expect(fused.state.gameData.roster.slimes[spareId]).toBeUndefined();
    }
  });

});
