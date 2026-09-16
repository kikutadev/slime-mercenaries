import type { MeaningfulTargetCandidate } from './engagement-cues.js';
import type { OfflineElapsed } from './offline-time.js';
import type { RewardSignal } from './reward-signals.js';
/**
 * Presentation-neutral description of what changed while the player was away.
 * Product code owns the concrete gain/progression payloads and how they are rendered.
 */
export type OfflineReturnSummary<TGain = unknown, TProgressChange = unknown, TTargetKind extends string = string> = Readonly<{
    elapsed: OfflineElapsed;
    gains: readonly TGain[];
    progressionChanges: readonly TProgressChange[];
    rewardSignals: readonly RewardSignal[];
    nextTarget: MeaningfulTargetCandidate<TTargetKind> | null;
}>;
/**
 * Creates an offline-return contract only when the product says the return contains a meaningful
 * change. Minimum absence duration remains product-owned so short reloads need not interrupt play.
 */
export declare function createOfflineReturnSummary<TGain, TProgressChange, TTargetKind extends string = string>(args: Readonly<{
    elapsed: OfflineElapsed;
    minimumObservedElapsedSec?: number;
    meaningfulChange: boolean;
    gains?: readonly TGain[];
    progressionChanges?: readonly TProgressChange[];
    rewardSignals?: readonly RewardSignal[];
    nextTarget?: MeaningfulTargetCandidate<TTargetKind> | null;
}>): OfflineReturnSummary<TGain, TProgressChange, TTargetKind> | null;
