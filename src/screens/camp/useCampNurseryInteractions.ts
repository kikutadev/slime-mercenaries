import { useRef, useState } from 'react';
import type { selectCreateSlimePanel } from '../../application/selectors/ui-selectors';
import type { SlimeGameController } from '../../application/game-controller';
import { useManagedTimeouts } from '../../app/useManagedTimeouts';
import type { NurseryCeremony } from '../../components/NurseryCeremonyStage';
import {
  sameTypeCount,
  slimeInstanceIdForSerial,
  type JobSlimeId,
  type SlimeInstanceId,
  type SlimeMercenariesState,
} from '../../domain';
import { getSlimePresentation } from '../../game/slimes';
import { campRejectionLabel } from './rejection-label';
import type {
  SetCampNotice,
  TriggerCampFeedback,
} from './types';

type CreatePanel = ReturnType<typeof selectCreateSlimePanel>;

interface Options {
  controller: SlimeGameController;
  state: SlimeMercenariesState;
  createPanel: CreatePanel;
  onSelect: (id: SlimeInstanceId | null) => void;
  setCreateOpen: (open: boolean) => void;
  setNotice: SetCampNotice;
  triggerFeedback: TriggerCampFeedback;
}

export function useCampNurseryInteractions({
  controller,
  state,
  createPanel,
  onSelect,
  setCreateOpen,
  setNotice,
  triggerFeedback,
}: Options) {
  const [nurseryCeremony, setNurseryCeremony] = useState<NurseryCeremony | null>(null);
  const nurseryCeremonyKey = useRef(0);
  const nurseryCommitLockRef = useRef(false);
  const { schedule } = useManagedTimeouts();
  const nurseryBusy = nurseryCeremony !== null;

  const playNurseryCeremony = (
    ceremony: Omit<NurseryCeremony, 'key'>,
    durationMs: number,
    onComplete?: () => void,
  ) => {
    const key = ++nurseryCeremonyKey.current;
    setNurseryCeremony({ ...ceremony, key });
    schedule(() => {
      nurseryCommitLockRef.current = false;
      setNurseryCeremony((active) => active?.key === key ? null : active);
      onComplete?.();
    }, durationMs);
  };

  const handleCraftPlain = () => {
    if (nurseryBusy || nurseryCommitLockRef.current) return;
    nurseryCommitLockRef.current = true;
    const beforeStock = createPanel.plainStock;
    const result = controller.craftPlainSlime(1);

    if (!result.accepted) {
      nurseryCommitLockRef.current = false;
      setNotice(campRejectionLabel(result.reason));
      return;
    }

    setNotice(null);
    playNurseryCeremony({ kind: 'craft', beforeStock }, 1280);
  };

  const handlePurchasePlain = () => {
    if (nurseryBusy || nurseryCommitLockRef.current) return;
    nurseryCommitLockRef.current = true;
    const beforeStock = createPanel.plainStock;
    const result = controller.buyPlainSlime(1);

    if (!result.accepted) {
      nurseryCommitLockRef.current = false;
      setNotice(campRejectionLabel(result.reason));
      return;
    }

    setNotice(null);
    playNurseryCeremony({ kind: 'purchase', beforeStock }, 1040);
  };

  const handleCaptureMimic = () => {
    if (nurseryBusy || nurseryCommitLockRef.current) return;
    nurseryCommitLockRef.current = true;
    const nextSerial = state.gameData.roster.nextSlimeSerial;
    const result = controller.captureMimic();

    if (!result.accepted) {
      nurseryCommitLockRef.current = false;
      setNotice(campRejectionLabel(result.reason));
      return;
    }

    const capturedId = slimeInstanceIdForSerial(nextSerial);
    const captured = result.state.gameData.roster.slimes[capturedId];
    if (captured === undefined) {
      nurseryCommitLockRef.current = false;
      setNotice('捕獲したミミックを確認できませんでした');
      return;
    }

    const open = result.state.gameData.roster.formationSlots.findIndex((slot) => slot === null);
    if (open >= 0) controller.assignSlime(capturedId, open);

    const name = getSlimePresentation(captured).name;
    setNotice(null);
    onSelect(capturedId);
    setCreateOpen(false);
    triggerFeedback(
      'recruit',
      `${name}が仲間になった！`,
      '宝箱のふりをやめ、傭兵団についてきました',
      3,
    );
    schedule(() => {
      nurseryCommitLockRef.current = false;
    }, 320);
  };

  const handleCreateJob = (jobId: JobSlimeId) => {
    if (nurseryBusy || nurseryCommitLockRef.current) return;
    nurseryCommitLockRef.current = true;
    const wasDiscovered = sameTypeCount(state, jobId) > 0;
    const result = controller.createJobSlime(jobId);

    if (!result.accepted) {
      nurseryCommitLockRef.current = false;
      setNotice(campRejectionLabel(result.reason));
      return;
    }

    const createdId = slimeInstanceIdForSerial(result.state.gameData.roster.nextSlimeSerial - 1);
    const created = result.state.gameData.roster.slimes[createdId];
    if (created === undefined) {
      nurseryCommitLockRef.current = false;
      setNotice('作成したスライムを確認できませんでした');
      return;
    }

    const name = getSlimePresentation(created).name;
    if (!wasDiscovered) {
      const open = result.state.gameData.roster.formationSlots.findIndex((slot) => slot === null);
      if (open >= 0) controller.assignSlime(createdId, open);
    }

    setNotice(null);
    playNurseryCeremony({
      kind: 'job',
      beforeStock: createPanel.plainStock,
      jobName: name,
      jobId,
    }, 1380, () => {
      onSelect(createdId);
      setCreateOpen(false);
      triggerFeedback(
        'recruit',
        `${name}が仲間になった！`,
        wasDiscovered ? '同じ職業の仲間が増えました' : '出撃編成に自動で加わりました',
      );
    });
  };

  return {
    nurseryCeremony,
    nurseryBusy,
    handleCraftPlain,
    handlePurchasePlain,
    handleCaptureMimic,
    handleCreateJob,
  };
}
