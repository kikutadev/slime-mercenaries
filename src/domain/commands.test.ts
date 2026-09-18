import { describe, expect, it } from 'vitest';
import {
  applyCurrencyTransaction,
  applyRewards,
  grantToken,
  readCurrency,
  readToken,
} from 'idle-game-kit';
import {
  buyPlainSlime,
  convertDuplicateToFusionCore,
  craftPlainSlime,
  createJobSlime,
  fuseSlime,
  levelUpSlime,
  plainSlimePurchaseCost,
  previewPlainSlimeCraft,
  previewSlimeFusion,
  previewSlimeLevelUp,
  promoteSlime,
} from './commands';
import {
  fusionStepDefinitions,
  ids,
  jobCreationDefinitions,
  promotionDefinitions,
  resolveCurrencyDefinition,
} from './definitions';
import { firstSlimeIdByType, slimeIdsByType } from './roster';
import { createInitialSlimeMercenariesState, type SlimeMercenariesState } from './state';

function createSword(state = createInitialSlimeMercenariesState(1_000, 1)) {
  const crafted = craftPlainSlime(state);
  if (!crafted.accepted) throw new Error('test setup craft failed');
  const created = createJobSlime(crafted.state, 'sword');
  if (!created.accepted) throw new Error('test setup job failed');
  const swordId = firstSlimeIdByType(created.state, 'sword');
  if (swordId === null) throw new Error('test setup sword missing');
  return { state: created.state, swordId };
}

function grantSwordCreationInputs(state: SlimeMercenariesState): SlimeMercenariesState {
  return {
    ...state,
    tokens: grantToken(
      grantToken(state.tokens, ids.token.plainSlime, jobCreationDefinitions.sword.plainSlimeCount),
      ids.token.trainingSword,
      jobCreationDefinitions.sword.jobGearCount,
    ),
  };
}

describe('Plain Slime economy', () => {
  it('crafts Plain Slime from the currently authored recipe', () => {
    const initial = createInitialSlimeMercenariesState(1_000, 1);
    const preview = previewPlainSlimeCraft(initial);
    expect(preview.canCraft).toBe(true);

    const result = craftPlainSlime(initial);
    expect(result.accepted).toBe(true);
    if (!result.accepted) return;

    expect(readToken(result.state.tokens, ids.token.plainSlime)).toBe(preview.outputCount);
    for (const requirement of preview.requirements) {
      expect(readToken(result.state.tokens, requirement.tokenId)).toBe(requirement.owned - requirement.required);
    }
  });

  it('rejects an unaffordable craft without partially consuming other materials', () => {
    const initial = createInitialSlimeMercenariesState(1_000, 1);
    const recipe = previewPlainSlimeCraft(initial);
    const firstRequirement = recipe.requirements[0];
    const secondRequirement = recipe.requirements[1];
    if (firstRequirement === undefined || secondRequirement === undefined) throw new Error('Craft recipe fixture requires two inputs.');

    const insufficient: SlimeMercenariesState = {
      ...initial,
      tokens: { ...initial.tokens, [firstRequirement.tokenId]: 0 },
    };
    const untouchedSecondInput = readToken(insufficient.tokens, secondRequirement.tokenId);
    const rejected = craftPlainSlime(insufficient);

    expect(rejected.accepted).toBe(false);
    expect(rejected.state).toBe(insufficient);
    expect(readToken(rejected.state.tokens, secondRequirement.tokenId)).toBe(untouchedSecondInput);
  });

  it('prices shop purchases from one balance curve and advances the curve index', () => {
    const initial = createInitialSlimeMercenariesState(1_000, 1);
    const funded = applyRewards(initial, [{
      type: 'currency', currencyId: ids.currency.gold, amount: 1_000_000, source: 'test',
    }], { resolveCurrencyDefinition }) as SlimeMercenariesState;

    const cost = plainSlimePurchaseCost(funded);
    const expectedSpend = applyCurrencyTransaction(funded.currencies, {
      currencyId: ids.currency.gold, amount: cost, kind: 'spend', source: 'test.expected',
    }, resolveCurrencyDefinition(ids.currency.gold));
    if (!expectedSpend.accepted) throw new Error('Test funding must cover the current Plain Slime price.');

    const purchased = buyPlainSlime(funded);
    expect(purchased.accepted).toBe(true);
    if (!purchased.accepted) return;

    expect(readToken(purchased.state.tokens, ids.token.plainSlime)).toBeGreaterThan(0);
    expect(readCurrency(purchased.state.currencies, ids.currency.gold).compare(
      readCurrency(expectedSpend.balances, ids.currency.gold),
    )).toBe(0);
    expect(purchased.state.gameData.economy.plainSlimeShopPurchaseCount).toBe(1);
  });
});

