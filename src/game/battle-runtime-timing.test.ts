import { describe, expect, it } from 'vitest';
import { BOSS_APPROACH_SECONDS, NORMAL_APPROACH_SECONDS } from './battle-approach';
import { MIN_VISIBLE_COMBAT_SECONDS, authoritativeResultTriggerDelay } from './battle-runtime-timing';

describe('battle runtime result timing', () => {
  it('does not force a one-second analytical victory before normal combat becomes visible', () => {
    expect(authoritativeResultTriggerDelay('victory', 1, false))
      .toBe(NORMAL_APPROACH_SECONDS + MIN_VISIBLE_COMBAT_SECONDS);
  });

  it('keeps the boss entrance plus a visible combat beat even for a short analytical boundary', () => {
    expect(authoritativeResultTriggerDelay('victory', 1, true))
      .toBe(BOSS_APPROACH_SECONDS + MIN_VISIBLE_COMBAT_SECONDS);
  });

  it('preserves a longer authoritative timing when it already exceeds the presentation floor', () => {
    expect(authoritativeResultTriggerDelay('victory', 10, false)).toBe(9);
    expect(authoritativeResultTriggerDelay('defeat', 10, false)).toBe(7.8);
  });
});
