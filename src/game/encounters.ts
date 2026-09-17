import { getEnemyDefinition, type EnemyDefinition, type EnemyId } from './enemies';

export const MAX_NORMAL_ENEMIES = 12;

export type EnemyFormationSlot =
  | 'front-left' | 'front-center' | 'front-right'
  | 'mid-left' | 'mid-center' | 'mid-right'
  | 'back-left' | 'back-center' | 'back-right'
  | 'rear-left' | 'rear-center' | 'rear-right';

const AUTO_FORMATION_SLOTS: readonly EnemyFormationSlot[] = [
  'front-left', 'front-center', 'front-right',
  'mid-left', 'mid-center', 'mid-right',
  'back-left', 'back-center', 'back-right',
  'rear-left', 'rear-center', 'rear-right',
];

export interface EncounterGroup {
  enemyId: EnemyId;
  count: number;
  /** Explicit presentation slots. When omitted, units fill front-to-rear slots automatically. */
  slots?: readonly EnemyFormationSlot[];
  /** Seconds after combat begins before the first attack in this group may start. */
  attackDelay?: number;
  /** Additional first-attack delay applied to each later member of this group. */
  attackDelayStep?: number;
}

export interface EncounterDefinition {
  id: string;
  displayName: string;
  boss: boolean;
  groups: readonly EncounterGroup[];
}

export interface ResolvedEncounterEnemy extends EnemyDefinition {
  instanceIndex: number;
  formationSlot: EnemyFormationSlot;
  initialAttackDelay: number;
}

export interface ResolvedEncounter {
  id: string;
  displayName: string;
  boss: boolean;
  enemies: readonly ResolvedEncounterEnemy[];
}

function group(
  enemyId: EnemyId,
  slots: readonly EnemyFormationSlot[],
  attackDelay: number,
  attackDelayStep = 0.16,
): EncounterGroup {
  return { enemyId, count: slots.length, slots, attackDelay, attackDelayStep };
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
  // Stage 1 — Mushroom onboarding. Keep the original simple auto-formation.
  wave(1, 1, 'ちびキノコの群れ', [{ enemyId: 'tiny-mushroom', count: 3 }]),
  wave(1, 2, '街道のキノコ群', [{ enemyId: 'tiny-mushroom', count: 4 }]),
  wave(1, 3, 'ぷくキノコ混成', [{ enemyId: 'tiny-mushroom', count: 3 }, { enemyId: 'plump-mushroom', count: 1 }]),

  // Stage 2 — Leaf introduction. First show Leafling alone, then teach Whirl Leaf as a backliner.
  wave(2, 1, '葉っぱの行進', [
    group('leafling', ['front-left', 'front-center', 'front-right', 'mid-center'], 0.24, 0.13),
  ]),
  wave(2, 2, '風まわる葉っぱ隊', [
    group('leafling', ['front-left', 'front-center', 'front-right'], 0.22, 0.14),
    group('whirl-leaf', ['back-left', 'back-right'], 0.72, 0.26),
  ]),
  wave(2, 3, '葉っぱとぷくキノコ', [
    group('plump-mushroom', ['front-center'], 0.20),
    group('leafling', ['front-left', 'front-right'], 0.38, 0.16),
    group('whirl-leaf', ['back-left', 'back-right'], 0.82, 0.24),
  ]),

  // Stage 3 — Flower introduction. Bud Bloom owns the first wave; pollen arrives from a clear back row.
  wave(3, 1, 'つぼみの道', [
    group('bud-bloom', ['front-left', 'front-center', 'front-right', 'mid-center'], 0.26, 0.15),
  ]),
  wave(3, 2, 'ぽふぽふ花粉隊', [
    group('bud-bloom', ['front-left', 'front-center', 'front-right'], 0.24, 0.16),
    group('puff-flower', ['back-left', 'back-right'], 0.78, 0.30),
  ]),
  wave(3, 3, '花と風の混成', [
    group('bud-bloom', ['front-left', 'front-right'], 0.22, 0.18),
    group('leafling', ['front-center'], 0.46),
    group('puff-flower', ['back-left', 'back-right'], 0.84, 0.28),
    group('spore-mushroom', ['back-center'], 1.18),
  ]),

  // Stage 4 — Forest Critter introduction. Rollers establish the front before acorn pressure begins.
  wave(4, 1, '森の小さな住人', [
    group('round-hedgehog', ['front-left', 'front-center', 'front-right'], 0.24, 0.20),
  ]),
  wave(4, 2, 'どんぐり投げ隊', [
    group('round-hedgehog', ['front-left', 'front-center', 'front-right'], 0.20, 0.18),
    group('acorn-squirrel', ['back-left', 'back-right'], 0.74, 0.28),
  ]),
  wave(4, 3, '森の混成隊', [
    group('round-hedgehog', ['front-left', 'front-right'], 0.20, 0.20),
    group('leafling', ['front-center'], 0.42),
    group('acorn-squirrel', ['back-left', 'back-right'], 0.78, 0.28),
    group('puff-flower', ['back-center'], 1.12),
  ]),

  // Stage 5 — Gauntlet. Frontline pressure arrives first; ranged families answer in a readable sequence.
  wave(5, 1, '街道オールスター', [
    group('round-hedgehog', ['front-left', 'front-right'], 0.18, 0.20),
    group('plump-mushroom', ['front-center'], 0.32),
    group('leafling', ['mid-left', 'mid-right'], 0.48, 0.18),
    group('bud-bloom', ['mid-center'], 0.66),
    group('tiny-mushroom', ['back-left', 'back-right'], 0.82, 0.16),
  ]),
  wave(5, 2, '前衛と遠距離の包囲', [
    group('leafling', ['front-left'], 0.18),
    group('bud-bloom', ['front-center'], 0.34),
    group('round-hedgehog', ['front-right'], 0.50),
    group('plump-mushroom', ['mid-center'], 0.64),
    group('spore-mushroom', ['back-left'], 0.82),
    group('whirl-leaf', ['back-center'], 1.02),
    group('puff-flower', ['back-right'], 1.22),
    group('acorn-squirrel', ['rear-center'], 1.42),
  ]),
  wave(5, 3, '最奥の森の総力戦', [
    group('round-hedgehog', ['front-left', 'front-right'], 0.18, 0.18),
    group('plump-mushroom', ['front-center'], 0.30),
    group('bud-bloom', ['mid-left', 'mid-right'], 0.46, 0.20),
    group('leafling', ['mid-center'], 0.64),
    group('whirl-leaf', ['back-left'], 0.84),
    group('puff-flower', ['back-center'], 1.04),
    group('acorn-squirrel', ['back-right'], 1.24),
    group('spore-mushroom', ['rear-center'], 1.44),
  ]),
  {
    id: 'encounter.clover-road.05.boss',
    displayName: 'オオキノコ',
    boss: true,
    groups: [group('great-mushroom', ['front-center'], 0.52)],
  },
];

