import type { AuthenticatedPrincipal } from './authentication.js';
export type GameProfileOwnership = Readonly<{
    accountId: string;
    gameId: string;
    playerId: string;
    createdAtMs: number;
}>;
export type ClaimGameProfileInput = Readonly<{
    accountId: string;
    gameId: string;
    playerId: string;
    createdAtMs: number;
}>;
export type ClaimGameProfileResult = Readonly<{
    status: 'claimed';
    ownership: GameProfileOwnership;
}> | Readonly<{
    status: 'already-owned';
    ownership: GameProfileOwnership;
}> | Readonly<{
    status: 'conflict';
    ownership: GameProfileOwnership;
}>;
export interface GameProfileOwnershipRepository {
    findOwner(gameId: string, playerId: string): Promise<GameProfileOwnership | null>;
    listOwnedProfiles(accountId: string, gameId?: string): Promise<readonly GameProfileOwnership[]>;
    claimProfile(input: ClaimGameProfileInput): Promise<ClaimGameProfileResult>;
}
export declare function isValidIdentityPart(value: string): boolean;
export declare function validateGameProfileOwnershipInput(input: ClaimGameProfileInput): boolean;
/**
 * Minimal authorization helper for protected per-player operations.
 * A missing principal or malformed target never authorizes access.
 */
export declare function ownsGameProfile(repository: GameProfileOwnershipRepository, principal: AuthenticatedPrincipal | null, gameId: string, playerId: string): Promise<boolean>;
