import { type NonConsumablePurchaseDefinition, type NonConsumablePurchaseProvider, type PurchaseCommitResult, type PurchaseTransaction, type RestoreNonConsumablePurchasesResult } from '../application/purchases.js';
export type RestorePurchasesStatus = 'idle' | 'restoring' | RestoreNonConsumablePurchasesResult['status'];
export declare function useRestorePurchases(args: Readonly<{
    provider: NonConsumablePurchaseProvider;
    definitions: readonly NonConsumablePurchaseDefinition[];
    commitTransaction: (transaction: PurchaseTransaction, definition: NonConsumablePurchaseDefinition) => PurchaseCommitResult | Promise<PurchaseCommitResult>;
}>): Readonly<{
    status: RestorePurchasesStatus;
    pending: boolean;
    run: () => Promise<RestoreNonConsumablePurchasesResult | null>;
    reset: () => void;
}>;
