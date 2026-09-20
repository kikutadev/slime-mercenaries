export type EnemyId =
  | 'leafling' | 'whirl-leaf'
  | 'bud-bloom' | 'puff-flower'
  | 'round-hedgehog' | 'acorn-squirrel'
  | 'tiny-mushroom' | 'plump-mushroom' | 'spore-mushroom' | 'great-mushroom'
  | 'crystal-beetle' | 'drill-nose-mole' | 'crystal-bat' | 'pebble-golem' | 'amber-turtle'
  | 'puff-frog' | 'marsh-sprout' | 'bubble-snail' | 'skimming-lily' | 'great-marsh-frog'
  | 'snow-roller' | 'ice-bug' | 'scarf-snowman' | 'icicle-lantern' | 'snow-statue-guardian'
  | 'ember-gecko' | 'charcoal-roller' | 'crackle-bug' | 'magma-crab' | 'furnace-turtle'
  | 'round-sentry' | 'shield-sentry' | 'bell-mage' | 'windup-bat' | 'moon-crown-knight'
  | 'egg-dragon' | 'tiny-wing-dragon' | 'star-eater-lizard' | 'meteor-hatchling' | 'star-eater-dragon';

export type EnemyBehaviorId =
  | 'leaf-hop-slap' | 'leaf-whirl'
  | 'flower-bud-poke' | 'flower-pollen'
  | 'critter-roll' | 'critter-acorn'
  | 'mushroom-bump' | 'mushroom-heavy-bump' | 'mushroom-spore' | 'mushroom-boss'
  | 'mine-crystal-tackle' | 'mine-burrow-pop' | 'mine-crystal-ring' | 'mine-golem-tackle' | 'mine-amber-boss'
  | 'marsh-frog-hop' | 'marsh-sprout-orb' | 'marsh-bubble-pulse' | 'marsh-lily-skim' | 'marsh-frog-boss'
  | 'frost-snow-roll' | 'frost-ice-spike-shot' | 'frost-scarf-dash' | 'frost-lantern-ray' | 'frost-guardian-boss'
  | 'ember-tail-dash' | 'ember-charcoal-burst' | 'ember-spark-shell' | 'ember-crab-snap' | 'ember-furnace-boss'
  | 'castle-spear-thrust' | 'castle-shield-bash' | 'castle-bell-ring' | 'castle-windup-burst' | 'castle-moon-knight-boss'
  | 'dragon-egg-fire' | 'dragon-tiny-wing-dive' | 'dragon-star-lizard-charge' | 'dragon-meteor-cast' | 'dragon-star-eater-boss';

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

type EnemyCombatTuning = Readonly<{
  maxHp: number;
  moveSpeed: number;
  attackRange: number;
  attackInterval: number;
  attackDamage?: number;
  scaleClass?: EnemyScaleClass;
  shadowRadius?: number;
}>;

function enemy(
  id: EnemyId,
  name: string,
  behaviorId: EnemyBehaviorId,
  renderScale: number,
  tuning: EnemyCombatTuning,
): EnemyDefinition {
  return {
    id,
    name,
    asset: `assets/enemies/${id}.glb`,
    behaviorId,
    renderScale,
    maxHp: tuning.maxHp,
    moveSpeed: tuning.moveSpeed,
    attackRange: tuning.attackRange,
    attackInterval: tuning.attackInterval,
    attackDamage: tuning.attackDamage ?? 1,
    scaleClass: tuning.scaleClass ?? 'fodder',
    shadowRadius: tuning.shadowRadius ?? Math.max(0.18, renderScale * 0.68),
  };
}

/**
 * Presentation-combat tuning.
 *
 * Authoritative progression difficulty stays in Domain stage work/power. These values only keep
 * the live Three.js battle readable and roughly aligned with each enemy's authored role.
 */
