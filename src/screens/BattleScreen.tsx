import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useGameController, useGameState } from '../app/GameProvider';
import { selectBattleSceneModel } from '../application/selectors/battle-scene';
import { selectFormation, selectGlobalHud } from '../application/selectors/ui-selectors';
import type { BattleSnapshot } from '../game/battle-runtime/types';
import type { SlimeInstanceId } from '../domain';
import { battleRewardCueMatchesEncounter, type BattleRewardCue } from '../game/battle-reward';
import {
  battleSceneModelKey,
  createBattlePresentationCursor,
  reconcileBattlePresentation,
} from '../game/battle-presentation-latch';

const BattleCanvas = lazy(async () => {
  const module = await import('../components/BattleCanvas');
  return { default: module.BattleCanvas };
});

const INITIAL_BATTLE: BattleSnapshot = {
  phase: 'loading',
  label: '出撃準備中',
  result: null,
  enemyAlive: 0,
  enemyHp: 0,
  enemyMaxHp: 0,
  presentationReady: false,
  allies: {},
};

type KeyedBattleSnapshot = Readonly<{
  battleKey: string;
  snapshot: BattleSnapshot;
}>;

type KeyedBattleError = Readonly<{
  battleKey: string;
  error: Error;
}>;

const PRESENTATION_HANDOFF_HOLD_MS = 300;

