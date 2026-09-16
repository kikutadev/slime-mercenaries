export type SweepValue = string | number | boolean;
export type SweepParameterSet = Readonly<Record<string, SweepValue>>;
export type SweepResult<TParameters extends SweepParameterSet, TMetric> = Readonly<{
    parameters: TParameters;
    metric: TMetric;
}>;
/**
 * 各axisの直積をparameter setへ展開する。
 * 空axisや値を持たないaxisは設定ミスとして拒否する。
 */
export declare function createParameterGrid<TParameters extends SweepParameterSet>(axes: Readonly<Record<keyof TParameters, readonly SweepValue[]>>): readonly TParameters[];
/**
 * full gridが大きい時に、順序を維持しつつ全体へ均等に散らしたcaseだけを選ぶ。
 * RNGを使わないため、同じgrid/sample countなら同じcase集合になる。
 */
export declare function sampleParameterCases<TParameters extends SweepParameterSet>(cases: readonly TParameters[], sampleCount: number): readonly TParameters[];
/** parameter setの生成方法とmetric評価を分離した、小さなsweep runner。 */
export declare function runParameterSweep<TParameters extends SweepParameterSet, TMetric>(args: Readonly<{
    cases: readonly TParameters[];
    evaluate: (parameters: TParameters) => TMetric;
}>): readonly SweepResult<TParameters, TMetric>[];
