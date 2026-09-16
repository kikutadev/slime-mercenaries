import type { RequestAuthenticator } from '../../application/authentication.js';
import type { CloudSaveSnapshotRepository } from '../../application/cloud-save.js';
import type { GameProfileOwnershipRepository } from '../../application/game-profile-ownership.js';
export type CloudSaveHandlerObservation = Readonly<{
    operation: 'read' | 'write' | 'delete';
    gameId: string;
    outcome: 'ok' | 'missing' | 'unauthenticated' | 'forbidden' | 'rate-limited' | 'invalid' | 'conflict' | 'failed';
    durationMs: number;
    payloadBytes?: number;
}>;
export type CloudSaveHandlerOptions = Readonly<{
    maxPayloadBytes?: number;
    now?: () => number;
    /** Deployment-owned abuse/rate-limit policy. Raw payload is deliberately not exposed. */
    allowWrite?: (input: Readonly<{
        accountId: string;
        gameId: string;
        playerId: string;
        request: Request;
    }>) => Promise<boolean>;
    /** Metadata-only observability. Never receives accountId, playerId or save payload. */
    observe?: (observation: CloudSaveHandlerObservation) => void;
}>;
/** Authenticated owner-only private Cloud Save GET/PUT/DELETE handler. */
export declare function createCloudSaveHandler<TPayload = unknown>(authenticator: RequestAuthenticator, ownershipRepository: GameProfileOwnershipRepository, repository: CloudSaveSnapshotRepository<TPayload>, options?: CloudSaveHandlerOptions): (request: Request) => Promise<Response | null>;
