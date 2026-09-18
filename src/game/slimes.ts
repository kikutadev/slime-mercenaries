import { ids, type JobSlimeId } from '../domain/definitions';
import type { SlimeProgress } from '../domain/state';

export type SlimeId = JobSlimeId;
export type BattleBehaviorId =
  | 'sword-melee'
  | 'fighter-combo'
  | 'blademaster-dash'
  | 'berserker-heavy'
  | 'bow-ranged'
  | 'ranger-double-shot'
  | 'sniper-pierce'
  | 'storm-archer-volley'
  | 'shield-defender'
  | 'guardian-guard'
  | 'paladin-barrier'
  | 'fortress-plant'
  | 'wand-magic'
  | 'mage-aoe'
  | 'archmage-burst'
  | 'frost-mage-control'
  | 'dagger-skirmisher'
  | 'rogue-twin-strike'
  | 'ninja-vanish'
  | 'assassin-execute'
  | 'gun-ranged'
  | 'gunner-burst'
  | 'cannoneer-shell'
  | 'engineer-turret';

export type FusionItemCategory = 'slime' | 'weapon' | 'material';
export type FusionItemId =
  | typeof ids.token.swordCore
  | typeof ids.token.shieldCore
  | typeof ids.token.bowCore
  | typeof ids.token.wandCore
  | typeof ids.token.daggerCore
  | typeof ids.token.gunCore
  | typeof ids.token.greatswordBlank
  | typeof ids.token.reinforcedBow
  | typeof ids.token.hardeningGel
  | typeof ids.token.temperedSteel;

export interface SlimeBattlePresentation {
  behaviorId: BattleBehaviorId;
  equipmentAnchorName: string;
  weaponTipName: string | null;
  maxHp: number;
  formationRole: 'front' | 'back';
}

export interface SlimeDefinition {
  id: SlimeId;
  name: string;
  role: string;
  tier: number;
  asset: string;
  icon: string;
  accent: string;
  battle: SlimeBattlePresentation;
}

export interface SlimePresentation extends SlimeDefinition {
  form: string;
}

export interface FusionItemDefinition {
  id: FusionItemId;
  name: string;
  shortName: string;
  category: FusionItemCategory;
  glyph: string;
}

export const SLIMES: Record<SlimeId, SlimeDefinition> = {
  sword: base('sword', '剣士スライム', '前衛・近接', 'sword-slime.glb', 'sword-slime-icon.svg', '#ffcf69', 'sword-melee', 'WeaponAnchor', 'Sword_Tip', 6, 'front'),
  shield: base('shield', '盾士スライム', '前衛・防御', 'shield-slime.glb', 'shield-slime-icon.svg', '#78c8ff', 'shield-defender', 'ShieldAnchor', 'ShieldAnchor', 9, 'front'),
  bow: base('bow', '弓士スライム', '後衛・射撃', 'archer-slime.glb', 'bow-slime-icon.svg', '#8bdc78', 'bow-ranged', 'BowAnchor', null, 4, 'back'),
  wand: base('wand', '杖士スライム', '後衛・魔法', 'wand-slime.glb', 'wand-slime-icon.svg', '#a98cff', 'wand-magic', 'WandAnchor', null, 4, 'back'),
  dagger: base('dagger', '短剣士スライム', '前衛・高速近接', 'dagger-slime.glb', 'dagger-slime-icon.svg', '#8195ff', 'dagger-skirmisher', 'WeaponAnchor', 'WeaponTip', 5, 'front'),
  gun: base('gun', '銃士スライム', '後衛・銃撃', 'gun-slime.glb', 'gun-slime-icon.svg', '#6fcbe7', 'gun-ranged', 'GunAnchor', null, 5, 'back'),
};

function base(
  id: JobSlimeId,
  name: string,
  role: string,
  assetFile: string,
  iconFile: string,
  accent: string,
  behaviorId: BattleBehaviorId,
  equipmentAnchorName: string,
  weaponTipName: string | null,
  maxHp: number,
  formationRole: 'front' | 'back',
): SlimeDefinition {
  return {
    id,
    name,
    role,
    tier: 1,
    asset: `assets/${assetFile}`,
    icon: `assets/${iconFile}`,
    accent,
    battle: { behaviorId, equipmentAnchorName, weaponTipName, maxHp, formationRole },
  };
}

