import type { NonConsumablePurchaseProvider, PurchaseProductInfo, PurchaseProviderOutcome, PurchaseRestoreOutcome, PurchaseTransaction } from '../../application/purchases.js';
/**
 * Development/example向けのnon-consumable purchase provider。
 * Store SDKなしでcatalog / purchase / restore / finishの契約を最後まで実行する。
 */
export declare class FakeNonConsumablePurchaseProvider implements NonConsumablePurchaseProvider {
    #private;
    constructor(args: Readonly<{
        products: readonly PurchaseProductInfo[];
        available?: boolean;
        purchaseOutcome?: 'purchased' | 'pending' | 'cancelled' | 'unavailable' | 'error';
        restoredTransactions?: readonly PurchaseTransaction[];
    }>);
    loadProducts(productIds: readonly string[]): Promise<readonly PurchaseProductInfo[]>;
    purchase(productId: string): Promise<PurchaseProviderOutcome>;
    restore(): Promise<PurchaseRestoreOutcome>;
    finishTransaction(transactionId: string): Promise<void>;
    isTransactionFinished(transactionId: string): boolean;
}
