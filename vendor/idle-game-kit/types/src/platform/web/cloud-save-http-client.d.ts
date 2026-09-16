import type { CloudSaveClient, CloudSaveReadResult, CloudSaveWriteRequest, CloudSaveWriteResult } from '../../application/cloud-save.js';
export type CloudSaveHttpClientOptions = Readonly<{
    apiBaseUrl?: string;
    fetch?: typeof globalThis.fetch;
    timeoutMs?: number;
    /** Delays before transient retries. Defaults to 150ms then 500ms. */
    retryDelaysMs?: readonly number[];
    sleep?: (delayMs: number) => Promise<void>;
}>;
export type CloudSaveDeleteResult = 'deleted' | 'unauthorized' | 'forbidden' | 'unavailable' | 'error';
/** Credentialed browser HTTP adapter for the standard Cloud Save Worker routes. */
export declare class CloudSaveHttpClient<TPayload = unknown> implements CloudSaveClient<TPayload> {
    #private;
    constructor(options?: CloudSaveHttpClientOptions);
    getLatest(gameId: string, playerId: string): Promise<CloudSaveReadResult<TPayload>>;
    put(input: CloudSaveWriteRequest<TPayload>): Promise<CloudSaveWriteResult<TPayload>>;
    deleteRemote(gameId: string, playerId: string): Promise<CloudSaveDeleteResult>;
}
