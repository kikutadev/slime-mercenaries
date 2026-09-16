export interface AttentionBadgeProps {
    readonly label: string;
    readonly count?: number;
    readonly maxCount?: number;
    readonly className?: string;
}
/**
 * Theme-neutral attention marker. Visual urgency remains consumer-owned through className.
 * Omit count to render a simple semantic dot/marker.
 */
export declare function AttentionBadge({ label, count, maxCount, className, }: AttentionBadgeProps): import("react").JSX.Element | null;
