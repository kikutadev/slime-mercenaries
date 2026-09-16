import { type CurveDefinition } from '../domain/curve/curve.js';
import { GameNumber, type GameNumberSource } from '../domain/number/game-number.js';
export type MaxAffordableCurvePurchase = Readonly<{
    count: number;
    totalCost: GameNumber;
    remainingBalance: GameNumber;
    nextUnitCost: GameNumber | null;
    reachedLimit: boolean;
}>;
/**
 * 単調な非負cost curveに対し、現在balanceで一括購入できる最大個数を求める。
 * 個数を1件ずつ走査せず、指数探索で上限を見つけてから二分探索する。
 */
export declare function maxAffordableCurvePurchase(args: Readonly<{
    curve: CurveDefinition;
    startIndex: number;
    balance: GameNumberSource;
    maxCount?: number;
}>): MaxAffordableCurvePurchase;
