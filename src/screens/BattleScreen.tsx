import { useEffect, useMemo, useRef, useState } from 'react';
import { BattleCanvas } from '../components/BattleCanvas';
import { useGameController, useGameState } from '../app/GameProvider';
import { selectBattleSceneModel } from '../application/selectors/battle-scene';
import { selectFormation, selectGlobalHud } from '../application/selectors/ui-selectors';
import type { BattleSnapshot } from '../game/BattleRuntime';
import type { SlimeInstanceId } from '../domain';
import type { BattleRewardCue } from '../game/battle-reward';

const INITIAL_BATTLE: BattleSnapshot = {
  phase: 'loading',
  label: '出撃準備中',
  result: null,
  enemyAlive: 0,
  enemyHp: 0,
  enemyMaxHp: 0,
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

export function BattleScreen({
  onOpenSlime,
  rewardCue,
}: {
  onOpenSlime: (slimeId: SlimeInstanceId) => void;
  rewardCue: BattleRewardCue | null;
}) {
  const state = useGameState();
  const controller = useGameController();
  const validationMode = controller.validationMode;
  const [battleState, setBattleState] = useState<KeyedBattleSnapshot>({
    battleKey: '',
    snapshot: INITIAL_BATTLE,
  });
  const [runtimeErrorState, setRuntimeErrorState] = useState<KeyedBattleError | null>(null);
  const [stageArrival, setStageArrival] = useState<number | null>(null);
  const previousStageRef = useRef(state.gameData.progression.currentStage);
  const hud = selectGlobalHud(state);
  const formation = selectFormation(state);
  const sceneModel = selectBattleSceneModel(state);
  const battleKey = `${sceneModel.encounterKey}:${sceneModel.visualKey}`;
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

  useEffect(() => {
    const previousStage = previousStageRef.current;
    previousStageRef.current = sceneModel.stageNumber;
    if (sceneModel.stageNumber <= previousStage) return;
    setStageArrival(sceneModel.stageNumber);
  }, [sceneModel.stageNumber]);

  const battleStatus = useMemo(() => {
    if (runtimeError !== null) return '戦闘表示の読み込みに失敗しました';
    if (state.gameData.combat.contentBoundaryReached) return '現在のエリアを踏破しました';
    if (state.gameData.combat.retryFarmClearsRemaining > 0) {
      return `再編成中 · ステージ${state.gameData.progression.currentStage} · 再出撃まであと${state.gameData.combat.retryFarmClearsRemaining}周`;
    }
    if (activeCount === 0) return '傭兵を編成すると自動戦闘が始まります';
    return battle.label;
  }, [
    activeCount,
    battle.label,
    runtimeError,
    state.gameData.combat.contentBoundaryReached,
    state.gameData.combat.retryFarmClearsRemaining,
    state.gameData.progression.currentStage,
  ]);

  return (
    <section className="screen screen--battle screen--active" aria-label="戦闘">
      {hasBattleSlime ? (
        <BattleCanvas
          model={sceneModel}
          rewardCue={rewardCue}
          onSnapshot={(snapshot) => {
            setBattleState({ battleKey, snapshot });
            setRuntimeErrorState((current) => current?.battleKey === battleKey ? null : current);
          }}
          onRuntimeError={(error) => setRuntimeErrorState({ battleKey, error })}
        />
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
          <p className="eyebrow">{hud.areaLabel} · ステージ {hud.stageLabel}</p>
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

      {rewardCue !== null && (
        <div className={'battle-reward-receipt' + (rewardCue.importance === 'boss' ? ' is-major' : '')} key={rewardCue.id} aria-live="polite">
          <span>{rewardCue.importance === 'boss' ? 'BOSS戦利品' : '戦利品'}</span>
          <div>
            {rewardCue.items.map((item) => (
              <strong className={item.kind === 'gold' ? 'is-gold' : 'is-material'} key={item.kind + ':' + item.id}>
                {item.label} +{Math.floor(item.amount).toLocaleString('ja-JP')}
              </strong>
            ))}
          </div>
        </div>
      )}

      {validationMode && state.gameData.combat.contentBoundaryReached && (
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
