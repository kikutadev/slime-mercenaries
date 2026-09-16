import { useEffect, useMemo, useRef, useState } from 'react';
import { readCurrency, readToken } from 'idle-game-kit';
import { BattleCanvas } from './components/BattleCanvas';
import { SlimePreview } from './components/SlimePreview';
import { DEFAULT_PROFILE_ID, loadOrCreateSlimeProfile, saveSlimeProfile } from './application/profile';
import { assignSlimeToFormation } from './domain/combat';
import {
  buyPlainSlime,
  craftPlainSlime,
  createJobSlime,
  fuseSlime,
  previewJobCreation,
  previewPlainSlimeCraft,
  previewPlainSlimePurchase,
  previewSlimeFusion,
  previewSlimePromotion,
  promoteSlime,
} from './domain/commands';
import { equippedWeaponDefinition, forgeEquipment } from './domain/equipment';
import { ids, type JobSlimeId } from './domain/definitions';
import type { SlimeMercenariesState } from './domain/state';
import { advanceSlimeWorldFromWallClock } from './domain/world';
import { createSlimeMercenariesBrowserRepository } from './platform/web';
import { getNextFusionStep } from './game/fusion';
import { FUSION_ITEMS, getSlimePresentation, SLIMES, type SlimeId } from './game/slimes';
import type { BattleSnapshot } from './game/BattleRuntime';

type Screen = 'battle' | 'slimes';

const INITIAL_BATTLE: BattleSnapshot = {
  phase: 'loading', label: '出撃準備中', result: null,
  enemyAlive: 3, enemyHp: 12, enemyMaxHp: 12,
  swordHp: 6, swordMaxHp: 6, bowHp: 4, bowMaxHp: 4,
};

function AssignmentLabel({ value }: { value: 'battle' | 'reserve' | 'dispatch' }) {
  const label = value === 'battle' ? '戦闘中' : value === 'dispatch' ? '派遣中' : '控え';
  return <span className={`assignment assignment--${value}`}>{label}</span>;
}

