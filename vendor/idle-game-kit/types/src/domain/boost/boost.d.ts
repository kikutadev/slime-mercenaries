import type { Modifier } from '../modifier/modifier.js';
export type BoostTarget = string;
export type BoostStackingPolicy = 'refresh-duration' | 'replace-weaker' | 'non-stackable';
type BoostDefinitionBase = Readonly<{
    id: string;
    target: BoostTarget;
    modifier: Modifier;
    durationSec: number;
    stackingKey: string;
}>;
export type BoostDefinition = Readonly<BoostDefinitionBase & {
    stackingPolicy: 'replace-weaker';
    /** 同じstackingKey内で大きい値を強いBoostとして採用する。 */
    stackingStrength: number;
}> | Readonly<BoostDefinitionBase & {
    stackingPolicy: 'refresh-duration' | 'non-stackable';
    stackingStrength?: never;
}>;
export type ActiveBoostState = Readonly<{
    boostId: string;
    stackingKey: string;
    activatedAtSimTimeSec: number;
    expiresAtSimTimeSec: number;
    /** replace-weaker groupだけが保存する比較metadata。 */
    stackingStrength?: number;
}>;
export type ActiveBoostStates = Readonly<Record<string, ActiveBoostState>>;
/** Temporary Boostをactive stateへ追加し、同じstackingKeyの競合をdefinition policyで解決する。 */
export declare function activateTemporaryBoost(activeBoosts: ActiveBoostStates, definition: BoostDefinition, simTimeSec: number): ActiveBoostStates;
/** current sim timeで有効なtarget向けModifierだけを返す。 */
export declare function activeBoostModifiers(activeBoosts: ActiveBoostStates, definitions: Readonly<Record<string, BoostDefinition>>, target: BoostTarget, simTimeSec: number): readonly Modifier[];
/** targetまでの間で最初に訪れるboost expiryをevent boundaryとして返す。 */
export declare function nextBoostExpiry(activeBoosts: ActiveBoostStates, afterSimTimeSec: number, targetSimTimeSec: number): number | null;
/** expiry済みBoostをsave stateから除去する。 */
export declare function pruneExpiredBoosts(activeBoosts: ActiveBoostStates, simTimeSec: number): ActiveBoostStates;
export {};
