export type PresentationPreemption = 'resume-current' | 'discard-current';
export interface PresentationQueueItem {
    /** Larger values represent presentation that should win attention first. */
    readonly presentationPriority: number;
    /**
     * Optional key for state-like presentation where only the latest item is useful.
     * Items sharing a key replace older queued presentation in the same logical slot.
     */
    readonly presentationCoalescingKey?: string;
    /**
     * Optional higher-priority interruption behavior.
     *
     * `resume-current` temporarily moves ahead of the current item and lets it resume later.
     * `discard-current` supersedes the current item because its information is now obsolete.
     */
    readonly presentationPreemption?: PresentationPreemption;
}
/**
 * Pure, presentation-only queue composition.
 *
 * Normal notices preserve FIFO order. State-like notices can opt into coalescing so stale progress
 * snapshots never pile up. A higher-priority incoming item may also explicitly interrupt the
 * current presentation. Presentation timing stays outside persisted game state.
 */
export declare function enqueuePresentationItems<T extends PresentationQueueItem>(current: readonly T[], incoming: readonly T[]): readonly T[];
/** Remove the currently visible item while preserving the queued order behind it. */
export declare function dismissCurrentPresentation<T>(queue: readonly T[]): readonly T[];
