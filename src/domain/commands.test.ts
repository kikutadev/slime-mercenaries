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
import { createInitialSlimeMercenariesState, type SlimeMercenariesState } from './state';

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
      tokens: {
        ...initial.tokens,
        [firstRequirement.tokenId]: 0,
      },
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
      type: 'currency',
      currencyId: ids.currency.gold,
      amount: 1_000_000,
      source: 'test',
    }], { resolveCurrencyDefinition }) as SlimeMercenariesState;

    const cost = plainSlimePurchaseCost(funded);
    const expectedSpend = applyCurrencyTransaction(funded.currencies, {
      currencyId: ids.currency.gold,
      amount: cost,
      kind: 'spend',
      source: 'test.expected',
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
  it('discovers one canonical Sword Slime from Plain Slime + Job Gear', () => {
    const initial = createInitialSlimeMercenariesState(1_000, 1);
    const crafted = craftPlainSlime(initial);
    expect(crafted.accepted).toBe(true);
    if (!crafted.accepted) return;

    const created = createJobSlime(crafted.state, 'sword');
    expect(created.accepted).toBe(true);
    if (!created.accepted) return;

    const definition = jobCreationDefinitions.sword;
    expect(readToken(created.state.tokens, ids.token.plainSlime)).toBe(0);
    expect(readToken(created.state.tokens, ids.token.trainingSword)).toBe(0);
    expect(readToken(created.state.tokens, ids.token.swordCore)).toBe(0);
    expect(created.state.gameData.roster.slimes.sword).toMatchObject({
      typeId: 'sword',
      level: definition.startingLevel,
      jobTier: definition.startingJobTier,
      fusionRank: 1,
      fusionFormId: 'base',
      assignment: 'reserve',
    });
  });

  it('converts a repeated Sword creation into fusion input without adding another roster body', () => {
    const initial = createInitialSlimeMercenariesState(1_000, 1);
    const crafted = craftPlainSlime(initial);
    if (!crafted.accepted) throw new Error('test setup failed');
    const discovered = createJobSlime(crafted.state, 'sword');
    if (!discovered.accepted) throw new Error('test setup failed');

    const prepared: SlimeMercenariesState = {
      ...discovered.state,
      tokens: grantToken(
        grantToken(discovered.state.tokens, ids.token.plainSlime, jobCreationDefinitions.sword.plainSlimeCount),
        ids.token.trainingSword,
        jobCreationDefinitions.sword.jobGearCount,
      ),
    };
    const duplicate = createJobSlime(prepared, 'sword');
    expect(duplicate.accepted).toBe(true);
    if (!duplicate.accepted) return;

    expect(duplicate.state.gameData).toBe(prepared.gameData);
    expect(Object.keys(duplicate.state.gameData.roster.slimes)).toEqual(['sword']);
    expect(readToken(duplicate.state.tokens, ids.token.swordCore)).toBe(1);
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

describe('type growth', () => {
  it('levels a discovered slime from the authored Kit LevelDefinition cost curve', () => {
    const initial = createInitialSlimeMercenariesState(1_000, 1);
    const crafted = craftPlainSlime(initial);
    if (!crafted.accepted) throw new Error('test setup failed');
    const discovered = createJobSlime(crafted.state, 'sword');
    if (!discovered.accepted) throw new Error('test setup failed');
    const funded = applyRewards(discovered.state, [{
      type: 'currency',
      currencyId: ids.currency.gold,
      amount: 1_000_000,
      source: 'test',
    }], { resolveCurrencyDefinition }) as SlimeMercenariesState;

    const preview = previewSlimeLevelUp(funded, 'sword', 2);
    if (preview === null || !preview.available) throw new Error('Expected an available level preview.');
    const expectedSpend = applyCurrencyTransaction(funded.currencies, {
      currencyId: ids.currency.gold,
      amount: preview.totalCost,
      kind: 'spend',
      source: 'test.expected',
    }, resolveCurrencyDefinition(ids.currency.gold));
    if (!expectedSpend.accepted) throw new Error('Test funding must cover the current level cost.');

    const leveled = levelUpSlime(funded, 'sword', 2);
    expect(leveled.accepted).toBe(true);
    if (!leveled.accepted) return;

    expect(leveled.state.gameData.roster.slimes.sword?.level).toBe(preview.targetLevel);
    expect(readCurrency(leveled.state.currencies, ids.currency.gold).compare(
      readCurrency(expectedSpend.balances, ids.currency.gold),
    )).toBe(0);
  });

  it('unlocks the authored Sword Fusion form without changing the promotion tier', () => {
    const initial = createInitialSlimeMercenariesState(1_000, 1);
    const crafted = craftPlainSlime(initial);
    if (!crafted.accepted) throw new Error('test setup failed');
    const discovered = createJobSlime(crafted.state, 'sword');
    if (!discovered.accepted) throw new Error('test setup failed');

    const firstStep = fusionStepDefinitions.sword[0];
    if (firstStep === undefined) throw new Error('Sword Fusion requires at least one authored step.');
    const sword = discovered.state.gameData.roster.slimes.sword!;
    let tokens = discovered.state.tokens;
    for (const requirement of firstStep.recipe) {
      tokens = grantToken(tokens, requirement.tokenId, requirement.count);
    }
    const prepared: SlimeMercenariesState = {
      ...discovered.state,
      tokens,
      gameData: {
        ...discovered.state.gameData,
        roster: {
          ...discovered.state.gameData.roster,
          slimes: {
            ...discovered.state.gameData.roster.slimes,
            sword: { ...sword, level: firstStep.minLevel },
          },
        },
      },
    };
    const preview = previewSlimeFusion(prepared, 'sword');
    expect(preview.canFuse).toBe(true);

    const fused = fuseSlime(prepared, 'sword');
    expect(fused.accepted).toBe(true);
    if (!fused.accepted) return;

    expect(fused.state.gameData.roster.slimes.sword).toMatchObject({
      level: firstStep.minLevel,
      jobTier: jobCreationDefinitions.sword.startingJobTier,
      fusionRank: firstStep.toRank,
      fusionFormId: firstStep.resultFusionFormId,
    });
    for (const requirement of firstStep.recipe) {
      expect(readToken(fused.state.tokens, requirement.tokenId)).toBe(0);
    }
  });
});

describe('promotion', () => {
  it('promotes job tier without changing Fusion rank/form', () => {
    const initial = createInitialSlimeMercenariesState(1_000, 1);
    const crafted = craftPlainSlime(initial);
    if (!crafted.accepted) throw new Error('setup craft failed');
    const discovered = createJobSlime(crafted.state, 'sword');
    if (!discovered.accepted) throw new Error('setup job failed');
    const sword = discovered.state.gameData.roster.slimes.sword!;
    let prepared: SlimeMercenariesState = {
      ...discovered.state,
      tokens: grantToken(discovered.state.tokens, ids.token.promotionMaterial, promotionDefinitions.sword[0]!.recipe[0]!.count),
      gameData: {
        ...discovered.state.gameData,
        roster: {
          ...discovered.state.gameData.roster,
          slimes: {
            ...discovered.state.gameData.roster.slimes,
            sword: { ...sword, level: promotionDefinitions.sword[0]!.minLevel, fusionRank: 2, fusionFormId: 'greatsword' },
          },
        },
      },
    };
    prepared = applyRewards(prepared, [{
      type: 'currency', currencyId: ids.currency.gold, amount: 1_000, source: 'test',
    }], { resolveCurrencyDefinition }) as SlimeMercenariesState;

    const promoted = promoteSlime(prepared, 'sword');
    expect(promoted.accepted).toBe(true);
    if (!promoted.accepted) return;
    expect(promoted.state.gameData.roster.slimes.sword).toMatchObject({
      jobTier: 2,
      promotionPathId: 'fighter',
      fusionRank: 2,
      fusionFormId: 'greatsword',
    });
  });

  it('rejects Promotion atomically when materials are missing', () => {
    const initial = createInitialSlimeMercenariesState(1_000, 1);
    const crafted = craftPlainSlime(initial);
    if (!crafted.accepted) throw new Error('setup craft failed');
    const discovered = createJobSlime(crafted.state, 'sword');
    if (!discovered.accepted) throw new Error('setup job failed');
    const sword = discovered.state.gameData.roster.slimes.sword!;
    let prepared: SlimeMercenariesState = {
      ...discovered.state,
      gameData: {
        ...discovered.state.gameData,
        roster: {
          ...discovered.state.gameData.roster,
          slimes: { ...discovered.state.gameData.roster.slimes, sword: { ...sword, level: promotionDefinitions.sword[0]!.minLevel } },
        },
      },
    };
    prepared = applyRewards(prepared, [{
      type: 'currency', currencyId: ids.currency.gold, amount: 1_000, source: 'test',
    }], { resolveCurrencyDefinition }) as SlimeMercenariesState;
    const goldBefore = readCurrency(prepared.currencies, ids.currency.gold).toString();

    const rejected = promoteSlime(prepared, 'sword');
    expect(rejected.accepted).toBe(false);
    expect(rejected.state).toBe(prepared);
    expect(readCurrency(rejected.state.currencies, ids.currency.gold).toString()).toBe(goldBefore);
  });
});
