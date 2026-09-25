import { useCallback, useEffect, useRef, useState } from 'react';
import { useGameController } from './GameProvider';
import {
  battleActivityReportIsMeaningful,
  buildBattleActivityReport,
  isBattleActivityEvent,
  mergeBattleActivityReports,
  routePresentationEvents,
  toDispatchReturnCues,
  type BattleActivityReport,
  type DispatchReturnCue,
  type SlimePresentationNotice,
} from '../application/presentation-events';
import type { BattleRewardCue } from '../game/battle-reward';

export type PresentationScreenId = 'battle' | 'slimes' | 'dispatch' | 'forge';

export function useAppPresentationEvents({
  activeScreen,
  enqueueNotices,
}: {
  activeScreen: PresentationScreenId;
  enqueueNotices: (notices: readonly SlimePresentationNotice[]) => void;
}) {
  const controller = useGameController();
  const [battleRewardCues, setBattleRewardCues] = useState<readonly BattleRewardCue[]>([]);
  const [battleActivityReport, setBattleActivityReport] = useState<BattleActivityReport | null>(null);
  const [battleReportOpen, setBattleReportOpen] = useState(false);
  const [hasPendingBattleActivity, setHasPendingBattleActivity] = useState(false);
  const [dispatchReturnCues, setDispatchReturnCues] = useState<readonly DispatchReturnCue[]>([]);

  const battleRewardCueTimersRef = useRef(new Map<string, number>());
  const pendingBattleActivityRef = useRef<BattleActivityReport | null>(null);
  const activeScreenRef = useRef(activeScreen);
  const enqueueNoticesRef = useRef(enqueueNotices);

  activeScreenRef.current = activeScreen;
  enqueueNoticesRef.current = enqueueNotices;

  useEffect(() => controller.subscribeEvents((events, context) => {
    const activeScreenNow = activeScreenRef.current;
    const dispatchCues = toDispatchReturnCues(events);

    if (dispatchCues.length > 0) {
      setDispatchReturnCues((current) => {
        const known = new Set(current.map((cue) => cue.id));
        const fresh = dispatchCues.filter((cue) => !known.has(cue.id));
        return fresh.length === 0 ? current : [...current, ...fresh];
      });
    }

    const collectingBattleActivity = context.source === 'background'
      || (context.source === 'live' && activeScreenNow !== 'battle');

    if (collectingBattleActivity && context.elapsedSec > 0) {
      const snapshot = controller.store.getSnapshot();
      const battleEvents = events.filter(isBattleActivityEvent);
      const hasFormation = snapshot.gameData.roster.formationSlots.some((slot) => slot !== null);
      const battleCanProgress = hasFormation
        && (!snapshot.gameData.combat.contentBoundaryReached || battleEvents.length > 0);

      if (battleCanProgress) {
        const delta = buildBattleActivityReport({
          events: battleEvents,
          elapsedSec: context.elapsedSec,
          from: {
            areaId: context.fromAreaId,
            stageNumber: context.fromStage,
            waveIndex: context.fromWaveIndex,
          },
          to: {
            areaId: context.toAreaId,
            stageNumber: context.toStage,
            waveIndex: context.toWaveIndex,
          },
        });

        if (activeScreenNow === 'battle') {
          if (battleActivityReportIsMeaningful(delta)) {
            setBattleActivityReport((current) => mergeBattleActivityReports(current, delta));
          }
        } else {
          const pending = mergeBattleActivityReports(pendingBattleActivityRef.current, delta);
          pendingBattleActivityRef.current = pending;
          if (battleActivityReportIsMeaningful(pending)) {
            setHasPendingBattleActivity(true);
          }
        }
      }
    }

    const presentationEvents = context.source === 'offline'
      ? []
      : collectingBattleActivity
        ? events.filter((event) =>
          !isBattleActivityEvent(event) && event.type !== 'dispatchCompleted')
        : events.filter((event) => event.type !== 'dispatchCompleted');

    const routed = routePresentationEvents(
      presentationEvents,
      activeScreenNow === 'battle' && context.source === 'live',
    );
    enqueueNoticesRef.current(routed.notices);

    if (routed.battleRewardCue !== null) {
      const cue = routed.battleRewardCue;
      setBattleRewardCues((current) =>
        current.some((queued) => queued.id === cue.id)
          ? current
          : [...current, cue]);
    }
  }), [controller]);

  useEffect(() => {
    if (activeScreen === 'battle') return;

    for (const timeoutId of battleRewardCueTimersRef.current.values()) {
      window.clearTimeout(timeoutId);
    }
    battleRewardCueTimersRef.current.clear();
    setBattleRewardCues([]);
  }, [activeScreen]);

  useEffect(() => {
    if (activeScreen !== 'battle' || pendingBattleActivityRef.current === null) return;

    const pending = pendingBattleActivityRef.current;
    pendingBattleActivityRef.current = null;
    if (battleActivityReportIsMeaningful(pending)) {
      setBattleActivityReport((current) => mergeBattleActivityReports(current, pending));
    }
    setHasPendingBattleActivity(false);
  }, [activeScreen]);

  const handleBattleRewardCuePresented = useCallback((cueId: string) => {
    if (battleRewardCueTimersRef.current.has(cueId)) return;

    const timeoutId = window.setTimeout(() => {
      setBattleRewardCues((current) => current.filter((cue) => cue.id !== cueId));
      battleRewardCueTimersRef.current.delete(cueId);
    }, 2_200);
    battleRewardCueTimersRef.current.set(cueId, timeoutId);
  }, []);

  const dismissDispatchReturnCue = useCallback((cueId: string) => {
    setDispatchReturnCues((current) => current.filter((cue) => cue.id !== cueId));
  }, []);

  const confirmBattleActivityReport = useCallback(() => {
    setBattleActivityReport(null);
    setBattleReportOpen(false);
  }, []);

  return {
    battleRewardCues,
    battleActivityReport,
    battleReportOpen,
    setBattleReportOpen,
    hasPendingBattleActivity,
    dispatchReturnCues,
    handleBattleRewardCuePresented,
    dismissDispatchReturnCue,
    confirmBattleActivityReport,
  };
}
