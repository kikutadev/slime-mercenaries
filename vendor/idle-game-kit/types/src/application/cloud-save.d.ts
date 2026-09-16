import type { ProfileRepository, StoredProfile } from './profile-repository.js';
export type CloudSaveSnapshot<TPayload = unknown> = Readonly<{
    gameId: string;
    playerId: string;
    schemaVersion: number;
    revision: number;
    parentRevision: number | null;
    updatedAtMs: number;
    payload: TPayload;
}>;
export type CloudSaveWriteRequest<TPayload> = Readonly<{
    gameId: string;
    playerId: string;
    expectedRevision: number | null;
    /** Stable per-upload identifier. Reusing it makes transport retries idempotent. */
    operationId: string;
    schemaVersion: number;
    payload: TPayload;
}>;
export type CloudSaveReadResult<TPayload> = Readonly<{
    status: 'found';
    snapshot: CloudSaveSnapshot<TPayload>;
}> | Readonly<{
    status: 'missing';
}> | Readonly<{
    status: 'unauthorized' | 'forbidden' | 'unavailable' | 'error';
}>;
export type CloudSaveWriteResult<TPayload> = Readonly<{
    status: 'saved';
    snapshot: CloudSaveSnapshot<TPayload>;
}> | Readonly<{
    status: 'conflict';
    current: CloudSaveSnapshot<TPayload> | null;
}> | Readonly<{
    status: 'unauthorized' | 'forbidden' | 'rate-limited' | 'unavailable' | 'error';
}>;
/** Transport-neutral authenticated Cloud Save client boundary. */
export interface CloudSaveClient<TPayload = unknown> {
    getLatest(gameId: string, playerId: string): Promise<CloudSaveReadResult<TPayload>>;
    put(input: CloudSaveWriteRequest<TPayload>): Promise<CloudSaveWriteResult<TPayload>>;
}
export type CloudSaveSyncStatus = 'never-synced' | 'synced' | 'local-dirty' | 'conflict';
export type CloudSaveSyncState = Readonly<{
    gameId: string;
    playerId: string;
    lastSyncedRevision: number | null;
    lastSyncedPayloadFingerprint: string | null;
    lastSuccessfulSyncAtMs: number | null;
    status: CloudSaveSyncStatus;
}>;
/** Local-only metadata. It never becomes gameplay authority. */
export interface CloudSaveSyncMetadataRepository {
    load(gameId: string, playerId: string): Promise<CloudSaveSyncState | null>;
    save(state: CloudSaveSyncState): Promise<void>;
    delete(gameId: string, playerId: string): Promise<void>;
}
/** Server-side private snapshot persistence boundary. Authentication stays outside this interface. */
export interface CloudSaveSnapshotRepository<TPayload = unknown> {
    getLatest(gameId: string, playerId: string): Promise<CloudSaveSnapshot<TPayload> | null>;
    put(input: CloudSaveWriteRequest<TPayload>, updatedAtMs: number): Promise<Readonly<{
        status: 'saved';
        snapshot: CloudSaveSnapshot<TPayload>;
    }> | Readonly<{
        status: 'conflict';
        current: CloudSaveSnapshot<TPayload> | null;
    }>>;
    deleteAll(gameId: string, playerId: string): Promise<void>;
}
export type CloudSaveStateAdapter<TState, TPayload = unknown> = Readonly<{
    /** Current product schema version written to Cloud Save. */
    getSchemaVersion: (state: TState) => number;
    /** Convert an already-valid local state to its private cloud payload. */
    encode: (state: TState) => TPayload;
    /** Migrate / normalize / validate a remote payload before it can replace local state. */
    decode: (snapshot: CloudSaveSnapshot<TPayload>) => Promise<TState> | TState;
    /** Stable collision-resistant fingerprint used only for local dirty detection. */
    fingerprint: (state: TState) => Promise<string> | string;
}>;
export type CloudSaveConflict<TState, TPayload> = Readonly<{
    local: StoredProfile<TState>;
    remote: CloudSaveSnapshot<TPayload>;
    lastSyncedRevision: number | null;
}>;
export type CloudSaveSyncResult<TState, TPayload> = Readonly<{
    status: 'local-missing';
}> | Readonly<{
    status: 'synced';
    revision: number;
}> | Readonly<{
    status: 'uploaded';
    snapshot: CloudSaveSnapshot<TPayload>;
}> | Readonly<{
    status: 'restored';
    snapshot: CloudSaveSnapshot<TPayload>;
    state: TState;
}> | Readonly<{
    status: 'conflict';
    conflict: CloudSaveConflict<TState, TPayload>;
}> | Readonly<{
    status: 'unauthorized' | 'forbidden' | 'rate-limited' | 'unavailable' | 'error';
}>;
export type CloudSaveConflictResolution = 'keep-local' | 'use-cloud';
export type CloudSaveCoordinatorOptions<TState, TPayload> = Readonly<{
    gameId: string;
    playerId: string;
    profileId: string;
    localRepository: ProfileRepository<TState>;
    metadataRepository: CloudSaveSyncMetadataRepository;
    client: CloudSaveClient<TPayload>;
    stateAdapter: CloudSaveStateAdapter<TState, TPayload>;
    now?: () => number;
    operationIdFactory?: () => string;
    /** Optional product-owned backup hook invoked before a remote state replaces an existing local profile. */
    backupLocal?: (profile: StoredProfile<TState>) => Promise<void>;
}>;
/**
 * Local-first Cloud Save coordinator.
 *
 * Ordering invariants:
 * - upload always starts from an already-durable local profile;
 * - remote payload is decoded before any local mutation;
 * - local save completes before sync metadata is advanced;
 * - concurrent local/remote edits never silently use last-write-wins.
 */
export declare class CloudSaveCoordinator<TState, TPayload = unknown> {
    #private;
    constructor(options: CloudSaveCoordinatorOptions<TState, TPayload>);
    /** Mark a successful local checkpoint as dirty without performing network I/O. */
    markLocalDirty(): Promise<void>;
    sync(): Promise<CloudSaveSyncResult<TState, TPayload>>;
    resolveConflict(resolution: CloudSaveConflictResolution): Promise<CloudSaveSyncResult<TState, TPayload>>;
}
