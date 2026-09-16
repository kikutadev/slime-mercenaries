import type { RequestAuthenticator } from '../../application/authentication.js';
import type { GameProfileOwnershipRepository } from '../../application/game-profile-ownership.js';
export type GameProfileClaimHandlerOptions = Readonly<{
    now?: () => number;
}>;
/**
 * Same-origin Worker handler for claiming a game/player identity after
 * authentication. The account id always comes from the authenticated request.
 */
export declare function createGameProfileClaimHandler(authenticator: RequestAuthenticator, ownershipRepository: GameProfileOwnershipRepository, options?: GameProfileClaimHandlerOptions): (request: Request) => Promise<Response | null>;
