import { describe, expect, it } from 'vitest';
import {
  areaDefinitions,
  fusionStepDefinitions,
  initialEconomyBalance,
  jobCreationDefinitions,
  NORMAL_JOB_SLIME_IDS,
} from './definitions';

/**
 * Production guardrail: every released Fusion recipe input must have at least one authored source.
 * This prevents visually polished but impossible progression paths.
 */
describe('released fusion content', () => {
  it('has an acquisition source for every recipe token', () => {
    const obtainable = new Set<string>();

    Object.values(jobCreationDefinitions).forEach((definition) => {
      obtainable.add(definition.fusionCoreTokenId);
    });

    Object.values(areaDefinitions).flatMap((area) => area.stages).forEach((stage) => {
      stage.clearRewards.forEach((reward) => {
        if (reward.type === 'token') obtainable.add(reward.tokenId);
      });
      stage.waves.forEach((wave) => {
        wave.randomDrops.forEach((drop) => obtainable.add(drop.tokenId));
      });
      stage.boss?.rewards.forEach((reward) => {
        if (reward.type === 'token') obtainable.add(reward.tokenId);
      });
    });

    const required = Object.values(fusionStepDefinitions)
      .flatMap((steps) => steps)
      .flatMap((step) => step.recipe.map((requirement) => requirement.tokenId));

    expect([...new Set(required)].filter((tokenId) => !obtainable.has(tokenId))).toEqual([]);
  });

  it('deterministically supplies enough Job Gear to reach every released rank-4 branch', () => {
    const gearTotals = new Map<string, number>();
    for (const [tokenId, count] of Object.entries(initialEconomyBalance.tokens)) {
      gearTotals.set(tokenId, count);
    }
    for (const stage of Object.values(areaDefinitions).flatMap((area) => area.stages)) {
      for (const reward of stage.clearRewards) {
        if (reward.type !== 'token') continue;
        gearTotals.set(reward.tokenId, (gearTotals.get(reward.tokenId) ?? 0) + reward.count);
      }
    }

    // One active body plus six spare bodies covers the current 1 + 2 + 3 core recipes.
    for (const jobId of NORMAL_JOB_SLIME_IDS) {
      const gearTokenId = jobCreationDefinitions[jobId].jobGearTokenId;
      expect(gearTotals.get(gearTokenId) ?? 0, `${jobId} deterministic Job Gear`).toBeGreaterThanOrEqual(7);
    }
  });

  it('places later-family first Job Gear no later than the area that unlocks that family', () => {
    const cloverFinal = areaDefinitions['area.clover-road'].stages[4]!;
    const mushroomFinal = areaDefinitions['area.mushroom-forest'].stages[4]!;
    const cloverTokens = new Set(cloverFinal.clearRewards.flatMap((reward) => reward.type === 'token' ? [reward.tokenId] : []));
    const mushroomTokens = new Set(mushroomFinal.clearRewards.flatMap((reward) => reward.type === 'token' ? [reward.tokenId] : []));

    expect(cloverTokens).toContain(jobCreationDefinitions.wand.jobGearTokenId);
    expect(cloverTokens).toContain(jobCreationDefinitions.dagger.jobGearTokenId);
    expect(mushroomTokens).toContain(jobCreationDefinitions.shield.jobGearTokenId);
    expect(mushroomTokens).toContain(jobCreationDefinitions.gun.jobGearTokenId);
  });

  it('gives every normal job family at least one authored Fusion sink', () => {
    for (const slimeId of NORMAL_JOB_SLIME_IDS) {
      expect(fusionStepDefinitions[slimeId].length, `${slimeId} Fusion steps`).toBeGreaterThan(0);
    }
  });

});
