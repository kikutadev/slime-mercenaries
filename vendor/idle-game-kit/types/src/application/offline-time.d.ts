export type OfflineTimePolicy = Readonly<{
    /** 未指定ならuncapped。 */
    maxOfflineSec?: number;
}>;
export type OfflineElapsed = Readonly<{
    observedElapsedSec: number;
    appliedElapsedSec: number;
    discardedByCapSec: number;
    /** whole-second分だけwall clockを消費し、sub-second residualは次回へ残す。 */
    nextWallClockMs: number;
}>;
/**
 * saved/current wall clockからDomainへ渡すwhole-second elapsedを解決する。
 * clock rollbackは0へclampし、offline capで捨てた時間は次回resumeへ持ち越さない。
 */
export declare function resolveOfflineElapsed(lastWallClockMs: number, currentWallClockMs: number, policy?: OfflineTimePolicy): OfflineElapsed;