describe('normal job creation', () => {
  it('discovers one persistent Sword Slime from Plain Slime + Job Gear', () => {
    const { state, swordId } = createSword();
    const definition = jobCreationDefinitions.sword;

    expect(readToken(state.tokens, ids.token.plainSlime)).toBe(0);
    expect(readToken(state.tokens, ids.token.trainingSword)).toBe(0);
    expect(readToken(state.tokens, ids.token.swordCore)).toBe(0);
    expect(state.gameData.roster.slimes[swordId]).toMatchObject({
      id: swordId,
      serial: 1,
      typeId: 'sword',
      level: definition.startingLevel,
      jobTier: definition.startingJobTier,
      fusionRank: 1,
      fusionFormId: 'base',
      assignment: 'reserve',
    });
  });

  it('keeps repeated Sword creation as a second persistent body instead of auto-merging it', () => {
    const first = createSword();
    const prepared = grantSwordCreationInputs(first.state);
    const duplicate = createJobSlime(prepared, 'sword');
    expect(duplicate.accepted).toBe(true);
    if (!duplicate.accepted) return;

    const idsForType = slimeIdsByType(duplicate.state, 'sword');
    expect(idsForType).toEqual(['slime.1', 'slime.2']);
    expect(duplicate.state.gameData.roster.slimes['slime.2']).toMatchObject({ typeId: 'sword', assignment: 'reserve' });
    expect(readToken(duplicate.state.tokens, ids.token.swordCore)).toBe(0);
  });

  it('converts only an explicit spare reserve body into Fusion Core and preserves the main body', () => {
    const first = createSword();
    const duplicate = createJobSlime(grantSwordCreationInputs(first.state), 'sword');
    if (!duplicate.accepted) throw new Error('duplicate setup failed');

    const converted = convertDuplicateToFusionCore(duplicate.state, 'slime.2');
    expect(converted.accepted).toBe(true);
    if (!converted.accepted) return;

    expect(slimeIdsByType(converted.state, 'sword')).toEqual(['slime.1']);
    expect(converted.state.gameData.roster.slimes['slime.1']).toBeDefined();
    expect(converted.state.gameData.equipment.loadouts['slime.2']).toBeUndefined();
    expect(readToken(converted.state.tokens, ids.token.swordCore)).toBe(1);

    const rejected = convertDuplicateToFusionCore(converted.state, 'slime.1');
    expect(rejected.accepted).toBe(false);
    if (!rejected.accepted) expect(rejected.reason).toBe('last-of-type');
  });

  it('rejects job creation atomically when the Plain Slime is missing', () => {
    const initial = createInitialSlimeMercenariesState(1_000, 1);
    const jobGearBefore = readToken(initial.tokens, ids.token.trainingSword);
    const rejected = createJobSlime(initial, 'sword');
    expect(rejected.accepted).toBe(false);
    expect(rejected.state).toBe(initial);
    expect(readToken(rejected.state.tokens, ids.token.trainingSword)).toBe(jobGearBefore);
  });
});

