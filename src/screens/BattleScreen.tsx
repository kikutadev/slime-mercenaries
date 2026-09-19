import { useMemo, useState } from 'react';
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
  const [battleState, setBattleState] = useState<Readonly<{ sceneKey: string; snapshot: BattleSnapshot }>>({
    sceneKey: '',
    snapshot: INITIAL_BATTLE,
  });
  const hud = selectGlobalHud(state);
  const formation = selectFormation(state);
  const sceneModel = selectBattleSceneModel(state);
  const sceneKey = `${sceneModel.encounterKey}:${sceneModel.visualKey}`;
  const battle = battleState.sceneKey === sceneKey ? battleState.snapshot : INITIAL_BATTLE;
  const hasBattleSlime = sceneModel.allies.length > 0;
  const enemyRatio = battle.enemyMaxHp > 0 ? battle.enemyHp / battle.enemyMaxHp : 0;
  const activeCount = sceneModel.allies.length;

  const battleStatus = useMemo(() => {
    if (state.gameData.combat.contentBoundaryReached) return '現在のエリアを踏破しました';
    if (state.gameData.combat.retryFarmClearsRemaining > 0) {
      return `再編成中 · ステージ${state.gameData.progression.currentStage} · 再出撃まであと${state.gameData.combat.retryFarmClearsRemaining}周`;
    }
    if (activeCount === 0) return '傭兵を編成すると自動戦闘が始まります';
    if (battle.result === 'defeat') return '敗北 · 戦線を立て直します';
    if (battle.result === 'victory') {
      return sceneModel.isStageFinalEncounter ? 'ステージクリア' : '敵部隊を突破 · 次のウェーブへ';
    }
    return battle.label;
  }, [
    activeCount,
    battle.label,
    battle.result,
    sceneModel.isStageFinalEncounter,
    state.gameData.combat.contentBoundaryReached,
    state.gameData.combat.retryFarmClearsRemaining,
    state.gameData.progression.currentStage,
  ]);

  return (
    <section className="screen screen--battle screen--active" aria-label="戦闘">
      {hasBattleSlime ? (
        <BattleCanvas model={sceneModel} onSnapshot={(snapshot) => setBattleState({ sceneKey, snapshot })} />
      ) : (
        <div className="battle-empty-visual" aria-hidden="true">
          <div className="battle-empty-road" />
          <div className="battle-empty-orb">●</div>
        </div>
      )}

      <header className="battle-topbar">
        <div>
          <p className="eyebrow">{hud.areaLabel} · ステージ {hud.stageLabel}</p>
        </div>
        <div className="resource-pill"><span className="resource-pill__coin">G</span><strong>{validationMode ? '∞' : hud.gold}</strong></div>
      </header>

      {hasBattleSlime && (
        <div className={`battle-enemy-compact ${sceneModel.encounter?.boss ? 'is-boss' : ''}`} aria-label="敵の体力">
          <div><strong>{sceneModel.encounter?.displayName ?? '敵部隊'}</strong><span>{sceneModel.encounter?.boss ? 'BOSS' : `残り${battle.enemyAlive}体`}</span></div>
          <div className="enemy-hp-track"><div className="enemy-hp-fill" style={{ transform: `scaleX(${enemyRatio})` }} /></div>
        </div>
      )}

      <div className={`battle-status-strip ${state.gameData.combat.retryFarmClearsRemaining > 0 ? 'is-warning' : ''}`}>
        <span className="status-dot" />
        {battleStatus}
      </div>

      {(battle.result === 'defeat' || (battle.result === 'victory' && sceneModel.isStageFinalEncounter)) && (
        <div
          className={`battle-result-overlay battle-result-overlay--${battle.result}`}
          role="status"
          aria-live="polite"
        >
          <div className="battle-result-overlay__burst" aria-hidden="true" />
          <div className="battle-result-overlay__card">
            <span className="battle-result-overlay__eyebrow">
              {battle.result === 'victory' ? 'ステージクリア' : '撤退'}
            </span>
            <strong>{battle.result === 'victory' ? '勝利' : '敗北'}</strong>
            <small>{battle.result === 'victory' ? '次のステージへ進軍' : '戦線を立て直します'}</small>
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
              <span className="party-dot__hp"><i style={{ transform: `scaleX(${Math.max(0, hpRatio)})` }} /></span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
