import type { Condition } from '../condition/condition.js';
import type { GameNumberSource } from '../number/game-number.js';
export type CharacterDefinitionId = string;
export type CharacterInstanceId = string;
export type CharacterLimitBreakDefinition = Readonly<{
    /** Optional hard cap. Omit for an uncapped duplicate-progression track. */
    maxCount?: number;
}>;
export type CharacterDefinition = Readonly<{
    id: CharacterDefinitionId;
    displayName?: string;
    description?: string;
    rarity?: string;
    traits?: readonly string[];
    levelDefinitionId?: string;
    unlockCondition?: Condition;
    baseStats?: Readonly<Record<string, GameNumberSource>>;
    /** Optional durable duplicate-progression capability. The product decides its gameplay effect. */
    limitBreak?: CharacterLimitBreakDefinition;
}>;
export type CharacterState = Readonly<{
    instanceId: CharacterInstanceId;
    definitionId: CharacterDefinitionId;
    level: number;
    traits: readonly string[];
    /** Omitted/zero means no duplicate progression yet. */
    limitBreakCount?: number;
}>;
export type CharacterStates = Readonly<Record<CharacterInstanceId, CharacterState>>;
export declare const ownsCharacterDefinition: (characters: CharacterStates, definitionId: CharacterDefinitionId) => boolean;
/**
 * Unique Named等の個体をimmutableに追加する。instance ID衝突はreject扱いにできるようfalseを返す。
 */
export declare function addCharacter(characters: CharacterStates, character: CharacterState): {
    accepted: true;
    characters: CharacterStates;
} | {
    accepted: false;
    characters: CharacterStates;
};
/** Character levelをimmutableに更新する。未知instanceや不正levelはrejectする。 */
export declare function setCharacterLevel(characters: CharacterStates, instanceId: CharacterInstanceId, level: number): Readonly<{
    accepted: true;
    characters: CharacterStates;
}> | Readonly<{
    accepted: false;
    characters: CharacterStates;
    reason: 'unknown-character' | 'invalid-level';
}>;
/**
 * Increment durable Character duplicate progression immutably. The kit owns count/cap semantics only;
 * stat changes, visuals, and duplicate-source policy remain product concerns.
 */
export declare function incrementCharacterLimitBreak(characters: CharacterStates, instanceId: CharacterInstanceId, count?: number, definition?: CharacterLimitBreakDefinition): Readonly<{
    accepted: true;
    characters: CharacterStates;
    limitBreakCount: number;
}> | Readonly<{
    accepted: false;
    characters: CharacterStates;
    reason: 'unknown-character' | 'invalid-count' | 'limit-reached';
}>;
