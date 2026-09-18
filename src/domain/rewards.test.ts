import { describe, expect, it } from 'vitest';
import { readCurrency, readToken } from 'idle-game-kit';

import { ids } from './definitions';
import { applySlimeProductRewards } from './rewards';
import { createInitialSlimeMercenariesState } from './state';

describe('Slime Mercenaries product rewards', () => {
  it('delegates generic Kit rewards without changing their semantics', () => {
    const initial = createInitialSlimeMercenariesState(0, 71);
    const rewarded = applySlimeProductRewards(initial, [
      { type: 'currency', currencyId: ids.currency.gold, amount: 125, source: 'test' },
      { type: 'token', tokenId: ids.token.forgeKey, count: 2 },
    ]);

    expect(readCurrency(rewarded.currencies, ids.currency.gold).toNumber()).toBe(125);
    expect(readToken(rewarded.tokens, ids.token.forgeKey)).toBe(2);
  });

  it('applies mutation progress through the product-owned reward extension', () => {
    const initial = createInitialSlimeMercenariesState(0, 72);
    const rewarded = applySlimeProductRewards(initial, [
      { type: 'mutation-fragment', mutationId: 'king', count: 4 },
      { type: 'mutation-catalyst', mutationId: 'prism', count: 1 },
      { type: 'mutation-fragment', mutationId: 'king', count: 3 },
    ]);

    expect(rewarded.gameData.mutationProgress.king.fragments).toBe(7);
    expect(rewarded.gameData.mutationProgress.prism.catalysts).toBe(1);
  });

  it('preserves reward ordering while mixing Kit and product-specific rewards', () => {
    const initial = createInitialSlimeMercenariesState(0, 73);
    const rewarded = applySlimeProductRewards(initial, [
      { type: 'mutation-fragment', mutationId: 'golden', count: 2 },
      { type: 'currency', currencyId: ids.currency.gold, amount: 40, source: 'test' },
      { type: 'mutation-catalyst', mutationId: 'golden', count: 1 },
    ]);

    expect(rewarded.gameData.mutationProgress.golden).toEqual({ fragments: 2, catalysts: 1 });
    expect(readCurrency(rewarded.currencies, ids.currency.gold).toNumber()).toBe(40);
  });
});
