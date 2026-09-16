import type { RewardedAdAdapter } from './ads.js';
export type RewardedAdFlowResult = 'granted' | 'closed' | 'unavailable' | 'error' | 'rejected';
/**
 * Provider表示とproduct-owned reward commitを接続する最小Application orchestration。
 *
 * Kitはreward内容やDomain commandを知らず、providerが`reward-granted`を返した場合だけ
 * external grant IDをproduct callbackへ渡す。callbackはdedupe・Domain grant・checkpointを
 * atomicなproduct policyとして実行する責務を持つ。
 */
export declare function runRewardedAdFlow(args: Readonly<{
    adapter: RewardedAdAdapter;
    offerId: string;
    grantReward: (externalGrantId: string) => boolean | Promise<boolean>;
}>): Promise<RewardedAdFlowResult>;
