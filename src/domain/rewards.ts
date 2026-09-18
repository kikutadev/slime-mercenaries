import { applyRewards, type Reward } from 'idle-game-kit';

import { resolveCurrencyDefinition } from './definitions';
import { grantMutationCatalyst, grantMutationFragments } from './mutation';
import type { SlimeMercenariesState, SlimeMutationId } from './state';

export type MutationFragmentReward = Readonly<{
  type: 'mutation-fragment';
  mutationId: SlimeMutationId;
  count: number;
}>;

export type MutationCatalystReward = Readonly<{
  type: 'mutation-catalyst';
  mutationId: SlimeMutationId;
  count: number;
}>;

/**
 * Product reward contract.
 *
 * Generic currency/token/item rewards stay owned by Kit Core. Mutation progress is
 * product-specific, so it is adapted here instead of adding Slime Mercenaries concepts
 * to the shared reward engine.
 */
export type SlimeProductReward = Reward | MutationFragmentReward | MutationCatalystReward;

export function applySlimeProductRewards(
  state: SlimeMercenariesState,
  rewards: readonly SlimeProductReward[],
): SlimeMercenariesState {
  let nextState = state;

  for (const reward of rewards) {
    switch (reward.type) {
      case 'mutation-fragment':
        nextState = grantMutationFragments(nextState, reward.mutationId, reward.count);
        break;
      case 'mutation-catalyst':
        nextState = grantMutationCatalyst(nextState, reward.mutationId, reward.count);
        break;
      default:
        nextState = applyRewards(
          nextState,
          [reward],
          { resolveCurrencyDefinition },
        ) as SlimeMercenariesState;
        break;
    }
  }

  return nextState;
}
