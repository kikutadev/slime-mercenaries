import { type Condition, type ConditionContext } from '../condition/condition.js';
import { type CurrencyDefinitionResolver } from '../currency/currency.js';
import { GameNumber, type GameNumberSource } from '../number/game-number.js';
import type { GameState } from '../state.js';
export type ActivityMode = 'continuous' | 'timed';
export type ActivityOfflinePolicy = 'progress' | 'pause';
export type ActivityCancellationPolicy = 'allow' | 'forbid';
export type ActivityConcurrencyGroupDefinition = Readonly<{
    id: string;
    maxSlots: number;
}>;
export type ActivityConcurrencyPreview = Readonly<{
    allowed: boolean;
    requiredSlots: number;
    usedSlots: number;
    maxSlots: number;
    remainingSlots: number;
}>;
export type ActivityStartCost = Readonly<{
    type: 'currency';
    currencyId: string;
    amount: GameNumberSource;
}> | Readonly<{
    type: 'token';
    tokenId: string;
    count: number;
}>;
/**
 * Continuous / Timed Activityで共有するauthoring contract。
 * assignmentの意味やslot割当実装はgame固有になりやすいため、coreではsemantic metadataまでに留める。
 */
export type ActivityDefinitionBase<TMode extends ActivityMode> = Readonly<{
    id: string;
    mode: TMode;
    eligibility?: Condition;
    startCosts?: readonly ActivityStartCost[];
    concurrencyGroupId?: string;
    slotCost?: number;
    offlinePolicy?: ActivityOfflinePolicy;
    cancellationPolicy?: ActivityCancellationPolicy;
}>;
export type ActivityStartPreview = Readonly<{
    eligible: boolean;
    affordable: boolean;
    canStart: boolean;
    blockingCost: ActivityStartCost | null;
}>;
/** Eligibilityとstart costを副作用なしで確認する。 */
export declare function previewActivityStart<TGameData>(args: Readonly<{
    state: GameState<TGameData>;
    definition: ActivityDefinitionBase<ActivityMode>;
    createConditionContext?: (state: GameState<TGameData>) => ConditionContext;
    resolveCurrencyDefinition?: CurrencyDefinitionResolver;
}>): ActivityStartPreview;
/**
 * 全start costを一つのimmutable transitionとして適用する。
 * 後続costが不足した場合は途中stateを返さず、必ず入力state identityへrollbackする。
 */
export declare function applyActivityStartCosts<TGameData>(args: Readonly<{
    state: GameState<TGameData>;
    costs: readonly ActivityStartCost[];
    resolveCurrencyDefinition?: CurrencyDefinitionResolver;
}>): Readonly<{
    accepted: true;
    state: GameState<TGameData>;
}> | Readonly<{
    accepted: false;
    state: GameState<TGameData>;
    blockingCost: ActivityStartCost;
    reason: 'insufficient-currency' | 'insufficient-token';
}>;
export declare function activityAdvancesOffline(definition: ActivityDefinitionBase<ActivityMode>): boolean;
export declare function previewActivityConcurrency(definition: ActivityDefinitionBase<ActivityMode>, group: ActivityConcurrencyGroupDefinition, usedSlots: number): ActivityConcurrencyPreview;
export declare function activityStartCurrencyCost(definition: ActivityDefinitionBase<ActivityMode>, currencyId: string): GameNumber;
export declare function validateCommonActivityDefinition(definition: ActivityDefinitionBase<ActivityMode>, expectedMode?: ActivityMode): void;
