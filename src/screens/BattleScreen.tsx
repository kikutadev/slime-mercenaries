import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BattleCanvas } from '../components/BattleCanvas';
import { useGameController, useGameState } from '../app/GameProvider';
import { BATTLE_RESULT_HOLD_MS, canAdoptBattleSceneModel } from '../application/battle-presentation';
import { validationToolsVisible } from '../application/validation-mode';
import { selectBattleSceneModel, type BattleSceneModel } from '../application/selectors/battle-scene';
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
  const showValidationTools = validationToolsVisible();
  const authoritativeSceneModel = selectBattleSceneModel(state);
  const [sceneModel, setSceneModel] = useState(authoritativeSceneModel);
  const [pendingSceneModel, setPendingSceneModel] = useState<BattleSceneModel | null>(null);
  const [battle, setBattle] = useState<BattleSnapshot>(INITIAL_BATTLE);
  const [stageArrival, setStageArrival] = useState<number | null>(null);
  const latestSceneModelRef = useRef(authoritativeSceneModel);
  const presentedSceneModelRef = useRef(sceneModel);
  const pendingSceneModelRef = useRef<BattleSceneModel | null>(pendingSceneModel);
  const presentationTimerRef = useRef<number | null>(null);
  const previousStageRef = useRef(sceneModel.stageNumber);
  const hud = selectGlobalHud(state);
  const formation = selectFormation(state);

  latestSceneModelRef.current = authoritativeSceneModel;
  presentedSceneModelRef.current = sceneModel;
  pendingSceneModelRef.current = pendingSceneModel;

  const queueSceneModel = useCallback((incoming: BattleSceneModel) => {
    const presented = presentedSceneModelRef.current;
    if (incoming.encounterKey === presented.encounterKey) {
      presentedSceneModelRef.current = incoming;
      setSceneModel(incoming);
      return;
    }
    if (incoming.encounter === null) return;
    pendingSceneModelRef.current = incoming;
    setPendingSceneModel(incoming);
  }, []);

  const schedulePresentationAdvance = useCallback(() => {
    if (presentationTimerRef.current !== null) return;

    presentationTimerRef.current = window.setTimeout(() => {
      presentationTimerRef.current = null;
      const presented = presentedSceneModelRef.current;
      const incoming = latestSceneModelRef.current;
      if (!canAdoptBattleSceneModel(presented, incoming, 'result')) return;
      queueSceneModel(incoming);
    }, BATTLE_RESULT_HOLD_MS);
  }, [queueSceneModel]);

  useEffect(() => () => {
    if (presentationTimerRef.current !== null) window.clearTimeout(presentationTimerRef.current);
  }, []);

  useEffect(() => {
    const incoming = authoritativeSceneModel;
    const presented = presentedSceneModelRef.current;
    const pending = pendingSceneModelRef.current;

    // While an encounter transition is loading, coalesce any faster analytical
    // progression into the newest real encounter. The visible battle remains stable.
    if (pending !== null) {
      if (incoming.encounter !== null
        && incoming.encounterKey !== presented.encounterKey
        && incoming.encounterKey !== pending.encounterKey) {
        pendingSceneModelRef.current = incoming;
        setPendingSceneModel(incoming);
      }
      return;
    }

    if (!canAdoptBattleSceneModel(presented, incoming, battle.phase)) return;
    const encounterChanged = presented.encounterKey !== incoming.encounterKey;
    if (encounterChanged && presented.encounter !== null) {
      schedulePresentationAdvance();
      return;
    }

    queueSceneModel(incoming);
  }, [
    authoritativeSceneModel.encounterKey,
    authoritativeSceneModel.visualKey,
    authoritativeSceneModel.encounter,
    battle.phase,
    queueSceneModel,
    schedulePresentationAdvance,
  ]);

  const handleSnapshot = useCallback((snapshot: BattleSnapshot) => {
    setBattle(snapshot);
    if (snapshot.phase === 'result') schedulePresentationAdvance();
  }, [schedulePresentationAdvance]);

  const handleEncounterReady = useCallback((readyModel: BattleSceneModel) => {
    const pending = pendingSceneModelRef.current;
    if (pending === null
      || pending.encounterKey !== readyModel.encounterKey
      || pending.visualKey !== readyModel.visualKey) {
      return;
    }

    presentedSceneModelRef.current = readyModel;
    pendingSceneModelRef.current = null;
    setSceneModel(readyModel);
    setPendingSceneModel(null);
  }, []);

  useEffect(() => {
    const previousStage = previousStageRef.current;
    previousStageRef.current = sceneModel.stageNumber;
    if (sceneModel.stageNumber <= previousStage) return;
    setStageArrival(sceneModel.stageNumber);
  }, [sceneModel.stageNumber]);

  const hasBattleSlime = sceneModel.allies.length > 0;
  const hasEncounter = sceneModel.encounter !== null;
  const enemyRatio = battle.enemyMaxHp > 0 ? battle.enemyHp / battle.enemyMaxHp : 0;
  const activeCount = sceneModel.allies.length;

  const battleStatus = useMemo(() => {
    if (!hasEncounter && state.gameData.combat.contentBoundaryReached) return '次の戦闘を準備中';
    if (state.gameData.combat.retryFarmClearsRemaining > 0) {
      return `再編成中 · ステージ${sceneModel.stageNumber} · 再出撃まであと${state.gameData.combat.retryFarmClearsRemaining}周`;
    }
    if (activeCount === 0) return '傭兵を編成すると自動戦闘が始まります';
    return battle.label;
  }, [
    activeCount,
    battle.label,
    hasEncounter,
    sceneModel.stageNumber,
    state.gameData.combat.contentBoundaryReached,
    state.gameData.combat.retryFarmClearsRemaining,
  ]);

  return (
    <section className="screen screen--battle screen--active" aria-label="戦闘">
      {hasBattleSlime && hasEncounter ? (
        <BattleCanvas
          model={sceneModel}
          pendingModel={pendingSceneModel}
          onSnapshot={handleSnapshot}
          onEncounterReady={handleEncounterReady}
          rewardCue={rewardCue}
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
          <p className="eyebrow">{hud.areaLabel} · ステージ {sceneModel.stageNumber}</p>
        </div>
        <div className="resource-pill"><span className="resource-pill__coin">G</span><strong>{validationMode ? '∞' : hud.gold}</strong></div>
      </header>

      {hasBattleSlime && hasEncounter && (
        <div className={`battle-enemy-compact ${sceneModel.encounter?.boss ? 'is-boss' : ''}${sceneModel.encounter?.boss && battle.phase === 'approach' ? ' is-entering' : ''}${battle.result === 'victory' ? ' is-cleared' : ''}`} aria-label="敵の体力">
          <div><strong>{sceneModel.encounter?.displayName ?? '敵部隊'}</strong><span>{sceneModel.encounter?.boss ? 'BOSS' : `残り${battle.enemyAlive}体`}</span></div>
          <div className="enemy-hp-track"><div className="enemy-hp-fill" style={{ transform: `scaleX(${enemyRatio})` }} /></div>
        </div>
      )}

      <div className={`battle-status-strip ${state.gameData.combat.retryFarmClearsRemaining > 0 ? 'is-warning' : ''}`}>
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

      {showValidationTools && state.gameData.combat.contentBoundaryReached && (
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
              <span className="party-dot__hp"><i style={{ transform: `scaleX(${Math.max(0, hpRatio)})` }} /></span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
