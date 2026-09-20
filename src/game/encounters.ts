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

const FRONT_SLOTS: readonly EnemyFormationSlot[] = [
  'front-left', 'front-center', 'front-right',
  'mid-left', 'mid-center', 'mid-right',
];

const BACK_SLOTS: readonly EnemyFormationSlot[] = [
  'back-left', 'back-center', 'back-right',
  'rear-left', 'rear-center', 'rear-right',
];

type EnemyEncounterRole = 'front' | 'back';

const ENEMY_ENCOUNTER_ROLE: Readonly<Record<EnemyId, EnemyEncounterRole>> = {
  'leafling': 'front',
  'whirl-leaf': 'back',
  'bud-bloom': 'front',
  'puff-flower': 'back',
  'round-hedgehog': 'front',
  'acorn-squirrel': 'back',

  'tiny-mushroom': 'front',
  'plump-mushroom': 'front',
  'spore-mushroom': 'back',
  'great-mushroom': 'front',

  'crystal-beetle': 'front',
  'drill-nose-mole': 'front',
  'crystal-bat': 'back',
  'pebble-golem': 'front',
  'amber-turtle': 'front',

  'puff-frog': 'front',
  'marsh-sprout': 'back',
  'bubble-snail': 'front',
  'skimming-lily': 'front',
  'great-marsh-frog': 'front',

  'snow-roller': 'front',
  'ice-bug': 'back',
  'scarf-snowman': 'front',
  'icicle-lantern': 'back',
  'snow-statue-guardian': 'front',

  'ember-gecko': 'front',
  'charcoal-roller': 'front',
  'crackle-bug': 'back',
  'magma-crab': 'front',
  'furnace-turtle': 'front',

  'round-sentry': 'front',
  'shield-sentry': 'front',
  'bell-mage': 'back',
  'windup-bat': 'back',
  'moon-crown-knight': 'front',

  'egg-dragon': 'back',
  'tiny-wing-dragon': 'front',
  'star-eater-lizard': 'front',
  'meteor-hatchling': 'back',
  'star-eater-dragon': 'front',
};

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

type EncounterGroupRequest = Readonly<{
  enemyId: EnemyId;
  count: number;
  attackDelay?: number;
  attackDelayStep?: number;
}>;

type FourEnemyAreaPlan = Readonly<{
  slug: string;
  areaName: string;
  roster: readonly [EnemyId, EnemyId, EnemyId, EnemyId];
  boss: EnemyId;
}>;

function encounterId(slug: string, stage: number, wave: number | 'boss'): string {
  const stagePart = String(stage).padStart(2, '0');
  const encounterPart = wave === 'boss' ? 'boss' : String(wave).padStart(2, '0');
  return `encounter.${slug}.${stagePart}.${encounterPart}`;
}

function allocateGroups(requests: readonly EncounterGroupRequest[]): readonly EncounterGroup[] {
  const used = new Set<EnemyFormationSlot>();

  const takeSlot = (role: EnemyEncounterRole): EnemyFormationSlot => {
    const preferred = role === 'front' ? FRONT_SLOTS : BACK_SLOTS;
    const fallback = role === 'front' ? BACK_SLOTS : FRONT_SLOTS;
    const slot = [...preferred, ...fallback].find((candidate) => !used.has(candidate));
    if (slot === undefined) throw new Error('Encounter exceeds formation capacity');
    used.add(slot);
    return slot;
  };

  return requests.map((request) => {
    const role = ENEMY_ENCOUNTER_ROLE[request.enemyId];
    const slots = Array.from({ length: request.count }, () => takeSlot(role));
    return {
      enemyId: request.enemyId,
      count: request.count,
      slots,
      attackDelay: request.attackDelay ?? (role === 'front' ? 0.22 : 0.78),
      attackDelayStep: request.attackDelayStep ?? (role === 'front' ? 0.16 : 0.24),
    };
  });
}

function wave(
  slug: string,
  stage: number,
  waveNumber: number,
  displayName: string,
  requests: readonly EncounterGroupRequest[],
): EncounterDefinition {
  return {
    id: encounterId(slug, stage, waveNumber),
    displayName,
    boss: false,
    groups: allocateGroups(requests),
  };
}

function boss(slug: string, stage: number, enemyId: EnemyId): EncounterDefinition {
  return {
    id: encounterId(slug, stage, 'boss'),
    displayName: getEnemyDefinition(enemyId).name,
    boss: true,
    groups: [{
      enemyId,
      count: 1,
      slots: ['front-center'],
      attackDelay: 0.52,
      attackDelayStep: 0,
    }],
  };
}

