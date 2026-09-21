import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { BottomSheet, usePresentationQueue } from 'idle-game-kit/react';
import { useGameBootstrap, useGameController, useGameState } from './GameProvider';
import { selectNavigationAttention, selectOwnedSlimeIds } from '../application/selectors/ui-selectors';
import {
  battleActivityProgressLabel,
  battleActivityReportIsMeaningful,
  buildBattleActivityReport,
  buildOfflineReturnView,
  formatBattleActivityElapsed,
  isBattleActivityEvent,
  mergeBattleActivityReports,
  presentationNoticeDurationMs,
  routePresentationEvents,
  type BattleActivityReport,
} from '../application/presentation-events';
import type { BattleRewardCue } from '../game/battle-reward';
import { SlimesScreen } from '../screens/SlimesScreen';
import type { SlimeInstanceId } from '../domain';
import { NavIcon, type NavIconKind } from '../components/navigation/NavIcon';
import { SlimeMark } from '../components/SlimeMark';
import { SettingsSheet } from '../components/SettingsSheet';
import styles from './AppShell.module.css';

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

type ScreenId = 'battle' | 'slimes' | 'dispatch' | 'forge';

export function AppShell() {
  const bootstrap = useGameBootstrap();
  const controller = useGameController();
  const state = useGameState();
  const ownedIds = selectOwnedSlimeIds(state);
  const attention = selectNavigationAttention(state);
  const [screen, setScreen] = useState<ScreenId | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selectedSlimeId, setSelectedSlimeId] = useState<SlimeInstanceId | null>(null);
  const [offlineDismissed, setOfflineDismissed] = useState(false);
  const [battleRewardCue, setBattleRewardCue] = useState<BattleRewardCue | null>(null);
  const [presentedBattleRewardCueId, setPresentedBattleRewardCueId] = useState<string | null>(null);
  const [battleActivityReport, setBattleActivityReport] = useState<BattleActivityReport | null>(null);
  const [battleReportOpen, setBattleReportOpen] = useState(false);
  const [hasPendingBattleActivity, setHasPendingBattleActivity] = useState(false);
  const pendingBattleActivityRef = useRef<BattleActivityReport | null>(null);
  const presentation = usePresentationQueue(presentationNoticeDurationMs);
  const initialScreen: ScreenId = ownedIds.length > 0 && state.gameData.roster.formationSlots.some((slot) => slot !== null)
    ? 'battle'
    : 'slimes';
  const activeScreen = screen ?? initialScreen;


  const activeScreenRef = useRef(activeScreen);
  const enqueuePresentationRef = useRef(presentation.enqueue);
  activeScreenRef.current = activeScreen;
  enqueuePresentationRef.current = presentation.enqueue;

  useEffect(() => controller.subscribeEvents((events, context) => {
    const activeScreenNow = activeScreenRef.current;
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
          from: { stageNumber: context.fromStage, waveIndex: context.fromWaveIndex },
          to: { stageNumber: context.toStage, waveIndex: context.toWaveIndex },
        });
        if (activeScreenNow === 'battle') {
          if (battleActivityReportIsMeaningful(delta)) {
            setBattleActivityReport((current) => mergeBattleActivityReports(current, delta));
          }
        } else {
          const pending = mergeBattleActivityReports(
            pendingBattleActivityRef.current,
            delta,
          );
          pendingBattleActivityRef.current = pending;
          if (battleActivityReportIsMeaningful(pending)) setHasPendingBattleActivity(true);
        }
      }
    }

    const presentationEvents = context.source === 'offline'
      ? []
      : collectingBattleActivity
        ? events.filter((event) => !isBattleActivityEvent(event))
        : events;
    const routed = routePresentationEvents(
      presentationEvents,
      activeScreenNow === 'battle' && context.source === 'live',
    );
    enqueuePresentationRef.current(routed.notices);
    if (routed.battleRewardCue !== null) {
      setBattleRewardCue(routed.battleRewardCue);
      setPresentedBattleRewardCueId(null);
    }
  }), [controller]);

  useEffect(() => {
    if (activeScreen === 'battle') return;
    setBattleRewardCue(null);
    setPresentedBattleRewardCueId(null);
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

  useEffect(() => {
    if (
      battleRewardCue === null
      || presentedBattleRewardCueId !== battleRewardCue.id
    ) return undefined;
    const timeoutId = window.setTimeout(() => {
      setBattleRewardCue((current) => current?.id === battleRewardCue.id ? null : current);
      setPresentedBattleRewardCueId((current) =>
        current === battleRewardCue.id ? null : current);
    }, 2_200);
    return () => window.clearTimeout(timeoutId);
  }, [battleRewardCue, presentedBattleRewardCueId]);

  useEffect(() => {
    if (bootstrap.status !== 'ready' || screen !== null) return;
    const firstOwned = ownedIds[0] ?? null;
    if (selectedSlimeId === null && firstOwned !== null) setSelectedSlimeId(firstOwned);
    setScreen(firstOwned !== null && state.gameData.roster.formationSlots.some((slot) => slot !== null) ? 'battle' : 'slimes');
  }, [bootstrap.status]); // Initial routing only; later state changes must not steal navigation.

  const battleActivityRewardLabel = useMemo(() => {
    if (battleActivityReport === null) return null;
    if (battleActivityReport.rewards.length === 0) return '戦闘進行のみ';
    const visible = battleActivityReport.rewards.slice(0, 2)
      .map((item) => `${item.label} +${Math.floor(item.amount).toLocaleString('ja-JP')}`);
    const rest = battleActivityReport.rewards.length - visible.length;
    return rest > 0 ? `${visible.join(' · ')} · ほか${rest}種` : visible.join(' · ');
  }, [battleActivityReport]);

  const offlineReturn = useMemo(() => {
    if (bootstrap.status !== 'ready' || bootstrap.offlineSec < 30) return null;
    return buildOfflineReturnView(
      bootstrap.offlineSec,
      bootstrap.offlineEvents,
      state.gameData.progression.currentStage,
    );
  }, [bootstrap, state.gameData.progression.currentStage]);

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

  const openSlime = (slimeId: SlimeInstanceId) => {
    setSelectedSlimeId(slimeId);
    setScreen('slimes');
  };
  return (
    <main className={styles.page}>
      <section className={styles.gameShell} aria-label="ゲーム画面">
        <div className={styles.appContent}>
          <Suspense fallback={<section className="screen screen--active" aria-label="画面を読み込み中" />}>
            {activeScreen === 'battle' && (
              <BattleScreen
                onOpenSlime={openSlime}
                rewardCue={battleRewardCue}
                onRewardCuePresented={setPresentedBattleRewardCueId}
              />
            )}
            {activeScreen === 'slimes' && <SlimesScreen selectedId={selectedSlimeId} onSelect={setSelectedSlimeId} onOpenBattle={() => setScreen('battle')} />}
            {activeScreen === 'dispatch' && <DispatchScreen />}
            {activeScreen === 'forge' && <ForgeScreen />}
          </Suspense>
        </div>

        {activeScreen === 'battle' && battleActivityReport !== null && !battleReportOpen && (
          <button
            className={styles.battleReportPeek}
            type="button"
            onClick={() => setBattleReportOpen(true)}
          >
            <span>戦闘レポート</span>
            <strong>{battleActivityProgressLabel(battleActivityReport)}</strong>
            <small>
              {formatBattleActivityElapsed(battleActivityReport.elapsedSec)}
              {battleActivityRewardLabel === null ? '' : ` · ${battleActivityRewardLabel}`}
            </small>
          </button>
        )}

        {battleReportOpen && battleActivityReport !== null && (
          <BottomSheet
            title="戦闘レポート"
            onClose={() => setBattleReportOpen(false)}
            backdropClassName={styles.sheetBackdrop}
            sheetClassName={`${styles.sheetPanel} ${styles.offlineSheet}`}
            headerClassName={styles.sheetHeader}
            closeButtonClassName={styles.sheetClose}
          >
            <div className={styles.offlineSummary}>
              <div className={styles.offlineHero}>
                <span>離れていた間の自動戦闘</span>
                <strong>{battleActivityProgressLabel(battleActivityReport)}</strong>
                <small>{formatBattleActivityElapsed(battleActivityReport.elapsedSec)}ぶん進行しました</small>
              </div>
              <div className={styles.offlineGrid}>
                <div><span>ウェーブ突破</span><strong>{battleActivityReport.waveClearCount}</strong></div>
                <div><span>ステージ突破</span><strong>{battleActivityReport.stageClearCount}</strong></div>
                <div><span>周回完了</span><strong>{battleActivityReport.farmClearCount}</strong></div>
                <div><span>敗北</span><strong>{battleActivityReport.defeatCount}</strong></div>
              </div>
              {battleActivityReport.bossDefeatedCount > 0 && (
                <div className={styles.offlineReward}>
                  <span>ボス撃破</span>
                  <strong>{battleActivityReport.bossDefeatedCount}回</strong>
                </div>
              )}
              {battleActivityReport.retryCount > 0 && (
                <div className={styles.offlineReward}>
                  <span>最前線へ再挑戦</span>
                  <strong>{battleActivityReport.retryCount}回</strong>
                </div>
              )}
              <div className={styles.battleReportRewards}>
                <span>獲得報酬</span>
                {battleActivityReport.rewards.length > 0 ? (
                  <div>
                    {battleActivityReport.rewards.map((item) => (
                      <div key={`${item.kind}:${item.id}`}>
                        <span>{item.label}</span>
                        <strong>+{Math.floor(item.amount).toLocaleString('ja-JP')}</strong>
                      </div>
                    ))}
                  </div>
                ) : (
                  <small>この期間は報酬獲得前まで戦闘が進みました。</small>
                )}
              </div>
              <button
                className={styles.primaryButton}
                type="button"
                onClick={() => {
                  setBattleActivityReport(null);
                  setBattleReportOpen(false);
                }}
              >
                確認した
              </button>
            </div>
          </BottomSheet>
        )}

        {!offlineDismissed && offlineReturn !== null && (
          <BottomSheet
            title="おかえりなさい"
            onClose={() => setOfflineDismissed(true)}
            backdropClassName={styles.sheetBackdrop}
            sheetClassName={`${styles.sheetPanel} ${styles.offlineSheet}`}
            headerClassName={styles.sheetHeader}
            closeButtonClassName={styles.sheetClose}
          >
            <div className={styles.offlineSummary}>
              <div className={styles.offlineHero}>
                <span>放置進行</span>
                <strong>{offlineReturn.elapsedLabel}</strong>
                <small>放置中も傭兵団は進み続けました。</small>
              </div>
              <div className={styles.offlineGrid}>
                <div><span>到達</span><strong>ステージ {offlineReturn.furthestStage}</strong></div>
                <div><span>ステージ突破</span><strong>{offlineReturn.stageClearCount}</strong></div>
                <div><span>ボス撃破</span><strong>{offlineReturn.bossDefeatedCount}</strong></div>
                <div><span>派遣帰還</span><strong>{offlineReturn.dispatchCompletedCount}</strong></div>
              </div>
              {offlineReturn.frontierStageReached !== null && (
                <div className={styles.offlineReward}><span>最前線</span><strong>ステージ {offlineReturn.frontierStageReached} 到達 · 周回継続中</strong></div>
              )}
              {offlineReturn.battleRewards.length > 0 && (
                <div className={styles.battleReportRewards}>
                  <span>放置中の獲得</span>
                  <div>
                    {offlineReturn.battleRewards.map((item) => (
                      <div key={`offline:${item.kind}:${item.id}`}>
                        <span>{item.label}</span>
                        <strong>+{Math.floor(item.amount).toLocaleString('ja-JP')}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <button className={styles.primaryButton} type="button" onClick={() => { setOfflineDismissed(true); setScreen('battle'); }}>戦闘へ戻る</button>
            </div>
          </BottomSheet>
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
          <NavButton id="slimes" label="キャンプ" icon="camp" active={activeScreen === 'slimes'} attention={attention.has('slimes')} onClick={setScreen} />
          <NavButton id="dispatch" label="派遣" icon="dispatch" active={activeScreen === 'dispatch'} attention={attention.has('dispatch')} onClick={setScreen} />
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
