import { type Condition, type ConditionContext } from '../condition/condition.js';
import type { Reward } from '../reward/reward.js';
import type { DomainEvent } from '../state.js';
export type RewardedOfferDefinition = Readonly<{
    id: string;
    placementId: string;
    rewards: readonly Reward[];
    eligibility?: Condition;
    cooldownSec?: number;
    dailyCap?: number;
}>;
export type RewardedOfferState = Readonly<{
    grantCount: number;
    lastGrantedAtSimTimeSec: number | null;
    dailyPeriodIndex: number | null;
    dailyGrantCount: number;
}>;
export type RewardedOfferStates = Readonly<Record<string, RewardedOfferState>>;
export type RewardedOfferUnavailableReason = 'ineligible' | 'cooldown' | 'daily-cap';
export type RewardedOfferPreview = Readonly<{
    available: boolean;
    reason: RewardedOfferUnavailableReason | null;
    rewards: readonly Reward[];
    grantCount: number;
    cooldownRemainingSec: number;
    dailyRemaining: number | null;
}>;
/**
 * Provider availabilityとは独立したgame ruleとして、eligibility/cooldown/daily capを判定する。
 * dailyPeriodIndexはApplication/Calendar adapter側で算出し、DomainへDate APIを持ち込まない。
 */
export declare function previewRewardedOffer<TState>(args: Readonly<{
    state: TState;
    offerState?: RewardedOfferState;
    definition: RewardedOfferDefinition;
    simTimeSec: number;
    dailyPeriodIndex: number;
    createConditionContext?: (state: TState) => ConditionContext;
}>): RewardedOfferPreview;
/**
 * Reward付与成功後だけusage stateをcommitする。
 * Provider grant ID dedupeは外部integrity concernなので、このsubsystemでは扱わない。
 */
export declare function grantRewardedOffer<TState>(args: Readonly<{
    state: TState;
    offerStates: RewardedOfferStates;
    definition: RewardedOfferDefinition;
    simTimeSec: number;
    dailyPeriodIndex: number;
    createConditionContext?: (state: TState) => ConditionContext;
    grantRewards: (state: TState, rewards: readonly Reward[]) => TState;
}>): Readonly<{
    accepted: true;
    state: TState;
    offerStates: RewardedOfferStates;
    events: readonly DomainEvent[];
}> | Readonly<{
    accepted: false;
    state: TState;
    offerStates: RewardedOfferStates;
    events: readonly [];
    reason: RewardedOfferUnavailableReason;
}>;
export declare function emptyRewardedOfferState(): RewardedOfferState;
