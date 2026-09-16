import { type NonConsumablePurchaseDefinition, type NonConsumablePurchaseFlowResult, type NonConsumablePurchaseProvider, type PurchaseCommitResult, type PurchaseTransaction } from '../application/purchases.js';
export type PurchaseActionStatus = 'idle' | 'requesting' | NonConsumablePurchaseFlowResult['status'];
export declare function useNonConsumablePurchase(args: Readonly<{
    provider: NonConsumablePurchaseProvider;
    definition: NonConsumablePurchaseDefinition;
    commitTransaction: (transaction: PurchaseTransaction, definition: NonConsumablePurchaseDefinition) => PurchaseCommitResult | Promise<PurchaseCommitResult>;
}>): Readonly<{
    status: PurchaseActionStatus;
    pending: boolean;
    run: () => Promise<NonConsumablePurchaseFlowResult | null>;
    reset: () => void;
}>;
