/**
 * A deliberately public projection of one player's state.
 *
 * Never place a full save, auth token, email address, purchase state, or other
 * private/account data in this payload. Products own the shape of `data` and
 * should publish only fields that are safe to show to another player.
 */
export type PublicPlayerSnapshot<TPublicData> = Readonly<{
    gameId: string;
    playerId: string;
    displayName: string;
    schemaVersion: number;
    revision: number;
    updatedAtMs: number;
    data: TPublicData;
}>;
export type PublicPlayerListQuery = Readonly<{
    gameId: string;
    limit?: number;
    cursor?: string;
}>;
export type PublicPlayerPage<TPublicData> = Readonly<{
    players: readonly PublicPlayerSnapshot<TPublicData>[];
    nextCursor: string | null;
}>;
/**
 * Read-only boundary for optional social discovery.
 *
 * Solo gameplay must not depend on this capability being reachable. A product
 * can omit the reader entirely and remain fully playable offline/local-first.
 */
export interface PublicPlayerDirectoryReader<TPublicData> {
    getPublicPlayer(gameId: string, playerId: string): Promise<PublicPlayerSnapshot<TPublicData> | null>;
    listPublicPlayers(query: PublicPlayerListQuery): Promise<PublicPlayerPage<TPublicData>>;
}
/**
 * Publishing is intentionally separate from reading because authentication,
 * abuse prevention, and ownership checks belong to deployment/backend policy.
 */
export interface PublicPlayerSnapshotPublisher<TPublicData> {
    publishPublicPlayer(snapshot: PublicPlayerSnapshot<TPublicData>): Promise<void>;
}
