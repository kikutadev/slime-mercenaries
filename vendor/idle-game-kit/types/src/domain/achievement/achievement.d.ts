import { type Condition, type ConditionContext } from '../condition/condition.js';
import { type GameNumberSource } from '../number/game-number.js';
import type { Reward } from '../reward/reward.js';
import type { DomainEvent } from '../state.js';
export type AchievementProgressMetric = Readonly<{
    type: 'currency-balance';
    currencyId: string;
    target: GameNumberSource;
}> | Readonly<{
    type: 'lifetime-currency-earned';
    currencyId: string;
    target: GameNumberSource;
}> | Readonly<{
    type: 'producer-count';
    producerId: string;
    target: number;
}> | Readonly<{
    type: 'producer-level';
    producerId: string;
    target: number;
}> | Readonly<{
    type: 'character-level';
    characterDefinitionId: string;
    target: number;
}> | Readonly<{
    type: 'activity-progress';
    activityId: string;
    target: number;
}> | Readonly<{
    type: 'gacha-draw-count';
    gachaId: string;
    target: number;
}> | Readonly<{
    type: 'prestige-count';
    prestigeId: string;
    target: number;
}> | Readonly<{
    type: 'calendar-streak';
    calendarRewardId: string;
    target: number;
}>;
export type AchievementDefinition = Readonly<{
    id: string;
    condition: Condition;
    rewards: readonly Reward[];
    displayName?: string;
    description?: string;
    hidden?: boolean;
    progressMetric?: AchievementProgressMetric;
}>;
export type AchievementCarrier = Readonly<{
    simTimeSec: number;
    achievements: Readonly<Record<string, boolean>>;
}>;
export type AchievementStatus = Readonly<{
    id: string;
    completed: boolean;
    visible: boolean;
    progress: number | null;
}>;
/**
 * Achievementのpresentation query。hiddenは未達時だけ非表示とし、達成後は履歴として見える。
 * progressMetric未指定ではprogressを推測せずnullを返す。
 */
export declare function selectAchievementStatus(state: AchievementCarrier, definition: AchievementDefinition, context: ConditionContext): AchievementStatus;
/** authored metricを0..1へ正規化する。target<=0は既に満たされたmetricとして1を返す。 */
export declare function achievementProgressRatio(metric: AchievementProgressMetric, context: ConditionContext): number;
/**
 * 未達Achievementだけをdefinition順に評価し、達成stateとRewardを同じ遷移で反映する。
 * contextはReward適用後のstateから毎回再構築できるため、Achievement連鎖もdeterministicに扱える。
 * V1 Achievementはnon-repeatableで、達成済みIDは再評価・再付与しない。
 */
export declare function evaluateAchievements<TState extends AchievementCarrier>(args: Readonly<{
    state: TState;
    definitions: readonly AchievementDefinition[];
    createConditionContext: (state: TState) => ConditionContext;
    grantRewards: (state: TState, rewards: readonly Reward[]) => TState;
}>): Readonly<{
    state: TState;
    events: readonly DomainEvent[];
}>;
