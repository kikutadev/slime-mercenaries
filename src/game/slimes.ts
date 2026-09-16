import { ids } from '../domain/definitions';

export type SlimeId = 'sword' | 'bow';
export type SlimeAssignment = 'battle' | 'reserve' | 'dispatch';
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

/** Legacy presentation state. Economy/fusion balance is sourced from src/domain definitions. */
export interface SlimeProgress {
  id: SlimeId;
  level: number;
  fusionRank: number;
  assignment: SlimeAssignment;
  equippedWeapon: string;
}

/** Temporary presentation fixture until App.tsx is migrated to the authoritative GameState. */
export interface RosterState {
  selectedId: SlimeId;
  slimes: Record<SlimeId, SlimeProgress>;
  inventory: Record<FusionItemId, number>;
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
  [ids.token.swordCore]: {
    id: ids.token.swordCore,
    name: '剣士スライムの核',
    shortName: '剣士の核',
    category: 'slime',
    glyph: '●',
  },
  [ids.token.bowCore]: {
    id: ids.token.bowCore,
    name: '弓士スライムの核',
    shortName: '弓士の核',
    category: 'slime',
    glyph: '●',
  },
  [ids.token.greatswordBlank]: {
    id: ids.token.greatswordBlank,
    name: '大剣の原型',
    shortName: '大剣の原型',
    category: 'weapon',
    glyph: '⚔',
  },
  [ids.token.reinforcedBow]: {
    id: ids.token.reinforcedBow,
    name: '強化弓の原型',
    shortName: '強化弓',
    category: 'weapon',
    glyph: '➶',
  },
  [ids.token.hardeningGel]: {
    id: ids.token.hardeningGel,
    name: '硬化ジェル',
    shortName: '硬化ジェル',
    category: 'material',
    glyph: '◆',
  },
  [ids.token.temperedSteel]: {
    id: ids.token.temperedSteel,
    name: '鍛鉄片',
    shortName: '鍛鉄片',
    category: 'material',
    glyph: '⬟',
  },
};

const GREATSWORD_FORM: SlimePresentation = {
  ...SLIMES.sword,
  name: 'Greatsword Slime',
  role: '前衛・範囲重撃',
  // Greatsword is a Fusion form on the Sword branch, not the Tier-2 Fighter promotion.
  tier: 1,
  asset: 'assets/greatsword-slime.glb',
  accent: '#ffd76f',
  form: 'greatsword',
};

export function getSlimePresentation(slime: SlimeProgress): SlimePresentation {
  if (slime.id === 'sword' && slime.fusionRank >= 2) return GREATSWORD_FORM;
  return { ...SLIMES[slime.id], form: slime.id };
}

export function getSlimePresentationForRank(id: SlimeId, fusionRank: number): SlimePresentation {
  return getSlimePresentation({
    id,
    level: 1,
    fusionRank,
    assignment: 'reserve',
    equippedWeapon: '',
  });
}

/**
 * Current battle/fusion UI fixture. Values here are presentation test setup, not product balance.
 */
export function createInitialRoster(): RosterState {
  return {
    selectedId: 'sword',
    slimes: {
      sword: {
        id: 'sword',
        level: 12,
        fusionRank: 1,
        assignment: 'battle',
        equippedWeapon: 'Rusty Sword',
      },
      bow: {
        id: 'bow',
        level: 9,
        fusionRank: 1,
        assignment: 'battle',
        equippedWeapon: 'Hunter Bow',
      },
    },
    inventory: {
      [ids.token.swordCore]: 1,
      [ids.token.bowCore]: 0,
      [ids.token.greatswordBlank]: 1,
      [ids.token.reinforcedBow]: 0,
      [ids.token.hardeningGel]: 2,
      [ids.token.temperedSteel]: 0,
    },
  };
}
