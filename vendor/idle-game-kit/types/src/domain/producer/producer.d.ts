import type { Condition } from '../condition/condition.js';
import type { CurveDefinition } from '../curve/curve.js';
import type { GameNumberSource } from '../number/game-number.js';
export type ProducerDefinitionId = string;
export type ProducerDefinition = Readonly<{
    id: ProducerDefinitionId;
    displayName?: string;
    description?: string;
    hireCostCurve?: CurveDefinition;
    levelDefinitionId?: string;
    unlockCondition?: Condition;
    baseProduction?: Readonly<Record<string, GameNumberSource>>;
    tags?: readonly string[];
}>;
export type ProducerState = Readonly<{
    definitionId: ProducerDefinitionId;
    ownedCount: number;
    level: number;
}>;
export type ProducerStates = Readonly<Record<ProducerDefinitionId, ProducerState>>;
export declare function setProducerOwnedCount(producers: ProducerStates, definitionId: ProducerDefinitionId, ownedCount: number): ProducerStates;
/** Producer shared levelをimmutableに更新する。未知producerや不正levelでは元recordを維持する。 */
export declare function setProducerLevel(producers: ProducerStates, definitionId: ProducerDefinitionId, level: number): Readonly<{
    accepted: true;
    producers: ProducerStates;
}> | Readonly<{
    accepted: false;
    producers: ProducerStates;
    reason: 'unknown-producer' | 'invalid-level';
}>;
