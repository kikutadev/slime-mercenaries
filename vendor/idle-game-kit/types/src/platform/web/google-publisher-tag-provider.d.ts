import type { BrowserAdProvider } from './browser-ad-adapter.js';
export type GooglePublisherTagSize = readonly [width: number, height: number];
export type GooglePublisherTagProviderConfig = Readonly<{
    bannerPlacements?: Readonly<Record<string, Readonly<{
        adUnitPath: string;
        sizes: readonly GooglePublisherTagSize[];
    }>>>;
    rewardedOffers?: Readonly<Record<string, Readonly<{
        adUnitPath: string;
    }>>>;
}>;
type GptSlot = Readonly<{
    addService: (service: GptPubAdsService) => GptSlot;
}>;
type GptSlotEvent = Readonly<{
    slot: GptSlot;
}>;
type GptSlotRenderEndedEvent = GptSlotEvent & Readonly<{
    isEmpty: boolean;
    responseIdentifier: string | null;
}>;
type GptRewardedReadyEvent = GptSlotEvent & Readonly<{
    makeRewardedVisible: () => void;
}>;
type GptEventMap = Readonly<{
    slotRenderEnded: GptSlotRenderEndedEvent;
    rewardedSlotReady: GptRewardedReadyEvent;
    rewardedSlotGranted: GptSlotEvent;
    rewardedSlotClosed: GptSlotEvent;
}>;
type GptPubAdsService = Readonly<{
    addEventListener: <TType extends keyof GptEventMap>(type: TType, listener: (event: GptEventMap[TType]) => void) => void;
}>;
export type GooglePublisherTagRuntime = Readonly<{
    cmd: Readonly<{
        push: (callback: () => void) => unknown;
    }>;
    enums: Readonly<{
        OutOfPageFormat: Readonly<{
            REWARDED: unknown;
        }>;
    }>;
    pubads: () => GptPubAdsService;
    defineSlot: (adUnitPath: string, sizes: readonly GooglePublisherTagSize[], elementId: string) => GptSlot | null;
    defineOutOfPageSlot: (adUnitPath: string, format: unknown) => GptSlot | null;
    enableServices: () => void;
    display: (slotOrElementId: GptSlot | string) => void;
    destroySlots: (slots?: readonly GptSlot[]) => boolean;
}>;
export type GooglePublisherTagProviderOptions = Readonly<{
    resolveRuntime?: () => GooglePublisherTagRuntime | undefined;
    bannerTimeoutMs?: number;
    rewardedTimeoutMs?: number;
}>;
/**
 * Google Publisher TagをBrowserAdProvider contractへ変換するproduction bridge。
 * SDK script loading、consent、network/ad-unit設定はdeployment bootstrap側の責務とする。
 */
export declare class GooglePublisherTagProvider implements BrowserAdProvider {
    #private;
    constructor(config: GooglePublisherTagProviderConfig, options?: GooglePublisherTagProviderOptions);
    showBanner(args: Readonly<{
        placementId: string;
        host: HTMLElement | null;
    }>): Promise<'shown' | 'unavailable'>;
    hideBanner(args: Readonly<{
        placementId: string;
        host: HTMLElement | null;
    }>): Promise<void>;
    showRewarded(args: Readonly<{
        offerId: string;
        requestId: string;
    }>): Promise<Readonly<{
        status: 'reward-granted';
        externalGrantId?: string;
    }> | Readonly<{
        status: 'closed' | 'unavailable';
    }>>;
}
/** deployment bootstrap用。provider-specific configを設定し、generic BrowserAdAdapterから解決可能にする。 */
export declare function installGooglePublisherTagProvider(config: GooglePublisherTagProviderConfig, options?: GooglePublisherTagProviderOptions): GooglePublisherTagProvider | null;
export {};
