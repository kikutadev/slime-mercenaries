import { GameNumber, type GameNumberSource } from '../number/game-number.js';
export type Condition = Readonly<{
    type: 'and';
    conditions: readonly Condition[];
}> | Readonly<{
    type: 'or';
    conditions: readonly Condition[];
}> | Readonly<{
    type: 'not';
    condition: Condition;
}> | Readonly<{
    type: 'currency-balance-at-least';
    currencyId: string;
    amount: GameNumberSource;
}> | Readonly<{
    type: 'lifetime-currency-earned-at-least';
    currencyId: string;
    amount: GameNumberSource;
}> | Readonly<{
    type: 'producer-count-at-least';
    producerId: string;
    count: number;
}> | Readonly<{
    type: 'producer-level-at-least';
    producerId: string;
    level: number;
}> | Readonly<{
    type: 'character-owned';
    characterDefinitionId: string;
}> | Readonly<{
    type: 'character-level-at-least';
    characterDefinitionId: string;
    level: number;
}> | Readonly<{
    type: 'activity-progress-at-least';
    activityId: string;
    progress: number;
}> | Readonly<{
    type: 'activity-milestone-reached';
    activityId: string;
    milestoneId: string;
}> | Readonly<{
    type: 'achievement-completed';
    achievementId: string;
}> | Readonly<{
    type: 'prestige-count-at-least';
    prestigeId: string;
    count: number;
}> | Readonly<{
    type: 'gacha-draw-count-at-least';
    gachaId: string;
    count: number;
}> | Readonly<{
    type: 'calendar-streak-at-least';
    calendarRewardId: string;
    count: number;
}> | Readonly<{
    type: 'unlock-flag';
    flagId: string;
}>;
export type ConditionContext = Readonly<{
    currencyBalance: (currencyId: string) => GameNumber;
    lifetimeCurrencyEarned: (currencyId: string) => GameNumber;
    producerCount: (producerId: string) => number;
    producerLevel?: (producerId: string) => number;
    characterOwned: (characterDefinitionId: string) => boolean;
    characterLevel?: (characterDefinitionId: string) => number;
    activityProgress: (activityId: string) => number;
    activityMilestoneReached?: (activityId: string, milestoneId: string) => boolean;
    achievementCompleted: (achievementId: string) => boolean;
    prestigeCount?: (prestigeId: string) => number;
    gachaDrawCount?: (gachaId: string) => number;
    calendarStreak?: (calendarRewardId: string) => number;
    unlockFlag: (flagId: string) => boolean;
}>;
/** Typed condition treeを副作用なしで評価する。 */
export declare function evaluateCondition(condition: Condition, context: ConditionContext): boolean;
