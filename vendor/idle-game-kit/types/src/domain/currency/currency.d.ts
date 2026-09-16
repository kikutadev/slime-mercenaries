import { GameNumber, type GameNumberSerialized, type GameNumberSource } from '../number/game-number.js';
export type CurrencyId = string;
export type CurrencyRoundingMode = 'floor' | 'round' | 'ceil';
export type CurrencyDefinition = Readonly<{
    id: CurrencyId;
    displayName?: string;
    symbol?: string;
    /** Transaction amountの小数桁。roundingModeと同時指定する。 */
    precision?: number;
    roundingMode?: CurrencyRoundingMode;
    cap?: GameNumberSource;
    allowNegativeBalance?: boolean;
    resetPolicy?: 'retain' | 'reset';
}>;
export type CurrencyDefinitionResolver = (currencyId: CurrencyId) => CurrencyDefinition | undefined;
export type CurrencyBalances = Readonly<Record<CurrencyId, GameNumberSerialized>>;
export type CurrencyTransaction = Readonly<{
    currencyId: CurrencyId;
    amount: GameNumberSource;
    kind: 'earn' | 'spend';
    source: string;
}>;
export type CurrencyTransactionResult = Readonly<{
    accepted: true;
    balances: CurrencyBalances;
    appliedAmount: GameNumber;
}> | Readonly<{
    accepted: false;
    balances: CurrencyBalances;
    reason: 'insufficient-balance' | 'invalid-amount';
}>;
export declare const readCurrency: (balances: CurrencyBalances, currencyId: CurrencyId) => GameNumber;
/**
 * 1通貨のearn/spendをimmutableかつreject時no-mutationで適用する。
 * CurrencyDefinition指定時はtransaction amountをquantizeし、earn cap/negative-balance policyを同じ境界で適用する。
 */
export declare function applyCurrencyTransaction(balances: CurrencyBalances, transaction: CurrencyTransaction, definition?: CurrencyDefinition): CurrencyTransactionResult;
