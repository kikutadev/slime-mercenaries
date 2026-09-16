import { type Condition, type ConditionContext } from '../condition/condition.js';
import { type CurrencyDefinitionResolver } from '../currency/currency.js';
import { type Modifier } from '../modifier/modifier.js';
import { type GameNumberSource } from '../number/game-number.js';
import type { CommandResult, GameState } from '../state.js';
export type ActiveGainDefinition = Readonly<{
    id: string;
    currencyId: string;
    baseAmount: GameNumberSource;
    eligibility?: Condition;
}>;
/**
 * click/tap等の能動操作をplatform-neutralな1 commandとして処理する。
 * UI event自体は持たず、eligibility・modifier・currency grantだけをDomainで確定する。
 */
export declare function executeActiveGain<TGameData>(args: Readonly<{
    state: GameState<TGameData>;
    definition: ActiveGainDefinition;
    modifiers?: readonly Modifier[];
    createConditionContext?: (state: GameState<TGameData>) => ConditionContext;
    resolveCurrencyDefinition?: CurrencyDefinitionResolver;
}>): CommandResult<GameState<TGameData>, 'ineligible' | 'no-effective-gain'>;
