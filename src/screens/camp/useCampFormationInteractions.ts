import { useRef, useState } from 'react';
import type {
  selectFormation,
  selectSlimeDetail,
} from '../../application/selectors/ui-selectors';
import type { SlimeGameController } from '../../application/game-controller';
import { useManagedTimeouts } from '../../app/useManagedTimeouts';
import type { CampFormationCeremony } from '../../components/CampFormationBoard';
import type { SlimeInstanceId } from '../../domain';
import { campRejectionLabel } from './rejection-label';
import type { SetCampNotice, TriggerCampFeedback } from './types';

type SlimeDetail = ReturnType<typeof selectSlimeDetail>;
type FormationView = ReturnType<typeof selectFormation>;

interface Options {
  controller: SlimeGameController;
  selected: SlimeInstanceId | null;
  detail: SlimeDetail;
  formation: FormationView;
  setNotice: SetCampNotice;
  triggerFeedback: TriggerCampFeedback;
}

export function useCampFormationInteractions({
  controller,
  selected,
  detail,
  formation,
  setNotice,
  triggerFeedback,
}: Options) {
  const [formationCeremony, setFormationCeremony] = useState<CampFormationCeremony | null>(null);
  const formationCeremonyKey = useRef(0);
  const formationCommitLockRef = useRef(false);
  const { schedule } = useManagedTimeouts();
  const formationBusy = formationCeremony !== null;

  const playFormationCeremony = (
    ceremony: Omit<CampFormationCeremony, 'key'>,
    title: string,
    detailText: string,
  ) => {
    const key = ++formationCeremonyKey.current;
    setFormationCeremony({ ...ceremony, key });
    const durationMs = ceremony.kind === 'swap'
      ? 380
      : ceremony.kind === 'replace'
        ? 400
        : 320;

    schedule(() => {
      formationCommitLockRef.current = false;
      setFormationCeremony((current) => current?.key === key ? null : current);
      triggerFeedback('formation', title, detailText);
    }, durationMs);
  };

  const handleFormationSlot = (slotIndex: number) => {
    if (
      selected === null
      || detail === null
      || formationBusy
      || formationCommitLockRef.current
      || detail.assignment === 'dispatch'
    ) return;

    const fromSlot = formation.find((slot) => slot.slimeId === selected)?.slotIndex ?? null;
    const target = formation[slotIndex];
    if (target === undefined || target.slimeId === selected) return;

    formationCommitLockRef.current = true;
    const result = controller.assignSlime(selected, slotIndex);
    if (!result.accepted) {
      formationCommitLockRef.current = false;
      setNotice(campRejectionLabel(result.reason));
      return;
    }

    setNotice(null);
    const kind: CampFormationCeremony['kind'] = fromSlot !== null
      ? target.slimeId === null ? 'move' : 'swap'
      : target.slimeId === null ? 'move' : 'replace';
    const rowLabel = slotIndex < 3 ? '前衛' : '後衛';

    playFormationCeremony(
      {
        kind,
        fromSlot,
        toSlot: slotIndex,
        selectedIcon: import.meta.env.BASE_URL + detail.icon,
        ...(target.icon === null
          ? {}
          : { displacedIcon: import.meta.env.BASE_URL + target.icon }),
      },
      kind === 'swap' ? '配置を入れ替え' : '配置を変更',
      `${rowLabel}へ移動しました`,
    );
  };

  const handleFormationReserve = () => {
    if (
      selected === null
      || detail === null
      || formationBusy
      || formationCommitLockRef.current
    ) return;

    const fromSlot = formation.find((slot) => slot.slimeId === selected)?.slotIndex ?? null;
    if (fromSlot === null) return;

    formationCommitLockRef.current = true;
    const result = controller.removeSlime(fromSlot);
    if (!result.accepted) {
      formationCommitLockRef.current = false;
      setNotice(campRejectionLabel(result.reason));
      return;
    }

    setNotice(null);
    playFormationCeremony(
      {
        kind: 'reserve',
        fromSlot,
        toSlot: null,
        selectedIcon: import.meta.env.BASE_URL + detail.icon,
      },
      '控えへ移動',
      '戦闘編成から外れました',
    );
  };

  return {
    formationCeremony,
    formationBusy,
    handleFormationSlot,
    handleFormationReserve,
  };
}
