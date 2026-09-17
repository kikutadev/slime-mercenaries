export type EnemyId = 'tiny-mushroom' | 'plump-mushroom' | 'spore-mushroom' | 'great-mushroom';

export type EnemyBehaviorId =
  | 'mushroom-bump'
  | 'mushroom-heavy-bump'
  | 'mushroom-spore'
  | 'mushroom-boss'
  | 'leaf-hop-slap'
  | 'leaf-whirl'
  | 'flower-bud-poke'
  | 'flower-pollen'
  | 'critter-roll'
  | 'critter-acorn';

export type EnemyScaleClass = 'fodder' | 'elite' | 'boss';

export interface EnemyDefinition {
  id: EnemyId;
  name: string;
  asset: string;
  behaviorId: EnemyBehaviorId;
  maxHp: number;
  moveSpeed: number;
  attackRange: number;
  attackInterval: number;
  attackDamage: number;
  renderScale: number;
  scaleClass: EnemyScaleClass;
  shadowRadius: number;
}

/** Enemy stats and presentation are authored as data, never inside BattleRuntime. */
export const ENEMIES: Readonly<Record<EnemyId, EnemyDefinition>> = {
  'tiny-mushroom': {
    id: 'tiny-mushroom',
    name: 'ちびキノコ',
    asset: 'assets/enemies/tiny-mushroom.glb',
    behaviorId: 'mushroom-bump',
    maxHp: 4,
    moveSpeed: 0.74,
    attackRange: 0.72,
    attackInterval: 1.52,
    attackDamage: 1,
    renderScale: 0.31,
    scaleClass: 'fodder',
    shadowRadius: 0.21,
  },
  'plump-mushroom': {
    id: 'plump-mushroom',
    name: 'ぷくキノコ',
    asset: 'assets/enemies/plump-mushroom.glb',
    behaviorId: 'mushroom-heavy-bump',
    maxHp: 8,
    moveSpeed: 0.58,
    attackRange: 0.76,
    attackInterval: 1.9,
    attackDamage: 1,
    renderScale: 0.34,
    scaleClass: 'elite',
    shadowRadius: 0.25,
  },
  'spore-mushroom': {
    id: 'spore-mushroom',
    name: 'ほうしキノコ',
    asset: 'assets/enemies/spore-mushroom.glb',
    behaviorId: 'mushroom-spore',
    maxHp: 5,
    moveSpeed: 0.62,
    attackRange: 1.65,
    attackInterval: 1.75,
    attackDamage: 1,
    renderScale: 0.31,
    scaleClass: 'fodder',
    shadowRadius: 0.22,
  },
  'great-mushroom': {
    id: 'great-mushroom',
    name: 'オオキノコ',
    asset: 'assets/enemies/great-mushroom.glb',
    behaviorId: 'mushroom-boss',
    maxHp: 30,
    moveSpeed: 0.42,
    attackRange: 0.9,
    attackInterval: 2.35,
    attackDamage: 2,
    renderScale: 0.46,
    scaleClass: 'boss',
    shadowRadius: 0.46,
  },
};

export function getEnemyDefinition(id: EnemyId): EnemyDefinition {
  return ENEMIES[id];
}
