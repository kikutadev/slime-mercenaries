import type { Dispatch, SetStateAction } from 'react';
import type { CampFeedback, CampMode, CampReaction } from '../../game/camp-types';

export type SetCampMode = Dispatch<SetStateAction<CampMode>>;
export type SetCampNotice = Dispatch<SetStateAction<string | null>>;
export type SetCampFeedback = Dispatch<SetStateAction<CampFeedback>>;

export type TriggerCampFeedback = (
  reaction: CampReaction,
  title: string,
  detail?: string,
  strength?: 1 | 2 | 3,
) => void;
