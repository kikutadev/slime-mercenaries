export type StateMigration = Readonly<{
    fromSchemaVersion: number;
    toSchemaVersion: number;
    migrate: (candidate: unknown) => unknown;
}>;
export type StateLoadRejectionReason = 'not-object' | 'wrong-game' | 'invalid-schema-version' | 'newer-schema' | 'missing-migration' | 'migration-failed' | 'normalization-failed' | 'invalid-state';
export type StateLoadResult<TState> = Readonly<{
    accepted: true;
    state: TState;
    initialSchemaVersion: number;
    finalSchemaVersion: number;
    migrationCount: number;
    normalized: boolean;
}> | Readonly<{
    accepted: false;
    reason: StateLoadRejectionReason;
    schemaVersion?: number;
    failedFromSchemaVersion?: number;
}>;
/**
 * Runs an explicit, versioned migration chain before product-owned normalization and strict validation.
 *
 * The kit owns only orchestration. Field defaults, renamed IDs, removed content and definition-version
 * compatibility remain product decisions. Every migration must advance schemaVersion and preserve gameId.
 */
export declare function migrateNormalizeAndValidateState<TState>(args: Readonly<{
    candidate: unknown;
    expectedGameId: string;
    currentSchemaVersion: number;
    migrations?: readonly StateMigration[];
    normalize?: (candidate: unknown) => unknown;
    validate: (candidate: unknown) => candidate is TState;
}>): StateLoadResult<TState>;
