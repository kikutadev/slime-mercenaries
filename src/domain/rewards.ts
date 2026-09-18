import { GameNumber, applyRewards, type Reward } from 'idle-game-kit';

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


export type SlimeRewardEventItem = Readonly<{
  kind: 'currency' | 'token' | 'mutation-fragment' | 'mutation-catalyst';
  id: string;
  amount: number;
}>;

/** Project product rewards into a presentation-safe, exact granted-reward payload. */
export function describeSlimeProductRewards(
  rewards: readonly SlimeProductReward[],
): readonly SlimeRewardEventItem[] {
  const items: SlimeRewardEventItem[] = [];

  const visit = (reward: SlimeProductReward): void => {
    switch (reward.type) {
      case 'currency': {
        const amount = GameNumber.from(reward.amount).toNumber();
        if (Number.isFinite(amount) && amount > 0) items.push({ kind: 'currency', id: reward.currencyId, amount });
        return;
      }
      case 'token':
        if (reward.count > 0) items.push({ kind: 'token', id: reward.tokenId, amount: reward.count });
        return;
      case 'mutation-fragment':
        if (reward.count > 0) items.push({ kind: 'mutation-fragment', id: reward.mutationId, amount: reward.count });
        return;
      case 'mutation-catalyst':
        if (reward.count > 0) items.push({ kind: 'mutation-catalyst', id: reward.mutationId, amount: reward.count });
        return;
      case 'composite':
        reward.rewards.forEach((nested) => visit(nested));
        return;
      default:
        return;
    }
  };

  rewards.forEach(visit);
  return items;
}

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
