export type SlimeId = 'sword' | 'bow';
export type SlimeAssignment = 'battle' | 'reserve' | 'dispatch';

export interface SlimeDefinition {
  id: SlimeId;
  name: string;
  role: string;
  tier: number;
  asset: string;
  icon: string;
  accent: string;
}

export interface SlimeProgress {
  id: SlimeId;
  level: number;
  fusionRank: number;
  fusionProgress: number;
  assignment: SlimeAssignment;
  equippedWeapon: string;
}

export interface RosterState {
  selectedId: SlimeId;
  slimes: Record<SlimeId, SlimeProgress>;
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

export function createInitialRoster(): RosterState {
  return {
    selectedId: 'sword',
    slimes: {
      sword: {
        id: 'sword',
        level: 12,
        fusionRank: 1,
        fusionProgress: 1,
        assignment: 'battle',
        equippedWeapon: 'Rusty Sword',
      },
      bow: {
        id: 'bow',
        level: 9,
        fusionRank: 1,
        fusionProgress: 0,
        assignment: 'battle',
        equippedWeapon: 'Hunter Bow',
      },
    },
  };
}
