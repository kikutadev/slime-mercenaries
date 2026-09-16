import type { ReactNode } from 'react';
import type { PurchaseProductInfo } from '../application/purchases.js';
export interface PurchaseProductCardProps {
    readonly product: PurchaseProductInfo | null;
    readonly owned: boolean;
    readonly pending: boolean;
    readonly onPurchase: () => void;
    readonly className?: string;
    readonly titleClassName?: string;
    readonly descriptionClassName?: string;
    readonly priceClassName?: string;
    readonly actionClassName?: string;
    readonly ownedLabel?: ReactNode;
    readonly unavailableLabel?: ReactNode;
    readonly purchaseLabel?: ReactNode;
    readonly pendingLabel?: ReactNode;
}
/**
 * Unstyled semantic card for a provider-authored product title/description/localized price.
 * Product art direction and purchase result messaging remain consumer-owned.
 */
export declare function PurchaseProductCard({ product, owned, pending, onPurchase, className, titleClassName, descriptionClassName, priceClassName, actionClassName, ownedLabel, unavailableLabel, purchaseLabel, pendingLabel, }: PurchaseProductCardProps): import("react").JSX.Element;
export declare function EntitlementGate({ owned, children, fallback, }: Readonly<{
    owned: boolean;
    children: ReactNode;
    fallback?: ReactNode;
}>): import("react").JSX.Element;
