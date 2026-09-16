import type { CharacterStates } from './character/character.js';
import type { CurrencyBalances } from './currency/currency.js';
import type { ProducerStates } from './producer/producer.js';
import type { RngStreamStates } from './rng/rng.js';
import type { GachaStates } from './gacha/gacha.js';
import type { TokenBalances } from './token/token.js';
import type { ActiveBoostStates } from './boost/boost.js';
import type { PrestigeStates } from './prestige/prestige.js';
import type { CalendarRewardStates } from './calendar/calendar-reward.js';
import type { MissionSetStates, MissionStates } from './mission/mission.js';
export type AchievementState = Readonly<Record<string, boolean>>;
export type ProgressionFlags = Readonly<Record<string, boolean>>;
export type TitleState = Readonly<Record<string, boolean>>;
export type GameState<TGameData = unknown> = Readonly<{
    schemaVersion: number;
    gameId: string;
    definitionVersion: string;
    createdAtMs: number;
    simTimeSec: number;
    lastWallClockMs: number;
    currencies: CurrencyBalances;
    tokens: TokenBalances;
    producers: ProducerStates;
    characters: CharacterStates;
    achievements: AchievementState;
    titles: TitleState;
    progressionFlags: ProgressionFlags;
    rngStreams: RngStreamStates;
    gachaStates: GachaStates;
    activeBoosts: ActiveBoostStates;
    recentExternalRewardGrantIds: readonly string[];
    prestigeStates: PrestigeStates;
    calendarRewardStates: CalendarRewardStates;
    /** Missionは後方互換のためoptional。Mission未使用productの既存save/stateを壊さない。 */
    missionStates?: MissionStates;
    missionSetStates?: MissionSetStates;
    statistics: Readonly<{
        lifetimeCurrencyEarned: Readonly<Record<string, import('./number/game-number.js').GameNumberSerialized>>;
        lifetimeCurrencySpent: Readonly<Record<string, import('./number/game-number.js').GameNumberSerialized>>;
    }>;
    gameData: TGameData;
}>;
export type DomainEvent = Readonly<{
    id: string;
    type: string;
    simTimeSec: number;
    payload?: Readonly<Record<string, unknown>>;
}>;
export type AcceptedCommand<TState> = Readonly<{
    accepted: true;
    state: TState;
    events: readonly DomainEvent[];
}>;
export type RejectedCommand<TState, TReason extends string = string> = Readonly<{
    accepted: false;
    state: TState;
    events: readonly [];
    reason: TReason;
}>;
export type CommandResult<TState, TReason extends string = string> = AcceptedCommand<TState> | RejectedCommand<TState, TReason>;
