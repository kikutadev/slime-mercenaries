export type GameNumberSerialized = Readonly<{
    mantissa: number;
    exponent: number;
}>;
export type GameNumberSource = GameNumber | GameNumberSerialized | number | string;
/**
 * Idle economy向けの数値境界。
 * 外部ライブラリの型やserializationをDomain API/saveへ漏らさない。
 */
export declare class GameNumber {
    #private;
    private constructor();
    static zero(): GameNumber;
    static one(): GameNumber;
    static from(source: GameNumberSource): GameNumber;
    static deserialize(serialized: GameNumberSerialized): GameNumber;
    add(other: GameNumberSource): GameNumber;
    subtract(other: GameNumberSource): GameNumber;
    multiply(other: GameNumberSource): GameNumber;
    divide(other: GameNumberSource): GameNumber;
    /** Idle-scale curve計算でJS Numberの指数overflowを避ける。 */
    pow(exponent: number): GameNumber;
    floor(): GameNumber;
    ceil(): GameNumber;
    round(): GameNumber;
    compare(other: GameNumberSource): -1 | 0 | 1;
    equals(other: GameNumberSource): boolean;
    greaterThanOrEqual(other: GameNumberSource): boolean;
    greaterThan(other: GameNumberSource): boolean;
    lessThan(other: GameNumberSource): boolean;
    isNegative(): boolean;
    isZero(): boolean;
    log10(): number;
    toNumber(): number;
    serialize(): GameNumberSerialized;
    toString(): string;
    private static decimalOf;
}
export declare const gameNumber: (source: GameNumberSource) => GameNumber;
