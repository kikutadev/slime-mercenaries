import type { CloudSaveSnapshot, CloudSaveSnapshotRepository, CloudSaveWriteRequest } from '../../application/cloud-save.js';
import type { D1DatabaseLike } from './d1-public-player-directory.js';
export type D1CloudSaveRepositoryOptions = Readonly<{
    /** Bounded recovery history. Defaults to the newest 20 revisions. */
    retentionCount?: number;
    /** Safe metadata-only maintenance hook. Never receives save payloads. */
    onMaintenanceError?: (input: Readonly<{
        operation: 'retention-prune';
        gameId: string;
        playerId: string;
        error: unknown;
    }>) => void;
}>;
/**
 * Append-only D1 Cloud Save repository.
 *
 * Revision rows are the source of truth. The unique
 * (game_id, player_id, revision) key arbitrates revision races, while write_id
 * makes transport retries of the same logical upload idempotent.
 */
export declare class D1CloudSaveRepository<TPayload = unknown> implements CloudSaveSnapshotRepository<TPayload> {
    #private;
    constructor(db: D1DatabaseLike, options?: D1CloudSaveRepositoryOptions);
    getLatest(gameId: string, playerId: string): Promise<CloudSaveSnapshot<TPayload> | null>;
    put(input: CloudSaveWriteRequest<TPayload>, updatedAtMs: number): Promise<Readonly<{
        status: 'saved';
        snapshot: CloudSaveSnapshot<TPayload>;
    }> | Readonly<{
        status: 'conflict';
        current: CloudSaveSnapshot<TPayload> | null;
    }>>;
    deleteAll(gameId: string, playerId: string): Promise<void>;
    /** Cloud Save portion of account-removal cleanup. Ownership cleanup remains a separate capability. */
    deleteAllForAccount(accountId: string): Promise<void>;
    /** Keep only the newest N revisions for bounded recovery history. */
    pruneHistory(gameId: string, playerId: string, keepLatestCount?: number): Promise<void>;
}
