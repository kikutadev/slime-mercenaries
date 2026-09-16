import { useMemo, useState } from 'react';
import { BattleCanvas } from '../components/BattleCanvas';
import { useGameState } from '../app/GameProvider';
import { selectBattleSceneModel } from '../application/selectors/battle-scene';
import { selectFormation, selectGlobalHud } from '../application/selectors/ui-selectors';
import type { BattleSnapshot } from '../game/BattleRuntime';
import type { JobSlimeId } from '../domain';

const INITIAL_BATTLE: BattleSnapshot = {
  phase: 'loading',
  label: '出撃準備中',
  result: null,
  enemyAlive: 3,
  enemyHp: 12,
  enemyMaxHp: 12,
  swordHp: 6,
  swordMaxHp: 6,
  bowHp: 4,
  bowMaxHp: 4,
};

export function BattleScreen({ onOpenSlime }: { onOpenSlime: (slimeId: JobSlimeId) => void }) {
  const state = useGameState();
  const [battle, setBattle] = useState<BattleSnapshot>(INITIAL_BATTLE);
  const hud = selectGlobalHud(state);
  const formation = selectFormation(state);
  const sceneModel = selectBattleSceneModel(state);
  const hasSupportedBattleSlime = sceneModel.allies.some((ally) => ally.slimeId === 'sword' || ally.slimeId === 'bow');
  const enemyRatio = battle.enemyMaxHp > 0 ? battle.enemyHp / battle.enemyMaxHp : 0;
  const activeCount = sceneModel.allies.length;

  const battleStatus = useMemo(() => {
    if (state.gameData.combat.contentBoundaryReached) return '現在のエリアを踏破しました';
    if (state.gameData.combat.blockedBossStage !== null) return 'Bossで停止中 · Slimesで強化';
    if (activeCount === 0) return '傭兵を編成すると自動戦闘が始まります';
    return battle.label;
  }, [activeCount, battle.label, state.gameData.combat.blockedBossStage, state.gameData.combat.contentBoundaryReached]);

  return (
    <section className="screen screen--battle screen--active" aria-label="Battle">
      {hasSupportedBattleSlime ? (
        <BattleCanvas model={sceneModel} onSnapshot={setBattle} />
      ) : (
        <div className="battle-empty-visual" aria-hidden="true">
          <div className="battle-empty-road" />
          <div className="battle-empty-orb">●</div>
        </div>
      )}

      <header className="battle-topbar">
        <div>
          <p className="eyebrow">{hud.areaLabel.toUpperCase()} · STAGE {hud.stageLabel}</p>
          <h1>Slime Mercenaries</h1>
        </div>
        <div className="resource-pill"><span className="resource-pill__coin">G</span><strong>{hud.gold}</strong></div>
      </header>

      {hasSupportedBattleSlime && (
        <div className="battle-enemy-compact" aria-label="enemy health">
          <div><strong>Forest Mushrooms</strong><span>{battle.enemyAlive} left</span></div>
          <div className="enemy-hp-track"><div className="enemy-hp-fill" style={{ transform: `scaleX(${enemyRatio})` }} /></div>
        </div>
      )}

      <div className={`battle-status-strip ${state.gameData.combat.blockedBossStage !== null ? 'is-warning' : ''}`}>
        <span className="status-dot" />
        {battleStatus}
      </div>

      <div className="battle-party-rail" aria-label="active formation">
        {formation.map((slot) => {
          if (slot.slimeId === null) return <span className="party-dot party-dot--empty" key={slot.slotIndex}>{slot.slotIndex + 1}</span>;
          const slime = state.gameData.roster.slimes[slot.slimeId];
          if (slime === undefined) return null;
          const hpRatio = slot.slimeId === 'sword'
            ? battle.swordHp / Math.max(1, battle.swordMaxHp)
            : battle.bowHp / Math.max(1, battle.bowMaxHp);
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
