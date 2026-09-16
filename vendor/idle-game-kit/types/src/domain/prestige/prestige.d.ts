import { type Condition, type ConditionContext } from '../condition/condition.js';
import type { Reward } from '../reward/reward.js';
import type { GameState } from '../state.js';
export type PrestigeState = Readonly<{
    count: number;
}>;
export type PrestigeStates = Readonly<Record<string, PrestigeState>>;
export type RecordResetPolicy = 'retain' | 'reset' | Readonly<{
    resetIds: readonly string[];
}>;
export type PrestigeResetPolicy = Readonly<{
    currencies?: RecordResetPolicy;
    tokens?: RecordResetPolicy;
    producers?: RecordResetPolicy;
    characters?: RecordResetPolicy;
    achievements?: RecordResetPolicy;
    titles?: RecordResetPolicy;
    progressionFlags?: RecordResetPolicy;
    gachaStates?: RecordResetPolicy;
    activeBoosts?: RecordResetPolicy;
    statistics?: 'retain' | 'reset';
}>;
export type PrestigeDefinition<TState extends GameState<unknown>> = Readonly<{
    id: string;
    eligibility: Condition;
    resetPolicy: PrestigeResetPolicy;
    rewards: (state: TState) => readonly Reward[];
}>;
export type PrestigeHooks<TState extends GameState<unknown>> = Readonly<{
    createConditionContext: (state: TState) => ConditionContext;
    grantRewards: (state: TState, rewards: readonly Reward[]) => TState;
    /** Game固有のActivity/Party等を、standard category resetの後に初期化する。 */
    transformAfterReset?: (state: TState) => TState;
}>;
export type PrestigeRecordCategory = 'currencies' | 'tokens' | 'producers' | 'characters' | 'achievements' | 'titles' | 'progressionFlags' | 'gachaStates' | 'activeBoosts';
export type PrestigeResetImpactEntry = Readonly<{
    category: PrestigeRecordCategory;
    mode: 'retain' | 'reset' | 'reset-selected';
    /** 現在state上で今回実際に消えるID。 */
    resetIds: readonly string[];
    /** 現在state上でstandard reset後も残るID。 */
    retainedIds: readonly string[];
    /** reset-selected definitionが宣言するID。未所有/未解禁IDも含む。 */
    configuredResetIds: readonly string[];
}>;
export type PrestigeResetImpact = Readonly<{
    records: readonly PrestigeResetImpactEntry[];
    statistics: 'retain' | 'reset';
}>;
export type PrestigePreview = Readonly<{
    eligible: boolean;
    nextCount: number;
    rewards: readonly Reward[];
    resetImpact: PrestigeResetImpact;
}>;
/**
 * Standard GameState categoryについて、現在stateのreset/retain影響をdefinitionから導出する。
 * Party/Activity等のgameData固有resetはGame Plugin側のpreviewへ追加する。
 */
export declare function previewPrestigeResetImpact<TState extends GameState<unknown>>(state: TState, policy: PrestigeResetPolicy): PrestigeResetImpact;
/**
 * Prestige実行前のpreviewを副作用なしで作る。
 * reward formulaとstandard reset impactは実行時と同じdefinitionを使い、UI専用計算を複製しない。
 */
export declare function previewPrestige<TState extends GameState<unknown>>(state: TState, definition: PrestigeDefinition<TState>, createConditionContext: (state: TState) => ConditionContext): PrestigePreview;
/**
 * eligibility確認後、standard category reset -> game固有transform -> reward grantをatomicに実行する。
 * state keyをproduct commandへ列挙せず、reset policyとsubsystem hookへ責務を分ける。
 */
export declare function executePrestige<TState extends GameState<unknown>>(state: TState, definition: PrestigeDefinition<TState>, hooks: PrestigeHooks<TState>): Readonly<{
    accepted: true;
    state: TState;
    rewards: readonly Reward[];
    prestigeCount: number;
}> | Readonly<{
    accepted: false;
    state: TState;
    reason: 'not-eligible';
}>;
