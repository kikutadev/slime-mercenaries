import { useEffect } from 'react';
import { BattleCanvas } from '../components/BattleCanvas';
import { useGameState } from '../app/GameProvider';
import { validationToolsVisible } from '../application/validation-mode';
import { selectBattleSceneModel } from '../application/selectors/battle-scene';
import { selectFormation, selectGlobalHud } from '../application/selectors/ui-selectors';
import { resolveAreaDefinition, type SlimeInstanceId } from '../domain';
import type { BattleRewardCue } from '../game/battle-reward';
import styles from './BattleScreen.module.css';
import { battleStatusText, clampBattleRatio, visibleBattleRewardCue } from './battle/battle-screen-view';
import { useBattlePresentation } from './battle/useBattlePresentation';


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
  const authoritativeSceneModel = selectBattleSceneModel(state);
  const {
    controller,
    sceneModel,
    pendingSceneModel,
    battle,
    stageArrival,
    restartRevision,
    handleSnapshot,
    handleEncounterReady,
    handleEncounterRestarted,
    clearStageArrival,
  } = useBattlePresentation(authoritativeSceneModel);
  const validationMode = controller.validationMode;
  const showValidationTools = validationMode && validationToolsVisible();
  const hud = selectGlobalHud(state);
  const formation = selectFormation(state);
  const sceneAreaLabel = resolveAreaDefinition(sceneModel.areaId)?.displayName ?? sceneModel.areaId;

  const hasBattleSlime = sceneModel.allies.length > 0;
  const hasEncounter = sceneModel.encounter !== null;
  const visibleRewardCue = visibleBattleRewardCue(rewardCues, battle.result, sceneModel);

  useEffect(() => {
    if (visibleRewardCue === null) return;
    onRewardCuePresented(visibleRewardCue.id);
  }, [onRewardCuePresented, visibleRewardCue?.id]);
  const enemySnapshots = Object.entries(battle.enemies)
    .sort(([, left], [, right]) => left.index - right.index);
  const activeCount = sceneModel.allies.length;

  const battleStatus = battleStatusText({
    battle,
    hasEncounter,
    contentBoundaryReached: state.gameData.combat.contentBoundaryReached,
    retryFarmClearsRemaining: state.gameData.combat.retryFarmClearsRemaining,
    activeCount,
    sceneModel,
  });

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
          isSoundEnabled={() => controller.soundEnabled}
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
          onAnimationEnd={() => clearStageArrival(stageArrival)}
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
              const hpRatio = clampBattleRatio(enemy.hp, enemy.maxHp);
              return (
                <div
                  className={[styles.hpTrack, styles.enemyHpSegment, enemy.alive ? '' : styles.enemyHpDepleted].filter(Boolean).join(' ')}
                  key={enemyInstanceId}
                  aria-label={`${enemy.name} ${Math.max(0, enemy.hp)} / ${enemy.maxHp}`}
                >
                  <div
                    className={styles.hpFill}
                    style={{ transform: `scaleX(${hpRatio})` }}
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
            : clampBattleRatio(runtimeAlly.hp, runtimeAlly.maxHp);
          return (
            <button className={styles.partyDot} type="button" key={slot.slotIndex} onClick={() => onOpenSlime(slot.slimeId!)}>
              <img src={`${import.meta.env.BASE_URL}${slot.icon}`} alt={slot.name ?? ''} />
              <span className={styles.partyHp}><i style={{ transform: `scaleX(${hpRatio})` }} /></span>
            </button>
          );
        })}
      </div>
    </section>
  );
}