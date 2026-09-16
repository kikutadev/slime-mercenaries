import type { PublicPlayerSnapshot, PublicPlayerSnapshotPublisher } from '../../application/public-player-directory.js';
import type { GameProfileOwnership } from '../../application/game-profile-ownership.js';
type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
export type OwnedGameProfileSummary = Readonly<{
    gameId: string;
    playerId: string;
    createdAtMs: number;
}>;
export type OwnedGameProfilesClientResult = Readonly<{
    status: 'ok';
    profiles: readonly OwnedGameProfileSummary[];
}> | Readonly<{
    status: 'unauthenticated' | 'unavailable';
}>;
export type GameProfileClaimClientResult = Readonly<{
    status: 'claimed' | 'already-owned';
    ownership: GameProfileOwnership;
}> | Readonly<{
    status: 'conflict';
}> | Readonly<{
    status: 'unauthenticated';
}> | Readonly<{
    status: 'unavailable';
}>;
export declare class AuthenticatedPlayerRequestError extends Error {
    readonly status: number;
    constructor(status: number, message: string);
}
/** Same-origin/browser client for the authenticated game-profile claim route. */
export declare class CloudflareGameProfileClaimClient {
    #private;
    constructor(args?: Readonly<{
        apiBaseUrl?: string;
        fetch?: FetchLike;
    }>);
    listOwned(gameId: string): Promise<OwnedGameProfilesClientResult>;
    claim(gameId: string, playerId: string): Promise<GameProfileClaimClientResult>;
}
/** Authenticated publisher for the protected public-player write route. */
export declare class CloudflareAuthenticatedPublicPlayerPublisher<TPublicData> implements PublicPlayerSnapshotPublisher<TPublicData> {
    #private;
    constructor(args?: Readonly<{
        apiBaseUrl?: string;
        fetch?: FetchLike;
    }>);
    publishPublicPlayer(snapshot: PublicPlayerSnapshot<TPublicData>): Promise<void>;
}
export {};
