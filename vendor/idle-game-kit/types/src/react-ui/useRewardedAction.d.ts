import type { RewardedAdFlowResult } from '../application/rewarded-ad-flow.js';
export type RewardedActionStatus = 'idle' | 'requesting' | RewardedAdFlowResult;
/**
 * Rewarded actionの一時的なpresentation stateを管理するReact hook。
 * GameStateへpending/success/failureを保存せず、同時リクエストを抑止する。
 */
export declare function useRewardedAction<TArgs extends readonly unknown[]>(request: (...args: TArgs) => Promise<RewardedAdFlowResult>): Readonly<{
    status: RewardedActionStatus;
    pending: boolean;
    run: (...args: TArgs) => Promise<RewardedAdFlowResult | null>;
    reset: () => void;
}>;
