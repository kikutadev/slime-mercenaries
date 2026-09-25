export type CampMode =
  | 'none'
  | 'train'
  | 'formation'
  | 'fusion'
  | 'mutation'
  | 'equipment';

export type CampReaction =
  | 'idle'
  | 'level-up'
  | 'formation'
  | 'recruit'
  | 'fusion';

export interface CampFeedback {
  key: number;
  reaction: CampReaction;
  title: string;
  detail?: string;
  strength?: 1 | 2 | 3;
}

export interface CampLevelAction {
  count: number;
  targetLevel: number;
  cost: string;
  available: boolean;
}
