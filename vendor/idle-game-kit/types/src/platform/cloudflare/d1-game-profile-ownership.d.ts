import type { ClaimGameProfileInput, ClaimGameProfileResult, GameProfileOwnership, GameProfileOwnershipRepository } from '../../application/game-profile-ownership.js';
import type { D1DatabaseLike } from './d1-public-player-directory.js';
/**
 * D1 ownership repository. The unique (game_id, player_id) constraint is the
 * authority that prevents concurrent claims from stealing a profile.
 */
export declare class D1GameProfileOwnershipRepository implements GameProfileOwnershipRepository {
    #private;
    constructor(db: D1DatabaseLike);
    findOwner(gameId: string, playerId: string): Promise<GameProfileOwnership | null>;
    listOwnedProfiles(accountId: string, gameId?: string): Promise<readonly GameProfileOwnership[]>;
    claimProfile(input: ClaimGameProfileInput): Promise<ClaimGameProfileResult>;
}
