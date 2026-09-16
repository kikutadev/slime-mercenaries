import { IndexedDbProfileRepository } from 'idle-game-kit/web';
import type { SlimeMercenariesState } from '../domain/state';

/** Browser-local authoritative save adapter. Cloud Save, if added, remains a secondary sync path. */
export function createSlimeMercenariesBrowserRepository(): IndexedDbProfileRepository<SlimeMercenariesState> {
  return new IndexedDbProfileRepository<SlimeMercenariesState>({
    dbName: 'slime-mercenaries',
  });
}
