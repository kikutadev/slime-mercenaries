import { GameNumber, type GameNumberSource } from '../number/game-number.js';
export type ModifierOperation = 'flatAdd' | 'percentAdd' | 'multiply' | 'override';
/** 実計算へ渡す最小fragment。target/source等のauthoring metadataは持たない。 */
export type Modifier = Readonly<{
    id: string;
    operation: ModifierOperation;
    value: GameNumberSource;
    overridePriority?: number;
}>;
/**
 * Definition layerの恒久/汎用Modifier。
 * 所有・有効化stateはgame固有progressionへ残し、target解決だけ共通queryで行う。
 */
export type ModifierDefinition = Readonly<{
    id: string;
    target: string;
    operation: ModifierOperation;
    value: GameNumberSource;
    overridePriority?: number;
    source: string;
}>;
/** authored definitionから計算用fragmentへ落とす。 */
export declare function modifierFromDefinition(definition: ModifierDefinition): Modifier;
/**
 * Game Pluginが保持するactive ID集合からtarget一致のModifierだけをdefinition順に解決する。
 * 未知IDはdefinition version不整合なので黙って無視さずfail-fastする。
 */
export declare function resolveModifierDefinitions(activeModifierIds: readonly string[], definitions: Readonly<Record<string, ModifierDefinition>>, target: string): readonly Modifier[];
/**
 * 仕様固定順序: flatAdd -> percentAdd -> multiply -> override。
 * override同priorityはstable ID昇順で一意に決める。
 */
export declare function applyModifiers(base: GameNumberSource, modifiers: readonly Modifier[]): GameNumber;
