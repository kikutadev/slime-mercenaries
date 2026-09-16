import type { RequestAuthenticator } from '../../application/authentication.js';
import type { GameProfileOwnershipRepository } from '../../application/game-profile-ownership.js';
/** Authenticated discovery route required for fresh-device Cloud Save restore. */
export declare function createOwnedGameProfilesHandler(authenticator: RequestAuthenticator, ownershipRepository: GameProfileOwnershipRepository): (request: Request) => Promise<Response | null>;
