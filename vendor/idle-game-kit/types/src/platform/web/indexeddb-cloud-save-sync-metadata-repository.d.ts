import type { CloudSaveSyncMetadataRepository, CloudSaveSyncState } from '../../application/cloud-save.js';
/** Browser-local Cloud Save metadata store. Gameplay state remains in ProfileRepository. */
export declare class IndexedDbCloudSaveSyncMetadataRepository implements CloudSaveSyncMetadataRepository {
    #private;
    constructor(args: Readonly<{
        dbName: string;
        indexedDb?: IDBFactory;
        storeName?: string;
    }>);
    load(gameId: string, playerId: string): Promise<CloudSaveSyncState | null>;
    save(state: CloudSaveSyncState): Promise<void>;
    delete(gameId: string, playerId: string): Promise<void>;
}
