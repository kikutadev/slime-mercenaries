import { type CurrencyDefinitionResolver } from '../currency/currency.js';
import { type GameNumberSource } from '../number/game-number.js';
import type { CommandResult, GameState } from '../state.js';
export type GachaPoolEntry<TReward> = Readonly<{
    id: string;
    weight: number;
    reward: TReward;
    rarity?: string;
}>;
export type GachaGuaranteedSlotRule = Readonly<{
    id: string;
    drawCount: number;
    drawIndex: number;
    poolEntryIds: readonly string[];
}>;
/**
 * 1回のmulti-drawを固定長batchへ分け、各batchに対象entryが1件も無い場合だけ
 * batch末尾を対象poolから引き直す。「10連でSR以上1体以上」のような事後保証を表現する。
 */
export type GachaBatchGuaranteeRule = Readonly<{
    id: string;
    drawCount: number;
    batchSize: number;
    poolEntryIds: readonly string[];
}>;
export type GachaPityRule = Readonly<{
    id: string;
    threshold: number;
    poolEntryIds: readonly string[];
}>;
export type GachaDuplicatePolicy = 'resolve-with-hook' | 'grant-again' | 'ignore';
export type GachaCost = Readonly<{
    currencyId: string;
    amountPerDraw: GameNumberSource;
}> | Readonly<{
    tokenId: string;
    countPerDraw: number;
}>;
export type GachaDefinition<TReward> = Readonly<{
    id: string;
    cost: GachaCost;
    allowedDrawCounts: readonly number[];
    pool: readonly GachaPoolEntry<TReward>[];
    rngStreamName: string;
    guaranteedSlots?: readonly GachaGuaranteedSlotRule[];
    batchGuarantees?: readonly GachaBatchGuaranteeRule[];
    pity?: GachaPityRule;
    /** 未指定は現在互換のresolve-with-hook。 */
    duplicatePolicy?: GachaDuplicatePolicy;
}>;
export type GachaRuntimeState = Readonly<{
    totalDrawCount: number;
    /** Pity rule未設定のdefinitionでは保存しない。 */
    pityMissCount?: number;
}>;
export type GachaStates = Readonly<Record<string, GachaRuntimeState>>;
export type GachaSelectionRule = Readonly<{
    kind: 'guaranteed-slot';
    ruleId: string;
}> | Readonly<{
    kind: 'batch-guarantee';
    ruleId: string;
    batchIndex: number;
}> | Readonly<{
    kind: 'pity';
    ruleId: string;
}>;
export type GachaGrantContext = Readonly<{
    gachaId: string;
    entryId: string;
    drawIndex: number;
    globalDrawNumber: number;
    selectionRule: GachaSelectionRule | null;
}>;
export type GachaHooks<TState, TReward> = Readonly<{
    isDuplicate: (state: TState, reward: TReward) => boolean;
    grantReward: (state: TState, reward: TReward, context: GachaGrantContext) => TState;
    grantDuplicate: (state: TState, reward: TReward, context: GachaGrantContext) => TState;
}>;
export type GachaDrawPayload = Readonly<{
    gachaId: string;
    entryId: string;
    drawIndex: number;
    globalDrawNumber: number;
    duplicate: boolean;
    duplicatePolicy: GachaDuplicatePolicy;
    selectionRule: GachaSelectionRule | null;
}>;
/**
 * Currency/Token spend -> named RNG draw -> pity/guarantee selection -> duplicate resolution -> grant -> state更新を
 * immutableな1 commandとして実行する。途中でrejectした場合は元stateを返す。
 *
 * Batch guaranteeは通常抽選後の結果を見て不足時だけbatch末尾を再抽選するため、
 * unconditional guaranteed slotとは乱数消費・確率分布が異なる。
 */
export declare function drawGacha<TGameData, TReward>(args: Readonly<{
    state: GameState<TGameData>;
    definition: GachaDefinition<TReward>;
    drawCount: number;
    hooks: GachaHooks<GameState<TGameData>, TReward>;
    resolveCurrencyDefinition?: CurrencyDefinitionResolver;
}>): CommandResult<GameState<TGameData>, 'invalid-draw-count' | 'insufficient-currency' | 'insufficient-token' | 'missing-rng-stream'>;
/** Weightの合計に対して [0,1) の乱数をdeterministically対応付ける。 */
export declare function pickWeightedEntry<TReward>(pool: readonly GachaPoolEntry<TReward>[], randomValue: number): GachaPoolEntry<TReward>;