export default function App() {
  const repository = useMemo(() => createSlimeMercenariesBrowserRepository(), []);
  const saveChain = useRef<Promise<void>>(Promise.resolve());
  const [gameState, setGameState] = useState<SlimeMercenariesState | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [screen, setScreen] = useState<Screen>('slimes');
  const [selectedId, setSelectedId] = useState<SlimeId>('sword');
  const [battle, setBattle] = useState<BattleSnapshot>(INITIAL_BATTLE);
  const [fusionSequenceKey, setFusionSequenceKey] = useState(0);
  const [fusionNotice, setFusionNotice] = useState<string | null>(null);
  const [fusionRun, setFusionRun] = useState<{ id: SlimeId; fromRank: number; toRank: number; title: string } | null>(null);

  const queueSave = (state: SlimeMercenariesState) => {
    saveChain.current = saveChain.current
      .then(() => saveSlimeProfile(repository, DEFAULT_PROFILE_ID, state))
      .catch((error: unknown) => setLoadError(error instanceof Error ? error.message : String(error)));
  };

  useEffect(() => {
    let cancelled = false;
    void loadOrCreateSlimeProfile({ repository }).then((loaded) => {
      if (cancelled) return;
      setGameState(loaded.state);
      const firstOwned = (['sword', 'bow'] as SlimeId[]).find((id) => loaded.state.gameData.roster.slimes[id] !== undefined);
      if (firstOwned !== undefined) {
        setSelectedId(firstOwned);
        setScreen('battle');
      }
    }).catch((error: unknown) => {
      if (!cancelled) setLoadError(error instanceof Error ? error.message : String(error));
    });
    return () => { cancelled = true; };
  }, [repository]);

  useEffect(() => {
    if (gameState === null) return;
    const timer = window.setInterval(() => {
      setGameState((current) => {
        if (current === null) return current;
        const advanced = advanceSlimeWorldFromWallClock(current, Date.now());
        if (advanced.appliedOfflineSec === 0) return current;
        if (advanced.events.length > 0) queueSave(advanced.state);
        return advanced.state;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [gameState !== null]); // eslint-disable-line react-hooks/exhaustive-deps

  const mutate = (transition: (state: SlimeMercenariesState) => SlimeMercenariesState) => {
    setGameState((current) => {
      if (current === null) return current;
      const next = transition(current);
      if (next !== current) queueSave(next);
      return next;
    });
  };

  if (loadError !== null) {
    return <main className="page"><section className="game-shell"><div className="fusion-panel"><strong>Save error</strong><p>{loadError}</p></div></section></main>;
  }
  if (gameState === null) {
    return <main className="page"><section className="game-shell"><div className="battle-message">セーブデータを読み込み中…</div></section></main>;
  }

  const ownedIds = (['sword', 'bow'] as SlimeId[]).filter((id) => gameState.gameData.roster.slimes[id] !== undefined);
  const effectiveSelectedId = gameState.gameData.roster.slimes[selectedId] !== undefined ? selectedId : ownedIds[0] ?? 'sword';
  const selected = gameState.gameData.roster.slimes[effectiveSelectedId];
  const sword = gameState.gameData.roster.slimes.sword;
  const bow = gameState.gameData.roster.slimes.bow;
  const swordPresentation = sword === undefined ? SLIMES.sword : getSlimePresentation(sword);
  const swordInBattle = gameState.gameData.roster.formationSlots.includes('sword');
  const bowInBattle = gameState.gameData.roster.formationSlots.includes('bow');
  const encounterKey = `${gameState.gameData.progression.currentStage}:${gameState.gameData.combat.currentWaveIndex}`;
  const gold = readCurrency(gameState.currencies, ids.currency.gold).toString();
  const forgeKeys = readToken(gameState.tokens, ids.token.forgeKey);

  const fusionPreview = selected === undefined ? null : previewSlimeFusion(gameState, effectiveSelectedId);
  const nextFusion = selected === undefined ? null : getNextFusionStep(selected);
  const fusionReady = fusionPreview?.canFuse ?? false;
  const promotionPreview = selected === undefined ? null : previewSlimePromotion(gameState, effectiveSelectedId);
  const equippedWeapon = selected === undefined ? null : equippedWeaponDefinition(gameState, effectiveSelectedId);

  const selectSlime = (id: SlimeId) => {
    if (fusionRun || gameState.gameData.roster.slimes[id] === undefined) return;
    setSelectedId(id);
    setFusionNotice(null);
  };

  const handleCraftPlain = () => mutate((current) => {
    const result = craftPlainSlime(current);
    return result.accepted ? result.state : current;
  });

  const handleBuyPlain = () => mutate((current) => {
    const result = buyPlainSlime(current);
    return result.accepted ? result.state : current;
  });

  const handleCreateJob = (id: JobSlimeId) => mutate((current) => {
    const wasOwned = current.gameData.roster.slimes[id] !== undefined;
    const created = createJobSlime(current, id);
    if (!created.accepted) return current;
    let next = created.state;
    if (!wasOwned) {
      const slotIndex = next.gameData.roster.formationSlots.findIndex((candidate) => candidate === null);
      if (slotIndex >= 0) {
        const assigned = assignSlimeToFormation(next, id, slotIndex);
        if (assigned.accepted) next = assigned.state;
      }
      setSelectedId(id);
      setScreen('battle');
    }
    return next;
  });

  const handleFuse = () => {
    if (selected === undefined || nextFusion === null || !fusionReady || fusionRun) return;
    setFusionNotice(null);
    setFusionSequenceKey((value) => value + 1);
    setFusionRun({ id: effectiveSelectedId, fromRank: selected.fusionRank, toRank: selected.fusionRank + 1, title: nextFusion.title });
  };

  const commitFusion = () => {
    if (!fusionRun) return;
    mutate((current) => {
      const result = fuseSlime(current, fusionRun.id);
      return result.accepted ? result.state : current;
    });
    setFusionNotice(fusionRun.title);
  };

  const handlePromotion = () => {
    if (selected === undefined || promotionPreview?.canPromote !== true) return;
    mutate((current) => {
      const result = promoteSlime(current, effectiveSelectedId);
      return result.accepted ? result.state : current;
    });
  };

  const handleForge = () => mutate((current) => {
    const result = forgeEquipment(current, 1);
    return result.accepted ? result.state : current;
  });

  const craftPreview = previewPlainSlimeCraft(gameState);
  const shopPreview = previewPlainSlimePurchase(gameState);
  const enemyRatio = battle.enemyMaxHp > 0 ? battle.enemyHp / battle.enemyMaxHp : 0;

  return (
    <main className="page">
      <section className="game-shell" aria-label="Slime Mercenaries">
        <div className={`screen screen--battle ${screen !== 'battle' ? 'is-hidden' : ''}`} aria-hidden={screen !== 'battle'} inert={screen !== 'battle'}>
          {sword !== undefined && swordInBattle ? (
            <BattleCanvas
              encounterKey={encounterKey}
              showBow={bow !== undefined && bowInBattle}
              swordFusionRank={sword.fusionRank}
              swordAsset={swordPresentation.asset}
              onSnapshot={setBattle}
            />
          ) : <div className="battle-message">傭兵を編成すると自動戦闘が始まります</div>}

          <header className="hud hud--top">
            <div><p className="eyebrow">CLOVER ROAD · STAGE {gameState.gameData.progression.currentStage}</p><h1>Slime Mercenaries</h1></div>
            <div className="status-chip"><span className="status-dot" />{gold} G</div>
          </header>

          {sword !== undefined && swordInBattle && <div className="enemy-hud" aria-label="enemy health">
            <div className="enemy-hud__row"><strong>Forest Mushrooms</strong><span>{battle.enemyAlive}体 · {battle.enemyHp} / {battle.enemyMaxHp}</span></div>
            <div className="enemy-hp-track"><div className="enemy-hp-fill" style={{ transform: `scaleX(${enemyRatio})` }} /></div>
          </div>}

          <div className={`battle-message ${battle.result ? 'battle-message--result' : ''}`}>
            {gameState.gameData.combat.blockedBossStage !== null ? `Boss blocked · 強化が必要` : battle.label}
          </div>

          <div className="battle-roster">
            {sword !== undefined && <button className={`unit-card ${battle.swordHp <= 0 ? 'is-defeated' : ''}`} type="button" onClick={() => { selectSlime('sword'); setScreen('slimes'); }}>
              <div className="unit-icon unit-icon--sword"><img src={`${import.meta.env.BASE_URL}${SLIMES.sword.icon}`} alt="" /></div>
              <div><strong>{getSlimePresentation(sword).name}</strong><span>Lv.{sword.level} · Fusion {sword.fusionRank}</span><small className="unit-hp">HP {battle.swordHp} / {battle.swordMaxHp}</small></div>
            </button>}
            {bow !== undefined && <button className={`unit-card ${battle.bowHp <= 0 ? 'is-defeated' : ''}`} type="button" onClick={() => { selectSlime('bow'); setScreen('slimes'); }}>
              <div className="unit-icon unit-icon--bow"><img src={`${import.meta.env.BASE_URL}${SLIMES.bow.icon}`} alt="" /></div>
              <div><strong>{getSlimePresentation(bow).name}</strong><span>Lv.{bow.level} · Fusion {bow.fusionRank}</span><small className="unit-hp">HP {battle.bowHp} / {battle.bowMaxHp}</small></div>
            </button>}
          </div>
        </div>

        <div className={`screen screen--slimes ${screen !== 'slimes' ? 'is-hidden' : ''}`} aria-hidden={screen !== 'slimes'} inert={screen !== 'slimes'}>
          <header className="slimes-header">
            <div><p className="eyebrow">MERCENARY ROSTER</p><h1>Slimes</h1></div>
            <span className="slimes-count">{ownedIds.length} / 6 · {gold} G</span>
          </header>

          <div className="formation-strip" aria-label="battle formation">
            {gameState.gameData.roster.formationSlots.map((id, index) => id === null ? (
              <div className="formation-slot formation-slot--empty" key={`empty-${index}`}>＋</div>
            ) : (
              <button className={`formation-slot ${effectiveSelectedId === id ? 'is-selected' : ''}`} key={`${id}-${index}`} type="button" onClick={() => selectSlime(id)}>
                <span className="formation-slot__icon"><img src={`${import.meta.env.BASE_URL}${SLIMES[id].icon}`} alt="" /></span>
                <span className="formation-slot__name">{getSlimePresentation(gameState.gameData.roster.slimes[id]!).name.replace(' Slime', '')}</span>
                {previewSlimeFusion(gameState, id).canFuse && <span className="ready-dot" />}
              </button>
            ))}
          </div>

          {selected === undefined ? (
            <section className="fusion-panel is-ready">
              <div className="fusion-panel__heading"><div><p className="section-kicker">CREATE</p><h3>最初の傭兵を作る</h3></div></div>
              <div className="next-upgrade"><span>Plain Slime stock</span><strong>{readToken(gameState.tokens, ids.token.plainSlime)}</strong><p>素材から生成するか、Goldで購入できます。</p></div>
              <button className="fusion-button" type="button" disabled={!craftPreview.canCraft} onClick={handleCraftPlain}>素材からPlain Slimeを生成</button>
              <button className="fusion-button" type="button" disabled={!shopPreview.canAfford} onClick={handleBuyPlain}>ショップで購入 · {shopPreview.totalCost.toString()} G</button>
              {(['sword', 'bow'] as JobSlimeId[]).map((id) => {
                const preview = previewJobCreation(gameState, id);
                return <button className="fusion-button" key={id} type="button" disabled={!preview.canCreate} onClick={() => handleCreateJob(id)}>{SLIMES[id].name}を作る</button>;
              })}
            </section>
          ) : (
            <>
              <section className="slime-focus">
                <div className="slime-focus__meta"><div><p className="slime-role">{getSlimePresentation(selected).role}</p><h2>{getSlimePresentation(selected).name}</h2></div><AssignmentLabel value={selected.assignment} /></div>
                <SlimePreview
                  slimeId={effectiveSelectedId}
                  fusionRank={selected.fusionRank}
                  fusionReady={fusionReady}
                  isFusing={Boolean(fusionRun && fusionRun.id === effectiveSelectedId)}
                  sequenceKey={fusionSequenceKey}
                  fromRank={fusionRun?.fromRank ?? selected.fusionRank}
                  toRank={fusionRun?.toRank ?? selected.fusionRank + 1}
                  onFusionCommit={commitFusion}
                  onFusionComplete={() => setFusionRun(null)}
                />
                <div className="slime-stats"><span>Lv.{selected.level}</span><span>Tier {selected.jobTier}</span><span>{equippedWeapon?.displayName ?? 'No Weapon'}</span></div>
              </section>

              <section className={`fusion-panel ${fusionReady ? 'is-ready' : ''}`}>
                <div className="fusion-panel__heading"><div><p className="section-kicker">FUSION</p><h3>合成段階 {selected.fusionRank}{nextFusion ? ` → ${selected.fusionRank + 1}` : ''}</h3></div>{fusionReady && <span className="ready-pill">合成可能</span>}</div>
                {nextFusion && fusionPreview ? <>
                  <div className="fusion-material"><div className="fusion-material__label"><span>合成レシピ</span><strong>{fusionPreview.requirements.every((item) => item.missing === 0) ? 'READY' : '素材不足'}</strong></div>
                    <div className="fusion-recipe">{nextFusion.recipe.map((requirement) => {
                      const item = FUSION_ITEMS[requirement.itemId];
                      const owned = readToken(gameState.tokens, requirement.itemId);
                      return <div className={`fusion-recipe__item ${owned >= requirement.amount ? 'is-ready' : 'is-missing'}`} key={requirement.itemId}><span className={`fusion-recipe__glyph fusion-recipe__glyph--${item.category}`}>{item.glyph}</span><span className="fusion-recipe__name">{item.shortName}</span><strong>{owned} / {requirement.amount}</strong></div>;
                    })}</div>
                  </div>
                  <div className="next-upgrade"><span>次の強化 · Lv.{nextFusion.minLevel}以上</span><strong>{nextFusion.resultName ?? nextFusion.title}</strong><p>{nextFusion.description}</p></div>
                  {fusionNotice && <div className="fusion-unlocked" key={fusionSequenceKey}><span>UNLOCKED</span><strong>{fusionNotice}</strong></div>}
                  <button className="fusion-button" type="button" disabled={!fusionReady || Boolean(fusionRun)} onClick={handleFuse}>{fusionRun ? '合成中…' : fusionPreview.levelMet ? (fusionReady ? '合成する' : '素材が足りません') : `Lv.${nextFusion.minLevel}で解放`}</button>
                </> : <div className="fusion-max"><strong>現在の合成段階は上限です</strong></div>}

                {promotionPreview?.step && <div className="next-upgrade"><span>PROMOTION · Lv.{promotionPreview.step.minLevel}</span><strong>{promotionPreview.step.resultDisplayName}</strong><p>{promotionPreview.step.goldCost} G + 昇格素材。Fusion状態はそのまま引き継ぎます。</p><button className="fusion-button" type="button" disabled={!promotionPreview.canPromote} onClick={handlePromotion}>昇格する</button></div>}
              </section>

              <section className="fusion-panel">
                <div className="fusion-panel__heading"><div><p className="section-kicker">FORGE</p><h3>Equipment</h3></div><span className="ready-pill">Key {forgeKeys}</span></div>
                <button className="fusion-button" type="button" disabled={forgeKeys < 1} onClick={handleForge}>Forge Key ×1で鍛造</button>
              </section>

              <section className="fusion-panel">
                <div className="fusion-panel__heading"><div><p className="section-kicker">CREATE</p><h3>Plain / Job</h3></div></div>
                <button className="fusion-button" type="button" disabled={!craftPreview.canCraft} onClick={handleCraftPlain}>Plain Slimeを生成</button>
                {(['sword', 'bow'] as JobSlimeId[]).map((id) => <button className="fusion-button" key={id} type="button" disabled={!previewJobCreation(gameState, id).canCreate} onClick={() => handleCreateJob(id)}>{SLIMES[id].name}をもう一体作る</button>)}
              </section>
            </>
          )}
        </div>

        <nav className="bottom-nav" aria-label="primary navigation">
          <button className={screen === 'battle' ? 'is-active' : ''} type="button" onClick={() => setScreen('battle')}><span className="nav-icon">⚔</span>Battle</button>
          <button className={screen === 'slimes' ? 'is-active' : ''} type="button" onClick={() => setScreen('slimes')}><span className="nav-icon">●</span>Slimes{ownedIds.some((id) => previewSlimeFusion(gameState, id).canFuse) && <span className="nav-notice" />}</button>
        </nav>
      </section>
    </main>
  );
}
