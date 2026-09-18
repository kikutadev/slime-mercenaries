export type BalancePercentile = 'p50' | 'p90';
export type BalanceTargetDefinition = Readonly<{
    id: string;
    kind: 'milestone-time';
    profileId: string;
    milestoneId: string;
    percentile: BalancePercentile;
    minSec?: number;
    maxSec?: number;
}> | Readonly<{
    id: string;
    kind: 'max-no-action-window';
    profileId: string;
    percentile: BalancePercentile;
    maxSec: number;
}> | Readonly<{
    id: string;
    kind: 'wall-wait';
    profileId: string;
    phaseId: string;
    maxSec: number;
}> | Readonly<{
    id: string;
    kind: 'wall-stuck-probability';
    profileId: string;
    phaseId: string;
    maxProbability: number;
}> | Readonly<{
    /** Product-owned repeated action/event count, e.g. retries, farm clears, repeated upgrades. */
    id: string;
    kind: 'repetition-count';
    profileId: string;
    metricId: string;
    percentile: BalancePercentile;
    minCount?: number;
    maxCount?: number;
}> | Readonly<{
    id: string;
    kind: 'ad-dependency-ratio';
    baselineProfileId: string;
    acceleratedProfileId: string;
    milestoneId: string;
    percentile: BalancePercentile;
    minRatio?: number;
    maxRatio?: number;
}>;
export interface BalanceTargetSource {
    milestoneTimeSec(profileId: string, milestoneId: string, percentile: BalancePercentile): number | null;
    maxNoActionWindowSec(profileId: string, percentile: BalancePercentile): number | null;
    wallP90WaitSec(profileId: string, phaseId: string): number | null;
    wallStuckProbability(profileId: string, phaseId: string): number | null;
    /** Optional so existing products do not need to implement repetition metrics until they use them. */
    repetitionCount?(profileId: string, metricId: string, percentile: BalancePercentile): number | null;
}
export type BalanceTargetEvaluation = Readonly<{
    target: BalanceTargetDefinition;
    status: 'pass' | 'fail' | 'missing';
    observed: number | null;
    expectedMin: number | null;
    expectedMax: number | null;
}>;
/**
 * Game固有Simulator集計をtyped targetへ照合する。
 * target definitionはbalance data、measurement extractionはgame report adapterの責務とする。
 */
export declare function evaluateBalanceTargets(targets: readonly BalanceTargetDefinition[], source: BalanceTargetSource): readonly BalanceTargetEvaluation[];
export declare function failedBalanceTargets(evaluations: readonly BalanceTargetEvaluation[]): readonly BalanceTargetEvaluation[];
