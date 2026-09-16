import type { PublicPlayerDirectoryReader, PublicPlayerListQuery, PublicPlayerPage, PublicPlayerSnapshot } from '../../application/public-player-directory.js';
type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
export declare class PublicPlayerDirectoryRequestError extends Error {
    readonly status: number;
    constructor(status: number, message: string);
}
export declare class PublicPlayerDirectoryProtocolError extends Error {
    constructor(message: string);
}
/**
 * Browser/Worker HTTP adapter for the Kit public-player contract.
 *
 * The server can be a Cloudflare Worker backed by D1. This adapter is read-only
 * on purpose: publishing should only be enabled after the product has an
 * authenticated ownership story.
 */
export declare class CloudflarePublicPlayerDirectory<TPublicData> implements PublicPlayerDirectoryReader<TPublicData> {
    #private;
    constructor(args: Readonly<{
        apiBaseUrl: string;
        fetch?: FetchLike;
    }>);
    getPublicPlayer(gameId: string, playerId: string): Promise<PublicPlayerSnapshot<TPublicData> | null>;
    listPublicPlayers(query: PublicPlayerListQuery): Promise<PublicPlayerPage<TPublicData>>;
}
export {};
