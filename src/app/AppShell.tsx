import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { BottomSheet, usePresentationQueue } from 'idle-game-kit/react';
import { useGameBootstrap, useGameController, useGameState } from './GameProvider';
import { selectNavigationAttention, selectOwnedSlimeIds } from '../application/selectors/ui-selectors';
import { buildOfflineReturnView, presentationNoticeDurationMs, toBattleRewardCue, toPresentationNotices } from '../application/presentation-events';
import type { BattleRewardCue } from '../game/battle-reward';
import { SlimesScreen } from '../screens/SlimesScreen';
import { DispatchScreen } from '../screens/DispatchScreen';
import { ForgeScreen } from '../screens/ForgeScreen';
import type { SlimeInstanceId } from '../domain';
import { NavIcon, type NavIconKind } from '../components/navigation/NavIcon';

const BattleScreen = lazy(async () => {
  const module = await import('../screens/BattleScreen');
  return { default: module.BattleScreen };
});

type ScreenId = 'battle' | 'slimes' | 'dispatch' | 'forge';

export function AppShell() {
  const bootstrap = useGameBootstrap();
  const controller = useGameController();
  const state = useGameState();
  const ownedIds = selectOwnedSlimeIds(state);
  const attention = selectNavigationAttention(state);
  const [screen, setScreen] = useState<ScreenId | null>(null);
  const [selectedSlimeId, setSelectedSlimeId] = useState<SlimeInstanceId | null>(null);
  const [offlineDismissed, setOfflineDismissed] = useState(false);
  const [battleRewardCue, setBattleRewardCue] = useState<BattleRewardCue | null>(null);
  const presentation = usePresentationQueue(presentationNoticeDurationMs);
  const initialScreen: ScreenId = ownedIds.length > 0 && state.gameData.roster.formationSlots.some((slot) => slot !== null)
    ? 'battle'
    : 'slimes';
  const activeScreen = screen ?? initialScreen;


  useEffect(() => controller.subscribeEvents((events) => {
    const notices = toPresentationNotices(events);
    presentation.enqueue(activeScreen === 'battle'
      ? notices.filter((notice) => notice.presentationCoalescingKey !== 'combat-reward')
      : notices);
    const rewardCue = toBattleRewardCue(events);
    if (rewardCue !== null) setBattleRewardCue(rewardCue);
  }), [controller, presentation.enqueue, activeScreen]);

  useEffect(() => {
    if (battleRewardCue === null) return undefined;
    const timeoutId = window.setTimeout(() => {
      setBattleRewardCue((current) => current?.id === battleRewardCue.id ? null : current);
    }, 2_200);
    return () => window.clearTimeout(timeoutId);
  }, [battleRewardCue]);

  useEffect(() => {
    if (bootstrap.status !== 'ready' || screen !== null) return;
    const firstOwned = ownedIds[0] ?? null;
    if (selectedSlimeId === null && firstOwned !== null) setSelectedSlimeId(firstOwned);
    setScreen(firstOwned !== null && state.gameData.roster.formationSlots.some((slot) => slot !== null) ? 'battle' : 'slimes');
  }, [bootstrap.status]); // Initial routing only; later state changes must not steal navigation.

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
      <main className="page">
        <section className="game-shell game-shell--loading">
          <div className="loading-slime">●</div>
          <span>セーブデータを読み込み中…</span>
        </section>
      </main>
    );
  }

  if (bootstrap.status === 'error') {
    return (
      <main className="page">
        <section className="game-shell game-shell--loading">
          <div className="error-mark">!</div>
          <strong>セーブデータを読み込めませんでした</strong>
          <span>{bootstrap.error.message}</span>
          <button className="secondary-button" type="button" onClick={() => window.location.reload()}>再読み込み</button>
        </section>
      </main>
    );
  }

  const openSlime = (slimeId: SlimeInstanceId) => {
    setSelectedSlimeId(slimeId);
    setScreen('slimes');
  };
  return (
    <main className="page">
      <section className="game-shell" aria-label="ゲーム画面">
        <div className="app-content">
          <Suspense fallback={<section className="screen screen--active" aria-label="画面を読み込み中" />}>
            {activeScreen === 'battle' && <BattleScreen onOpenSlime={openSlime} rewardCue={battleRewardCue} />}
            {activeScreen === 'slimes' && <SlimesScreen selectedId={selectedSlimeId} onSelect={setSelectedSlimeId} onOpenBattle={() => setScreen('battle')} />}
            {activeScreen === 'dispatch' && <DispatchScreen />}
            {activeScreen === 'forge' && <ForgeScreen />}
          </Suspense>
        </div>

        {!offlineDismissed && offlineReturn !== null && (
          <BottomSheet
            title="おかえりなさい"
            onClose={() => setOfflineDismissed(true)}
            backdropClassName="sheet-backdrop"
            sheetClassName="sheet-panel offline-sheet"
            headerClassName="sheet-header"
            closeButtonClassName="sheet-close"
          >
            <div className="offline-summary">
              <div className="offline-summary__hero">
                <span>放置進行</span>
                <strong>{offlineReturn.elapsedLabel}</strong>
                <small>放置中も傭兵団は進み続けました。</small>
              </div>
              <div className="offline-summary__grid">
                <div><span>到達</span><strong>ステージ {offlineReturn.furthestStage}</strong></div>
                <div><span>ステージ突破</span><strong>{offlineReturn.stageClearCount}</strong></div>
                <div><span>ボス撃破</span><strong>{offlineReturn.bossDefeatedCount}</strong></div>
                <div><span>派遣帰還</span><strong>{offlineReturn.dispatchCompletedCount}</strong></div>
              </div>
              {offlineReturn.frontierStageReached !== null && (
                <div className="offline-summary__reward"><span>最前線</span><strong>ステージ {offlineReturn.frontierStageReached} 到達 · 周回継続中</strong></div>
              )}
              {offlineReturn.materialDropCount > 0 && (
                <div className="offline-summary__reward"><span>戦闘ドロップ</span><strong>素材 +{offlineReturn.materialDropCount}</strong></div>
              )}
              <button className="primary-button" type="button" onClick={() => { setOfflineDismissed(true); setScreen('battle'); }}>戦闘へ戻る</button>
            </div>
          </BottomSheet>
        )}

        {bootstrap.error !== null && (
          <div className="save-warning">セーブに失敗しました。接続を確認してください。</div>
        )}

        {presentation.current !== null && (
          <button
            className={`global-event-notice global-event-notice--${presentation.current.tone}`}
            type="button"
            onClick={presentation.dismissCurrent}
          >
            <span>{presentation.current.tone === 'milestone' ? '達成' : presentation.current.tone === 'warning' ? '注意' : '更新'}</span>
            <strong>{presentation.current.title}</strong>
            {presentation.current.body !== undefined && <small>{presentation.current.body}</small>}
          </button>
        )}

        <nav className="bottom-nav bottom-nav--four" aria-label="メインメニュー">
          <NavButton id="battle" label="戦闘" icon="battle" active={activeScreen === 'battle'} attention={false} onClick={setScreen} />
          <NavButton id="slimes" label="キャンプ" icon="camp" active={activeScreen === 'slimes'} attention={attention.has('slimes')} onClick={setScreen} />
          <NavButton id="dispatch" label="派遣" icon="dispatch" active={activeScreen === 'dispatch'} attention={attention.has('dispatch')} onClick={setScreen} />
          <NavButton id="forge" label="鍛造" icon="forge" active={activeScreen === 'forge'} attention={attention.has('forge')} onClick={setScreen} />
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
    <button className={active ? 'is-active' : ''} type="button" onClick={() => onClick(id)}>
      <span className="nav-icon"><NavIcon kind={icon} /></span>
      <span>{label}</span>
      {attention && <span className="nav-notice" aria-label="実行できる項目があります" />}
    </button>
  );
}