export function BattleScreen({
  onOpenSlime,
  rewardCue,
  onRewardCuePresented,
}: {
  onOpenSlime: (slimeId: SlimeInstanceId) => void;
  rewardCue: BattleRewardCue | null;
  onRewardCuePresented: (cueId: string) => void;
}) {
  const state = useGameState();
  const controller = useGameController();
  const validationMode = controller.validationMode;
  const hud = selectGlobalHud(state);
  const formation = selectFormation(state);
  const latestSceneModel = selectBattleSceneModel(state);
  const latestBattleKey = battleSceneModelKey(latestSceneModel);
  const [presentationCursor, setPresentationCursor] = useState(() =>
    createBattlePresentationCursor(
      latestSceneModel,
      state.gameData.combat.contentBoundaryReached,
    ));
  const sceneModel = presentationCursor.model;
  const battleKey = battleSceneModelKey(sceneModel);
  const [battleState, setBattleState] = useState<KeyedBattleSnapshot>({
    battleKey: '',
    snapshot: INITIAL_BATTLE,
  });
  const [runtimeErrorState, setRuntimeErrorState] = useState<KeyedBattleError | null>(null);
  const [handoffReadyBattleKey, setHandoffReadyBattleKey] = useState<string | null>(null);
  const [stageArrival, setStageArrival] = useState<number | null>(null);
  const previousStageRef = useRef(sceneModel.stageNumber);
  const battle = battleState.battleKey === battleKey ? battleState.snapshot : INITIAL_BATTLE;
  const runtimeError = runtimeErrorState?.battleKey === battleKey ? runtimeErrorState.error : null;
  const hasBattleSlime = sceneModel.allies.length > 0;
  const encounterEnemyCount = sceneModel.encounter?.enemies.length ?? 0;
  const displayedEnemyAlive = battle.phase === 'loading' ? encounterEnemyCount : battle.enemyAlive;
  const enemyRatio = battle.phase === 'loading' && encounterEnemyCount > 0
    ? 1
    : battle.enemyMaxHp > 0
      ? Math.max(0, Math.min(1, battle.enemyHp / battle.enemyMaxHp))
      : 0;
  const activeCount = sceneModel.allies.length;
  const presentationCaughtUp = battleKey === latestBattleKey;
  const terminalVisible = presentationCursor.terminalReached;
  const visibleRewardCue = rewardCue !== null
    && (
      terminalVisible
      || battleRewardCueMatchesEncounter(
        rewardCue,
        sceneModel.stageNumber,
        sceneModel.waveIndex,
        sceneModel.encounter?.boss === true,
      )
    )
    ? rewardCue
    : null;

  useEffect(() => {
    setHandoffReadyBattleKey(null);
    if (!battle.presentationReady) return undefined;
    const timeoutId = window.setTimeout(
      () => setHandoffReadyBattleKey(battleKey),
      PRESENTATION_HANDOFF_HOLD_MS,
    );
    return () => window.clearTimeout(timeoutId);
  }, [battle.presentationReady, battleKey]);

  useEffect(() => {
    setPresentationCursor((current) => reconcileBattlePresentation(
      current,
      latestSceneModel,
      handoffReadyBattleKey === battleKey || runtimeError !== null,
      state.gameData.combat.contentBoundaryReached,
    ));
  }, [
    battleKey,
    handoffReadyBattleKey,
    latestBattleKey,
    runtimeError,
    state.gameData.combat.contentBoundaryReached,
  ]);

  useEffect(() => {
    const previousStage = previousStageRef.current;
    previousStageRef.current = sceneModel.stageNumber;
    if (sceneModel.stageNumber <= previousStage) return;
    setStageArrival(sceneModel.stageNumber);
  }, [sceneModel.stageNumber]);

  useEffect(() => {
    if (visibleRewardCue === null) return;
    onRewardCuePresented(visibleRewardCue.id);
  }, [onRewardCuePresented, visibleRewardCue?.id]);

  const battleStatus = useMemo(() => {
    if (runtimeError !== null) return '戦闘表示の読み込みに失敗しました';
    if (terminalVisible) return '現在のエリアを踏破しました';
    if (presentationCaughtUp && state.gameData.combat.retryFarmClearsRemaining > 0) {
      return `再編成中 · ステージ${state.gameData.progression.currentStage} · 再出撃まであと${state.gameData.combat.retryFarmClearsRemaining}周`;
    }
    if (activeCount === 0) return '傭兵を編成すると自動戦闘が始まります';
    return battle.label;
  }, [
    activeCount,
    battle.label,
    runtimeError,
    presentationCaughtUp,
    terminalVisible,
    state.gameData.combat.retryFarmClearsRemaining,
    state.gameData.progression.currentStage,
  ]);

  return (
    <section className="screen screen--battle screen--active" aria-label="戦闘">
      {hasBattleSlime && sceneModel.encounter !== null ? (
        <Suspense
          fallback={(
            <div className="battle-empty-visual" aria-label="戦闘表示を読み込み中">
              <div className="battle-empty-road" />
              <div className="battle-empty-orb">●</div>
            </div>
          )}
        >
          <BattleCanvas
            model={sceneModel}
            rewardCue={visibleRewardCue}
            onSnapshot={(snapshot) => {
              setBattleState({ battleKey, snapshot });
              setRuntimeErrorState((current) => current?.battleKey === battleKey ? null : current);
            }}
            onRuntimeError={(error) => setRuntimeErrorState({ battleKey, error })}
          />
        </Suspense>
      ) : (
        <div className="battle-empty-visual" aria-hidden="true">
          <div className="battle-empty-road" />
          <div className="battle-empty-orb">●</div>
        </div>
      )}

      {stageArrival !== null && (
        <div
          key={stageArrival}
          className="battle-stage-arrival"
          aria-hidden="true"
          onAnimationEnd={() => setStageArrival((current) => current === stageArrival ? null : current)}
        >
          <i />
        </div>
      )}

      <header className="battle-topbar">
        <div>
          <p className="eyebrow">{hud.areaLabel} · ステージ {sceneModel.stageNumber}</p>
        </div>
        <div className="resource-pill"><span className="resource-pill__coin">G</span><strong>{validationMode ? '∞' : hud.gold}</strong></div>
      </header>

      {hasBattleSlime && sceneModel.encounter !== null && runtimeError === null && (
        <div className={`battle-enemy-compact ${sceneModel.encounter?.boss ? 'is-boss' : ''}${sceneModel.encounter?.boss && battle.phase === 'approach' ? ' is-entering' : ''}${battle.result === 'victory' ? ' is-cleared' : ''}`} aria-label="敵の体力">
          <div><strong>{sceneModel.encounter?.displayName ?? '敵部隊'}</strong><span>{sceneModel.encounter?.boss ? 'BOSS' : `残り${displayedEnemyAlive}体`}</span></div>
          <div className="enemy-hp-track"><div className="enemy-hp-fill" style={{ transform: `scaleX(${enemyRatio})` }} /></div>
        </div>
      )}

      <div className={`battle-status-strip ${state.gameData.combat.retryFarmClearsRemaining > 0 || runtimeError !== null ? 'is-warning' : ''}`}>
        <span className="status-dot" />
        {battleStatus}
      </div>

      {visibleRewardCue !== null && (
        <div className={'battle-reward-receipt' + (visibleRewardCue.importance === 'boss' ? ' is-major' : '')} key={visibleRewardCue.id} aria-live="polite">
          <span>{visibleRewardCue.importance === 'boss' ? 'BOSS戦利品' : '戦利品'}</span>
          <div>
            {visibleRewardCue.items.map((item) => (
              <strong className={item.kind === 'gold' ? 'is-gold' : 'is-material'} key={item.kind + ':' + item.id}>
                {item.label} +{Math.floor(item.amount).toLocaleString('ja-JP')}
              </strong>
            ))}
          </div>
        </div>
      )}

      {validationMode && terminalVisible && (
        <button className="battle-validation-restart" type="button" onClick={() => controller.validationResetBattle()}>
          <span>検証</span><strong>戦闘を最初から再開</strong>
        </button>
      )}

      <div className="battle-party-rail" aria-label="出撃編成">
        {formation.map((slot) => {
          if (slot.slimeId === null) return <span className="party-dot party-dot--empty" key={slot.slotIndex}>{slot.slotIndex + 1}</span>;
          const sceneAlly = sceneModel.allies.find((ally) => ally.slimeId === slot.slimeId);
          if (sceneAlly === undefined) return null;
          const runtimeAlly = battle.allies[slot.slimeId];
          const hpRatio = runtimeAlly === undefined
            ? 1
            : runtimeAlly.hp / Math.max(1, runtimeAlly.maxHp);
          return (
            <button className="party-dot" type="button" key={slot.slotIndex} onClick={() => onOpenSlime(slot.slimeId!)}>
              <img src={`${import.meta.env.BASE_URL}${slot.icon}`} alt={slot.name ?? ''} />
              <span className="party-dot__hp"><i style={{ transform: `scaleX(${Math.max(0, Math.min(1, hpRatio))})` }} /></span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
