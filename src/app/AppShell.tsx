import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
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
import styles from './AppShell.module.css';
import { battleActivityRewardLabel } from './app-report-view';
import { BattleActivityPeek, BattleActivitySheet, OfflineReturnSheet } from './AppReportSheets';
import { useAppPresentationEvents, type PresentationScreenId } from './useAppPresentationEvents';

const BattleScreen = lazy(async () => {
  const module = await import('../screens/BattleScreen');
  return { default: module.BattleScreen };
});

const DispatchScreen = lazy(async () => {
  const module = await import('../screens/DispatchScreen');
  return { default: module.DispatchScreen };
});

const ForgeScreen = lazy(async () => {
  const module = await import('../screens/ForgeScreen');
  return { default: module.ForgeScreen };
});

type ScreenId = PresentationScreenId;

export function AppShell() {
  const bootstrap = useGameBootstrap();
  const state = useGameState();
  const ownedIds = selectOwnedSlimeIds(state);
  const attention = selectNavigationAttention(state);
  const [screen, setScreen] = useState<ScreenId | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selectedSlimeId, setSelectedSlimeId] = useState<SlimeInstanceId | null>(null);
  const [campEntry, setCampEntry] = useState<{ mode: CampMode; revision: number }>({ mode: 'none', revision: 0 });
  const [offlineDismissed, setOfflineDismissed] = useState(false);
  const presentation = usePresentationQueue(presentationNoticeDurationMs);
  const initialScreen: ScreenId = ownedIds.length > 0 && state.gameData.roster.formationSlots.some((slot) => slot !== null)
    ? 'battle'
    : 'slimes';
  const activeScreen = screen ?? initialScreen;


  useEffect(() => installBattleAudioUnlock(), []);

  const {
    battleRewardCues,
    battleActivityReport,
    battleReportOpen,
    setBattleReportOpen,
    hasPendingBattleActivity,
    dispatchReturnCues,
    handleBattleRewardCuePresented,
    dismissDispatchReturnCue,
    confirmBattleActivityReport,
  } = useAppPresentationEvents({
    activeScreen,
    enqueueNotices: presentation.enqueue,
  });

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
    setScreen('slimes');
  };
  const openSlime = (slimeId: SlimeInstanceId) => openCamp('none', slimeId);
  return (
    <main className={styles.page}>
      <section className={styles.gameShell} aria-label="ゲーム画面">
        <div className={styles.appContent}>
          <Suspense fallback={<ScreenLoading screen={activeScreen} />}>
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
                onOpenBattle={() => setScreen('battle')}
                onOpenForge={() => setScreen('forge')}
                entryMode={campEntry.mode}
                entryRevision={campEntry.revision}
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
              setScreen('battle');
            }}
          />
        )}

        {bootstrap.error !== null && (
          <div className={styles.saveWarning}>セーブに失敗しました。接続を確認してください。</div>
        )}

        {presentation.current !== null && (
          <div
            className={`${styles.eventNotice} ${styles[presentation.current.tone]}`}
            role="status"
            aria-live="polite"
          >
            <span>{presentation.current.tone === 'milestone' ? '達成' : presentation.current.tone === 'warning' ? '注意' : '更新'}</span>
            <strong>{presentation.current.title}</strong>
            {presentation.current.body !== undefined && <small>{presentation.current.body}</small>}
          </div>
        )}

        {settingsOpen && <SettingsSheet onClose={() => setSettingsOpen(false)} />}

        <nav className={styles.bottomNav} aria-label="メインメニュー">
          <NavButton
            id="battle"
            label="戦闘"
            icon="battle"
            active={activeScreen === 'battle'}
            attention={activeScreen !== 'battle' && (hasPendingBattleActivity || battleActivityReport !== null)}
            onClick={setScreen}
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
              setScreen(id);
            }}
          />
          <NavButton id="dispatch" label="派遣" icon="dispatch" active={activeScreen === 'dispatch'} attention={attention.has('dispatch') || dispatchReturnCues.length > 0} onClick={setScreen} />
          <NavButton id="forge" label="鍛造" icon="forge" active={activeScreen === 'forge'} attention={attention.has('forge')} onClick={setScreen} />
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

function ScreenLoading({ screen }: { screen: ScreenId }) {
  const labels: Record<ScreenId, string> = {
    battle: '戦場へ移動中',
    slimes: 'キャンプへ移動中',
    dispatch: '遠征地図を開いています',
    forge: '工房を開いています',
  };
  return (
    <section className={`screen screen--active ${styles.screenLoading}`} aria-label={labels[screen]} aria-busy="true">
      <SlimeMark className={styles.screenLoadingMark} />
      <strong>{labels[screen]}</strong>
    </section>
  );
}

function NavButton({
  id,
  label,
  icon,
  active,
  attention,
  onClick,
}: {
  id: ScreenId;
  label: string;
  icon: NavIconKind;
  active: boolean;
  attention: boolean;
  onClick: (screen: ScreenId) => void;
}) {
  return (
    <button className={`${styles.navButton} ${active ? styles.navButtonActive : ''}`} type="button" onClick={() => onClick(id)}>
      <span className={styles.navIcon}><NavIcon kind={icon} /></span>
      <span>{label}</span>
      {attention && <span className={styles.navNotice} aria-label="実行できる項目があります" />}
    </button>
  );
}