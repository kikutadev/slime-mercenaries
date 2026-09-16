export type RngStreamState = Readonly<{
    algorithmId: 'mulberry32-v1';
    state: number;
}>;
export type RngStreamStates = Readonly<Record<string, RngStreamState>>;
/**
 * 小さく高速なdeterministic PRNG。stateをsaveへ保存し、streamごとに独立して進める。
 */
export declare function nextRandom(stream: RngStreamState): {
    value: number;
    stream: RngStreamState;
};
export type WeightedCandidate = Readonly<{
    weight: number;
}>;
/** Deterministically map a [0,1) sample onto a positive finite weighted table. */
export declare function selectWeightedCandidate<T extends WeightedCandidate>(candidates: readonly T[], randomValue: number): T;
export declare function createRngStreams(seed: number, streamNames: readonly string[]): RngStreamStates;
