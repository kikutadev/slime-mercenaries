export type EnemyId =
  | 'tiny-mushroom' | 'plump-mushroom' | 'spore-mushroom' | 'great-mushroom'
  | 'leafling' | 'whirl-leaf'
  | 'bud-bloom' | 'puff-flower'
  | 'round-hedgehog' | 'acorn-squirrel';

export type EnemyBehaviorId =
  | 'mushroom-bump' | 'mushroom-heavy-bump' | 'mushroom-spore' | 'mushroom-boss'
  | 'leaf-hop-slap' | 'leaf-whirl'
  | 'flower-bud-poke' | 'flower-pollen'
  | 'critter-roll' | 'critter-acorn';

export type EnemyScaleClass = 'fodder' | 'elite' | 'boss';
export interface EnemyDefinition { id: EnemyId; name: string; asset: string; behaviorId: EnemyBehaviorId; maxHp: number; moveSpeed: number; attackRange: number; attackInterval: number; attackDamage: number; renderScale: number; scaleClass: EnemyScaleClass; shadowRadius: number; }

export const ENEMIES: Readonly<Record<EnemyId, EnemyDefinition>> = {
  'tiny-mushroom': { id:'tiny-mushroom',name:'ちびキノコ',asset:'assets/enemies/tiny-mushroom.glb',behaviorId:'mushroom-bump',maxHp:4,moveSpeed:.74,attackRange:.72,attackInterval:1.52,attackDamage:1,renderScale:.31,scaleClass:'fodder',shadowRadius:.21 },
  'plump-mushroom': { id:'plump-mushroom',name:'ぷくキノコ',asset:'assets/enemies/plump-mushroom.glb',behaviorId:'mushroom-heavy-bump',maxHp:8,moveSpeed:.58,attackRange:.76,attackInterval:1.9,attackDamage:1,renderScale:.34,scaleClass:'elite',shadowRadius:.25 },
  'spore-mushroom': { id:'spore-mushroom',name:'ほうしキノコ',asset:'assets/enemies/spore-mushroom.glb',behaviorId:'mushroom-spore',maxHp:5,moveSpeed:.62,attackRange:1.65,attackInterval:1.75,attackDamage:1,renderScale:.31,scaleClass:'fodder',shadowRadius:.22 },
  'great-mushroom': { id:'great-mushroom',name:'オオキノコ',asset:'assets/enemies/great-mushroom.glb',behaviorId:'mushroom-boss',maxHp:30,moveSpeed:.42,attackRange:.9,attackInterval:2.35,attackDamage:2,renderScale:.46,scaleClass:'boss',shadowRadius:.46 },
  'leafling': { id:'leafling',name:'ちびリーフ',asset:'assets/enemies/leafling.glb',behaviorId:'leaf-hop-slap',maxHp:4,moveSpeed:.82,attackRange:.70,attackInterval:1.40,attackDamage:1,renderScale:.34,scaleClass:'fodder',shadowRadius:.20 },
  'whirl-leaf': { id:'whirl-leaf',name:'くるりリーフ',asset:'assets/enemies/whirl-leaf.glb',behaviorId:'leaf-whirl',maxHp:5,moveSpeed:.90,attackRange:1.45,attackInterval:1.55,attackDamage:1,renderScale:.34,scaleClass:'fodder',shadowRadius:.21 },
  'bud-bloom': { id:'bud-bloom',name:'つぼみん',asset:'assets/enemies/bud-bloom.glb',behaviorId:'flower-bud-poke',maxHp:6,moveSpeed:.63,attackRange:.74,attackInterval:1.62,attackDamage:1,renderScale:.32,scaleClass:'fodder',shadowRadius:.20 },
  'puff-flower': { id:'puff-flower',name:'ぽふぽふ花',asset:'assets/enemies/puff-flower.glb',behaviorId:'flower-pollen',maxHp:5,moveSpeed:.57,attackRange:1.62,attackInterval:1.78,attackDamage:1,renderScale:.31,scaleClass:'fodder',shadowRadius:.21 },
  'round-hedgehog': { id:'round-hedgehog',name:'まるハリ',asset:'assets/enemies/round-hedgehog.glb',behaviorId:'critter-roll',maxHp:9,moveSpeed:.66,attackRange:.74,attackInterval:1.86,attackDamage:1,renderScale:.34,scaleClass:'elite',shadowRadius:.25 },
  'acorn-squirrel': { id:'acorn-squirrel',name:'どんぐりリス',asset:'assets/enemies/acorn-squirrel.glb',behaviorId:'critter-acorn',maxHp:5,moveSpeed:.88,attackRange:1.58,attackInterval:1.58,attackDamage:1,renderScale:.30,scaleClass:'fodder',shadowRadius:.21 },
};
export function getEnemyDefinition(id: EnemyId): EnemyDefinition { return ENEMIES[id]; }
