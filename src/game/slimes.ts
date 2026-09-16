export type SlimeId = 'sword' | 'bow';
export type SlimeAssignment = 'battle' | 'reserve' | 'dispatch';
export type FusionItemCategory = 'slime' | 'weapon' | 'material';
export type FusionItemId =
  | 'sword-core'
  | 'bow-core'
  | 'greatsword-blank'
  | 'reinforced-bow'
  | 'hardening-gel'
  | 'tempered-steel';

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

export interface SlimeProgress {
  id: SlimeId;
  level: number;
  fusionRank: number;
  assignment: SlimeAssignment;
  equippedWeapon: string;
}

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
  'sword-core': {
    id: 'sword-core',
    name: '剣士スライムの核',
    shortName: '剣士の核',
    category: 'slime',
    glyph: '●',
  },
  'bow-core': {
    id: 'bow-core',
    name: '弓士スライムの核',
    shortName: '弓士の核',
    category: 'slime',
    glyph: '●',
  },
  'greatsword-blank': {
    id: 'greatsword-blank',
    name: '大剣の原型',
    shortName: '大剣の原型',
    category: 'weapon',
    glyph: '⚔',
  },
  'reinforced-bow': {
    id: 'reinforced-bow',
    name: '強化弓の原型',
    shortName: '強化弓',
    category: 'weapon',
    glyph: '➶',
  },
  'hardening-gel': {
    id: 'hardening-gel',
    name: '硬化ジェル',
    shortName: '硬化ジェル',
    category: 'material',
    glyph: '◆',
  },
  'tempered-steel': {
    id: 'tempered-steel',
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
  tier: 2,
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
      'sword-core': 1,
      'bow-core': 0,
      'greatsword-blank': 1,
      'reinforced-bow': 0,
      'hardening-gel': 2,
      'tempered-steel': 0,
    },
  };
}