export const FUSION_ITEMS: Record<FusionItemId, FusionItemDefinition> = {
  [ids.token.swordCore]: { id: ids.token.swordCore, name: '剣士スライムの核', shortName: '剣士の核', category: 'slime', glyph: '●' },
  [ids.token.shieldCore]: { id: ids.token.shieldCore, name: '盾士スライムの核', shortName: '盾士の核', category: 'slime', glyph: '●' },
  [ids.token.bowCore]: { id: ids.token.bowCore, name: '弓士スライムの核', shortName: '弓士の核', category: 'slime', glyph: '●' },
  [ids.token.wandCore]: { id: ids.token.wandCore, name: '杖士スライムの核', shortName: '杖士の核', category: 'slime', glyph: '●' },
  [ids.token.daggerCore]: { id: ids.token.daggerCore, name: '短剣士スライムの核', shortName: '短剣士の核', category: 'slime', glyph: '●' },
  [ids.token.gunCore]: { id: ids.token.gunCore, name: '銃士スライムの核', shortName: '銃士の核', category: 'slime', glyph: '●' },
  [ids.token.greatswordBlank]: { id: ids.token.greatswordBlank, name: '大剣の原型', shortName: '大剣の原型', category: 'weapon', glyph: '⚔' },
  [ids.token.reinforcedBow]: { id: ids.token.reinforcedBow, name: '強化弓の原型', shortName: '強化弓', category: 'weapon', glyph: '➶' },
  [ids.token.hardeningGel]: { id: ids.token.hardeningGel, name: '硬化ジェル', shortName: '硬化ジェル', category: 'material', glyph: '◆' },
  [ids.token.temperedSteel]: { id: ids.token.temperedSteel, name: '鍛鉄片', shortName: '鍛鉄片', category: 'material', glyph: '⬟' },
};

type PromotionPresentation = Readonly<{
  typeId: JobSlimeId;
  name: string;
  role: string;
  tier: number;
  asset: string;
  accent: string;
  battle: SlimeBattlePresentation;
}>;

const PROMOTED: Readonly<Record<string, PromotionPresentation>> = {
  fighter: promoted('sword', '戦士スライム', '前衛・連撃', 2, 'fighter-slime.glb', '#c7654e', 'fighter-combo', 'WeaponAnchor', 'WeaponTip', 8, 'front'),
  blademaster: promoted('sword', '剣聖スライム', '前衛・技巧斬撃', 3, 'blademaster-slime.glb', '#ffd86c', 'blademaster-dash', 'WeaponAnchor', 'WeaponTip', 9, 'front'),
  berserker: promoted('sword', '狂戦士スライム', '前衛・重撃', 3, 'berserker-slime.glb', '#ff8b65', 'berserker-heavy', 'WeaponAnchor', 'WeaponTip', 10, 'front'),

  guardian: promoted('shield', 'ガーディアンスライム', '前衛・重防御', 2, 'guardian-slime.glb', '#85c9ef', 'guardian-guard', 'GuardianShieldAnchor', 'GuardianShieldAnchor', 11, 'front'),
  paladin: promoted('shield', 'パラディンスライム', '前衛・守護', 3, 'paladin-slime.glb', '#f2d379', 'paladin-barrier', 'PaladinShieldAnchor', 'PaladinShieldAnchor', 12, 'front'),
  fortress: promoted('shield', 'フォートレススライム', '前衛・要塞', 3, 'fortress-slime.glb', '#9caeb8', 'fortress-plant', 'FortressShieldAnchor', 'FortressShieldAnchor', 14, 'front'),

  ranger: promoted('bow', 'レンジャースライム', '後衛・機動射撃', 2, 'ranger-slime.glb', '#87dc78', 'ranger-double-shot', 'RangerBowAnchor', null, 5, 'back'),
  sniper: promoted('bow', 'スナイパースライム', '後衛・狙撃', 3, 'sniper-slime.glb', '#9fd985', 'sniper-pierce', 'SniperBowAnchor', null, 5, 'back'),
  'storm-archer': promoted('bow', 'ストームアーチャースライム', '後衛・連撃射撃', 3, 'storm-archer-slime.glb', '#71d9cf', 'storm-archer-volley', 'StormBowAnchor', null, 6, 'back'),

  mage: promoted('wand', 'メイジスライム', '後衛・魔法', 2, 'mage-slime.glb', '#9b7cf0', 'mage-aoe', 'WandAnchor', null, 5, 'back'),
  archmage: promoted('wand', 'アークメイジスライム', '後衛・大魔法', 3, 'archmage-slime.glb', '#c18cff', 'archmage-burst', 'WandAnchor', null, 5, 'back'),
  'frost-mage': promoted('wand', 'フロストメイジスライム', '後衛・氷結魔法', 3, 'frost-mage-slime.glb', '#83d9ff', 'frost-mage-control', 'FrostStaffAnchor', null, 6, 'back'),

  rogue: promoted('dagger', 'ローグスライム', '前衛・双短剣', 2, 'rogue-slime.glb', '#7885df', 'rogue-twin-strike', 'WeaponAnchor', 'WeaponTip', 6, 'front'),
  ninja: promoted('dagger', 'ニンジャスライム', '前衛・忍術', 3, 'ninja-slime.glb', '#9a7ed9', 'ninja-vanish', 'WeaponAnchor', 'WeaponTip', 7, 'front'),
  assassin: promoted('dagger', 'アサシンスライム', '前衛・暗殺', 3, 'assassin-slime.glb', '#8d65ba', 'assassin-execute', 'WeaponAnchor', 'WeaponTip', 7, 'front'),

  gunner: promoted('gun', 'ガンナースライム', '後衛・連射', 2, 'gunner-slime.glb', '#69c6de', 'gunner-burst', 'GunAnchor', null, 6, 'back'),
  cannoneer: promoted('gun', '砲撃手スライム', '後衛・砲撃', 3, 'cannoneer-slime.glb', '#dfad67', 'cannoneer-shell', 'CannoneerCannonAnchor', null, 7, 'back'),
  engineer: promoted('gun', 'エンジニアスライム', '後衛・機工', 3, 'engineer-slime.glb', '#e9a75d', 'engineer-turret', 'EngineerWrenchAnchor', null, 7, 'back'),
};

