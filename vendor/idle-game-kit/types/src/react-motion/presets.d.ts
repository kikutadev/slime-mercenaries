export type MotionPresetName = 'bump' | 'pop' | 'pulse' | 'reveal' | 'shake';
export type MotionPreset = Readonly<{
    keyframes: readonly Keyframe[];
    options: Readonly<KeyframeAnimationOptions>;
}>;
/**
 * Generic motion vocabulary only. Products decide which semantic event maps to which preset.
 */
export declare const motionPresets: Readonly<Record<MotionPresetName, MotionPreset>>;
