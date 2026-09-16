export type StateListener = () => void;
/**
 * React DOM / React Nativeの双方から購読できる最小external-store実装。
 * Domain transitionは外からpure functionとして渡し、UI state frameworkをkit必須依存にしない。
 */
export declare class ApplicationStore<TState> {
    #private;
    constructor(initialState: TState);
    getSnapshot: () => TState;
    subscribe: (listener: StateListener) => (() => void);
    replaceState(nextState: TState): void;
    update(updater: (state: TState) => TState): void;
}
