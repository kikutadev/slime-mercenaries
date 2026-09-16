import { type StateLoadResult, type StateMigration } from './state-migration.js';
export declare const SAVE_FORMAT_ID = "idle-game-kit-save-v1";
export type SaveEnvelope<TState> = Readonly<{
    formatId: typeof SAVE_FORMAT_ID;
    gameId: string;
    exportedAtMs: number;
    state: TState;
}>;
export type ImportResult<TState> = Readonly<{
    accepted: true;
    envelope: SaveEnvelope<TState>;
}> | Readonly<{
    accepted: false;
    reason: 'invalid-json' | 'invalid-envelope' | 'wrong-game' | 'invalid-state';
}>;
export type ParsedSaveEnvelopeResult = Readonly<{
    accepted: true;
    envelope: SaveEnvelope<unknown>;
}> | Readonly<{
    accepted: false;
    reason: 'invalid-json' | 'invalid-envelope' | 'wrong-game';
}>;
export type MigratedImportResult<TState> = Readonly<{
    accepted: true;
    envelope: SaveEnvelope<TState>;
    stateLoad: Extract<StateLoadResult<TState>, Readonly<{
        accepted: true;
    }>>;
}> | Readonly<{
    accepted: false;
    reason: 'invalid-json' | 'invalid-envelope' | 'wrong-game';
}> | Readonly<{
    accepted: false;
    reason: 'invalid-state';
    stateLoad: Extract<StateLoadResult<TState>, Readonly<{
        accepted: false;
    }>>;
}>;
export declare function serializeSave<TState extends Readonly<{
    gameId: string;
}>>(state: TState, exportedAtMs: number): string;
/** Parse only the portable envelope. Product state validation/migration happens after this boundary. */
export declare function parseSaveEnvelope(text: string, expectedGameId: string): ParsedSaveEnvelopeResult;
/** parse/validate完了前にはcurrent stateへ一切触れない。 */
export declare function parseSaveImport<TState>(text: string, expectedGameId: string, validateState: (candidate: unknown) => candidate is TState): ImportResult<TState>;
/**
 * Portable save import path for products that support older schema versions.
 * Envelope parsing happens first, then the same explicit migration/normalization pipeline used by
 * persisted profile loading. Callers still own backup + commit after this function succeeds.
 */
export declare function parseMigratedSaveImport<TState>(args: Readonly<{
    text: string;
    expectedGameId: string;
    currentSchemaVersion: number;
    migrations?: readonly StateMigration[];
    normalize?: (candidate: unknown) => unknown;
    validate: (candidate: unknown) => candidate is TState;
}>): MigratedImportResult<TState>;
