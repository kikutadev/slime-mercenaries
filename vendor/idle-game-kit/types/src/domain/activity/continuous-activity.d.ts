import { type ActivityDefinitionBase } from './activity-common.js';
import { GameNumber, type GameNumberSource } from '../number/game-number.js';
import type { Reward } from '../reward/reward.js';
import type { DomainEvent } from '../state.js';
export type ContinuousActivityState = Readonly<{
    activityId: string;
    running: boolean;
    progress: number;
    reachedMilestoneIds: readonly string[];
}>;
export type ContinuousActivityMilestone = Readonly<{
    id: string;
    threshold: number;
    rewards: readonly Reward[];
}>;
export type ContinuousActivityDefinition = ActivityDefinitionBase<'continuous'> & Readonly<{
    milestones: readonly ContinuousActivityMilestone[];
}>;
export type ContinuousRates = Readonly<{
    production: Readonly<Record<string, GameNumberSource>>;
    progressPerSec: number;
}>;
export type ContinuousAdvanceHooks<TState> = Readonly<{
    resolveRates: (state: TState) => ContinuousRates;
    grantProduction: (state: TState, currencyId: string, amount: GameNumber) => TState;
    grantRewards: (state: TState, rewards: readonly Reward[]) => TState;
}>;
/**
 * Whole-second virtual timeをmilestone境界ごとに進める。
 * milestoneによりrateが変わり得るため、境界を通過するたびresolveRatesを再実行する。
 */
export declare function advanceContinuousActivity<TState>(args: Readonly<{
    state: TState;
    activity: ContinuousActivityState;
    definition: ContinuousActivityDefinition;
    elapsedSec: number;
    startSimTimeSec: number;
    hooks: ContinuousAdvanceHooks<TState>;
    isOffline?: boolean;
}>): Readonly<{
    state: TState;
    activity: ContinuousActivityState;
    events: readonly DomainEvent[];
}>;
/** cancellation policyを尊重してContinuous Activityを停止する。 */
export declare function stopContinuousActivity(activity: ContinuousActivityState, definition: ContinuousActivityDefinition, simTimeSec: number): Readonly<{
    accepted: true;
    activity: ContinuousActivityState;
    events: readonly DomainEvent[];
}> | Readonly<{
    accepted: false;
    activity: ContinuousActivityState;
    events: readonly [];
    reason: 'not-running' | 'cancellation-forbidden';
}>;
