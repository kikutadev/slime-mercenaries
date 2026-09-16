import type { DomainEvent } from '../state.js';
export type OpportunityOfflinePolicy = 'elapse' | 'pause';
export type OpportunityDismissalPolicy = 'allow' | 'forbid';
/**
 * 一時的に出現し、期限内にacceptするか見送るかを判断する機会の共通定義。
 * 出現頻度・抽選・payloadの意味はproduct側が所有し、kitはlifecycleだけを管理する。
 */
export type OpportunityDefinition = Readonly<{
    id: string;
    lifetimeSec: number;
    offlinePolicy?: OpportunityOfflinePolicy;
    dismissalPolicy?: OpportunityDismissalPolicy;
}>;
export type OpportunityStatus = 'open' | 'accepted' | 'expired' | 'dismissed';
/**
 * reward額や対象Characterなど「提示時点で固定すべき値」はsnapshotへ保存する。
 * これによりaccept時の再計算による価格・報酬ドリフトを避けられる。
 */
export type OpportunityState<TSnapshot = unknown> = Readonly<{
    instanceId: string;
    opportunityId: string;
    status: OpportunityStatus;
    offeredAtSimTimeSec: number;
    expiresAtSimTimeSec: number;
    resolvedAtSimTimeSec: number | null;
    snapshot: TSnapshot;
}>;
export type OpportunityTransitionResult<TSnapshot> = Readonly<{
    opportunity: OpportunityState<TSnapshot>;
    events: readonly DomainEvent[];
}>;
export type OpportunityCommandResult<TSnapshot, TReason extends string> = Readonly<{
    accepted: true;
    opportunity: OpportunityState<TSnapshot>;
    events: readonly DomainEvent[];
}> | Readonly<{
    accepted: false;
    opportunity: OpportunityState<TSnapshot>;
    events: readonly [];
    reason: TReason;
}>;
/** 提示時刻とdefinitionから期限を固定し、presentation非依存のoffer eventを返す。 */
export declare function createOpportunityState<TSnapshot>(args: Readonly<{
    definition: OpportunityDefinition;
    instanceId: string;
    offeredAtSimTimeSec: number;
    snapshot: TSnapshot;
}>): OpportunityTransitionResult<TSnapshot>;
/**
 * virtual timeを進め、期限を跨いだopen opportunityだけを一度expiredへ遷移する。
 * offlinePolicy=pauseでは離席時間ぶん期限を後ろへずらす。
 */
export declare function advanceOpportunity<TSnapshot>(args: Readonly<{
    opportunity: OpportunityState<TSnapshot>;
    definition: OpportunityDefinition;
    targetSimTimeSec: number;
    offlineElapsedSec?: number;
}>): OpportunityTransitionResult<TSnapshot>;
/** 期限内のopen opportunityをaccept済みにする。payload適用はproduct command側でatomicに接続する。 */
export declare function acceptOpportunity<TSnapshot>(args: Readonly<{
    opportunity: OpportunityState<TSnapshot>;
    definition: OpportunityDefinition;
    acceptedAtSimTimeSec: number;
}>): OpportunityCommandResult<TSnapshot, 'not-open' | 'expired'>;
/** 明示的に見送れるopportunityをdismissedへ遷移する。 */
export declare function dismissOpportunity<TSnapshot>(args: Readonly<{
    opportunity: OpportunityState<TSnapshot>;
    definition: OpportunityDefinition;
    dismissedAtSimTimeSec: number;
}>): OpportunityCommandResult<TSnapshot, 'not-open' | 'expired' | 'dismissal-forbidden'>;
/** UI countdown用。open以外は常に0を返す。 */
export declare function opportunityRemainingSec<TSnapshot>(opportunity: OpportunityState<TSnapshot>, simTimeSec: number): number;
export declare function validateOpportunityDefinition(definition: OpportunityDefinition): void;
