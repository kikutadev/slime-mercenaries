import type { TitleState } from '../state.js';
export type TitleDefinition = Readonly<{
    id: string;
    displayName: string;
    description?: string;
    hidden?: boolean;
}>;
export type TitleStatus = Readonly<{
    id: string;
    displayName: string;
    description: string | null;
    acquired: boolean;
    visible: boolean;
}>;
/** hidden titleは未獲得時だけ一覧から隠し、獲得後は通常titleと同じく表示できる。 */
export declare function selectTitleStatus(state: TitleState, definition: TitleDefinition): TitleStatus;
export declare function selectVisibleTitles(state: TitleState, definitions: readonly TitleDefinition[]): readonly TitleStatus[];
