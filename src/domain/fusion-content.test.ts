import { describe, expect, it } from 'vitest';
import {
  cloverRoadStageDefinitions,
  fusionStepDefinitions,
  jobCreationDefinitions,
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

    cloverRoadStageDefinitions.forEach((stage) => {
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
});
