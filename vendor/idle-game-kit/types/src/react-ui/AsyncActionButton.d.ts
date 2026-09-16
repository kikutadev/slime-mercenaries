import type { ButtonHTMLAttributes, ReactNode } from 'react';
export interface AsyncActionButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
    readonly pending: boolean;
    readonly children: ReactNode;
    readonly pendingChildren?: ReactNode;
}
/**
 * Pending中の重複submitを防ぐsemantic button。処理の意味や成功/失敗表示はconsumerが所有する。
 */
export declare function AsyncActionButton({ pending, children, pendingChildren, disabled, ...buttonProps }: AsyncActionButtonProps): import("react").JSX.Element;
