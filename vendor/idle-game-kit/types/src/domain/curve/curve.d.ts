import { GameNumber, type GameNumberSource } from '../number/game-number.js';
export type FormulaCurveDefinition = Readonly<{
    type: 'linear';
    base: GameNumberSource;
    step: GameNumberSource;
}> | Readonly<{
    type: 'polynomial';
    coefficients: readonly GameNumberSource[];
}> | Readonly<{
    type: 'geometric';
    base: GameNumberSource;
    ratio: number;
}>;
export type CurveDefinition = FormulaCurveDefinition | Readonly<{
    type: 'table';
    values: readonly GameNumberSource[];
}> | Readonly<{
    type: 'piecewise';
    segments: readonly Readonly<{
        startIndex: number;
        curve: FormulaCurveDefinition;
    }>[];
}>;
/** 0-based indexの値を返す。 */
export declare function curveValueAt(curve: CurveDefinition, index: number): GameNumber;
/** Bulk purchase等で使う[start, start+count)の合計costを返す。 */
export declare function curveIntervalSum(curve: CurveDefinition, start: number, count: number): GameNumber;
