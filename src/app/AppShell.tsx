import { lazy, Suspense, useEffect, useMemo, useState, useTransition } from 'react';
import { usePresentationQueue } from 'idle-game-kit/react';
import { useGameBootstrap, useGameState } from './GameProvider';
import { selectNavigationAttention, selectOwnedSlimeIds } from '../application/selectors/ui-selectors';
import { buildOfflineReturnView, presentationNoticeDurationMs } from '../application/presentation-events';
import { installBattleAudioUnlock } from '../game/battle-runtime/audio-system';
import { SlimesScreen } from '../screens/SlimesScreen';
import type { CampMode } from '../game/camp-types';
import type { SlimeInstanceId } from '../domain';
import { NavIcon, type NavIconKind } from '../components/navigation/NavIcon';
import { SlimeMark } from '../components/SlimeMark';
import { SettingsSheet } from '../components/SettingsSheet';
import { OnboardingGuideSheet } from '../components/OnboardingGuideSheet';
import styles from './AppShell.module.css';
import { battleActivityRewardLabel } from './app-report-view';
import { BattleActivityPeek, BattleActivitySheet, OfflineReturnSheet } from './AppReportSheets';
import { useAppPresentationEvents, type PresentationScreenId } from './useAppPresentationEvents';

const loadBattleScreen = () => import('../screens/BattleScreen');
const loadDispatchScreen = () => import('../screens/DispatchScreen');
const loadForgeScreen = () => import('../screens/ForgeScreen');

const BattleScreen = lazy(async () => ({ default: (await loadBattleScreen()).BattleScreen }));
const DispatchScreen = lazy(async () => ({ default: (await loadDispatchScreen()).DispatchScreen }));
const ForgeScreen = lazy(async () => ({ default: (await loadForgeScreen()).ForgeScreen }));

type ScreenId = PresentationScreenId;

