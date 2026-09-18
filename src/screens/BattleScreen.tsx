import { useState } from 'react';
import { BattleCanvas } from '../components/BattleCanvas';
import { useGameController, useGameState } from '../app/GameProvider';
import { selectBattleSceneModel } from '../application/selectors/battle-scene';
import { selectFormation, selectGlobalHud } from '../application/selectors/ui-selectors';
import type { BattleSnapshot } from '../game/BattleRuntime';
import type { SlimeInstanceId } from '../domain';

const INITIAL_BATTLE: BattleSnapshot = {
  phase: 'loading',
  label: '出撃準備中',
  result: null,
  enemyAlive: 0,
  enemyHp: 0,
  enemyMaxHp: 0,
  allies: {},
};

export function BattleScreen({ onOpenSlime }: { onOpenSlime: (slimeId: SlimeInstanceId) => void }) {
  const state = useGameState();
  const controller = useGameController();
  const validationMode = controller.validationMode;
  const [battle, setBattle] = useState<BattleSnapshot>(INITIAL_BATTLE);
  const hud = selectGlobalHud(state);
  const formation = selectFormation(state);
  const sceneModel = selectBattleSceneModel(state);
  const hasBattleSlime = sceneModel.allies.length > 0;
  const enemyRatio = battle.enemyMaxHp > 0 ? battle.enemyHp / battle.enemyMaxHp : 0;
  const retryClears = state.gameData.combat.retryFarmClearsRemaining;

  const contextCue = state.gameData.combat.contentBoundaryReached
    ? 'このエリアを踏破しました'
    : retryClears > 0
      ? `前線から撤退 · 再出撃まであと${retryClears}周`
      : !hasBattleSlime
        ? 'キャンプで傭兵を編成すると自動戦闘が始まります'
        : null;

  return (
    <section className="screen screen--battle screen--active" aria-label="戦闘">
      {hasBattleSlime ? (
        <BattleCanvas model={sceneModel} onSnapshot={setBattle} />
      ) : (
        <div className="battle-empty-visual" aria-hidden="true">
          <div className="battle-empty-road" />
        </div>
      )}

      <header className="battle-topbar">
        <div className="battle-stage-chip">
          <span>{hud.areaLabel}</span>
          <strong>ステージ {hud.stageLabel}</strong>
        </div>
        <div className="resource-pill">
          <span className="resource-pill__coin">G</span>
          <strong>{validationMode ? '∞' : hud.gold}</strong>
        </div>
      </header>

      {hasBattleSlime && sceneModel.encounter !== null && (
        <div
          className={sceneModel.encounter.boss ? 'battle-boss-hud' : 'battle-enemy-counter'}
          aria-label="敵の状態"
        >
          <div>
            <strong>{sceneModel.encounter.displayName}</strong>
            <span>{sceneModel.encounter.boss ? 'BOSS' : `残り ${battle.enemyAlive}`}</span>
          </div>
          {sceneModel.encounter.boss && (
            <div className="enemy-hp-track">
              <div className="enemy-hp-fill" style={{ transform: `scaleX(${enemyRatio})` }} />
            </div>
          )}
        </div>
      )}

      {battle.result === 'victory' && (
        <div className="battle-result-burst battle-result-burst--victory" key={`${sceneModel.encounterKey}:victory`}>
          <div className="battle-reward-coins" aria-hidden="true">
            <i /><i /><i /><i /><i /><i />
          </div>
          <span>突破</span>
        </div>
      )}

      {battle.result === 'defeat' && (
        <div className="battle-result-burst battle-result-burst--defeat" key={`${sceneModel.encounterKey}:defeat`}>
          <span>撤退</span>
          <small>ひとつ前の戦場で立て直します</small>
        </div>
      )}

      {contextCue !== null && (
        <div className={`battle-context-cue ${retryClears > 0 ? 'is-warning' : ''}`}>
          {contextCue}
        </div>
      )}

      {validationMode && state.gameData.combat.contentBoundaryReached && (
        <button className="battle-validation-restart" type="button" onClick={() => controller.validationResetBattle()}>
          <span>検証</span><strong>戦闘を最初から再開</strong>
        </button>
      )}

      <div className="battle-party-rail" aria-label="出撃編成">
        {formation.map((slot) => {
          if (slot.slimeId === null) {
            return <span className="party-dot party-dot--empty" key={slot.slotIndex}>{slot.slotIndex + 1}</span>;
          }
          const sceneAlly = sceneModel.allies.find((ally) => ally.slimeId === slot.slimeId);
          if (sceneAlly === undefined) return null;
          const runtimeAlly = battle.allies[slot.slimeId];
          const hpRatio = runtimeAlly === undefined ? 1 : runtimeAlly.hp / Math.max(1, runtimeAlly.maxHp);
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