const ENCOUNTER_BY_ID = new Map(CLOVER_ROAD_ENCOUNTERS.map((encounter) => [encounter.id, encounter]));

export function resolveEncounterDefinition(id: string): ResolvedEncounter {
  const definition = ENCOUNTER_BY_ID.get(id);
  if (definition === undefined) throw new Error(`Unknown encounter: ${id}`);
  const enemies: ResolvedEncounterEnemy[] = [];
  let instanceIndex = 0;
  for (const encounterGroup of definition.groups) {
    if (encounterGroup.slots !== undefined && encounterGroup.slots.length !== encounterGroup.count) {
      throw new Error(`Encounter group slot count mismatch: ${definition.id} / ${encounterGroup.enemyId}`);
    }
    for (let index = 0; index < encounterGroup.count; index += 1) {
      const formationSlot = encounterGroup.slots?.[index] ?? AUTO_FORMATION_SLOTS[instanceIndex];
      if (formationSlot === undefined) throw new Error(`Encounter exceeds formation capacity: ${definition.id}`);
      const initialAttackDelay = encounterGroup.attackDelay === undefined
        ? 0.38 + instanceIndex * 0.18
        : encounterGroup.attackDelay + index * (encounterGroup.attackDelayStep ?? 0);
      enemies.push({
        ...getEnemyDefinition(encounterGroup.enemyId),
        instanceIndex,
        formationSlot,
        initialAttackDelay,
      });
      instanceIndex += 1;
    }
  }
  return { id: definition.id, displayName: definition.displayName, boss: definition.boss, enemies };
}

export function getEncounterDefinition(id: string): EncounterDefinition | undefined {
  return ENCOUNTER_BY_ID.get(id);
}
