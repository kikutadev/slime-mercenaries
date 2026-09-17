import { getEnemyDefinition, type EnemyDefinition, type EnemyId } from './enemies';

export const MAX_NORMAL_ENEMIES = 12;

export interface EncounterGroup {
  enemyId: EnemyId;
  count: number;
}

export interface EncounterDefinition {
  id: string;
  displayName: string;
  boss: boolean;
  groups: readonly EncounterGroup[];
}

export interface ResolvedEncounterEnemy extends EnemyDefinition {
  instanceIndex: number;
}

export interface ResolvedEncounter {
  id: string;
  displayName: string;
  boss: boolean;
  enemies: readonly ResolvedEncounterEnemy[];
}

function wave(stage: number, waveNumber: number, displayName: string, groups: readonly EncounterGroup[]): EncounterDefinition {
  return {
    id: `encounter.clover-road.${String(stage).padStart(2, '0')}.${String(waveNumber).padStart(2, '0')}`,
    displayName,
    boss: false,
    groups,
  };
}

export const CLOVER_ROAD_ENCOUNTERS: readonly EncounterDefinition[] = [
  wave(1, 1, 'ちびキノコの群れ', [{ enemyId: 'tiny-mushroom', count: 3 }]),
  wave(1, 2, '街道のキノコ群', [{ enemyId: 'tiny-mushroom', count: 4 }]),
  wave(1, 3, 'ぷくキノコ混成', [{ enemyId: 'tiny-mushroom', count: 3 }, { enemyId: 'plump-mushroom', count: 1 }]),
  wave(2, 1, '葉っぱの行進', [{ enemyId: 'leafling', count: 3 }, { enemyId: 'tiny-mushroom', count: 1 }]),
  wave(2, 2, 'くるり葉っぱ隊', [{ enemyId: 'leafling', count: 2 }, { enemyId: 'whirl-leaf', count: 2 }]),
  wave(2, 3, '葉っぱとキノコ', [{ enemyId: 'leafling', count: 3 }, { enemyId: 'whirl-leaf', count: 1 }, { enemyId: 'plump-mushroom', count: 1 }]),
  wave(3, 1, 'つぼみの道', [{ enemyId: 'bud-bloom', count: 3 }, { enemyId: 'leafling', count: 2 }]),
  wave(3, 2, 'ぽふぽふ花粉隊', [{ enemyId: 'bud-bloom', count: 2 }, { enemyId: 'puff-flower', count: 2 }, { enemyId: 'whirl-leaf', count: 1 }]),
  wave(3, 3, '花と胞子の混成', [{ enemyId: 'puff-flower', count: 2 }, { enemyId: 'spore-mushroom', count: 2 }, { enemyId: 'bud-bloom', count: 2 }]),
  wave(4, 1, '森の小さな住人', [{ enemyId: 'round-hedgehog', count: 2 }, { enemyId: 'leafling', count: 2 }, { enemyId: 'bud-bloom', count: 1 }]),
  wave(4, 2, 'どんぐり投げ隊', [{ enemyId: 'acorn-squirrel', count: 2 }, { enemyId: 'round-hedgehog', count: 2 }, { enemyId: 'puff-flower', count: 1 }]),
  wave(4, 3, '森の混成隊', [{ enemyId: 'round-hedgehog', count: 2 }, { enemyId: 'acorn-squirrel', count: 2 }, { enemyId: 'whirl-leaf', count: 2 }]),
  wave(5, 1, '街道オールスター', [{ enemyId: 'tiny-mushroom', count: 2 }, { enemyId: 'leafling', count: 2 }, { enemyId: 'bud-bloom', count: 2 }, { enemyId: 'round-hedgehog', count: 1 }]),
  wave(5, 2, '遠距離混成隊', [{ enemyId: 'spore-mushroom', count: 2 }, { enemyId: 'whirl-leaf', count: 2 }, { enemyId: 'puff-flower', count: 2 }, { enemyId: 'acorn-squirrel', count: 2 }]),
  wave(5, 3, '最奥の森の仲間たち', [{ enemyId: 'plump-mushroom', count: 2 }, { enemyId: 'round-hedgehog', count: 2 }, { enemyId: 'bud-bloom', count: 2 }, { enemyId: 'acorn-squirrel', count: 2 }]),
  { id: 'encounter.clover-road.05.boss', displayName: 'オオキノコ', boss: true, groups: [{ enemyId: 'great-mushroom', count: 1 }] },
];

const ENCOUNTER_BY_ID = new Map(CLOVER_ROAD_ENCOUNTERS.map((encounter) => [encounter.id, encounter]));

export function resolveEncounterDefinition(id: string): ResolvedEncounter {
  const definition = ENCOUNTER_BY_ID.get(id);
  if (definition === undefined) throw new Error(`Unknown encounter: ${id}`);
  const enemies: ResolvedEncounterEnemy[] = [];
  let instanceIndex = 0;
  for (const group of definition.groups) {
    for (let index = 0; index < group.count; index += 1) {
      enemies.push({ ...getEnemyDefinition(group.enemyId), instanceIndex });
      instanceIndex += 1;
    }
  }
  return { id: definition.id, displayName: definition.displayName, boss: definition.boss, enemies };
}

export function getEncounterDefinition(id: string): EncounterDefinition | undefined {
  return ENCOUNTER_BY_ID.get(id);
}
