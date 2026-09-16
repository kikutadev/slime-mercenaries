export type NonConsumablePurchaseDefinition = Readonly<{
    /** Stable product-owned ID mapped to the store product/SKU by the platform provider. */
    productId: string;
    /** Stable entitlement granted by this non-consumable purchase. */
    entitlementId: string;
}>;
/** Localized store metadata. Price text is provider-authored and must not be reconstructed by the game. */
export type PurchaseProductInfo = Readonly<{
    productId: string;
    displayName: string;
    description?: string;
    priceText: string;
}>;
/**
 * Verified provider transaction for a non-consumable purchase.
 * `transactionId` is the provider's stable idempotency/completion key (for example an App Store
 * transaction identifier or a Google Play purchase token), never a human-facing order number.
 */
export type PurchaseTransaction = Readonly<{
    transactionId: string;
    productId: string;
}>;
export type PurchaseProviderOutcome = Readonly<{
    status: 'purchased';
    transaction: PurchaseTransaction;
}> | Readonly<{
    status: 'pending' | 'cancelled' | 'unavailable' | 'error';
}>;
export type PurchaseRestoreOutcome = Readonly<{
    status: 'restored';
    transactions: readonly PurchaseTransaction[];
}> | Readonly<{
    status: 'unavailable' | 'error';
}>;
/**
 * Platform/store boundary for the first purchase capability: non-consumable entitlements only.
 *
 * A provider must perform store-level verification before returning `purchased` / restored
 * transactions. `finishTransaction()` is called only after the product has durably committed the
 * entitlement or confirmed that the same transaction/entitlement was already committed.
 */
export interface NonConsumablePurchaseProvider {
    loadProducts(productIds: readonly string[]): Promise<readonly PurchaseProductInfo[]>;
    purchase(productId: string): Promise<PurchaseProviderOutcome>;
    restore(): Promise<PurchaseRestoreOutcome>;
    finishTransaction(transactionId: string): Promise<void>;
}
export type PurchaseCommitResult = 'granted' | 'already-granted' | 'rejected';
export type NonConsumableEntitlementState = Readonly<{
    entitlements: Readonly<Record<string, Readonly<{
        productId: string;
        firstTransactionId: string;
    }>>>;
    processedTransactions: Readonly<Record<string, Readonly<{
        productId: string;
        entitlementId: string;
    }>>>;
}>;
export declare function createEmptyNonConsumableEntitlementState(): NonConsumableEntitlementState;
export declare function hasNonConsumableEntitlement(state: NonConsumableEntitlementState, entitlementId: string): boolean;
/**
 * Pure idempotent projection from a verified provider transaction into persisted entitlement state.
 * Products may embed this state in their own private/profile data; it must not be exposed through a
 * public-player projection.
 */
export declare function applyNonConsumableEntitlementTransaction(args: Readonly<{
    state: NonConsumableEntitlementState;
    definition: NonConsumablePurchaseDefinition;
    transaction: PurchaseTransaction;
}>): Readonly<{
    accepted: true;
    state: NonConsumableEntitlementState;
    commit: Exclude<PurchaseCommitResult, 'rejected'>;
}> | Readonly<{
    accepted: false;
    state: NonConsumableEntitlementState;
    reason: 'product-mismatch' | 'transaction-id-conflict';
}>;
export type NonConsumablePurchaseFlowResult = Readonly<{
    status: 'granted' | 'already-granted';
    transactionId: string;
}> | Readonly<{
    status: 'granted-pending-provider-completion';
    transactionId: string;
    commit: Exclude<PurchaseCommitResult, 'rejected'>;
}> | Readonly<{
    status: 'pending' | 'cancelled' | 'unavailable' | 'error' | 'rejected';
}>;
/**
 * Purchase -> durable entitlement commit -> provider completion.
 *
 * `commitTransaction` MUST be idempotent by transaction and entitlement and MUST persist/checkpoint
 * the entitlement before resolving with `granted` or `already-granted`. If provider completion
 * fails after that durable commit, the flow reports `granted-pending-provider-completion`; a later
 * replay/restore can safely call the same commit callback again and then retry provider completion.
 */
export declare function runNonConsumablePurchaseFlow(args: Readonly<{
    provider: NonConsumablePurchaseProvider;
    definition: NonConsumablePurchaseDefinition;
    commitTransaction: (transaction: PurchaseTransaction, definition: NonConsumablePurchaseDefinition) => PurchaseCommitResult | Promise<PurchaseCommitResult>;
}>): Promise<NonConsumablePurchaseFlowResult>;
export type RestoreNonConsumablePurchasesResult = Readonly<{
    status: 'restored';
    grantedCount: number;
    alreadyGrantedCount: number;
    rejectedCount: number;
    providerCompletionPendingCount: number;
}> | Readonly<{
    status: 'unavailable' | 'error';
}>;
/**
 * Replays provider-owned purchases through the same idempotent entitlement commit path used by a
 * new purchase. Unknown product IDs are ignored because another product/version may own them.
 */
export declare function restoreNonConsumablePurchases(args: Readonly<{
    provider: NonConsumablePurchaseProvider;
    definitions: readonly NonConsumablePurchaseDefinition[];
    commitTransaction: (transaction: PurchaseTransaction, definition: NonConsumablePurchaseDefinition) => PurchaseCommitResult | Promise<PurchaseCommitResult>;
}>): Promise<RestoreNonConsumablePurchasesResult>;
