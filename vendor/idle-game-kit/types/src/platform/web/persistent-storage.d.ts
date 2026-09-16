export type PersistentStorageRequestResult = 'already-persisted' | 'granted' | 'denied' | 'unsupported' | 'error';
type PersistentStorageManager = Readonly<{
    persisted?: () => Promise<boolean>;
    persist?: () => Promise<boolean>;
}>;
/**
 * Browserに永続storageをbest-effortで要求する。
 * 非対応・拒否・例外でもIndexedDB自体はそのまま利用でき、ゲーム起動を阻害しない。
 */
export declare function requestPersistentStorage(storage?: PersistentStorageManager | undefined): Promise<PersistentStorageRequestResult>;
export {};
