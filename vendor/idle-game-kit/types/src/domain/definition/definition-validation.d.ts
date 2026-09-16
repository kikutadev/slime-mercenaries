import type { AchievementDefinition } from '../achievement/achievement.js';
import type { ActiveGainDefinition } from '../active-gain/active-gain.js';
import type { ActivityConcurrencyGroupDefinition } from '../activity/activity-common.js';
import type { ContinuousActivityDefinition } from '../activity/continuous-activity.js';
import type { TimedActivityDefinition } from '../activity/timed-activity.js';
import type { TitleDefinition } from '../title/title.js';
import type { BoostDefinition } from '../boost/boost.js';
import type { CalendarRewardDefinition } from '../calendar/calendar-reward.js';
import type { CharacterDefinition } from '../character/character.js';
import type { Condition } from '../condition/condition.js';
import type { CurrencyDefinition } from '../currency/currency.js';
import type { CurveDefinition } from '../curve/curve.js';
import type { GachaDefinition } from '../gacha/gacha.js';
import type { LevelDefinition } from '../level/level.js';
import type { ModifierDefinition } from '../modifier/modifier.js';
import type { MissionDefinition, MissionSetDefinition } from '../mission/mission.js';
import type { OpportunityDefinition } from '../opportunity/opportunity.js';
import type { PrestigeResetPolicy } from '../prestige/prestige.js';
import type { ProducerDefinition } from '../producer/producer.js';
import type { Reward } from '../reward/reward.js';
import type { RewardedOfferDefinition } from '../rewarded-offer/rewarded-offer.js';
export type DefinitionValidationIssueCode = 'duplicate-id' | 'missing-reference' | 'invalid-value' | 'cyclic-dependency' | 'custom';
export type DefinitionValidationIssue = Readonly<{
    code: DefinitionValidationIssueCode;
    path: string;
    message: string;
}>;
export type DefinitionIdRegistry = Readonly<{
    currencies: readonly string[];
    producers: readonly string[];
    tokens: readonly string[];
    characters: readonly string[];
    permanentModifiers: readonly string[];
    titles: readonly string[];
    unlockFlags: readonly string[];
    rngStreams: readonly string[];
}>;
export type DefinitionValidationBundle = Readonly<{
    ids: DefinitionIdRegistry;
    currencyDefinitions?: readonly CurrencyDefinition[];
    producerDefinitions?: readonly ProducerDefinition[];
    characterDefinitions?: readonly CharacterDefinition[];
    titleDefinitions?: readonly TitleDefinition[];
    modifierDefinitions?: readonly ModifierDefinition[];
    activeGains?: readonly ActiveGainDefinition[];
    curves?: readonly Readonly<{
        id: string;
        definition: CurveDefinition;
    }>[];
    levelDefinitions?: readonly LevelDefinition[];
    activityConcurrencyGroups?: readonly ActivityConcurrencyGroupDefinition[];
    continuousActivities?: readonly ContinuousActivityDefinition[];
    timedActivities?: readonly TimedActivityDefinition[];
    boosts?: readonly BoostDefinition[];
    gachas?: readonly GachaDefinition<unknown>[];
    calendarRewards?: readonly CalendarRewardDefinition[];
    rewardedOffers?: readonly RewardedOfferDefinition[];
    achievements?: readonly AchievementDefinition[];
    missions?: readonly MissionDefinition[];
    missionSets?: readonly MissionSetDefinition[];
    opportunities?: readonly OpportunityDefinition[];
    prestiges?: readonly Readonly<{
        id: string;
        eligibility: Condition;
        resetPolicy: PrestigeResetPolicy;
    }>[];
    additionalConditions?: readonly Readonly<{
        path: string;
        condition: Condition;
    }>[];
    additionalRewardSets?: readonly Readonly<{
        path: string;
        rewards: readonly Reward[];
    }>[];
    /** Gacha reward payload is game-defined; product/plugin can validate its own references here. */
    validateGachaReward?: (reward: unknown, path: string) => readonly DefinitionValidationIssue[];
}>;
/**
 * Game definition bundleを横断し、runtimeへ入る前に参照切れと主要な不正値を検出する。
 * Game固有DSLは導入せず、標準Reward/Conditionと公開definition contractだけを扱う。
 */
export declare function validateDefinitionBundle(bundle: DefinitionValidationBundle): readonly DefinitionValidationIssue[];
export declare function assertValidDefinitionBundle(bundle: DefinitionValidationBundle): void;