function buildFourEnemyAreaEncounters(plan: FourEnemyAreaPlan): readonly EncounterDefinition[] {
  const [a, b, c, d] = plan.roster;
  const n = (id: EnemyId) => getEnemyDefinition(id).name;

  return [
    wave(plan.slug, 1, 1, n(a), [{ enemyId: a, count: 3 }]),
    wave(plan.slug, 1, 2, `${n(a)}の群れ`, [{ enemyId: a, count: 4 }]),
    wave(plan.slug, 1, 3, `${n(a)}の大群`, [{ enemyId: a, count: 5 }]),

    wave(plan.slug, 2, 1, n(b), [{ enemyId: b, count: 3 }]),
    wave(plan.slug, 2, 2, `${n(a)}と${n(b)}`, [
      { enemyId: a, count: 2 },
      { enemyId: b, count: 2 },
    ]),
    wave(plan.slug, 2, 3, `${plan.areaName}・第二陣`, [
      { enemyId: a, count: 3 },
      { enemyId: b, count: 2 },
    ]),

    wave(plan.slug, 3, 1, n(c), [{ enemyId: c, count: 3 }]),
    wave(plan.slug, 3, 2, `${n(a)}と${n(c)}`, [
      { enemyId: a, count: 2 },
      { enemyId: c, count: 2 },
    ]),
    wave(plan.slug, 3, 3, `${plan.areaName}・第三陣`, [
      { enemyId: a, count: 2 },
      { enemyId: b, count: 2 },
      { enemyId: c, count: 2 },
    ]),

    wave(plan.slug, 4, 1, n(d), [{ enemyId: d, count: 3 }]),
    wave(plan.slug, 4, 2, `${n(b)}と${n(d)}`, [
      { enemyId: b, count: 2 },
      { enemyId: c, count: 1 },
      { enemyId: d, count: 2 },
    ]),
    wave(plan.slug, 4, 3, `${plan.areaName}混成隊`, [
      { enemyId: a, count: 2 },
      { enemyId: b, count: 2 },
      { enemyId: c, count: 1 },
      { enemyId: d, count: 2 },
    ]),

    wave(plan.slug, 5, 1, `${plan.areaName}総力戦・一`, [
      { enemyId: a, count: 2 },
      { enemyId: b, count: 2 },
      { enemyId: c, count: 2 },
      { enemyId: d, count: 2 },
    ]),
    wave(plan.slug, 5, 2, `${plan.areaName}総力戦・二`, [
      { enemyId: a, count: 2 },
      { enemyId: b, count: 2 },
      { enemyId: c, count: 2 },
      { enemyId: d, count: 2 },
    ]),
    wave(plan.slug, 5, 3, `${plan.areaName}最奥`, [
      { enemyId: a, count: 1 },
      { enemyId: b, count: 2 },
      { enemyId: c, count: 2 },
      { enemyId: d, count: 3 },
    ]),
    boss(plan.slug, 5, plan.boss),
  ];
}