export const ENEMIES: Readonly<Record<EnemyId, EnemyDefinition>> = {
  // Area 1 — Clover Road
  'leafling': enemy('leafling', 'ちびリーフ', 'leaf-hop-slap', .35, {
    maxHp: 4, moveSpeed: .82, attackRange: .70, attackInterval: 1.40, shadowRadius: .20,
  }),
  'whirl-leaf': enemy('whirl-leaf', 'くるりリーフ', 'leaf-whirl', .34, {
    maxHp: 5, moveSpeed: .90, attackRange: 1.45, attackInterval: 1.55, shadowRadius: .21,
  }),
  'bud-bloom': enemy('bud-bloom', 'つぼみん', 'flower-bud-poke', .36, {
    maxHp: 6, moveSpeed: .63, attackRange: .74, attackInterval: 1.62, shadowRadius: .20,
  }),
  'puff-flower': enemy('puff-flower', 'ぽふぽふ花', 'flower-pollen', .33, {
    maxHp: 5, moveSpeed: .57, attackRange: 1.62, attackInterval: 1.78, shadowRadius: .21,
  }),
  'round-hedgehog': enemy('round-hedgehog', 'まるハリ', 'critter-roll', .34, {
    maxHp: 9, moveSpeed: .66, attackRange: .74, attackInterval: 1.86, scaleClass: 'elite', shadowRadius: .25,
  }),
  'acorn-squirrel': enemy('acorn-squirrel', 'どんぐりリス', 'critter-acorn', .32, {
    maxHp: 5, moveSpeed: .88, attackRange: 1.58, attackInterval: 1.58, shadowRadius: .21,
  }),

  // Area 2 — Mushroom Forest
  'tiny-mushroom': enemy('tiny-mushroom', 'ちびキノコ', 'mushroom-bump', .31, {
    maxHp: 5, moveSpeed: .74, attackRange: .72, attackInterval: 1.52, shadowRadius: .21,
  }),
  'plump-mushroom': enemy('plump-mushroom', 'ぷくキノコ', 'mushroom-heavy-bump', .34, {
    maxHp: 10, moveSpeed: .58, attackRange: .76, attackInterval: 1.90, scaleClass: 'elite', shadowRadius: .25,
  }),
  'spore-mushroom': enemy('spore-mushroom', 'ほうしキノコ', 'mushroom-spore', .31, {
    maxHp: 7, moveSpeed: .62, attackRange: 1.65, attackInterval: 1.75, shadowRadius: .22,
  }),
  'great-mushroom': enemy('great-mushroom', 'オオキノコ', 'mushroom-boss', .46, {
    maxHp: 36, moveSpeed: .42, attackRange: .90, attackInterval: 2.35, attackDamage: 2, scaleClass: 'boss', shadowRadius: .46,
  }),

  // Area 3 — Amber Mine
  'crystal-beetle': enemy('crystal-beetle', 'ころクリ', 'mine-crystal-tackle', .40, {
    maxHp: 7, moveSpeed: .67, attackRange: .76, attackInterval: 1.62, shadowRadius: .24,
  }),
  'drill-nose-mole': enemy('drill-nose-mole', 'つるはしモグ', 'mine-burrow-pop', .43, {
    maxHp: 8, moveSpeed: .82, attackRange: .78, attackInterval: 1.70, shadowRadius: .25,
  }),
  'crystal-bat': enemy('crystal-bat', 'きらコウモリ', 'mine-crystal-ring', .32, {
    maxHp: 7, moveSpeed: .91, attackRange: 1.72, attackInterval: 1.68, shadowRadius: .20,
  }),
  'pebble-golem': enemy('pebble-golem', 'ゴロゴーレム', 'mine-golem-tackle', .38, {
    maxHp: 14, moveSpeed: .51, attackRange: .78, attackInterval: 2.00, attackDamage: 2, scaleClass: 'elite', shadowRadius: .29,
  }),
  'amber-turtle': enemy('amber-turtle', '琥珀ガメ', 'mine-amber-boss', .50, {
    maxHp: 46, moveSpeed: .40, attackRange: .94, attackInterval: 2.45, attackDamage: 2, scaleClass: 'boss', shadowRadius: .49,
  }),

  // Area 4 — Sunken Marsh
  'puff-frog': enemy('puff-frog', 'ぷくガエル', 'marsh-frog-hop', .37, {
    maxHp: 9, moveSpeed: .68, attackRange: .78, attackInterval: 1.68, shadowRadius: .25,
  }),
  'marsh-sprout': enemy('marsh-sprout', 'ぬまメ', 'marsh-sprout-orb', .41, {
    maxHp: 8, moveSpeed: .60, attackRange: 1.70, attackInterval: 1.78, shadowRadius: .23,
  }),
  'bubble-snail': enemy('bubble-snail', 'あわタニシ', 'marsh-bubble-pulse', .45, {
    maxHp: 15, moveSpeed: .46, attackRange: 1.20, attackInterval: 2.05, scaleClass: 'elite', shadowRadius: .30,
  }),
  'skimming-lily': enemy('skimming-lily', 'すいすいハス', 'marsh-lily-skim', .36, {
    maxHp: 8, moveSpeed: 1.02, attackRange: .82, attackInterval: 1.44, shadowRadius: .28,
  }),
  'great-marsh-frog': enemy('great-marsh-frog', 'おおぬまガエル', 'marsh-frog-boss', .50, {
    maxHp: 56, moveSpeed: .44, attackRange: 1.02, attackInterval: 2.50, attackDamage: 2, scaleClass: 'boss', shadowRadius: .50,
  }),

  // Area 5 — Frost Ruins
  'snow-roller': enemy('snow-roller', 'ゆきころ', 'frost-snow-roll', .35, {
    maxHp: 10, moveSpeed: .73, attackRange: .76, attackInterval: 1.66, shadowRadius: .24,
  }),
  'ice-bug': enemy('ice-bug', 'こおりムシ', 'frost-ice-spike-shot', .35, {
    maxHp: 9, moveSpeed: .58, attackRange: 1.72, attackInterval: 1.72, shadowRadius: .23,
  }),
  'scarf-snowman': enemy('scarf-snowman', 'マフラー雪だるま', 'frost-scarf-dash', .34, {
    maxHp: 11, moveSpeed: .84, attackRange: .80, attackInterval: 1.62, shadowRadius: .24,
  }),
  'icicle-lantern': enemy('icicle-lantern', 'つららランタン', 'frost-lantern-ray', .36, {
    maxHp: 9, moveSpeed: .64, attackRange: 1.82, attackInterval: 1.82, shadowRadius: .22,
  }),
  'snow-statue-guardian': enemy('snow-statue-guardian', '雪像の番人', 'frost-guardian-boss', .50, {
    maxHp: 66, moveSpeed: .38, attackRange: 1.05, attackInterval: 2.60, attackDamage: 2, scaleClass: 'boss', shadowRadius: .52,
  }),

  // Area 6 — Ember Canyon
  'ember-gecko': enemy('ember-gecko', 'ひのこヤモリ', 'ember-tail-dash', .35, {
    maxHp: 11, moveSpeed: .96, attackRange: .80, attackInterval: 1.48, shadowRadius: .23,
  }),
  'charcoal-roller': enemy('charcoal-roller', 'すみころ', 'ember-charcoal-burst', .36, {
    maxHp: 16, moveSpeed: .56, attackRange: .78, attackInterval: 2.10, attackDamage: 2, scaleClass: 'elite', shadowRadius: .28,
  }),
  'crackle-bug': enemy('crackle-bug', 'ぱちパチムシ', 'ember-spark-shell', .35, {
    maxHp: 10, moveSpeed: .67, attackRange: 1.78, attackInterval: 1.76, shadowRadius: .23,
  }),
  'magma-crab': enemy('magma-crab', 'マグマガニ', 'ember-crab-snap', .34, {
    maxHp: 14, moveSpeed: .62, attackRange: .84, attackInterval: 1.82, attackDamage: 2, scaleClass: 'elite', shadowRadius: .29,
  }),
  'furnace-turtle': enemy('furnace-turtle', '炉心ガメ', 'ember-furnace-boss', .50, {
    maxHp: 78, moveSpeed: .36, attackRange: 1.08, attackInterval: 2.68, attackDamage: 3, scaleClass: 'boss', shadowRadius: .54,
  }),

  // Area 7 — Moonlit Castle
  'round-sentry': enemy('round-sentry', 'ころ兵', 'castle-spear-thrust', .38, {
    maxHp: 13, moveSpeed: .70, attackRange: .95, attackInterval: 1.68, shadowRadius: .25,
  }),
  'shield-sentry': enemy('shield-sentry', 'たて兵', 'castle-shield-bash', .31, {
    maxHp: 19, moveSpeed: .48, attackRange: .78, attackInterval: 2.12, attackDamage: 2, scaleClass: 'elite', shadowRadius: .28,
  }),
  'bell-mage': enemy('bell-mage', 'ベル魔導兵', 'castle-bell-ring', .36, {
    maxHp: 12, moveSpeed: .57, attackRange: 1.80, attackInterval: 1.86, shadowRadius: .23,
  }),
  'windup-bat': enemy('windup-bat', 'ぜんまいコウモリ', 'castle-windup-burst', .27, {
    maxHp: 11, moveSpeed: 1.00, attackRange: 1.70, attackInterval: 1.54, shadowRadius: .20,
  }),
  'moon-crown-knight': enemy('moon-crown-knight', '月冠の騎士', 'castle-moon-knight-boss', .48, {
    maxHp: 92, moveSpeed: .52, attackRange: 1.04, attackInterval: 2.38, attackDamage: 3, scaleClass: 'boss', shadowRadius: .54,
  }),

  // Area 8 — Dragon Crater
  'egg-dragon': enemy('egg-dragon', 'たまごドラゴン', 'dragon-egg-fire', .30, {
    maxHp: 14, moveSpeed: .64, attackRange: 1.58, attackInterval: 1.78, shadowRadius: .23,
  }),
  'tiny-wing-dragon': enemy('tiny-wing-dragon', 'こつばさ竜', 'dragon-tiny-wing-dive', .34, {
    maxHp: 15, moveSpeed: .98, attackRange: .82, attackInterval: 1.58, shadowRadius: .25,
  }),
  'star-eater-lizard': enemy('star-eater-lizard', '星くいトカゲ', 'dragon-star-lizard-charge', .30, {
    maxHp: 21, moveSpeed: .66, attackRange: .84, attackInterval: 2.05, attackDamage: 2, scaleClass: 'elite', shadowRadius: .28,
  }),
  'meteor-hatchling': enemy('meteor-hatchling', 'りゅうせいヒナ', 'dragon-meteor-cast', .30, {
    maxHp: 15, moveSpeed: .61, attackRange: 1.90, attackInterval: 1.92, shadowRadius: .23,
  }),
  'star-eater-dragon': enemy('star-eater-dragon', '星喰らい竜', 'dragon-star-eater-boss', .46, {
    maxHp: 120, moveSpeed: .42, attackRange: 1.10, attackInterval: 2.72, attackDamage: 4, scaleClass: 'boss', shadowRadius: .58,
  }),
};

export const ENEMY_IDS = Object.keys(ENEMIES) as EnemyId[];

export function getEnemyDefinition(id: EnemyId): EnemyDefinition {
  return ENEMIES[id];
}
