import type { D1DatabaseLike } from './d1-public-player-directory.js';
export type D1CloudSaveWriteRateLimiterOptions = Readonly<{
    perProfileLimit?: number;
    perAccountLimit?: number;
    windowMs?: number;
    now?: () => number;
}>;
/**
 * Lightweight D1-backed Cloud Save write limiter.
 *
 * It derives counts from already-persisted revision rows, so no extra mutable
 * counter table is needed. This is an abuse guard, not a globally strict quota;
 * revision CAS remains the correctness boundary under concurrent writes.
 */
export declare class D1CloudSaveWriteRateLimiter {
    #private;
    constructor(db: D1DatabaseLike, options?: D1CloudSaveWriteRateLimiterOptions);
    allowWrite(accountId: string, gameId: string, playerId: string): Promise<boolean>;
}