export const CLOVER_ROAD_ENCOUNTERS: readonly EncounterDefinition[] = [
  // Stage 1 — teach the basic melee tell before any ranged pressure exists.
  wave('clover-road', 1, 1, 'ちびリーフ', [{ enemyId: 'leafling', count: 3 }]),
  wave('clover-road', 1, 2, '葉っぱの行進', [{ enemyId: 'leafling', count: 4 }]),
  wave('clover-road', 1, 3, '葉っぱの群れ', [{ enemyId: 'leafling', count: 5 }]),

  // Stage 2 — Whirl Leaf is isolated first, then moves behind Leafling.
  wave('clover-road', 2, 1, 'くるりリーフ', [{ enemyId: 'whirl-leaf', count: 3 }]),
  wave('clover-road', 2, 2, '風まわる葉っぱ隊', [
    { enemyId: 'leafling', count: 3 },
    { enemyId: 'whirl-leaf', count: 2 },
  ]),
  wave('clover-road', 2, 3, '葉っぱの前衛と風の後衛', [
    { enemyId: 'leafling', count: 4 },
    { enemyId: 'whirl-leaf', count: 2 },
  ]),

  // Stage 3 — introduce the two Flower silhouettes separately before mixing them.
  wave('clover-road', 3, 1, 'つぼみん', [{ enemyId: 'bud-bloom', count: 3 }]),
  wave('clover-road', 3, 2, 'ぽふぽふ花', [{ enemyId: 'puff-flower', count: 3 }]),
  wave('clover-road', 3, 3, '花と葉っぱの混成', [
    { enemyId: 'bud-bloom', count: 2 },
    { enemyId: 'leafling', count: 2 },
    { enemyId: 'puff-flower', count: 2 },
    { enemyId: 'whirl-leaf', count: 1 },
  ]),

  // Stage 4 — Critter silhouettes arrive only after Leaf and Flower are established.
  wave('clover-road', 4, 1, 'まるハリ', [{ enemyId: 'round-hedgehog', count: 3 }]),
  wave('clover-road', 4, 2, 'どんぐりリス', [{ enemyId: 'acorn-squirrel', count: 3 }]),
  wave('clover-road', 4, 3, '森の小さな住人', [
    { enemyId: 'round-hedgehog', count: 3 },
    { enemyId: 'leafling', count: 2 },
    { enemyId: 'acorn-squirrel', count: 2 },
  ]),

  // Stage 5 — all six Area 1 silhouettes are now allowed to appear together.
  wave('clover-road', 5, 1, '街道オールスター', [
    { enemyId: 'round-hedgehog', count: 2 },
    { enemyId: 'bud-bloom', count: 2 },
    { enemyId: 'leafling', count: 2 },
    { enemyId: 'whirl-leaf', count: 1 },
    { enemyId: 'puff-flower', count: 1 },
  ]),
  wave('clover-road', 5, 2, '前衛と遠距離の包囲', [
    { enemyId: 'leafling', count: 2 },
    { enemyId: 'bud-bloom', count: 1 },
    { enemyId: 'round-hedgehog', count: 2 },
    { enemyId: 'whirl-leaf', count: 1 },
    { enemyId: 'puff-flower', count: 1 },
    { enemyId: 'acorn-squirrel', count: 1 },
  ]),
  wave('clover-road', 5, 3, 'クローバー街道・最奥', [
    { enemyId: 'round-hedgehog', count: 2 },
    { enemyId: 'bud-bloom', count: 2 },
    { enemyId: 'leafling', count: 1 },
    { enemyId: 'whirl-leaf', count: 1 },
    { enemyId: 'puff-flower', count: 1 },
    { enemyId: 'acorn-squirrel', count: 1 },
  ]),
];

export const MUSHROOM_FOREST_ENCOUNTERS: readonly EncounterDefinition[] = [
  wave('mushroom-forest', 1, 1, 'ちびキノコ', [{ enemyId: 'tiny-mushroom', count: 3 }]),
  wave('mushroom-forest', 1, 2, 'ちびキノコの群れ', [{ enemyId: 'tiny-mushroom', count: 4 }]),
  wave('mushroom-forest', 1, 3, '森のちびキノコ', [{ enemyId: 'tiny-mushroom', count: 5 }]),

  wave('mushroom-forest', 2, 1, 'ぷくキノコ', [{ enemyId: 'plump-mushroom', count: 3 }]),
  wave('mushroom-forest', 2, 2, '軽いキノコと重いキノコ', [
    { enemyId: 'tiny-mushroom', count: 3 },
    { enemyId: 'plump-mushroom', count: 2 },
  ]),
  wave('mushroom-forest', 2, 3, 'キノコの壁', [
    { enemyId: 'tiny-mushroom', count: 3 },
    { enemyId: 'plump-mushroom', count: 3 },
  ]),

  wave('mushroom-forest', 3, 1, 'ほうしキノコ', [{ enemyId: 'spore-mushroom', count: 3 }]),
  wave('mushroom-forest', 3, 2, 'キノコ前衛と胞子', [
    { enemyId: 'tiny-mushroom', count: 3 },
    { enemyId: 'spore-mushroom', count: 2 },
  ]),
  wave('mushroom-forest', 3, 3, '胞子の深部', [
    { enemyId: 'plump-mushroom', count: 2 },
    { enemyId: 'tiny-mushroom', count: 2 },
    { enemyId: 'spore-mushroom', count: 3 },
  ]),

  wave('mushroom-forest', 4, 1, '森のキノコ混成・一', [
    { enemyId: 'tiny-mushroom', count: 3 },
    { enemyId: 'plump-mushroom', count: 2 },
    { enemyId: 'spore-mushroom', count: 2 },
  ]),
  wave('mushroom-forest', 4, 2, '森のキノコ混成・二', [
    { enemyId: 'plump-mushroom', count: 3 },
    { enemyId: 'tiny-mushroom', count: 2 },
    { enemyId: 'spore-mushroom', count: 3 },
  ]),
  wave('mushroom-forest', 4, 3, '光る窪地のキノコ隊', [
    { enemyId: 'tiny-mushroom', count: 3 },
    { enemyId: 'plump-mushroom', count: 3 },
    { enemyId: 'spore-mushroom', count: 3 },
  ]),

  wave('mushroom-forest', 5, 1, 'キノコの森総力戦・一', [
    { enemyId: 'tiny-mushroom', count: 3 },
    { enemyId: 'plump-mushroom', count: 2 },
    { enemyId: 'spore-mushroom', count: 3 },
  ]),
  wave('mushroom-forest', 5, 2, 'キノコの森総力戦・二', [
    { enemyId: 'tiny-mushroom', count: 3 },
    { enemyId: 'plump-mushroom', count: 3 },
    { enemyId: 'spore-mushroom', count: 3 },
  ]),
  wave('mushroom-forest', 5, 3, '大空洞のキノコ群', [
    { enemyId: 'tiny-mushroom', count: 4 },
    { enemyId: 'plump-mushroom', count: 3 },
    { enemyId: 'spore-mushroom', count: 3 },
  ]),
  boss('mushroom-forest', 5, 'great-mushroom'),
];

