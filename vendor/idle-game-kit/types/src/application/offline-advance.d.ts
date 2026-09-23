export type OfflineAdvanceChunk<TState, TEvent> = Readonly<{
    state: TState;
    events: readonly TEvent[];
}>;
export type OfflineAdvanceChunkContext = Readonly<{
    chunkIndex: number;
    fromSimTimeSec: number;
    toSimTimeSec: number;
}>;
export type OfflineAdvanceInChunksResult<TState, TAccumulator> = Readonly<{
    state: TState;
    accumulator: TAccumulator;
    chunkCount: number;
}>;
/**
 * Advances one product-owned same-core timeline through bounded chunks.
 *
 * The kit owns only execution safety:
 * - chunk targets are deterministic;
 * - every product advance must land exactly on the requested target;
 * - raw chunk events can be reduced immediately instead of being retained for the whole absence.
 *
 * Products still own event meaning, aggregation policy, reward semantics, and persistence.
 */
export declare function advanceOfflineInChunks<TState, TEvent, TAccumulator>(args: Readonly<{
    initialState: TState;
    targetSimTimeSec: number;
    maxChunkSec: number;
    getSimTimeSec: (state: TState) => number;
    advanceChunk: (state: TState, targetSimTimeSec: number) => OfflineAdvanceChunk<TState, TEvent>;
    initialAccumulator: TAccumulator;
    accumulate: (accumulator: TAccumulator, events: readonly TEvent[], context: OfflineAdvanceChunkContext) => TAccumulator;
}>): OfflineAdvanceInChunksResult<TState, TAccumulator>;
