import type { CloudSaveSnapshotRepository } from '../../application/cloud-save.js';
import type { GameProfileOwnershipRepository } from '../../application/game-profile-ownership.js';
import type { PublicPlayerDirectoryReader, PublicPlayerSnapshotPublisher } from '../../application/public-player-directory.js';
import { type AuthenticatedPublicPlayerPublishHandlerOptions, type CloudSaveHandlerOptions, type PublicPlayerDirectoryHandlerOptions } from '../cloudflare.js';
import type { CloudflareBetterAuthRuntime } from '../cloudflare/better-auth-provider.js';
export type CloudflareAccountBackendCorsOptions = Readonly<{
    /** Exact browser origins allowed to use credentialed account APIs. */
    allowedOrigins: readonly string[];
    /** Defaults to content-type. */
    allowedHeaders?: readonly string[];
    /** Defaults to GET, HEAD, POST, PUT, DELETE, OPTIONS. */
    allowedMethods?: readonly string[];
    /** Defaults to 600 seconds. */
    maxAgeSec?: number;
}>;
export type CloudflareAccountBackendOptions<TPublicData, TCloudSavePayload = unknown> = Readonly<{
    auth: CloudflareBetterAuthRuntime;
    ownershipRepository: GameProfileOwnershipRepository;
    cloudSaveRepository?: CloudSaveSnapshotRepository<TCloudSavePayload>;
    cloudSave?: CloudSaveHandlerOptions;
    publicDirectory?: PublicPlayerDirectoryReader<TPublicData>;
    publicPublisher?: PublicPlayerSnapshotPublisher<TPublicData>;
    validatePublicData?: (value: unknown) => value is TPublicData;
    publicRead?: PublicPlayerDirectoryHandlerOptions;
    publicWrite?: Omit<AuthenticatedPublicPlayerPublishHandlerOptions<TPublicData>, 'validateData'>;
    authBasePath?: string;
    /** Explicit credentialed cross-origin policy for a dedicated account service. */
    cors?: CloudflareAccountBackendCorsOptions;
    /** Deployment-owned final fallback, normally `env.ASSETS.fetch(request)`. */
    fallback?: (request: Request) => Promise<Response>;
}>;
/**
 * Compose the standard Cloudflare account backend without leaking Better Auth
 * into product Domain/Application code.
 *
 * Routing order is deliberate: Better Auth -> profile claim -> authenticated
 * publish -> anonymous public read -> deployment fallback.
 */
export declare function createCloudflareAccountBackendHandler<TPublicData, TCloudSavePayload = unknown>(options: CloudflareAccountBackendOptions<TPublicData, TCloudSavePayload>): (request: Request) => Promise<Response>;
