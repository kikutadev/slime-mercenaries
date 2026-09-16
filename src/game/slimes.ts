import { ids, type JobSlimeId } from '../domain/definitions';
import type { SlimeProgress } from '../domain/state';

export type SlimeId = JobSlimeId;
export type FusionItemCategory = 'slime' | 'weapon' | 'material';
export type FusionItemId =
  | typeof ids.token.swordCore
  | typeof ids.token.bowCore
  | typeof ids.token.greatswordBlank
  | typeof ids.token.reinforcedBow
  | typeof ids.token.hardeningGel
  | typeof ids.token.temperedSteel;

export interface SlimeDefinition {
  id: SlimeId;
  name: string;
  role: string;
  tier: number;
  asset: string;
  icon: string;
  accent: string;
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
  sword: {
    id: 'sword',
    name: 'Sword Slime',
    role: '前衛・近接',
    tier: 1,
    asset: 'assets/sword-slime.glb',
    icon: 'assets/sword-slime-icon.svg',
    accent: '#ffcf69',
  },
  bow: {
    id: 'bow',
    name: 'Bow Slime',
    role: '後衛・射撃',
    tier: 1,
    asset: 'assets/archer-slime.glb',
    icon: 'assets/bow-slime-icon.svg',
    accent: '#8bdc78',
  },
};

export const FUSION_ITEMS: Record<FusionItemId, FusionItemDefinition> = {
  [ids.token.swordCore]: { id: ids.token.swordCore, name: '剣士スライムの核', shortName: '剣士の核', category: 'slime', glyph: '●' },
  [ids.token.bowCore]: { id: ids.token.bowCore, name: '弓士スライムの核', shortName: '弓士の核', category: 'slime', glyph: '●' },
  [ids.token.greatswordBlank]: { id: ids.token.greatswordBlank, name: '大剣の原型', shortName: '大剣の原型', category: 'weapon', glyph: '⚔' },
  [ids.token.reinforcedBow]: { id: ids.token.reinforcedBow, name: '強化弓の原型', shortName: '強化弓', category: 'weapon', glyph: '➶' },
  [ids.token.hardeningGel]: { id: ids.token.hardeningGel, name: '硬化ジェル', shortName: '硬化ジェル', category: 'material', glyph: '◆' },
  [ids.token.temperedSteel]: { id: ids.token.temperedSteel, name: '鍛鉄片', shortName: '鍛鉄片', category: 'material', glyph: '⬟' },
};

const PROMOTED_NAMES: Readonly<Record<string, string>> = {
  fighter: 'Fighter Slime',
  ranger: 'Ranger Slime',
};

export function getSlimePresentation(slime: SlimeProgress): SlimePresentation {
  const base = SLIMES[slime.typeId];
  const promotedName = slime.promotionPathId === null ? null : PROMOTED_NAMES[slime.promotionPathId] ?? null;
  if (slime.typeId === 'sword' && slime.fusionRank >= 2) {
    return {
      ...base,
      name: promotedName ?? 'Greatsword Slime',
      role: '前衛・範囲重撃',
      tier: slime.jobTier,
      asset: 'assets/greatsword-slime.glb',
      accent: '#ffd76f',
      form: slime.fusionFormId,
    };
  }
  return {
    ...base,
    name: promotedName ?? base.name,
    tier: slime.jobTier,
    form: slime.fusionFormId,
  };
}

export function getSlimePresentationForRank(id: SlimeId, fusionRank: number): SlimePresentation {
  return getSlimePresentation({
    typeId: id,
    level: 1,
    jobTier: 1,
    promotionPathId: null,
    fusionRank,
    fusionFormId: id === 'sword' && fusionRank >= 2 ? 'greatsword' : 'base',
    assignment: 'reserve',
  });
}
