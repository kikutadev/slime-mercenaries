import { type Condition, type ConditionContext } from '../condition/condition.js';
import { type CurveDefinition } from '../curve/curve.js';
import { GameNumber } from '../number/game-number.js';
import type { Reward } from '../reward/reward.js';
export type LevelMilestone = Readonly<{
    id: string;
    level: number;
    rewards: readonly Reward[];
}>;
export type LevelDefinition = Readonly<{
    id: string;
    /** index 0 is the cost of Lv1 -> Lv2. */
    costCurve: CurveDefinition;
    /** index 0 is the effective stat/value at Lv1. */
    statCurve?: CurveDefinition;
    maxLevel?: number;
    milestones?: readonly LevelMilestone[];
    eligibility?: Condition;
}>;
export type AvailableLevelUpPreview = Readonly<{
    available: true;
    currentLevel: number;
    targetLevel: number;
    count: number;
    totalCost: GameNumber;
    currentStat: GameNumber | null;
    targetStat: GameNumber | null;
    crossedMilestones: readonly LevelMilestone[];
}>;
export type UnavailableLevelUpPreview = Readonly<{
    available: false;
    currentLevel: number;
    requestedCount: number;
    reason: 'ineligible' | 'max-level' | 'exceeds-max-level';
}>;
export type LevelUpPreview = AvailableLevelUpPreview | UnavailableLevelUpPreview;
/**
 * Level-upに必要なcost/stat/milestoneを副作用なしで解決する。
 * Resource spendとstate mutationはProduct command側がこのpreviewを使ってatomicに行う。
 */
export declare function previewLevelUp(args: Readonly<{
    definition: LevelDefinition;
    currentLevel: number;
    count?: number;
    conditionContext?: ConditionContext;
}>): LevelUpPreview;
