import { type AchievementProgressMetric } from '../achievement/achievement.js';
import { type Condition, type ConditionContext } from '../condition/condition.js';
import { type GameNumberSerialized, type GameNumberSource } from '../number/game-number.js';
import type { Reward } from '../reward/reward.js';
import type { DomainEvent } from '../state.js';
export type MissionClaimPolicy = 'manual' | 'auto';
export type MissionPeriod = 'daily' | 'weekly' | 'custom';
export type MissionProgressMetric = AchievementProgressMetric;
/**
 * condition objectiveはcurrent stateから判定する状態型任務、counter objectiveは
 * 「強化10回」「撃破300体」等のperiod-local accumulatorを表す。
 */
export type MissionObjective = Readonly<{
    type: 'condition';
    condition: Condition;
    progressMetric?: MissionProgressMetric;
}> | Readonly<{
    type: 'counter';
    metricId: string;
    target: GameNumberSource;
}>;
export type MissionDefinition = Readonly<{
    id: string;
    setId: string;
    objective: MissionObjective;
    rewards: readonly Reward[];
    points?: number;
    claimPolicy?: MissionClaimPolicy;
    displayName?: string;
    description?: string;
}>;
export type MissionPointMilestoneDefinition = Readonly<{
    id: string;
    pointsRequired: number;
    rewards: readonly Reward[];
    claimPolicy?: MissionClaimPolicy;
}>;
export type MissionSetDefinition = Readonly<{
    id: string;
    period: MissionPeriod;
    missionIds: readonly string[];
    pointMilestones?: readonly MissionPointMilestoneDefinition[];
}>;
export type MissionState = Readonly<{
    periodIndex: number;
    completed: boolean;
    claimed: boolean;
    /** counter objectiveだけが使用するcanonical GameNumber。 */
    progress?: GameNumberSerialized;
}>;
export type MissionStates = Readonly<Record<string, MissionState>>;
export type MissionSetState = Readonly<{
    periodIndex: number;
    claimedMilestoneIds: readonly string[];
}>;
export type MissionSetStates = Readonly<Record<string, MissionSetState>>;
export type MissionCarrier = Readonly<{
    simTimeSec: number;
    missionStates?: MissionStates;
    missionSetStates?: MissionSetStates;
}>;
export type MissionProgressUpdate = Readonly<{
    metricId: string;
    amount: GameNumberSource;
}>;
export type MissionStatus = Readonly<{
    id: string;
    completed: boolean;
    claimed: boolean;
    claimable: boolean;
    progress: number | null;
    points: number;
}>;
export type MissionPointMilestoneStatus = Readonly<{
    id: string;
    pointsRequired: number;
    claimed: boolean;
    claimable: boolean;
}>;
export type MissionSetStatus = Readonly<{
    id: string;
    periodIndex: number;
    points: number;
    milestones: readonly MissionPointMilestoneStatus[];
}>;
export type MissionEvaluationResult<TState> = Readonly<{
    accepted: true;
    state: TState;
    events: readonly DomainEvent[];
}> | Readonly<{
    accepted: false;
    state: TState;
    events: readonly [];
    reason: 'clock-rollback';
}>;
export type MissionClaimResult<TState> = Readonly<{
    accepted: true;
    state: TState;
    events: readonly DomainEvent[];
    rewards: readonly Reward[];
}> | Readonly<{
    accepted: false;
    state: TState;
    events: readonly [];
    reason: 'not-completed' | 'already-claimed' | 'auto-claim' | 'clock-rollback';
}>;
export type MissionPointMilestoneClaimResult<TState> = Readonly<{
    accepted: true;
    state: TState;
    events: readonly DomainEvent[];
    rewards: readonly Reward[];
}> | Readonly<{
    accepted: false;
    state: TState;
    events: readonly [];
    reason: 'unknown-milestone' | 'not-reached' | 'already-claimed' | 'auto-claim' | 'clock-rollback';
}>;
/**
 * Mission presentation query. Periodが変わった古いstateは未達として扱い、
 * condition objectiveでprogressMetric未指定ならUI側で推測せずnullを返す。
 */
export declare function selectMissionStatus(state: MissionCarrier, definition: MissionDefinition, periodIndex: number, context: ConditionContext): MissionStatus;
/** Mission setのcurrent-period pointsとpoint milestone attention stateを導出する。 */
export declare function selectMissionSetStatus(state: MissionCarrier, setDefinition: MissionSetDefinition, missionDefinitions: readonly MissionDefinition[], periodIndex: number): MissionSetStatus;
/**
 * condition objectiveだけをcurrent stateから評価する。
 * completeとclaimを分離し、auto claimだけ同じtransaction内でRewardを付与する。
 */
export declare function evaluateMissions<TState extends MissionCarrier>(args: Readonly<{
    state: TState;
    setDefinition: MissionSetDefinition;
    missionDefinitions: readonly MissionDefinition[];
    periodIndex: number;
    createConditionContext: (state: TState) => ConditionContext;
    grantRewards: (state: TState, rewards: readonly Reward[]) => TState;
}>): MissionEvaluationResult<TState>;
/**
 * period内のsemantic progressをcounter objectiveへ加算する。
 * Productはcommand/domain eventを、`upgrade`, `enemy-defeated`等のmetricIdへ一度だけ射影する。
 */
export declare function recordMissionProgress<TState extends MissionCarrier>(args: Readonly<{
    state: TState;
    setDefinition: MissionSetDefinition;
    missionDefinitions: readonly MissionDefinition[];
    periodIndex: number;
    updates: readonly MissionProgressUpdate[];
    grantRewards: (state: TState, rewards: readonly Reward[]) => TState;
}>): MissionEvaluationResult<TState>;
/** manual Mission reward claim. Completion済みでもauto-claim definitionは明示claimできない。 */
export declare function claimMission<TState extends MissionCarrier>(state: TState, definition: MissionDefinition, periodIndex: number, grantRewards: (state: TState, rewards: readonly Reward[]) => TState): MissionClaimResult<TState>;
/** manual point milestone reward claim. Mission points are earned on completion, not on reward claim. */
export declare function claimMissionPointMilestone<TState extends MissionCarrier>(state: TState, setDefinition: MissionSetDefinition, missionDefinitions: readonly MissionDefinition[], milestoneId: string, periodIndex: number, grantRewards: (state: TState, rewards: readonly Reward[]) => TState): MissionPointMilestoneClaimResult<TState>;
