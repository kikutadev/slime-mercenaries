export type RewardSignalTier = 'micro' | 'meaningful' | 'major';
/**
 * Product-owned semantic classification of a reward/reveal that can be reused by runtime UI,
 * offline return summaries and simulator cadence analysis.
 *
 * The kit never infers these fields from an event type or a currency delta.
 */
export type RewardSignal = Readonly<{
    id: string;
    simTimeSec: number;
    tier: RewardSignalTier;
    surprise: boolean;
    /** Stable product-owned key linking this result to the visible expectation that preceded it. */
    anticipationKey?: string;
    /** True when resolving this signal exposes a concrete next thing to wait for, earn or attempt. */
    nextExpectationCreated: boolean;
}>;
export type RewardSignalClassification = RewardSignal | readonly RewardSignal[] | null | undefined;
/**
 * Applies one product-owned classifier to semantic events and returns a deterministic, validated
 * reward-signal stream. This is intentionally presentation-free.
 */
export declare function classifyRewardSignals<TEvent>(events: readonly TEvent[], classify: (event: TEvent) => RewardSignalClassification): readonly RewardSignal[];
export declare function validateRewardSignal(signal: RewardSignal): void;
