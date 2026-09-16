import { type ActivityDefinitionBase } from './activity-common.js';
import type { Reward } from '../reward/reward.js';
import type { DomainEvent } from '../state.js';
export type TimedActivityClaimPolicy = 'auto' | 'manual';
export type TimedActivityRepeatPolicy = 'repeatable' | 'once';
export type TimedActivityStatus = 'available' | 'running' | 'completed-unclaimed' | 'exhausted';
export type TimedActivityDefinition = ActivityDefinitionBase<'timed'> & Readonly<{
    durationSec: number;
    completionRewards: readonly Reward[];
    claimPolicy: TimedActivityClaimPolicy;
    repeatPolicy: TimedActivityRepeatPolicy;
}>;
export type TimedActivityState = Readonly<{
    activityId: string;
    status: TimedActivityStatus;
    startedAtSimTimeSec: number | null;
    completesAtSimTimeSec: number | null;
    completionCount: number;
}>;
export type TimedActivityAdvanceHooks<TState> = Readonly<{
    grantRewards: (state: TState, rewards: readonly Reward[]) => TState;
}>;
export type TimedActivityCommandResult<TState, TReason extends string = string> = Readonly<{
    accepted: true;
    state: TState;
    activity: TimedActivityState;
    events: readonly DomainEvent[];
}> | Readonly<{
    accepted: false;
    state: TState;
    activity: TimedActivityState;
    events: readonly [];
    reason: TReason;
}>;
/**
 * Timed Activity の初期stateを作る。
 * presentationやwall clockを持たず、virtual sim timeだけで進行できる形に限定する。
 */
export declare function createTimedActivityState(activityId: string): TimedActivityState;
/**
 * Timed Activity を開始する。
 * durationはdefinitionの一部として検証し、開始済み・claim待ちのstateを上書きしない。
 */
export declare function startTimedActivity<TState>(args: Readonly<{
    state: TState;
    activity: TimedActivityState;
    definition: TimedActivityDefinition;
    startSimTimeSec: number;
}>): TimedActivityCommandResult<TState, 'not-available'>;
/**
 * target virtual time まで一括で進める。
 * completion境界より前ならstateを変えず、境界を跨いだ場合だけ1回resolveする。
 * repeatableは「再度start可能」を意味し、自動再開始はしない。
 */
export declare function advanceTimedActivity<TState>(args: Readonly<{
    state: TState;
    activity: TimedActivityState;
    definition: TimedActivityDefinition;
    targetSimTimeSec: number;
    hooks: TimedActivityAdvanceHooks<TState>;
    offlineElapsedSec?: number;
}>): Readonly<{
    state: TState;
    activity: TimedActivityState;
    events: readonly DomainEvent[];
}>;
/** cancellation policyを尊重してrunning Timed Activityをavailableへ戻す。 */
export declare function cancelTimedActivity(activity: TimedActivityState, definition: TimedActivityDefinition, simTimeSec: number): Readonly<{
    accepted: true;
    activity: TimedActivityState;
    events: readonly DomainEvent[];
}> | Readonly<{
    accepted: false;
    activity: TimedActivityState;
    events: readonly [];
    reason: 'not-running' | 'cancellation-forbidden';
}>;
/**
 * manual claim の完了報酬を1回だけ付与する。
 * claim後はrepeat policyに従い available または exhausted へ遷移する。
 */
export declare function claimTimedActivity<TState>(args: Readonly<{
    state: TState;
    activity: TimedActivityState;
    definition: TimedActivityDefinition;
    claimSimTimeSec: number;
    hooks: TimedActivityAdvanceHooks<TState>;
    offlineElapsedSec?: number;
}>): TimedActivityCommandResult<TState, 'not-claimable'>;