export function AppShell() {
  const bootstrap = useGameBootstrap();
  const state = useGameState();
  const ownedIds = selectOwnedSlimeIds(state);
  const attention = selectNavigationAttention(state);
  const hasCombatSlime = ownedIds.length > 0;
  const [screen, setScreen] = useState<ScreenId | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [selectedSlimeId, setSelectedSlimeId] = useState<SlimeInstanceId | null>(null);
  const [campEntry, setCampEntry] = useState<{ mode: CampMode; revision: number }>({ mode: 'none', revision: 0 });
  const [offlineDismissed, setOfflineDismissed] = useState(false);
  const [handledCampDefeatId, setHandledCampDefeatId] = useState<string | null>(null);
  const [, startScreenTransition] = useTransition();
  const presentation = usePresentationQueue(presentationNoticeDurationMs);
  const initialScreen: ScreenId = ownedIds.length > 0 && state.gameData.roster.formationSlots.some((slot) => slot !== null)
    ? 'battle'
    : 'slimes';
  const activeScreen = screen ?? initialScreen;


  useEffect(() => installBattleAudioUnlock(), []);
  useEffect(() => {
    void Promise.allSettled([loadBattleScreen(), loadDispatchScreen(), loadForgeScreen()]);
  }, []);

  const {
    battleRewardCues,
    battleActivityReport,
    battleReportOpen,
    setBattleReportOpen,
    hasPendingBattleActivity,
    dispatchReturnCues,
    latestLiveDefeatId,
    handleBattleRewardCuePresented,
    dismissDispatchReturnCue,
    confirmBattleActivityReport,
  } = useAppPresentationEvents({
    activeScreen,
    enqueueNotices: presentation.enqueue,
  });

  const campDefeatRecoveryActive = latestLiveDefeatId !== null
    && latestLiveDefeatId !== handledCampDefeatId;

  useEffect(() => {
    if (activeScreen !== 'slimes' || !campDefeatRecoveryActive || latestLiveDefeatId === null) return;
    const timeoutId = window.setTimeout(() => {
      setHandledCampDefeatId(latestLiveDefeatId);
    }, 3_400);
    return () => window.clearTimeout(timeoutId);
  }, [activeScreen, campDefeatRecoveryActive, latestLiveDefeatId]);

  useEffect(() => {
    if (bootstrap.status !== 'ready' || screen !== null) return;
    const firstOwned = ownedIds[0] ?? null;
    setScreen(firstOwned !== null && state.gameData.roster.formationSlots.some((slot) => slot !== null) ? 'battle' : 'slimes');
  }, [bootstrap.status]); // Initial routing only; later state changes must not steal navigation.

  const battleRewardLabel = battleActivityRewardLabel(battleActivityReport);

  const offlineReturn = useMemo(() => {
    if (bootstrap.status !== 'ready' || bootstrap.offlineSec < 30) return null;
    return buildOfflineReturnView(
      bootstrap.offlineSec,
      bootstrap.offlineEvents,
      {
        areaId: state.gameData.progression.currentAreaId,
        stageNumber: state.gameData.progression.currentStage,
      },
    );
  }, [bootstrap, state.gameData.progression.currentAreaId, state.gameData.progression.currentStage]);

  if (bootstrap.status === 'loading') {
    return (
      <main className={styles.page}>
        <section className={`${styles.gameShell} ${styles.loading}`}>
          <SlimeMark className={styles.loadingSlime} />
          <span>セーブデータを読み込み中…</span>
        </section>
      </main>
    );
  }

  if (bootstrap.status === 'error') {
    return (
      <main className={styles.page}>
        <section className={`${styles.gameShell} ${styles.loading}`}>
          <div className={styles.errorMark}>!</div>
          <strong>セーブデータを読み込めませんでした</strong>
          <span>{bootstrap.error.message}</span>
          <button className={styles.reloadButton} type="button" onClick={() => window.location.reload()}>再読み込み</button>
        </section>
      </main>
    );
  }

  const navigateScreen = (next: ScreenId) => {
    startScreenTransition(() => setScreen(next));
  };

  const openCamp = (mode: CampMode = 'none', slimeId: SlimeInstanceId | null = null) => {
    if (slimeId !== null) {
      setSelectedSlimeId(slimeId);
    } else if (mode === 'none') {
      // Ordinary Camp entry is an observation surface. Do not nominate a Hero automatically.
      setSelectedSlimeId(null);
    } else if (selectedSlimeId === null) {
      // Explicit management intents still need a concrete target.
      setSelectedSlimeId(ownedIds[0] ?? null);
    }
    setCampEntry((current) => ({ mode, revision: current.revision + 1 }));
    navigateScreen('slimes');
  };
  const openSlime = (slimeId: SlimeInstanceId) => openCamp('none', slimeId);
  return (
    <main className={styles.page}>
      <section className={styles.gameShell} aria-label="ゲーム画面">
        <div className={styles.appContent}>
          <Suspense fallback={null}>
            {activeScreen === 'battle' && (
              <BattleScreen
                onOpenSlime={openSlime}
                rewardCues={battleRewardCues}
                onRewardCuePresented={handleBattleRewardCuePresented}
              />
            )}
            {activeScreen === 'slimes' && (
              <SlimesScreen
                selectedId={selectedSlimeId}
                onSelect={setSelectedSlimeId}
                onOpenBattle={() => navigateScreen('battle')}
                onOpenForge={() => navigateScreen('forge')}
                entryMode={campEntry.mode}
                entryRevision={campEntry.revision}
                defeatRecoveryActive={campDefeatRecoveryActive}
              />
            )}
            {activeScreen === 'dispatch' && (
              <DispatchScreen
                onOpenCampFormation={() => openCamp('formation')}
                returnCue={dispatchReturnCues[0] ?? null}
                onReturnCuePresented={dismissDispatchReturnCue}
              />
            )}
            {activeScreen === 'forge' && <ForgeScreen onOpenSlime={(slimeId) => openCamp('equipment', slimeId)} />}
          </Suspense>
        </div>

        {activeScreen === 'battle' && battleActivityReport !== null && !battleReportOpen && (
          <BattleActivityPeek
            report={battleActivityReport}
            rewardLabel={battleRewardLabel}
            onOpen={() => setBattleReportOpen(true)}
          />
        )}

        {battleReportOpen && battleActivityReport !== null && (
          <BattleActivitySheet
            report={battleActivityReport}
            onClose={() => setBattleReportOpen(false)}
            onConfirm={confirmBattleActivityReport}
          />
        )}

        {!offlineDismissed && offlineReturn !== null && (
          <OfflineReturnSheet
            view={offlineReturn}
            onClose={() => setOfflineDismissed(true)}
            onBattle={() => {
              setOfflineDismissed(true);
              navigateScreen('battle');
            }}
          />
        )}

        {bootstrap.error !== null && (
          <div className={styles.saveWarning}>セーブに失敗しました。接続を確認してください。</div>
        )}

        {presentation.current !== null
          && !(activeScreen === 'slimes' && presentation.current.presentationCoalescingKey === 'frontier-state')
          && (
          <div
            className={`${styles.eventNotice} ${styles[presentation.current.tone]} ${activeScreen === 'battle' ? '' : styles.eventNoticeCompact}`}
            role="status"
            aria-live="polite"
          >
            <span>{presentation.current.tone === 'milestone' ? '達成' : presentation.current.tone === 'warning' ? '注意' : '更新'}</span>
            <strong>{presentation.current.title}</strong>
            {presentation.current.body !== undefined && <small>{presentation.current.body}</small>}
          </div>
        )}

        {settingsOpen && (
          <SettingsSheet
            onClose={() => setSettingsOpen(false)}
            onOpenGuide={() => { setSettingsOpen(false); setGuideOpen(true); }}
          />
        )}
        {guideOpen && <OnboardingGuideSheet onClose={() => setGuideOpen(false)} />}

        <nav className={styles.bottomNav} aria-label="メインメニュー">
          <NavButton
            id="battle"
            label="戦闘"
            icon="battle"
            active={activeScreen === 'battle'}
            attention={activeScreen !== 'battle' && (hasPendingBattleActivity || battleActivityReport !== null)}
            onClick={navigateScreen}
            disabled={!hasCombatSlime}
          />
          <NavButton
            id="slimes"
            label="キャンプ"
            icon="camp"
            active={activeScreen === 'slimes'}
            attention={attention.has('slimes')}
            onClick={(id) => {
              setSelectedSlimeId(null);
              setCampEntry((current) => ({ mode: 'none', revision: current.revision + 1 }));
              navigateScreen(id);
            }}
          />
          <NavButton id="dispatch" label="派遣" icon="dispatch" active={activeScreen === 'dispatch'} attention={attention.has('dispatch') || dispatchReturnCues.length > 0} onClick={navigateScreen} disabled={!hasCombatSlime} />
          <NavButton id="forge" label="鍛造" icon="forge" active={activeScreen === 'forge'} attention={attention.has('forge')} onClick={navigateScreen} disabled={!hasCombatSlime} />
          <button
            className={settingsOpen ? styles.navButton + ' ' + styles.navButtonActive : styles.navButton}
            type="button"
            aria-haspopup="dialog"
            aria-expanded={settingsOpen}
            onClick={() => setSettingsOpen(true)}
          >
            <span className={styles.navIcon}><NavIcon kind="settings" /></span>
            <span>設定</span>
          </button>
        </nav>
      </section>
    </main>
  );
}

function NavButton({
  id,
  label,
  icon,
  active,
  attention,
  onClick,
  disabled = false,
}: {
  id: ScreenId;
  label: string;
  icon: NavIconKind;
  active: boolean;
  attention: boolean;
  onClick: (screen: ScreenId) => void;
  disabled?: boolean;
}) {
  return (
    <button className={`${styles.navButton} ${active ? styles.navButtonActive : ''}`} type="button" disabled={disabled} onClick={() => onClick(id)}>
      <span className={styles.navIcon}><NavIcon kind={icon} /></span>
      <span>{label}</span>
      {attention && <span className={styles.navNotice} aria-label="実行できる項目があります" />}
    </button>
  );
}