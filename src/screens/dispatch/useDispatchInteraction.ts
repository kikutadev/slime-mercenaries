import { useEffect, useMemo, useRef, useState } from 'react';
import { useGameController } from '../../app/GameProvider';
import { useManagedTimeouts } from '../../app/useManagedTimeouts';
import type { DispatchReturnCue } from '../../application/presentation-events';
import type { selectDispatchScreen } from '../../application/selectors/ui-selectors';
import type { SlimeInstanceId, SlimeMercenariesState } from '../../domain';
import type { DispatchTraveler } from '../../components/DispatchMapStage';
import { getSlimePresentation } from '../../game/slimes';
import {
  dispatchProgress,
  dispatchRejectionLabel,
} from './dispatch-view';

const DISPATCH_DEPARTURE_CEREMONY_MS = 1_200;

type DispatchView = ReturnType<typeof selectDispatchScreen>;

export interface DispatchDepartureCue {
  contractId: DispatchView['contracts'][number]['id'];
  key: number;
  label: string;
}

export interface DispatchReturnPresentation {
  key: number;
  label: string;
  reward: string;
}

export function useDispatchInteraction({
  state,
  view,
  pendingReturnCue,
  onReturnCuePresented,
}: {
  state: SlimeMercenariesState;
  view: DispatchView;
  pendingReturnCue: DispatchReturnCue | null;
  onReturnCuePresented: (cueId: string) => void;
}) {
  const controller = useGameController();
  const [selectedContract, setSelectedContract] = useState(view.contracts[0]?.id ?? 'roadEscort');
  const [selectedSlime, setSelectedSlime] = useState<SlimeInstanceId | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [departure, setDeparture] = useState<DispatchDepartureCue | null>(null);
  const [returnCue, setReturnCue] = useState<DispatchReturnPresentation | null>(null);
  const departureSerial = useRef(0);
  const departureLockRef = useRef(false);
  const returnSerial = useRef(0);
  const activeReturnCueId = useRef<string | null>(null);
  const { schedule } = useManagedTimeouts();

  const contract = view.contracts.find((item) => item.id === selectedContract) ?? view.contracts[0]!;
  const selectedCandidate = contract.candidates.find((slime) => slime.id === selectedSlime) ?? null;
  const selectedDeparture = departure?.contractId === contract.id;
  const canSend = selectedCandidate?.eligible === true
    && contract.status !== 'running'
    && departure === null;

  useEffect(() => {
    if (contract.status === 'running') {
      setSelectedSlime(null);
      return;
    }
    setSelectedSlime((current) => {
      if (current !== null && contract.candidates.some((slime) => slime.id === current)) return current;
      return contract.candidates.find((slime) => slime.eligible)?.id ?? contract.candidates[0]?.id ?? null;
    });
  }, [contract.id, contract.status, contract.candidates]);

  useEffect(() => {
    if (pendingReturnCue === null || activeReturnCueId.current === pendingReturnCue.id) return;
    const contractView = view.contracts.find((item) => item.id === pendingReturnCue.contractId);
    if (contractView === undefined) return;

    activeReturnCueId.current = pendingReturnCue.id;
    const returningSlime = pendingReturnCue.slimeId === null
      ? null
      : state.gameData.roster.slimes[pendingReturnCue.slimeId] ?? null;
    const key = ++returnSerial.current;

    setReturnCue({
      key,
      label: returningSlime === null
        ? contractView.name
        : `${getSlimePresentation(returningSlime).name}が帰還`,
      reward: `${contractView.reward.label} ×${contractView.reward.amount}`,
    });

    schedule(() => {
      setReturnCue((current) => current?.key === key ? null : current);
      activeReturnCueId.current = null;
      onReturnCuePresented(pendingReturnCue.id);
    }, 1_280);
  }, [
    onReturnCuePresented,
    pendingReturnCue,
    schedule,
    state.gameData.roster.slimes,
    view.contracts,
  ]);

  const travelers = useMemo<readonly DispatchTraveler[]>(() => view.contracts.flatMap((item) => {
    if (item.status !== 'running' || item.slimeId === null || item.durationSec <= 0) return [];
    const slime = state.gameData.roster.slimes[item.slimeId];
    if (slime === undefined) return [];
    const presentation = getSlimePresentation(slime);
    return [{
      contractId: item.id,
      asset: presentation.asset,
      mutationId: presentation.mutationId,
      progress: dispatchProgress(item.remainingSec, item.durationSec),
      ...(departure?.contractId === item.id ? { departureKey: departure.key } : {}),
    }];
  }), [departure, state.gameData.roster.slimes, view.contracts]);

  const startSelectedDispatch = () => {
    if (selectedSlime === null || departureLockRef.current) return;
    departureLockRef.current = true;
    const result = controller.startDispatch(contract.id, selectedSlime);
    if (!result.accepted) {
      departureLockRef.current = false;
      setNotice(dispatchRejectionLabel(result.reason));
      return;
    }

    setNotice(null);
    const key = ++departureSerial.current;
    setDeparture({ contractId: contract.id, key, label: contract.name });
    schedule(() => {
      departureLockRef.current = false;
      setDeparture((current) => current?.key === key ? null : current);
    }, DISPATCH_DEPARTURE_CEREMONY_MS);
  };

  return {
    controller,
    selectedContract,
    setSelectedContract,
    selectedSlime,
    setSelectedSlime,
    notice,
    setNotice,
    departure,
    returnCue,
    contract,
    selectedCandidate,
    selectedDeparture,
    canSend,
    travelers,
    startSelectedDispatch,
  };
}
