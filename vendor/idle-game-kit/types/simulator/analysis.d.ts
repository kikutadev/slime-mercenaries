import type { SimulatorMilestoneHit, SimulatorWaitWindow } from './runner.js';
export type MilestoneWait = Readonly<{
    fromMilestoneId: string;
    toMilestoneId: string;
    durationSec: number;
}>;
export type NoActionSummary = Readonly<{
    totalDurationSec: number;
    maxWindowSec: number;
    windows: readonly SimulatorWaitWindow[];
}>;
/**
 * Milestone hit列から隣接milestone間の待ち時間を計算する。
 * ゲーム固有のprogress scoreを仮定せず、definition側が選んだmilestoneだけを使う。
 */
export declare function calculateMilestoneWaits(hits: readonly SimulatorMilestoneHit[]): readonly MilestoneWait[];
/**
 * policyが「meaningful commandなし」と分類した待機だけを集約する。
 * 戦略的な待機やsession gapはno-action windowへ混ぜない。
 */
export declare function summarizeNoActionWindows(waitWindows: readonly SimulatorWaitWindow[]): NoActionSummary;
export type MilestoneWallPhase = Readonly<{
    id: string;
    fromMilestoneId: string;
    toMilestoneId: string;
    totalRuns: number;
    reachedRuns: number;
    stuckProbability: number;
    p50WaitSec: number;
    p90WaitSec: number;
    maxWaitSec: number;
}>;
/**
 * 複数runの隣接milestone waitをphase単位へ集約する。
 * milestone自体はgame側が定義し、kitはthemeやprogress scoreを仮定しない。
 */
export declare function summarizeMilestoneWallPhases(runs: readonly Readonly<{
    milestoneHits: readonly SimulatorMilestoneHit[];
}>[]): readonly MilestoneWallPhase[];
