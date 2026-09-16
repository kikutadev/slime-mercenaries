export type StoredProfile<TState> = Readonly<{
    profileId: string;
    savedAtMs: number;
    state: TState;
}>;
/** Platform storageへ依存しないprofile persistence境界。 */
export interface ProfileRepository<TState> {
    load(profileId: string): Promise<StoredProfile<TState> | null>;
    save(profile: StoredProfile<TState>): Promise<void>;
    delete(profileId: string): Promise<void>;
}
