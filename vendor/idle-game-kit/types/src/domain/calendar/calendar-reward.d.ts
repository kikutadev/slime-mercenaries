import type { Reward } from '../reward/reward.js';
import type { GameState } from '../state.js';
export type CalendarPeriod = 'daily' | 'weekly' | 'monthly';
export type CalendarMissPolicy = 'preserve-sequence' | 'reset-sequence';
export type CalendarClaimPolicy = 'manual' | 'auto';
export type CalendarRewardState = Readonly<{
    lastClaimedPeriodIndex: number | null;
    claimCount: number;
    streakCount: number;
}>;
export type CalendarRewardStates = Readonly<Record<string, CalendarRewardState>>;
export type CalendarRewardDefinition = Readonly<{
    id: string;
    period: CalendarPeriod;
    rewardsByClaim: readonly (readonly Reward[])[];
    missPolicy?: CalendarMissPolicy;
    /** 未指定はmanual。autoはApplicationがperiod/resume境界でresolveAutomaticCalendarRewardsを呼ぶ。 */
    claimPolicy?: CalendarClaimPolicy;
}>;
export type CalendarRewardPreview = Readonly<{
    claimable: boolean;
    claimPolicy: CalendarClaimPolicy;
    periodIndex: number;
    sequenceIndex: number;
    rewards: readonly Reward[];
    streakCountAfterClaim: number;
    sequenceReset: boolean;
}>;
export type CalendarRewardClaimResult<TState> = Readonly<{
    accepted: true;
    state: TState;
    rewards: readonly Reward[];
}> | Readonly<{
    accepted: false;
    state: TState;
    reason: 'already-claimed' | 'clock-rollback' | 'manual-claim-disabled';
}>;
/**
 * Device-local等のoffsetをadapterから受け、daily/weekly/monthlyを同じinteger periodへ正規化する。
 * utcOffsetMinutesはUTCからlocalへの差分（日本なら+540）。
 */
export declare function calendarPeriodIndex(wallClockMs: number, utcOffsetMinutes: number, period: CalendarPeriod): number;
/** 取り逃し期間数ではなく実claim回数でsequenceを進め、missed periodで報酬を飛ばさない。 */
export declare function previewCalendarReward<TState extends GameState<unknown>>(state: TState, definition: CalendarRewardDefinition, wallClockMs: number, utcOffsetMinutes: number): CalendarRewardPreview;
/** manual policyのCalendar Rewardを明示claimする。auto definitionはApplication境界から解決する。 */
export declare function claimCalendarReward<TState extends GameState<unknown>>(state: TState, definition: CalendarRewardDefinition, wallClockMs: number, utcOffsetMinutes: number, grantRewards: (state: TState, rewards: readonly Reward[]) => TState): CalendarRewardClaimResult<TState>;
/**
 * auto policyのCalendar Rewardをまとめて解決する。
 * resume・period boundary等のApplication lifecycleから呼び、manual定義には触れない。
 */
export declare function resolveAutomaticCalendarRewards<TState extends GameState<unknown>>(state: TState, definitions: readonly CalendarRewardDefinition[], wallClockMs: number, utcOffsetMinutes: number, grantRewards: (state: TState, rewards: readonly Reward[]) => TState): Readonly<{
    state: TState;
    claimed: readonly Readonly<{
        calendarRewardId: string;
        rewards: readonly Reward[];
    }>[];
}>;
