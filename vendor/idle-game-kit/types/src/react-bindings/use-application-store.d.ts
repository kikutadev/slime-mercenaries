export interface ReadableApplicationStore<TState> {
    readonly getSnapshot: () => TState;
    readonly subscribe: (listener: () => void) => () => void;
}
/**
 * Connects the kit's external-store contract to React without making React a
 * dependency of Domain/Application code.
 */
export declare function useApplicationStore<TState>(store: ReadableApplicationStore<TState>): TState;
