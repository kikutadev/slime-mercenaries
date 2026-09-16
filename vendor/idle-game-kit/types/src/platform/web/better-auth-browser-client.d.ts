import type { AccountSession, AuthenticationClient, SocialAuthProviderId, SocialSignInResult } from '../../application/authentication.js';
export type BetterAuthBrowserClientOptions = Readonly<{
    authBaseUrl?: string;
    fetch?: typeof globalThis.fetch;
}>;
/**
 * Browser-side Better Auth adapter using its stable HTTP endpoints directly.
 * This keeps `idle-game-kit/web` free of a runtime dependency on the Better Auth
 * client package while containing the provider wire protocol in one adapter.
 */
export declare class BetterAuthBrowserAuthenticationClient implements AuthenticationClient {
    #private;
    constructor(options?: BetterAuthBrowserClientOptions);
    getSession(): Promise<AccountSession | null>;
    signInWithSocial(provider: SocialAuthProviderId, returnTo?: string): Promise<SocialSignInResult>;
    signOut(): Promise<void>;
}
