export type CooldownDefinition = Readonly<{
    id: string;
    durationSec: number;
}>;
export type CooldownState = Readonly<{
    readyAtSimTimeSec: number;
    useCount: number;
}>;
export type CooldownPreview = Readonly<{
    ready: boolean;
    remainingSec: number;
    readyAtSimTimeSec: number;
    useCount: number;
}>;
export type CooldownConsumeResult = Readonly<{
    accepted: true;
    cooldown: CooldownState;
    previous: CooldownState;
}> | Readonly<{
    accepted: false;
    cooldown: CooldownState;
    reason: 'cooldown-active';
    remainingSec: number;
}>;
/**
 * Create a ready cooldown state. The state stores only authoritative simulation time,
 * so UI timers never become the source of truth.
 */
export declare function createCooldownState(): CooldownState;
/** Project cooldown availability at a simulation time without mutating state. */
export declare function previewCooldown(definition: CooldownDefinition, cooldown: CooldownState | undefined, simTimeSec: number): CooldownPreview;
/**
 * Consume a ready action and start its next cooldown window atomically.
 * durationSecOverride is explicit so product-owned modifiers can calculate an effective
 * duration without mutating the shared definition.
 */
export declare function consumeCooldown(args: Readonly<{
    definition: CooldownDefinition;
    cooldown?: CooldownState;
    simTimeSec: number;
    durationSecOverride?: number;
}>): CooldownConsumeResult;
/**
 * Reduce an active cooldown by a fixed amount. This supports explicit skip/reduction rewards
 * while preserving simulation-time authority. It never moves readiness before simTimeSec.
 */
export declare function reduceCooldown(args: Readonly<{
    cooldown: CooldownState;
    simTimeSec: number;
    reductionSec: number;
}>): CooldownState;
