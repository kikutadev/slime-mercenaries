export type AttentionUrgency = 'notice' | 'action' | 'urgent';
/**
 * Product selectorがstateから導出する「今見る価値があるもの」のheadless表現。
 * label/icon/navigationはpresentation責務とし、kitは優先順位と期限だけを扱う。
 */
export type AttentionCandidate<TKind extends string = string> = Readonly<{
    id: string;
    kind: TKind;
    urgency: AttentionUrgency;
    priority: number;
    available: boolean;
    expiresAtSimTimeSec?: number;
}>;
export type AttentionSummary<TKind extends string = string> = Readonly<{
    items: readonly AttentionCandidate<TKind>[];
    primary: AttentionCandidate<TKind> | null;
    count: number;
    actionableCount: number;
    urgentCount: number;
}>;
/**
 * availableかつ未失効のcandidateだけをdeterministicに並べる。
 * urgency -> authored priority -> 期限が近い順 -> ID順で、renderごとの順序揺れを防ぐ。
 */
export declare function selectAttentionSummary<TKind extends string>(candidates: readonly AttentionCandidate<TKind>[], simTimeSec: number): AttentionSummary<TKind>;
/**
 * Productが「少し先に何を期待させるか」を表すnormalized target。
 * progressは0..1のみを持ち、具体的な通貨・条件計算はproduct selector側へ残す。
 */
export type MeaningfulTargetCandidate<TKind extends string = string> = Readonly<{
    id: string;
    kind: TKind;
    priority: number;
    progress: number;
    available: boolean;
}>;
/** authored priorityを最優先し、同priorityでは完了に近いtargetを先に返す。 */
export declare function selectNextMeaningfulTarget<TKind extends string>(candidates: readonly MeaningfulTargetCandidate<TKind>[]): MeaningfulTargetCandidate<TKind> | null;
