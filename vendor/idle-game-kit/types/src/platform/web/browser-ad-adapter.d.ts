import type { AdAdapter, BannerShowResult, RewardedAdOutcome } from '../../application/ads.js';
export type BrowserAdProvider = Readonly<{
    /**
     * placementIdに対応する広告を表示する。
     * hostがnullのproviderはoverlay等で表示してよいが、DOM bannerはhost内へ描画する。
     */
    showBanner: (args: Readonly<{
        placementId: string;
        host: HTMLElement | null;
    }>) => Promise<'shown' | 'unavailable'>;
    hideBanner: (args: Readonly<{
        placementId: string;
        host: HTMLElement | null;
    }>) => Promise<void>;
    /**
     * requestIdは1回のshow操作を識別するclient-generated stable ID。
     * provider固有のresponse IDが取れる場合はexternalGrantIdとして返し、取れなければ省略してよい。
     */
    showRewarded: (args: Readonly<{
        offerId: string;
        requestId: string;
    }>) => Promise<Readonly<{
        status: 'reward-granted';
        externalGrantId?: string;
    }> | Readonly<{
        status: 'closed' | 'unavailable';
    }>>;
}>;
declare global {
    interface Window {
        /** Production integration point. Provider bootstrap scriptがApplication起動前に設定する。 */
        __IDLE_GAME_AD_PROVIDER__?: BrowserAdProvider;
    }
}
type BrowserAdAdapterOptions = Readonly<{
    resolveProvider?: () => BrowserAdProvider | undefined;
    resolveBannerHost?: (placementId: string) => HTMLElement | null;
    createRequestId?: () => string;
}>;
/**
 * Web本番向け広告adapter。
 * provider固有SDKをApplication/Domainから隔離し、未導入・例外・不正reward IDを安全に失敗へ正規化する。
 */
export declare class BrowserAdAdapter implements AdAdapter {
    #private;
    constructor(options?: BrowserAdAdapterOptions);
    showBanner(placementId: string): Promise<BannerShowResult>;
    hideBanner(placementId: string): Promise<void>;
    showRewarded(offerId: string): Promise<RewardedAdOutcome>;
}
export {};
