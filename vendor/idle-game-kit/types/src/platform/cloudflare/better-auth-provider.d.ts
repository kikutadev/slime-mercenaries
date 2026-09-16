import type { RequestAuthenticator } from '../../application/authentication.js';
export type BetterAuthSocialProviderConfig = Readonly<{
    clientId: string | readonly string[];
    clientSecret: string;
    redirectURI?: string;
}>;
export type CloudflareBetterAuthConfig = Readonly<{
    /** Cloudflare D1 binding. Kept structurally opaque so Better Auth types do not leak into Core contracts. */
    database: unknown;
    secret: string;
    baseURL: string;
    trustedOrigins?: readonly string[];
    google?: BetterAuthSocialProviderConfig;
    accountIdFactory?: () => string;
    /** Optional account-scoped game-data cleanup invoked before Better Auth deletes the user row. */
    deleteAccountData?: (accountId: string) => Promise<void>;
}>;
export type CloudflareBetterAuthRuntime = Readonly<{
    handler(request: Request): Promise<Response>;
    authenticator: RequestAuthenticator;
}>;
/** Cloudflare/Better Auth production adapter with Google as the only configured social provider. */
export declare function createCloudflareBetterAuth(config: CloudflareBetterAuthConfig): CloudflareBetterAuthRuntime;
