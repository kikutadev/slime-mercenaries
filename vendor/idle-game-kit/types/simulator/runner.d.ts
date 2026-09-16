import type { CommandResult, DomainEvent } from '../src/domain/state.js';
export type SimulatorAction<TCommand> = Readonly<{
    kind: 'command';
    command: TCommand;
}> | Readonly<{
    kind: 'wait-until';
    simTimeSec: number;
    reason: string;
    classification: 'no-action' | 'strategic' | 'session-gap';
}> | Readonly<{
    kind: 'stop';
    reason: string;
}>;
export type SimulatorAdapter<TState, TCommand> = Readonly<{
    getSimTimeSec: (state: TState) => number;
    advanceTo: (state: TState, targetSimTimeSec: number) => Readonly<{
        state: TState;
        events: readonly DomainEvent[];
    }>;
    executeCommand: (state: TState, command: TCommand) => CommandResult<TState, string>;
}>;
export type SimulatorPolicy<TState, TCommand> = Readonly<{
    id: string;
    version: string;
    chooseAction: (state: TState) => SimulatorAction<TCommand>;
}>;
export type SimulatorMilestone<TState> = Readonly<{
    id: string;
    reached: (state: TState) => boolean;
}>;
export type SimulatorMilestoneHit = Readonly<{
    id: string;
    simTimeSec: number;
}>;
export type SimulatorWaitWindow = Readonly<{
    fromSimTimeSec: number;
    toSimTimeSec: number;
    durationSec: number;
    reason: string;
    classification: 'no-action' | 'strategic' | 'session-gap';
}>;
export type SimulatorRunResult<TState> = Readonly<{
    finalState: TState;
    stopReason: string;
    steps: number;
    milestoneHits: readonly SimulatorMilestoneHit[];
    waitWindows: readonly SimulatorWaitWindow[];
    events: readonly DomainEvent[];
}>;
/**
 * Productionと同じcommand/advance経路を使う、小さなheadless simulation runner。
 * policyが次の意味あるcommandまたは時刻境界を選び、runner自体はゲーム固有判断を持たない。
 */
export declare function runSimulation<TState, TCommand>(args: Readonly<{
    initialState: TState;
    adapter: SimulatorAdapter<TState, TCommand>;
    policy: SimulatorPolicy<TState, TCommand>;
    milestones?: readonly SimulatorMilestone<TState>[];
    maxSimTimeSec: number;
    maxSteps?: number;
}>): SimulatorRunResult<TState>;
