import type { AdAdapter, BannerShowResult, RewardedAdOutcome } from '../../application/ads.js';
/**
 * Development/simulator向けのfake provider。
 * real provider SDKなしでもbanner/rewardedのApplication契約を最後まで実行できる。
 */
export declare class FakeAdAdapter implements AdAdapter {
    #private;
    constructor(args?: Readonly<{
        bannerAvailable?: boolean;
        rewardedAvailable?: boolean;
    }>);
    showBanner(placementId: string): Promise<BannerShowResult>;
    hideBanner(placementId: string): Promise<void>;
    showRewarded(offerId: string): Promise<RewardedAdOutcome>;
    isBannerVisible(placementId: string): boolean;
}
