import { useEffect, useState } from 'react';
import { useGameController } from '../../app/GameProvider';
import type {
  selectCreateSlimePanel,
  selectFormation,
  selectSlimeDetail,
  selectSlimeWeaponOptions,
} from '../../application/selectors/ui-selectors';
import type {
  SlimeInstanceId,
  SlimeMercenariesState,
} from '../../domain';
import type {
  CampFeedback,
  CampMode,
  CampReaction,
} from '../../game/camp-types';
import { useCampEquipmentMutation } from './useCampEquipmentMutation';
import { useCampFormationInteractions } from './useCampFormationInteractions';
import { useCampNurseryInteractions } from './useCampNurseryInteractions';
import { useCampStrengthenInteraction } from './useCampStrengthenInteraction';

type SlimeDetail = ReturnType<typeof selectSlimeDetail>;
type WeaponView = ReturnType<typeof selectSlimeWeaponOptions>;
type FormationView = ReturnType<typeof selectFormation>;
type CreatePanel = ReturnType<typeof selectCreateSlimePanel>;

interface UseCampInteractionsOptions {
  state: SlimeMercenariesState;
  selected: SlimeInstanceId | null;
  detail: SlimeDetail;
  weaponView: WeaponView;
  formation: FormationView;
  createPanel: CreatePanel;
  entryMode: CampMode;
  entryRevision: number;
  onSelect: (id: SlimeInstanceId | null) => void;
}

/**
 * Coordinates Camp-local UI state.
 * Domain commands and ceremony timing live in focused sub-hooks.
 */
export function useCampInteractions({
  state,
  selected,
  detail,
  weaponView,
  formation,
  createPanel,
  entryMode,
  entryRevision,
  onSelect,
}: UseCampInteractionsOptions) {
  const controller = useGameController();
  const [mode, setMode] = useState<CampMode>('none');
  const [commandPanelOpen, setCommandPanelOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [codexOpen, setCodexOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<CampFeedback>({
    key: 0,
    reaction: 'idle',
    title: '',
  });

  useEffect(() => {
    setMode(entryMode);
    setCommandPanelOpen(entryMode !== 'none');
  }, [entryMode, entryRevision]);

  const triggerFeedback = (
    reaction: CampReaction,
    title: string,
    detailText?: string,
    strength: 1 | 2 | 3 = 1,
  ) => {
    setFeedback((current) => ({
      key: current.key + 1,
      reaction,
      title,
      strength,
      ...(detailText === undefined ? {} : { detail: detailText }),
    }));
  };

  const formationInteractions = useCampFormationInteractions({
    controller,
    selected,
    detail,
    formation,
    setNotice,
    triggerFeedback,
  });

  const strengthenInteraction = useCampStrengthenInteraction({
    controller,
    selected,
    detail,
    setNotice,
    triggerFeedback,
  });

  const campInteractionBusy = formationInteractions.formationBusy
    || strengthenInteraction.strengthenBusy;

  const equipmentMutation = useCampEquipmentMutation({
    controller,
    selected,
    detail,
    weaponView,
    busy: campInteractionBusy,
    setMode,
    setNotice,
    triggerFeedback,
  });

  const nurseryInteractions = useCampNurseryInteractions({
    controller,
    state,
    createPanel,
    onSelect,
    setCreateOpen,
    setNotice,
    triggerFeedback,
  });

  return {
    mode,
    setMode,
    commandPanelOpen,
    setCommandPanelOpen,
    createOpen,
    setCreateOpen,
    codexOpen,
    setCodexOpen,
    notice,
    setNotice,
    feedback,
    setFeedback,
    campInteractionBusy,
    triggerFeedback,
    ...formationInteractions,
    ...strengthenInteraction,
    ...equipmentMutation,
    ...nurseryInteractions,
  };
}
