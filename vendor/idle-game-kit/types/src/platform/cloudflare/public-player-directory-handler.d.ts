import type { PublicPlayerDirectoryReader } from '../../application/public-player-directory.js';
export type PublicPlayerDirectoryHandlerOptions = Readonly<{
    cacheControl?: string;
}>;
/**
 * Small same-origin Worker request handler for read-only public-player routes.
 * Compose it before an ASSETS fallback in a Cloudflare Worker.
 */
export declare function createPublicPlayerDirectoryHandler<TPublicData>(directory: PublicPlayerDirectoryReader<TPublicData>, options?: PublicPlayerDirectoryHandlerOptions): (request: Request) => Promise<Response | null>;
