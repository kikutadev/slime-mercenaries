import { type CSSProperties, type ReactNode } from 'react';
import { type MotionPresetName } from './presets.js';
export interface MotionProps {
    readonly as?: 'div' | 'span';
    readonly preset: MotionPresetName;
    readonly children: ReactNode;
    readonly className?: string;
    readonly style?: CSSProperties;
    readonly delayMs?: number;
    /** Change this value to explicitly replay the animation without remounting. */
    readonly motionKey?: string | number;
}
/**
 * Small DOM motion primitive backed by Web Animations API.
 * It is intentionally semantic-free and automatically suppresses nonessential motion
 * when the user prefers reduced motion.
 */
export declare function Motion({ as, preset, children, className, style, delayMs, motionKey, }: MotionProps): import("react").JSX.Element;
