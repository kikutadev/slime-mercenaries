import { useMemo, useRef, useState } from 'react';
import { useGameController } from '../../app/GameProvider';
import { useManagedTimeouts } from '../../app/useManagedTimeouts';
import { selectForgeWeaponTarget } from '../../application/selectors/ui-selectors';
import type { ForgeVisualPhase } from '../../components/ForgeStage';
import type { SlimeInstanceId } from '../../domain';
import {
  forgeResultNotice,
  parseForgeDrawEvents,
  strongestForgeResult,
  type ForgeResultView,
} from './forge-result';

export function useForgeSequence() {
  const controller = useGameController();
  const [results, setResults] = useState<readonly ForgeResultView[]>([]);
  const [phase, setPhase] = useState<ForgeVisualPhase>('idle');
  const [sequenceKey, setSequenceKey] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);
  const [resultTargetSlimeId, setResultTargetSlimeId] = useState<SlimeInstanceId | null>(null);
  const [resultEquipLabel, setResultEquipLabel] = useState<string | null>(null);
  const forgeLockRef = useRef(false);
  const impactTimer = useRef<number | null>(null);
  const revealTimer = useRef<number | null>(null);
  const { schedule, clear } = useManagedTimeouts();

  const bestResult = useMemo(() => strongestForgeResult(results), [results]);

  const draw = (count: 1 | 10) => {
    if (forgeLockRef.current || (phase !== 'idle' && phase !== 'reveal')) return;
    forgeLockRef.current = true;

    const result = controller.forge(count);
    if (!result.accepted) {
      forgeLockRef.current = false;
      setNotice(
        result.reason === 'insufficient-token'
          ? '鍛造キーが足りません'
          : `鍛造できません: ${result.reason}`,
      );
      return;
    }

    const nextResults = parseForgeDrawEvents(result.events);
    clear(impactTimer.current);
    clear(revealTimer.current);
    setNotice(null);
    setResults(nextResults);

    const strongestResult = strongestForgeResult(nextResults);
    const strongestTarget = strongestResult === null
      ? null
      : selectForgeWeaponTarget(result.state, strongestResult.weaponDefinitionId);
    const strongestEquipLabel = strongestResult === null
      || strongestResult.duplicate
      || strongestTarget?.equipped !== true
      ? null
      : `${strongestTarget.slimeName}が装備`;

    setResultTargetSlimeId(strongestTarget?.slimeId ?? null);
    setResultEquipLabel(strongestEquipLabel);
    setSequenceKey((current) => current + 1);
    setPhase('charging');

    impactTimer.current = schedule(() => setPhase('impact'), 360);
    revealTimer.current = schedule(() => {
      forgeLockRef.current = false;
      setPhase('reveal');
      if (strongestResult !== null) {
        setNotice(forgeResultNotice(strongestResult, strongestEquipLabel));
      }
    }, 760);
  };

  return {
    controller,
    results,
    phase,
    sequenceKey,
    notice,
    setNotice,
    resultTargetSlimeId,
    resultEquipLabel,
    bestResult,
    draw,
  };
}