describe('individual growth', () => {
  it('levels one slime instance from the authored Kit LevelDefinition cost curve', () => {
    const { state, swordId } = createSword();
    const funded = applyRewards(state, [{
      type: 'currency', currencyId: ids.currency.gold, amount: 1_000_000, source: 'test',
    }], { resolveCurrencyDefinition }) as SlimeMercenariesState;

    const preview = previewSlimeLevelUp(funded, swordId, 2);
    if (preview === null || !preview.available) throw new Error('Expected an available level preview.');
    const expectedSpend = applyCurrencyTransaction(funded.currencies, {
      currencyId: ids.currency.gold, amount: preview.totalCost, kind: 'spend', source: 'test.expected',
    }, resolveCurrencyDefinition(ids.currency.gold));
    if (!expectedSpend.accepted) throw new Error('Test funding must cover the current level cost.');

    const leveled = levelUpSlime(funded, swordId, 2);
    expect(leveled.accepted).toBe(true);
    if (!leveled.accepted) return;

    expect(leveled.state.gameData.roster.slimes[swordId]?.level).toBe(preview.targetLevel);
    expect(readCurrency(leveled.state.currencies, ids.currency.gold).compare(
      readCurrency(expectedSpend.balances, ids.currency.gold),
    )).toBe(0);
  });

  it('allows same-type bodies to diverge in progression', () => {
    const first = createSword();
    const duplicate = createJobSlime(grantSwordCreationInputs(first.state), 'sword');
    if (!duplicate.accepted) throw new Error('duplicate setup failed');
    const funded = applyRewards(duplicate.state, [{ type: 'currency', currencyId: ids.currency.gold, amount: 1_000_000, source: 'test' }], { resolveCurrencyDefinition }) as SlimeMercenariesState;

    const leveled = levelUpSlime(funded, 'slime.1', 3);
    expect(leveled.accepted).toBe(true);
    if (!leveled.accepted) return;
    expect(leveled.state.gameData.roster.slimes['slime.1']?.level).toBe(4);
    expect(leveled.state.gameData.roster.slimes['slime.2']?.level).toBe(1);
  });

  it('unlocks the authored Sword Fusion form without changing the promotion tier', () => {
    const { state, swordId } = createSword();
    const firstStep = fusionStepDefinitions.sword[0];
    if (firstStep === undefined) throw new Error('Sword Fusion requires at least one authored step.');
    const sword = state.gameData.roster.slimes[swordId]!;
    let tokens = state.tokens;
    for (const requirement of firstStep.recipe) tokens = grantToken(tokens, requirement.tokenId, requirement.count);
    const prepared: SlimeMercenariesState = {
      ...state,
      tokens,
      gameData: {
        ...state.gameData,
        roster: {
          ...state.gameData.roster,
          slimes: { ...state.gameData.roster.slimes, [swordId]: { ...sword, level: firstStep.minLevel } },
        },
      },
    };
    const preview = previewSlimeFusion(prepared, swordId);
    expect(preview.canFuse).toBe(true);

    const fused = fuseSlime(prepared, swordId);
    expect(fused.accepted).toBe(true);
    if (!fused.accepted) return;

    expect(fused.state.gameData.roster.slimes[swordId]).toMatchObject({
      level: firstStep.minLevel,
      jobTier: jobCreationDefinitions.sword.startingJobTier,
      fusionRank: firstStep.toRank,
      fusionFormId: firstStep.resultFusionFormId,
    });
  });
});

describe('promotion', () => {
  it('promotes one instance without changing its Fusion rank/form', () => {
    const { state, swordId } = createSword();
    const sword = state.gameData.roster.slimes[swordId]!;
    let prepared: SlimeMercenariesState = {
      ...state,
      tokens: grantToken(state.tokens, ids.token.promotionMaterial, promotionDefinitions.sword[0]!.recipe[0]!.count),
      gameData: {
        ...state.gameData,
        roster: {
          ...state.gameData.roster,
          slimes: {
            ...state.gameData.roster.slimes,
            [swordId]: { ...sword, level: promotionDefinitions.sword[0]!.minLevel, fusionRank: 2, fusionFormId: 'greatsword' },
          },
        },
      },
    };
    prepared = applyRewards(prepared, [{ type: 'currency', currencyId: ids.currency.gold, amount: 1_000, source: 'test' }], { resolveCurrencyDefinition }) as SlimeMercenariesState;

    const promoted = promoteSlime(prepared, swordId);
    expect(promoted.accepted).toBe(true);
    if (!promoted.accepted) return;
    expect(promoted.state.gameData.roster.slimes[swordId]).toMatchObject({
      jobTier: 2,
      promotionPathId: 'fighter',
      fusionRank: 2,
      fusionFormId: 'greatsword',
    });
  });

  it('rejects Promotion atomically when materials are missing', () => {
    const { state, swordId } = createSword();
    const sword = state.gameData.roster.slimes[swordId]!;
    let prepared: SlimeMercenariesState = {
      ...state,
      gameData: {
        ...state.gameData,
        roster: {
          ...state.gameData.roster,
          slimes: { ...state.gameData.roster.slimes, [swordId]: { ...sword, level: promotionDefinitions.sword[0]!.minLevel } },
        },
      },
    };
    prepared = applyRewards(prepared, [{ type: 'currency', currencyId: ids.currency.gold, amount: 1_000, source: 'test' }], { resolveCurrencyDefinition }) as SlimeMercenariesState;
    const goldBefore = readCurrency(prepared.currencies, ids.currency.gold).toString();

    const rejected = promoteSlime(prepared, swordId);
    expect(rejected.accepted).toBe(false);
    expect(rejected.state).toBe(prepared);
    expect(readCurrency(rejected.state.currencies, ids.currency.gold).toString()).toBe(goldBefore);
  });
});
