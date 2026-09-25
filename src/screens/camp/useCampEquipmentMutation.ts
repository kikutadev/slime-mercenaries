import type {
  selectSlimeDetail,
  selectSlimeWeaponOptions,
} from '../../application/selectors/ui-selectors';
import type { SlimeGameController } from '../../application/game-controller';
import type { SlimeInstanceId, SlimeMutationId } from '../../domain';
import { campRejectionLabel } from './rejection-label';
import type {
  SetCampMode,
  SetCampNotice,
  TriggerCampFeedback,
} from './types';

type SlimeDetail = ReturnType<typeof selectSlimeDetail>;
type WeaponView = ReturnType<typeof selectSlimeWeaponOptions>;

interface Options {
  controller: SlimeGameController;
  selected: SlimeInstanceId | null;
  detail: SlimeDetail;
  weaponView: WeaponView;
  busy: boolean;
  setMode: SetCampMode;
  setNotice: SetCampNotice;
  triggerFeedback: TriggerCampFeedback;
}

export function useCampEquipmentMutation({
  controller,
  selected,
  detail,
  weaponView,
  busy,
  setMode,
  setNotice,
  triggerFeedback,
}: Options) {
  const handleEquipWeapon = (weaponDefinitionId: string) => {
    if (selected === null || detail === null || busy) return;
    const option = weaponView.options.find((candidate) => candidate.id === weaponDefinitionId);
    if (option === undefined || option.equipped) return;

    const result = controller.equipWeapon(selected, weaponDefinitionId);
    if (!result.accepted) {
      setNotice(campRejectionLabel(result.reason));
      return;
    }

    setNotice(null);
    triggerFeedback(
      'formation',
      `${option.name}を装備`,
      option.equippedByName === null
        ? '戦闘力に反映されました'
        : `${option.equippedByName}から移し替えました`,
    );
  };

  const handleMutation = (mutationId: SlimeMutationId) => {
    if (selected === null || detail === null || busy) return;
    const option = detail.mutationOptions.find((candidate) => candidate.id === mutationId);
    if (option === undefined || !option.canMutate) return;

    const result = controller.mutateSlime(selected, mutationId);
    if (!result.accepted) {
      setNotice(campRejectionLabel(result.reason));
      return;
    }

    setNotice(null);
    setMode('none');
    triggerFeedback('recruit', option.displayName, option.identity, 3);
  };

  return {
    handleEquipWeapon,
    handleMutation,
  };
}
