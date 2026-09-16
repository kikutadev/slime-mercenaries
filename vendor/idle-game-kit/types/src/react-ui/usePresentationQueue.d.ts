import { type PresentationQueueItem } from '../application/presentation-queue.js';
/**
 * React-local queue controller for transient presentation. Queue contents remain presentation-only
 * and are intentionally not persisted into GameState.
 */
export declare function usePresentationQueue<T extends PresentationQueueItem>(getDurationMs: (item: T) => number): Readonly<{
    items: readonly T[];
    current: T | null;
    enqueue: (incoming: readonly T[]) => void;
    dismissCurrent: () => void;
    clear: () => void;
}>;
