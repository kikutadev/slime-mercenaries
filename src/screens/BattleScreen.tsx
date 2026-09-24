import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { BattleCanvas } from '../components/BattleCanvas';
import { useGameController, useGameState } from '../app/GameProvider';
import { canStartQueuedBattleScene, enqueueBattleSceneModel } from '../application/battle-presentation';
import { validationToolsVisible } from '../application/validation-mode';
import { selectBattleSceneModel, type BattleSceneModel } from '../application/selectors/battle-scene';
import { selectFormation, selectGlobalHud } from '../application/selectors/ui-selectors';
import type { BattleSnapshot } from '../game/BattleRuntime';
import { currentCombatEncounterIdentity, resolveAreaDefinition, type SlimeInstanceId } from '../domain';
import { battleRewardCueMatchesEncounter, type BattleRewardCue } from '../game/battle-reward';
import styles from './BattleScreen.module.css';

const INITIAL_BATTLE: BattleSnapshot = {
  phase: 'loading',
  label: '出撃準備中',
  result: null,
  enemyAlive: 0,
  presentationReady: false,
  enemies: {},
  allies: {},
};

export function BattleScreen({
  onOpenSlime,
  rewardCues,
  onRewardCuePresented,
}: {
  onOpenSlime: (slimeId: SlimeInstanceId) => void;
  rewardCues: readonly BattleRewardCue[];
  onRewardCuePresented: (cueId: string) => void;
}) {
  const state = useGameState();
  const controller = useGameController();
  const validationMode = controller.validationMode;
  const showValidationTools = validationMode && validationToolsVisible();
  const authoritativeSceneModel = selectBattleSceneModel(state);
  const [sceneModel, setSceneModel] = useState(authoritativeSceneModel);
  const [pendingSceneModel, setPendingSceneModel] = useState<BattleSceneModel | null>(null);
  const [queuedSceneModels, setQueuedSceneModels] = useState<readonly BattleSceneModel[]>([]);
  const [battle, setBattle] = useState<BattleSnapshot>(INITIAL_BATTLE);
  const [stageArrival, setStageArrival] = useState<string | null>(null);
  const [restartRevision, setRestartRevision] = useState(0);
  const presentedSceneModelRef = useRef(sceneModel);
  const pendingSceneModelRef = useRef<BattleSceneModel | null>(pendingSceneModel);
  const queuedSceneModelsRef = useRef<readonly BattleSceneModel[]>(queuedSceneModels);
  const previousStageRef = useRef({ areaId: sceneModel.areaId, stageNumber: sceneModel.stageNumber });
  const reportedResultKeysRef = useRef(new Set<string>());
  const hud = selectGlobalHud(state);
  const formation = selectFormation(state);
  const sceneAreaLabel = resolveAreaDefinition(sceneModel.areaId)?.displayName ?? sceneModel.areaId;

  presentedSceneModelRef.current = sceneModel;
  pendingSceneModelRef.current = pendingSceneModel;
  queuedSceneModelsRef.current = queuedSceneModels;

  useLayoutEffect(() => {
    controller.setLiveBattleActive(true);
    return () => controller.setLiveBattleActive(false);
  }, [controller]);


  useEffect(() => {
    const incoming = authoritativeSceneModel;
    const presented = presentedSceneModelRef.current;
    const pending = pendingSceneModelRef.current;

    if (incoming.encounterKey === presented.encounterKey) {
      if (incoming.visualKey !== presented.visualKey) {
        presentedSceneModelRef.current = incoming;
        setSceneModel(incoming);
      }
      return;
    }

    if (pending !== null && incoming.encounterKey === pending.encounterKey) {
      if (incoming.visualKey !== pending.visualKey) {
        pendingSceneModelRef.current = incoming;
        setPendingSceneModel(incoming);
      }
      return;
    }

    const nextQueue = enqueueBattleSceneModel(
      presented,
      pending,
      queuedSceneModelsRef.current,
      incoming,
    );
    if (nextQueue === queuedSceneModelsRef.current) return;
    queuedSceneModelsRef.current = nextQueue;
    setQueuedSceneModels(nextQueue);
  }, [
    authoritativeSceneModel.encounterKey,
    authoritativeSceneModel.visualKey,
    authoritativeSceneModel.encounter,
  ]);

  useEffect(() => {
    const pending = pendingSceneModelRef.current;
    const queue = queuedSceneModelsRef.current;
    if (!canStartQueuedBattleScene(battle.presentationReady, pending, queue)) return;

    const [next, ...rest] = queue;
    if (next === undefined) return;
    queuedSceneModelsRef.current = rest;
    setQueuedSceneModels(rest);
    pendingSceneModelRef.current = next;
    setPendingSceneModel(next);
  }, [battle.presentationReady, pendingSceneModel, queuedSceneModels.length]);

  const handleSnapshot = useCallback((snapshot: BattleSnapshot) => {
    setBattle(snapshot);
    if (snapshot.result === null) return;

    const presented = presentedSceneModelRef.current;
    if (presented.encounter === null) return;
    const resultKey = `${presented.encounterKey}:${snapshot.result}`;
    if (reportedResultKeysRef.current.has(resultKey)) return;
    reportedResultKeysRef.current.add(resultKey);

    const identity = {
      areaId: presented.areaId,
      stageNumber: presented.stageNumber,
      waveIndex: presented.waveIndex,
      encounterId: presented.encounter.id,
    };
    const resolved = controller.resolveLiveBattleEncounter(identity, snapshot.result);
    if (!resolved.accepted || snapshot.result !== 'defeat') return;

    const nextIdentity = currentCombatEncounterIdentity(controller.store.getSnapshot());
    if (nextIdentity !== null
      && nextIdentity.areaId === identity.areaId
      && nextIdentity.stageNumber === identity.stageNumber
      && nextIdentity.waveIndex === identity.waveIndex
      && nextIdentity.encounterId === identity.encounterId) {
      setRestartRevision((current) => current + 1);
    }
  }, [controller]);

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

  const handleEncounterRestarted = useCallback((readyModel: BattleSceneModel) => {
    reportedResultKeysRef.current.delete(`${readyModel.encounterKey}:victory`);
    reportedResultKeysRef.current.delete(`${readyModel.encounterKey}:defeat`);
  }, []);


  useEffect(() => {
    const previous = previousStageRef.current;
    previousStageRef.current = { areaId: sceneModel.areaId, stageNumber: sceneModel.stageNumber };
    const advanced = sceneModel.areaId !== previous.areaId || sceneModel.stageNumber > previous.stageNumber;
    if (!advanced) return;
    setStageArrival(`${sceneModel.areaId}:${sceneModel.stageNumber}`);
  }, [sceneModel.areaId, sceneModel.stageNumber]);

  const hasBattleSlime = sceneModel.allies.length > 0;
  const hasEncounter = sceneModel.encounter !== null;
  const matchingRewardCue = rewardCues.find((cue) =>
    battleRewardCueMatchesEncounter(
      cue,
      sceneModel.areaId,
      sceneModel.stageNumber,
      sceneModel.waveIndex,
      sceneModel.encounter?.boss ?? false,
    )) ?? null;
  const visibleRewardCue = matchingRewardCue !== null && battle.result === 'victory'
    ? matchingRewardCue
    : null;

  useEffect(() => {
    if (visibleRewardCue === null) return;
    onRewardCuePresented(visibleRewardCue.id);
  }, [onRewardCuePresented, visibleRewardCue?.id]);
  const enemySnapshots = Object.entries(battle.enemies)
    .sort(([, left], [, right]) => left.index - right.index);
  const activeCount = sceneModel.allies.length;

  const battleStatus = useMemo(() => {
    if (battle.result === 'defeat') return '敗北 · 戦線を立て直します';
    if (battle.result === 'victory') {
      return sceneModel.shouldCelebrateVictory ? 'ステージクリア' : '敵部隊を突破 · 次のウェーブへ';
    }
    if (!hasEncounter && state.gameData.combat.contentBoundaryReached) return '次の戦闘を準備中';
    if (state.gameData.combat.retryFarmClearsRemaining > 0) {
      return `再編成中 · ステージ${sceneModel.stageNumber} · 再出撃まであと${state.gameData.combat.retryFarmClearsRemaining}周`;
    }
    if (activeCount === 0) return '傭兵を編成すると自動戦闘が始まります';
    return battle.label;
  }, [
    activeCount,
    battle.label,
    battle.result,
    hasEncounter,
    sceneModel.shouldCelebrateVictory,
    sceneModel.stageNumber,
    state.gameData.combat.contentBoundaryReached,
    state.gameData.combat.retryFarmClearsRemaining,
  ]);

  return (
    <section className={`screen screen--active ${styles.root}`} aria-label="戦闘">
      {hasBattleSlime && hasEncounter ? (
        <BattleCanvas
          model={sceneModel}
          pendingModel={pendingSceneModel}
          onSnapshot={handleSnapshot}
          onEncounterReady={handleEncounterReady}
          restartRevision={restartRevision}
          onEncounterRestarted={handleEncounterRestarted}
          rewardCue={visibleRewardCue}
        />
      ) : (
        <div className={styles.emptyVisual} aria-hidden="true">
          <div className={styles.emptyRoad} />
          <div className={styles.emptyOrb}>●</div>
        </div>
      )}

      {stageArrival !== null && (
        <div
          key={stageArrival}
          className={styles.stageArrival}
          aria-hidden="true"
          onAnimationEnd={() => setStageArrival((current) => current === stageArrival ? null : current)}
        >
          <i />
        </div>
      )}

      <header className={styles.topbar}>
        <div>
          <p className="eyebrow">{sceneAreaLabel} · ステージ {sceneModel.stageNumber}</p>
        </div>
        <div className={styles.resource}><span className={styles.resourceCoin}>G</span><strong>{validationMode ? '∞' : hud.gold}</strong></div>
      </header>

      {hasBattleSlime && hasEncounter && (
        <div className={`${styles.enemy} ${sceneModel.encounter?.boss ? styles.boss : ''} ${sceneModel.encounter?.boss && battle.phase === 'approach' ? styles.entering : ''} ${battle.result === 'victory' ? styles.cleared : ''}`} aria-label="敵の体力">
          <div><strong>{sceneModel.encounter?.displayName ?? '敵部隊'}</strong><span>{sceneModel.encounter?.boss ? 'BOSS' : `残り${battle.enemyAlive}体`}</span></div>
          <div className={styles.enemyHpSegments} aria-label="敵ごとの体力">
            {enemySnapshots.map(([enemyInstanceId, enemy]) => {
              const hpRatio = enemy.maxHp > 0 ? enemy.hp / enemy.maxHp : 0;
              return (
                <div
                  className={[styles.hpTrack, styles.enemyHpSegment, enemy.alive ? '' : styles.enemyHpDepleted].filter(Boolean).join(' ')}
                  key={enemyInstanceId}
                  aria-label={`${enemy.name} ${Math.max(0, enemy.hp)} / ${enemy.maxHp}`}
                >
                  <div
                    className={styles.hpFill}
                    style={{ transform: `scaleX(${Math.max(0, Math.min(1, hpRatio))})` }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className={[
        styles.status,
        battle.result === null && state.gameData.combat.retryFarmClearsRemaining > 0 ? styles.warning : '',
        battle.phase === 'combat' && battle.result === null && state.gameData.combat.retryFarmClearsRemaining === 0 ? styles.routine : '',
      ].filter(Boolean).join(' ')}>
        <span className={styles.statusDot} />
        {battleStatus}
      </div>

      {(battle.result === 'defeat' || (battle.result === 'victory' && sceneModel.shouldCelebrateVictory)) && (
        <div
          className={`${styles.resultOverlay} ${battle.result === 'victory' ? styles.victory : styles.defeat}`}
          role="status"
          aria-live="polite"
        >
          <div className={styles.resultBurst} aria-hidden="true" />
          <div className={styles.resultCard}>
            <span className={styles.resultEyebrow}>
              {battle.result === 'victory' ? 'ステージクリア' : '撤退'}
            </span>
            <strong>{battle.result === 'victory' ? '勝利' : '敗北'}</strong>
            <small>{battle.result === 'victory' ? '次のステージへ進軍' : '戦線を立て直します'}</small>
          </div>
        </div>
      )}

      {visibleRewardCue !== null && (
        <div className={`${styles.reward} ${visibleRewardCue.importance === 'boss' ? styles.major : ''}`} key={visibleRewardCue.id} aria-live="polite">
          <span>{visibleRewardCue.importance === 'boss' ? 'BOSS戦利品' : '戦利品'}</span>
          <div>
            {visibleRewardCue.items.map((item) => (
              <strong className={item.kind === 'gold' ? styles.rewardGold : styles.rewardMaterial} key={item.kind + ':' + item.id}>
                {item.label} +{Math.floor(item.amount).toLocaleString('ja-JP')}
              </strong>
            ))}
          </div>
        </div>
      )}

      {showValidationTools && state.gameData.combat.contentBoundaryReached && (
        <button className={styles.validationRestart} type="button" onClick={() => controller.validationResetBattle()}>
          <span>検証</span><strong>戦闘を最初から再開</strong>
        </button>
      )}

      <div className={styles.partyRail} aria-label="出撃編成">
        {formation.map((slot) => {
          if (slot.slimeId === null) return <span className={`${styles.partyDot} ${styles.partyEmpty}`} key={slot.slotIndex}>{slot.slotIndex + 1}</span>;
          const sceneAlly = sceneModel.allies.find((ally) => ally.slimeId === slot.slimeId);
          if (sceneAlly === undefined) return null;
          const runtimeAlly = battle.allies[slot.slimeId];
          const hpRatio = runtimeAlly === undefined
            ? 1
            : runtimeAlly.hp / Math.max(1, runtimeAlly.maxHp);
          return (
            <button className={styles.partyDot} type="button" key={slot.slotIndex} onClick={() => onOpenSlime(slot.slimeId!)}>
              <img src={`${import.meta.env.BASE_URL}${slot.icon}`} alt={slot.name ?? ''} />
              <span className={styles.partyHp}><i style={{ transform: `scaleX(${Math.max(0, Math.min(1, hpRatio))})` }} /></span>
            </button>
          );
        })}
      </div>
    </section>
  );
}