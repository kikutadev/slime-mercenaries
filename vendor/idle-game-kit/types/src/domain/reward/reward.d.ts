import { type CurrencyDefinitionResolver } from '../currency/currency.js';
import { GameNumber, type GameNumberSource } from '../number/game-number.js';
import type { GameState } from '../state.js';
export type Reward = Readonly<{
    type: 'currency';
    currencyId: string;
    amount: GameNumberSource;
    source: string;
}> | Readonly<{
    type: 'producer';
    producerId: string;
    count: number;
}> | Readonly<{
    type: 'character';
    characterDefinitionId: string;
}> | Readonly<{
    type: 'token';
    tokenId: string;
    count: number;
}> | Readonly<{
    type: 'boost';
    boostId: string;
}> | Readonly<{
    type: 'permanent-modifier';
    modifierId: string;
}> | Readonly<{
    type: 'activity-advance';
    activityId: string;
    seconds: number;
}> | Readonly<{
    type: 'title';
    titleId: string;
}> | Readonly<{
    type: 'unlock';
    flagId: string;
}> | Readonly<{
    type: 'composite';
    rewards: readonly Reward[];
}>;
export type RewardApplicationHooks<TState> = Readonly<{
    resolveCurrencyDefinition?: CurrencyDefinitionResolver;
    /** Character instance IDや初期traitはgame/plugin側が決める。 */
    grantCharacter?: (state: TState, characterDefinitionId: string) => TState;
    /** Boost definition lookupとstacking適用はgame/plugin側が接続する。 */
    activateBoost?: (state: TState, boostId: string) => TState;
    /** Permanent modifierの保存先・重複policyはgame固有progressionへ委譲する。 */
    grantPermanentModifier?: (state: TState, modifierId: string) => TState;
    /** Timed Activity等のtime advanceはgame/plugin側のActivity stateへ委譲する。 */
    advanceActivity?: (state: TState, activityId: string, seconds: number) => TState;
}>;
/**
 * 失敗しないgrant系Rewardを共通適用する。
 * Character / Boost / Permanent Modifierは標準Rewardとして表現するが、game固有stateへの適用だけtyped hookへ委譲する。
 * spendを含むatomic commandはApplication/Product command側で事前検証してからcommitする。
 */
export declare function applyRewards<TGameData>(state: GameState<TGameData>, rewards: readonly Reward[], hooks?: RewardApplicationHooks<GameState<TGameData>>): GameState<TGameData>;
export declare function recordCurrencySpend<TGameData>(state: GameState<TGameData>, currencyId: string, amount: GameNumberSource): GameState<TGameData>;
export declare const currencyBalance: <TGameData>(state: GameState<TGameData>, currencyId: string) => GameNumber;
