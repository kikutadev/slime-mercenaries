import { useRef, useState } from 'react';
import type { selectSlimeDetail } from '../../application/selectors/ui-selectors';
import type { SlimeGameController } from '../../application/game-controller';
import { useManagedTimeouts } from '../../app/useManagedTimeouts';
import type {
  StrengthenCeremony,
  StrengthenVariant,
} from '../../components/CampStrengthenEffect';
import type { SlimeInstanceId } from '../../domain';
import type { CampLevelAction } from '../../game/camp-types';
import { campRejectionLabel } from './rejection-label';
import type { SetCampNotice, TriggerCampFeedback } from './types';

type SlimeDetail = ReturnType<typeof selectSlimeDetail>;

interface Options {
  controller: SlimeGameController;
  selected: SlimeInstanceId | null;
  detail: SlimeDetail;
  setNotice: SetCampNotice;
  triggerFeedback: TriggerCampFeedback;
}

export function useCampStrengthenInteraction({
  controller,
  selected,
  detail,
  setNotice,
  triggerFeedback,
}: Options) {
  const [strengthenCeremony, setStrengthenCeremony] = useState<StrengthenCeremony | null>(null);
  const strengthenCeremonyKey = useRef(0);
  const strengthenCommitLockRef = useRef(false);
  const { schedule } = useManagedTimeouts();
  const strengthenBusy = strengthenCeremony !== null;

  const handleStrengthen = (
    action: CampLevelAction,
    variant: StrengthenVariant,
  ) => {
    if (
      selected === null
      || detail === null
      || strengthenCeremony?.phase === 'charging'
      || strengthenCommitLockRef.current
    ) return;

    strengthenCommitLockRef.current = true;
    const result = controller.levelUpSlime(selected, action.count);
    if (!result.accepted) {
      strengthenCommitLockRef.current = false;
      setNotice(campRejectionLabel(result.reason));
      return;
    }

    setNotice(null);
    const key = ++strengthenCeremonyKey.current;
    const strength: 1 | 2 | 3 = variant === 'one' ? 1 : variant === 'ten' ? 2 : 3;
    const chargeMs = variant === 'one' ? 200 : variant === 'ten' ? 280 : 360;
    const settleMs = variant === 'one' ? 480 : variant === 'ten' ? 560 : 650;

    setStrengthenCeremony({
      key,
      phase: 'charging',
      variant,
      fromLevel: detail.level,
      targetLevel: action.targetLevel,
      cost: action.cost,
    });

    schedule(() => {
      setStrengthenCeremony((current) => current?.key === key
        ? { ...current, phase: 'result' }
        : current);
      triggerFeedback(
        'level-up',
        `Lv.${action.targetLevel}`,
        `-${action.cost} G`,
        strength,
      );

      schedule(() => {
        strengthenCommitLockRef.current = false;
        setStrengthenCeremony((current) => current?.key === key ? null : current);
      }, settleMs);
    }, chargeMs);
  };

  return {
    strengthenCeremony,
    strengthenBusy,
    handleStrengthen,
  };
}
