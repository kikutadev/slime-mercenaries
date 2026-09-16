export type BannerShowResult = 'shown' | 'unavailable' | 'error';
export interface BannerAdAdapter {
    showBanner(placementId: string): Promise<BannerShowResult>;
    hideBanner(placementId: string): Promise<void>;
}
export type RewardedAdOutcome = Readonly<{
    status: 'reward-granted';
    externalGrantId: string;
}> | Readonly<{
    status: 'closed' | 'unavailable' | 'error';
}>;
export interface RewardedAdAdapter {
    showRewarded(offerId: string): Promise<RewardedAdOutcome>;
}
export type AdAdapter = BannerAdAdapter & RewardedAdAdapter;
