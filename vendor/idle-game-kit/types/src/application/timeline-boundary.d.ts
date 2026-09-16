export type TimelineBoundaryCandidate<TId extends string = string> = Readonly<{
    id: TId;
    atSimTimeSec: number;
    /** Lower values resolve first when multiple boundaries share the same timestamp. */
    order?: number;
}>;
export type TimelineSegmentSelection<TId extends string = string> = Readonly<{
    /** Advance continuous simulation exactly to this time before resolving boundaries. */
    targetSimTimeSec: number;
    /** Boundaries due at targetSimTimeSec, in deterministic resolution order. */
    boundaries: readonly TimelineBoundaryCandidate<TId>[];
}>;
/**
 * Select one deterministic simulation segment from independently-authored event clocks.
 *
 * This is intentionally not a scheduler and owns no state. Products still author each
 * boundary source and resolution rule. The kit only centralizes nearest-boundary selection,
 * simultaneous-boundary ordering, and the stale-boundary guard that prevents zero-progress loops.
 */
export declare function selectTimelineSegment<TId extends string>(args: Readonly<{
    currentSimTimeSec: number;
    targetSimTimeSec: number;
    candidates: readonly (TimelineBoundaryCandidate<TId> | null | undefined)[];
}>): TimelineSegmentSelection<TId>;
