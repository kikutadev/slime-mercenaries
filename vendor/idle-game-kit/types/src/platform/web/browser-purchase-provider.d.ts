import type { NonConsumablePurchaseProvider, PurchaseProductInfo, PurchaseProviderOutcome, PurchaseRestoreOutcome } from '../../application/purchases.js';
export interface BrowserPurchaseProviderBridge {
    loadProducts(args: Readonly<{
        productIds: readonly string[];
    }>): Promise<readonly PurchaseProductInfo[]>;
    purchase(args: Readonly<{
        productId: string;
    }>): Promise<PurchaseProviderOutcome>;
    restore(): Promise<PurchaseRestoreOutcome>;
    finishTransaction(args: Readonly<{
        transactionId: string;
    }>): Promise<void>;
}
declare global {
    interface Window {
        __IDLE_GAME_PURCHASE_PROVIDER__?: BrowserPurchaseProviderBridge;
    }
}
/** Browser bridge for store/payment implementations supplied by deployment bootstrap code. */
export declare class BrowserNonConsumablePurchaseProvider implements NonConsumablePurchaseProvider {
    loadProducts(productIds: readonly string[]): Promise<readonly PurchaseProductInfo[]>;
    purchase(productId: string): Promise<PurchaseProviderOutcome>;
    restore(): Promise<PurchaseRestoreOutcome>;
    finishTransaction(transactionId: string): Promise<void>;
}
