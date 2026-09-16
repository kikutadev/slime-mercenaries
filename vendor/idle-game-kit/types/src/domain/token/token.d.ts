export type TokenBalances = Readonly<Record<string, number>>;
/** Countable token/ticketを非負safe integerとして読む。未作成tokenは0。 */
export declare function readToken(tokens: TokenBalances, tokenId: string): number;
/** Tokenをimmutableに加算する。 */
export declare function grantToken(tokens: TokenBalances, tokenId: string, count: number): TokenBalances;
/** 残高不足では元objectを維持してrejectする。 */
export declare function spendToken(tokens: TokenBalances, tokenId: string, count: number): Readonly<{
    accepted: true;
    tokens: TokenBalances;
}> | Readonly<{
    accepted: false;
    tokens: TokenBalances;
    reason: 'insufficient-token';
}>;
