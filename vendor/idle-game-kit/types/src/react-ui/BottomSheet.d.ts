import { type ReactNode } from 'react';
export interface BottomSheetProps {
    readonly title: string;
    readonly onClose: () => void;
    readonly children: ReactNode;
    readonly ariaLabel?: string;
    readonly closeLabel?: string;
    readonly backdropClassName?: string;
    readonly sheetClassName?: string;
    readonly headerClassName?: string;
    readonly closeButtonClassName?: string;
}
/**
 * Theme-neutral bottom-sheet shell with modal dialog semantics.
 * Visuals, sizing and motion remain consumer-owned while keyboard focus stays inside the dialog.
 */
export declare function BottomSheet({ title, onClose, children, ariaLabel, closeLabel, backdropClassName, sheetClassName, headerClassName, closeButtonClassName, }: BottomSheetProps): import("react").JSX.Element;
