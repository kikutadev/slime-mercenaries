import { useRef, useState } from 'react';
import { useGameController } from '../../app/GameProvider';
import { useManagedTimeouts } from '../../app/useManagedTimeouts';
import type { SlimeInstanceId, SlimeProgress } from '../../domain';
import type { FusionStep } from '../../game/fusion';
import { getFusionPreviewAttackDurationSec } from '../../game/fusion-preview';
import type { SlimePresentation } from '../../game/slimes';
import { fusionRejectionLabel } from './fusion-workbench-view';

export type FusionRunRequirement = Readonly<{
  tokenId: string;
  label: string;
  owned: number;
  required: number;
  missing: number;
}>;

export type FusionRun = Readonly<{
  stepId: string;
  fromRank: number;
  toRank: number;
  fromName: string;
  fromFusionFormId: string;
  fromJobTier: number;
  requirements: readonly FusionRunRequirement[];
}>;

export type FusionSequencePhase = 'idle' | 'merge' | 'reveal' | 'attack' | 'complete';

const MERGE_FAIL_SAFE_MS = 3_600;
const ATTACK_PREVIEW_LEAD_MS = 650;
const ATTACK_PREVIEW_HOLD_MS = 1_050;

export function useFusionWorkbenchInteraction() {
  const controller = useGameController();
  const [run, setRun] = useState<FusionRun | null>(null);
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const [sequenceKey, setSequenceKey] = useState(0);
  const [phase, setPhase] = useState<FusionSequencePhase>('idle');
  const [completed, setCompleted] = useState(false);
  const [completedName, setCompletedName] = useState<string | null>(null);
  const [completedBehavior, setCompletedBehavior] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const fusionCommitLocked = useRef(false);
  const duplicateConversionLocked = useRef(false);
  const failSafeTimer = useRef<number | null>(null);
  const runSerial = useRef(0);
  const { schedule, clear } = useManagedTimeouts();

  const enterReveal = () => {
    clear(failSafeTimer.current);
    failSafeTimer.current = null;
    setPhase((current) => current === 'merge' ? 'reveal' : current);
  };

  const completeFusion = () => {
    clear(failSafeTimer.current);
    failSafeTimer.current = null;
    fusionCommitLocked.current = false;
    setCompleted(true);
    setPhase('complete');
    setRun(null);
  };

  const startAttackPreview = (resultPresentation: SlimePresentation) => {
    if (phase !== 'reveal' || run === null) return;
    const serial = runSerial.current;
    clear(failSafeTimer.current);
    setSequenceKey((value) => value + 1);
    setPhase('attack');
    const attackPreviewMs = Math.ceil(getFusionPreviewAttackDurationSec(resultPresentation) * 1000)
      + ATTACK_PREVIEW_LEAD_MS
      + ATTACK_PREVIEW_HOLD_MS
      + 350;
    failSafeTimer.current = schedule(() => {
      if (runSerial.current !== serial) return;
      completeFusion();
    }, attackPreviewMs);
  };

  const beginFusion = ({
    slimeId,
    canFuse,
    next,
    progress,
    fromName,
    requirements,
    behaviorTitle,
  }: {
    slimeId: SlimeInstanceId;
    canFuse: boolean;
    next: FusionStep;
    progress: SlimeProgress;
    fromName: string;
    requirements: readonly FusionRunRequirement[];
    behaviorTitle: string;
    resultPresentation: SlimePresentation;
  }) => {
    if (!canFuse || run !== null || fusionCommitLocked.current) return;

    fusionCommitLocked.current = true;
    const result = controller.fuseSlime(slimeId, next.id);
    if (!result.accepted) {
      fusionCommitLocked.current = false;
      setNotice(fusionRejectionLabel(result.reason));
      return;
    }

    clear(failSafeTimer.current);
    const serial = ++runSerial.current;

    setNotice(null);
    setCompletedName(next.resultName);
    setCompletedBehavior(behaviorTitle);
    setSequenceKey((value) => value + 1);
    setCompleted(false);
    setPhase('merge');
    setRun({
      stepId: next.id,
      fromRank: progress.fusionRank,
      toRank: progress.fusionRank + 1,
      fromName,
      fromFusionFormId: progress.fusionFormId,
      fromJobTier: progress.jobTier,
      requirements,
    });

    // WebGL normally advances the ceremony. This only prevents a broken renderer from trapping the UI.
    failSafeTimer.current = schedule(() => {
      if (runSerial.current !== serial) return;
      enterReveal();
    }, MERGE_FAIL_SAFE_MS);
  };

  const convertDuplicate = (
    candidate: SlimeProgress,
    displayName: string,
  ) => {
    if (duplicateConversionLocked.current) return;

    duplicateConversionLocked.current = true;
    const result = controller.convertDuplicateToFusionCore(candidate.id);
    setNotice(
      result.accepted
        ? `${displayName} #${candidate.serial} を合成の核に変換しました`
        : fusionRejectionLabel(result.reason),
    );
    schedule(() => {
      duplicateConversionLocked.current = false;
    }, 260);
  };

  return {
    controller,
    run,
    selectedStepId,
    setSelectedStepId,
    sequenceKey,
    phase,
    completed,
    completedName,
    completedBehavior,
    notice,
    setNotice,
    beginFusion,
    enterReveal,
    startAttackPreview,
    completeFusion,
    convertDuplicate,
  };
}