function promoted(
  typeId: JobSlimeId,
  name: string,
  role: string,
  tier: number,
  assetFile: string,
  accent: string,
  behaviorId: BattleBehaviorId,
  equipmentAnchorName: string,
  weaponTipName: string | null,
  maxHp: number,
  formationRole: 'front' | 'back',
): PromotionPresentation {
  return {
    typeId,
    name,
    role,
    tier,
    asset: `assets/${assetFile}`,
    accent,
    battle: { behaviorId, equipmentAnchorName, weaponTipName, maxHp, formationRole },
  };
}

export function getSlimePresentation(slime: SlimeProgress): SlimePresentation {
  const baseDefinition = SLIMES[slime.typeId];
  const promotion = slime.promotionPathId === null ? null : PROMOTED[slime.promotionPathId] ?? null;

  // Promotion chooses the job form and primary combat identity. Fusion is an independent growth
  // axis and must never collapse a promoted Fighter/Blademaster/Berserker back into Greatsword.
  if (promotion !== null && promotion.typeId === slime.typeId) {
    return {
      ...baseDefinition,
      ...promotion,
      id: slime.typeId,
      icon: baseDefinition.icon,
      form: slime.promotionPathId!,
    };
  }

  // Greatsword is a Tier-1 Sword fusion form. Promoted Sword jobs retain this fusion state in
  // Domain, but their promoted model/behavior remains authoritative until promoted-form Fusion
  // modifiers are explicitly authored.
  if (slime.typeId === 'sword' && slime.jobTier === 1 && slime.fusionRank >= 2) {
    return {
      ...baseDefinition,
      name: '大剣士スライム',
      role: '前衛・範囲重撃',
      tier: slime.jobTier,
      asset: 'assets/greatsword-slime.glb',
      accent: '#ffd76f',
      battle: { ...baseDefinition.battle, behaviorId: 'sword-melee' },
      form: slime.fusionFormId,
    };
  }

  return { ...baseDefinition, tier: slime.jobTier, form: slime.fusionFormId };
}

export function getSlimePresentationForRank(id: SlimeId, fusionRank: number): SlimePresentation {
  return getSlimePresentation({
    id: `preview.${id}`,
    serial: 0,
    typeId: id,
    level: 1,
    jobTier: 1,
    promotionPathId: null,
    fusionRank,
    fusionFormId: id === 'sword' && fusionRank >= 2 ? 'greatsword' : 'base',
    mutationId: null,
    assignment: 'reserve',
  });
}
