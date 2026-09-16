export type SocialAuthProviderId = 'google';
export type AuthenticatedPrincipal = Readonly<{
    accountId: string;
}>;
export type AccountSession = Readonly<{
    principal: AuthenticatedPrincipal;
    expiresAtMs: number | null;
}>;
export type AuthenticationErrorCode = 'invalid-input' | 'invalid-credentials' | 'rate-limited' | 'unavailable' | 'provider-error' | 'unknown';
export type SocialSignInResult = Readonly<{
    status: 'redirect';
    url: string;
}> | Readonly<{
    status: 'unavailable';
}> | Readonly<{
    status: 'error';
    code: AuthenticationErrorCode;
}>;
/**
 * Provider-neutral browser/application authentication boundary.
 *
 * Implementations may use redirect-based OAuth, an HTTP façade, or a native
 * provider bridge. Provider-specific session/user objects must be projected
 * into the stable Kit types above before crossing this boundary.
 */
export interface AuthenticationClient {
    getSession(): Promise<AccountSession | null>;
    signInWithSocial(provider: SocialAuthProviderId, returnTo?: string): Promise<SocialSignInResult>;
    signOut(): Promise<void>;
}
/**
 * Server-side request authentication boundary used by protected Worker routes.
 * Authorization code must rely on the returned principal, never a client-body
 * account id.
 */
export interface RequestAuthenticator {
    authenticate(request: Request): Promise<AuthenticatedPrincipal | null>;
}
