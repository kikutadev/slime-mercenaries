import type { D1DatabaseLike, D1PreparedStatementLike } from './d1-public-player-directory.js';
export type D1BatchDatabaseLike = D1DatabaseLike & Readonly<{
    batch: (statements: readonly D1PreparedStatementLike[]) => Promise<unknown>;
}>;
/**
 * Deletes account-scoped game data before the authentication user row is removed.
 * The batch intentionally excludes Better Auth tables; Better Auth owns those.
 */
export declare class D1AccountDataCleanup {
    #private;
    constructor(db: D1BatchDatabaseLike);
    deleteAccountData(accountId: string): Promise<void>;
}
