import type { PublicPlayerDirectoryReader, PublicPlayerListQuery, PublicPlayerPage, PublicPlayerSnapshot, PublicPlayerSnapshotPublisher } from '../../application/public-player-directory.js';
export type D1PreparedStatementLike = Readonly<{
    bind: (...values: readonly unknown[]) => D1PreparedStatementLike;
    first: <T = Record<string, unknown>>() => Promise<T | null>;
    all: <T = Record<string, unknown>>() => Promise<Readonly<{
        results?: readonly T[];
    }>>;
    run: () => Promise<unknown>;
}>;
export type D1DatabaseLike = Readonly<{
    prepare: (sql: string) => D1PreparedStatementLike;
}>;
/**
 * Cloudflare D1 implementation of the public-player projection store.
 *
 * The caller is responsible for authenticating/authorizing publishes before
 * invoking `publishPublicPlayer`. This store deliberately has no account model.
 */
export declare class D1PublicPlayerDirectory<TPublicData> implements PublicPlayerDirectoryReader<TPublicData>, PublicPlayerSnapshotPublisher<TPublicData> {
    #private;
    constructor(db: D1DatabaseLike);
    getPublicPlayer(gameId: string, playerId: string): Promise<PublicPlayerSnapshot<TPublicData> | null>;
    listPublicPlayers(query: PublicPlayerListQuery): Promise<PublicPlayerPage<TPublicData>>;
    publishPublicPlayer(snapshot: PublicPlayerSnapshot<TPublicData>): Promise<void>;
}
