import type {
  selectCampUpgradeOpportunities,
  selectEarlyGameCue,
  selectFormation,
  selectSlimeDetail,
  selectSlimeWeaponOptions,
} from '../../application/selectors/ui-selectors';
import type {
  SlimeInstanceId,
  SlimeMercenariesState,
  SlimeMutationId,
} from '../../domain';
import type { CampLevelAction, CampMode } from '../../game/camp-types';
import type { CampFormationCeremony } from '../CampFormationBoard';
import type { StrengthenCeremony, StrengthenVariant } from '../CampStrengthenEffect';

export type CampSlimeDetail = NonNullable<ReturnType<typeof selectSlimeDetail>>;
export type CampWeaponView = ReturnType<typeof selectSlimeWeaponOptions>;
export type CampFormationView = ReturnType<typeof selectFormation>;
export type CampUpgradeOpportunity = ReturnType<typeof selectCampUpgradeOpportunities>[number];
export type CampEarlyGameCue = NonNullable<ReturnType<typeof selectEarlyGameCue>>;
export type CampRosterSlimes = SlimeMercenariesState['gameData']['roster']['slimes'];

export interface CampManagementModel {
  mode: CampMode;
  busy: boolean;
  roster: CampRosterSlimes;
  ownedIds: readonly SlimeInstanceId[];
  selected: SlimeInstanceId;
  detail: CampSlimeDetail;
  codexNewCount: number;
  retryFarmClearsRemaining: number;
  primaryUpgrade: CampUpgradeOpportunity | null;
  primaryUpgradeName: string | null;
  primaryMutation: CampUpgradeOpportunity | null;
  primaryMutationName: string | null;
  cue: CampEarlyGameCue | null;
  selectedUpgrades: readonly CampUpgradeOpportunity[];
  weaponView: CampWeaponView;
  mutationRelevant: boolean;
  mutationReady: boolean;
  strengthenCeremony: StrengthenCeremony | null;
  strengthenBusy: boolean;
  formation: CampFormationView;
  formationCeremony: CampFormationCeremony | null;
  formationBusy: boolean;
  showValidationTools: boolean;
}

export interface CampManagementActions {
  setMode: (mode: CampMode) => void;
  closeManagement: () => void;
  openCodex: () => void;
  openCreate: () => void;
  openBattle: () => void;
  openForge: () => void;
  selectSlime: (id: SlimeInstanceId) => void;
  resetFeedback: () => void;
  equipWeapon: (weaponDefinitionId: string) => void;
  mutate: (mutationId: SlimeMutationId) => void;
  strengthen: (action: CampLevelAction, variant: StrengthenVariant) => void;
  validationSetLevel40: () => void;
  validationReset: () => void;
  formationSlot: (slotIndex: number) => void;
  formationReserve: () => void;
}
