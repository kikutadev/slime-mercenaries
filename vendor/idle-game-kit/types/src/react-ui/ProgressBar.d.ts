import type { CSSProperties } from 'react';
export interface ProgressBarProps {
    readonly value: number;
    readonly label: string;
    readonly className?: string;
    readonly fillClassName?: string;
    readonly style?: CSSProperties;
}
/**
 * Semantic, unstyled progress primitive. Consumers own all visual treatment.
 */
export declare function ProgressBar({ value, label, className, fillClassName, style }: ProgressBarProps): import("react").JSX.Element;
