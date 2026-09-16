import type { NonConsumablePurchaseProvider, PurchaseProductInfo } from '../application/purchases.js';
export type PurchaseCatalogStatus = 'loading' | 'ready' | 'error';
export declare function usePurchaseCatalog(provider: NonConsumablePurchaseProvider, productIds: readonly string[]): Readonly<{
    status: PurchaseCatalogStatus;
    products: ReadonlyMap<string, PurchaseProductInfo>;
}>;
