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
  wave(1, 2, 'ちびキノコの群れ', [{ enemyId: 'tiny-mushroom', count: 4 }]),
  wave(1, 3, 'ぷくキノコ混成', [{ enemyId: 'tiny-mushroom', count: 3 }, { enemyId: 'plump-mushroom', count: 1 }]),
  wave(2, 1, '街道のキノコ群', [{ enemyId: 'tiny-mushroom', count: 4 }]),
  wave(2, 2, 'ぷくキノコ混成', [{ enemyId: 'tiny-mushroom', count: 2 }, { enemyId: 'plump-mushroom', count: 1 }]),
  wave(2, 3, 'ぷくキノコの壁', [{ enemyId: 'tiny-mushroom', count: 2 }, { enemyId: 'plump-mushroom', count: 2 }]),
  wave(3, 1, '胞子まじりの群れ', [{ enemyId: 'tiny-mushroom', count: 4 }, { enemyId: 'spore-mushroom', count: 1 }]),
  wave(3, 2, '胞子キノコ隊', [{ enemyId: 'tiny-mushroom', count: 3 }, { enemyId: 'spore-mushroom', count: 2 }]),
  wave(3, 3, '硬いキノコ混成', [{ enemyId: 'plump-mushroom', count: 2 }, { enemyId: 'spore-mushroom', count: 2 }]),
  wave(4, 1, '街道奥のキノコ群', [{ enemyId: 'tiny-mushroom', count: 3 }, { enemyId: 'plump-mushroom', count: 1 }, { enemyId: 'spore-mushroom', count: 1 }]),
  wave(4, 2, '胞子キノコ混成', [{ enemyId: 'plump-mushroom', count: 2 }, { enemyId: 'spore-mushroom', count: 2 }]),
  wave(4, 3, 'ぷくキノコ隊', [{ enemyId: 'plump-mushroom', count: 3 }, { enemyId: 'spore-mushroom', count: 2 }]),
  wave(5, 1, 'オオキノコの手下', [{ enemyId: 'tiny-mushroom', count: 4 }, { enemyId: 'spore-mushroom', count: 2 }]),
  wave(5, 2, 'オオキノコの護衛', [{ enemyId: 'plump-mushroom', count: 3 }, { enemyId: 'spore-mushroom', count: 2 }]),
  wave(5, 3, '最奥のキノコ群', [{ enemyId: 'plump-mushroom', count: 2 }, { enemyId: 'spore-mushroom', count: 3 }]),
  {
    id: 'encounter.clover-road.05.boss',
    displayName: 'オオキノコ',
    boss: true,
    groups: [{ enemyId: 'great-mushroom', count: 1 }],
  },
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
