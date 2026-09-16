import type { RewardSignal, RewardSignalTier } from '../src/application/reward-signals.js';
export type RewardBeatTier = RewardSignalTier;
/**
 * Product-specific simulator adapters classify their own semantic events into reward beats.
 * The kit deliberately does not infer "reward" from currency deltas or event names.
 */
export type RewardBeat = RewardSignal;
/**
 * Interval during which the product visibly exposes a near-term expectation.
 * Examples: progress to the next reveal, a countdown, an afford-soon target, or a pending random outcome.
 */
export type AnticipationWindow = Readonly<{
    id: string;
    /** Product-owned key shared with the RewardBeat(s) this visible expectation can resolve into. */
    anticipationKey: string;
    fromSimTimeSec: number;
    toSimTimeSec: number;
}>;
export type RewardDroughtWindow = Readonly<{
    fromSimTimeSec: number;
    toSimTimeSec: number;
    durationSec: number;
}>;
export type RewardCadenceSummary = Readonly<{
    sessionDurationSec: number;
    rewardCount: number;
    meaningfulRewardCount: number;
    majorRewardCount: number;
    surpriseRewardCount: number;
    meaningfulSurpriseRewardCount: number;
    majorSurpriseRewardCount: number;
    anticipatedRewardCount: number;
    anticipatedMeaningfulRewardCount: number;
    anticipatedMajorRewardCount: number;
    deadEndRewardCount: number;
    rewardRatePerMinute: number;
    meaningfulRewardRatePerMinute: number;
    averageRewardIntervalSec: number;
    p90RewardIntervalSec: number;
    averageMeaningfulRewardIntervalSec: number;
    p90MeaningfulRewardIntervalSec: number;
    firstRewardDelaySec: number;
    firstMeaningfulRewardDelaySec: number;
    maxRewardDroughtSec: number;
    maxMeaningfulRewardDroughtSec: number;
    anticipationCoverage: number;
    anticipatedRewardRate: number;
    anticipatedMeaningfulRewardRate: number;
    anticipatedMajorRewardRate: number;
    surpriseRate: number;
    meaningfulSurpriseRate: number;
    majorSurpriseRate: number;
    nextExpectationRate: number;
    deadEndRewardRate: number;
    droughtWindows: readonly RewardDroughtWindow[];
}>;
/**
 * Measures observable reward-loop cadence rather than pretending to measure dopamine directly.
 * Drought includes the session edges; reward interval only measures adjacent distinct reward timestamps.
 */
export declare function summarizeRewardCadence(args: Readonly<{
    sessionStartSimTimeSec: number;
    sessionEndSimTimeSec: number;
    rewardBeats: readonly RewardBeat[];
    anticipationWindows?: readonly AnticipationWindow[];
}>): RewardCadenceSummary;
export declare function calculateRewardDroughtWindows(sessionStartSimTimeSec: number, sessionEndSimTimeSec: number, rewardTimes: readonly number[]): readonly RewardDroughtWindow[];
