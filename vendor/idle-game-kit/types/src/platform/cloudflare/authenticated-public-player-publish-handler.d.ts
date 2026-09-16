import type { RequestAuthenticator } from '../../application/authentication.js';
import type { GameProfileOwnershipRepository } from '../../application/game-profile-ownership.js';
import type { PublicPlayerSnapshotPublisher } from '../../application/public-player-directory.js';
export type AuthenticatedPublicPlayerPublishHandlerOptions<TPublicData> = Readonly<{
    validateData: (value: unknown) => value is TPublicData;
    maxBodyBytes?: number;
    maxDisplayNameLength?: number;
    /** Return false to rate-limit or otherwise suppress this write at deployment level. */
    allowWrite?: (input: Readonly<{
        accountId: string;
        gameId: string;
        playerId: string;
        request: Request;
    }>) => Promise<boolean>;
}>;
/**
 * Authenticated/authorized public-player write handler.
 * Public reads remain handled independently by createPublicPlayerDirectoryHandler.
 */
export declare function createAuthenticatedPublicPlayerPublishHandler<TPublicData>(authenticator: RequestAuthenticator, ownershipRepository: GameProfileOwnershipRepository, publisher: PublicPlayerSnapshotPublisher<TPublicData>, options: AuthenticatedPublicPlayerPublishHandlerOptions<TPublicData>): (request: Request) => Promise<Response | null>;