export const AMBER_MINE_ENCOUNTERS = buildFourEnemyAreaEncounters({
  slug: 'amber-mine',
  areaName: '琥珀鉱山',
  roster: ['crystal-beetle', 'drill-nose-mole', 'crystal-bat', 'pebble-golem'],
  boss: 'amber-turtle',
});

export const SUNKEN_MARSH_ENCOUNTERS = buildFourEnemyAreaEncounters({
  slug: 'sunken-marsh',
  areaName: '沈み沼',
  roster: ['puff-frog', 'marsh-sprout', 'bubble-snail', 'skimming-lily'],
  boss: 'great-marsh-frog',
});

export const FROST_RUINS_ENCOUNTERS = buildFourEnemyAreaEncounters({
  slug: 'frost-ruins',
  areaName: '氷雪遺跡',
  roster: ['snow-roller', 'ice-bug', 'scarf-snowman', 'icicle-lantern'],
  boss: 'snow-statue-guardian',
});

export const EMBER_CANYON_ENCOUNTERS = buildFourEnemyAreaEncounters({
  slug: 'ember-canyon',
  areaName: '灼熱峡谷',
  roster: ['ember-gecko', 'charcoal-roller', 'crackle-bug', 'magma-crab'],
  boss: 'furnace-turtle',
});

export const MOONLIT_CASTLE_ENCOUNTERS = buildFourEnemyAreaEncounters({
  slug: 'moonlit-castle',
  areaName: '月夜の城',
  roster: ['round-sentry', 'shield-sentry', 'bell-mage', 'windup-bat'],
  boss: 'moon-crown-knight',
});

export const DRAGON_CRATER_ENCOUNTERS = buildFourEnemyAreaEncounters({
  slug: 'dragon-crater',
  areaName: '竜の火口',
  roster: ['egg-dragon', 'tiny-wing-dragon', 'star-eater-lizard', 'meteor-hatchling'],
  boss: 'star-eater-dragon',
});

export const ALL_ENCOUNTERS: readonly EncounterDefinition[] = [
  ...CLOVER_ROAD_ENCOUNTERS,
  ...MUSHROOM_FOREST_ENCOUNTERS,
  ...AMBER_MINE_ENCOUNTERS,
  ...SUNKEN_MARSH_ENCOUNTERS,
  ...FROST_RUINS_ENCOUNTERS,
  ...EMBER_CANYON_ENCOUNTERS,
  ...MOONLIT_CASTLE_ENCOUNTERS,
  ...DRAGON_CRATER_ENCOUNTERS,
];

const ENCOUNTER_BY_ID = new Map(ALL_ENCOUNTERS.map((encounter) => [encounter.id, encounter]));

if (ENCOUNTER_BY_ID.size !== ALL_ENCOUNTERS.length) {
  throw new Error('Duplicate encounter ID in production catalog');
}

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

  return {
    id: definition.id,
    displayName: definition.displayName,
    boss: definition.boss,
    enemies,
  };
}

export function getEncounterDefinition(id: string): EncounterDefinition | undefined {
  return ENCOUNTER_BY_ID.get(id);
}
