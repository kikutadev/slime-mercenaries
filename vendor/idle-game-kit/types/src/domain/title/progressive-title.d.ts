export type ProgressiveTitleId = string;
export type ProgressiveTitleDefinition = Readonly<{
    id: ProgressiveTitleId;
    cost: number;
}>;
export type EquippedProgressiveTitle = Readonly<{
    titleId: ProgressiveTitleId;
    level: number;
}>;
export type ProgressiveTitleCollectionState = Readonly<{
    copies: Readonly<Record<ProgressiveTitleId, number>>;
    equipped: readonly EquippedProgressiveTitle[];
}>;
export type ProgressiveTitleRules = Readonly<{
    copyThresholds: readonly number[];
    maxSlots: number;
}>;
export type AddProgressiveTitleCopyResult = Readonly<{
    collection: ProgressiveTitleCollectionState;
    added: boolean;
    previousCopies: number;
    copies: number;
    previousLevel: number;
    level: number;
}>;
export type EquipProgressiveTitleResult = Readonly<{
    accepted: true;
    collection: ProgressiveTitleCollectionState;
}> | Readonly<{
    accepted: false;
    collection: ProgressiveTitleCollectionState;
    reason: 'unknown-title' | 'not-owned' | 'invalid-level' | 'already-equipped' | 'slot-limit' | 'cost-limit';
}>;
export type UpdateProgressiveTitleLevelResult = Readonly<{
    accepted: true;
    collection: ProgressiveTitleCollectionState;
}> | Readonly<{
    accepted: false;
    collection: ProgressiveTitleCollectionState;
    reason: 'not-equipped' | 'invalid-level';
}>;
export declare function createProgressiveTitleCollection(): ProgressiveTitleCollectionState;
export declare function progressiveTitleLevelFromCopies(copies: number, copyThresholds: readonly number[]): number;
export declare function addProgressiveTitleCopy(collection: ProgressiveTitleCollectionState, titleId: ProgressiveTitleId, rules: ProgressiveTitleRules): AddProgressiveTitleCopyResult;
export declare function progressiveTitleTotalCost(collection: ProgressiveTitleCollectionState, definitions: readonly ProgressiveTitleDefinition[]): number;
export declare function equipProgressiveTitle(args: Readonly<{
    collection: ProgressiveTitleCollectionState;
    definitions: readonly ProgressiveTitleDefinition[];
    rules: ProgressiveTitleRules;
    titleId: ProgressiveTitleId;
    level: number;
    costLimit: number;
}>): EquipProgressiveTitleResult;
export declare function updateProgressiveTitleLevel(args: Readonly<{
    collection: ProgressiveTitleCollectionState;
    rules: ProgressiveTitleRules;
    titleId: ProgressiveTitleId;
    level: number;
}>): UpdateProgressiveTitleLevelResult;
export declare function reorderProgressiveTitle(collection: ProgressiveTitleCollectionState, titleId: ProgressiveTitleId, targetIndex: number): ProgressiveTitleCollectionState;
export declare function unequipProgressiveTitle(collection: ProgressiveTitleCollectionState, titleId: ProgressiveTitleId): ProgressiveTitleCollectionState;
export declare function clearEquippedProgressiveTitles(collection: ProgressiveTitleCollectionState): ProgressiveTitleCollectionState;
