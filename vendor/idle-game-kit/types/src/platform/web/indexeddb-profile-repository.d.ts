import type { ProfileRepository, StoredProfile } from '../../application/profile-repository.js';
/**
 * Browser IndexedDB adapter。GameStateはplain serializable objectとして保存し、
 * Domain/ApplicationはIDB APIを直接参照しない。
 */
export declare class IndexedDbProfileRepository<TState> implements ProfileRepository<TState> {
    #private;
    constructor(args: Readonly<{
        dbName: string;
        indexedDb?: IDBFactory;
        storeName?: string;
    }>);
    load(profileId: string): Promise<StoredProfile<TState> | null>;
    save(profile: StoredProfile<TState>): Promise<void>;
    delete(profileId: string): Promise<void>;
}
