import { useEffect, useMemo, useRef, useState } from 'react';
import { useGameController, useGameState } from '../app/GameProvider';
import { selectForgeScreen } from '../application/selectors/ui-selectors';
import { equipmentForgeDefinition, weaponDefinitions, weaponDefinitionsByDefinitionId } from '../domain';

interface ForgeResultView {
  weaponDefinitionId: string;
  duplicate: boolean;
  rarity: string;
}

type ForgePhase = 'idle' | 'charging' | 'impact' | 'reveal';

export function ForgeScreen() {
  const state = useGameState();
  const controller = useGameController();
  const view = selectForgeScreen(state);
  const [results, setResults] = useState<readonly ForgeResultView[]>([]);
  const [phase, setPhase] = useState<ForgePhase>('idle');
  const [notice, setNotice] = useState<string | null>(null);
  const revealTimer = useRef<number | null>(null);

  useEffect(() => () => {
    if (revealTimer.current !== null) window.clearTimeout(revealTimer.current);
  }, []);

  const bestResult = useMemo(() => [...results].sort((left, right) => rarityRank(right.rarity) - rarityRank(left.rarity))[0] ?? null, [results]);

  const draw = (count: 1 | 10) => {
    if (phase !== 'idle' && phase !== 'reveal') return;
    const result = controller.forge(count);
    if (!result.accepted) {
      setNotice(result.reason === 'insufficient-token' ? 'Forge Keyが足りません' : `鍛造できません: ${result.reason}`);
      return;
    }
    const nextResults = result.events.flatMap((event) => {
      if (event.type !== 'gachaDrawn' || event.payload === undefined) return [];
      const entryId = typeof event.payload.entryId === 'string' ? event.payload.entryId : null;
      const duplicate = event.payload.duplicate === true;
      if (entryId === null) return [];
      const entry = equipmentForgeDefinition.pool.find((candidate) => candidate.id === entryId);
      if (entry === undefined) return [];
      const weapon = weaponDefinitionsByDefinitionId[entry.reward.weaponDefinitionId];
      if (weapon === undefined) return [];
      return [{ weaponDefinitionId: weapon.id, duplicate, rarity: weapon.rarity } satisfies ForgeResultView];
    });
    setResults(nextResults);
    setPhase('charging');
    window.setTimeout(() => setPhase('impact'), 360);
    revealTimer.current = window.setTimeout(() => {
      setPhase('reveal');
      const best = [...nextResults].sort((left, right) => rarityRank(right.rarity) - rarityRank(left.rarity))[0];
      if (best !== undefined) {
        const weapon = weaponDefinitionsByDefinitionId[best.weaponDefinitionId];
        setNotice(best.duplicate ? `${weapon.displayName} · Refinement +1` : `${weapon.displayName} を獲得`);
      }
    }, 760);
  };

  const ownedWeapons = Object.values(weaponDefinitions).flatMap((weapon) => {
    const runtime = view.inventory.find((item) => item.definitionId === weapon.id);
    if (runtime === undefined) return [];
    return [{ ...weapon, refinementRank: runtime.refinementRank }];
  });

  const bestWeapon = bestResult === null ? null : weaponDefinitionsByDefinitionId[bestResult.weaponDefinitionId];

  return (
    <section className={`screen screen--forge-world screen--active forge-phase--${phase}`} aria-label="Forge">
      <header className="forge-world__topbar">
        <div><p className="eyebrow">ARCANE WORKSHOP</p><h1>Forge</h1></div>
        <div className="forge-world__keys"><span>◆</span><strong>{view.keys}</strong><small>KEY</small></div>
      </header>

      <div className="forge-room">
        <div className="forge-room__wall" />
        <div className="forge-room__window forge-room__window--left" />
        <div className="forge-room__window forge-room__window--right" />
        <div className="forge-room__floor" />
        <div className="forge-pipe forge-pipe--left" />
        <div className="forge-pipe forge-pipe--right" />

        <div className="forge-machine" aria-hidden="true">
          <div className="forge-machine__halo" />
          <div className="forge-machine__hammer"><span>▰</span></div>
          <div className="forge-machine__anvil"><span>◆</span></div>
          <div className="forge-machine__core"><i /><i /><i /></div>
          <div className="forge-machine__sparks"><b /><b /><b /><b /><b /><b /></div>
        </div>

        {phase === 'reveal' && bestWeapon !== null && (
          <div className={`forge-weapon-reveal rarity-${bestWeapon.rarity}`}>
            <div className="forge-weapon-reveal__burst" />
            <span>{bestWeapon.rarity.toUpperCase()}</span>
            <div className="forge-weapon-reveal__silhouette">{bestWeapon.family === 'sword' ? '⚔' : '➶'}</div>
            <strong>{bestWeapon.displayName}</strong>
            <small>{bestResult?.duplicate ? 'REFINEMENT +1' : 'NEW WEAPON'}</small>
          </div>
        )}

        {phase === 'idle' && (
          <div className="forge-room__prompt">
            <span>KEYを炉へ投入</span>
            <strong>武器を鋳造する</strong>
            <small>重複はRefinementへ変換</small>
          </div>
        )}
      </div>

      <div className="forge-console">
        <div className="forge-pity">
          <div><span>MYTHIC PITY</span><strong>{view.pityMissCount} / {view.pityThreshold}</strong></div>
          <div className="forge-pity__track"><i style={{ transform: `scaleX(${view.pityProgress})` }} /></div>
        </div>

        <div className="forge-console__actions">
          <button type="button" disabled={!view.canSingle || phase === 'charging' || phase === 'impact'} onClick={() => draw(1)}>
            <span>QUICK FORGE</span><strong>◆ {view.singleCost}</strong><small>1 weapon</small>
          </button>
          <button className="is-ten" type="button" disabled={!view.canTen || phase === 'charging' || phase === 'impact'} onClick={() => draw(10)}>
            <span>MASS FORGE</span><strong>◆ {view.tenCost}</strong><small>10 weapons</small>
          </button>
        </div>

        {phase === 'reveal' && results.length > 1 && (
          <div className="forge-result-rack">
            {results.map((result, index) => {
              const weapon = weaponDefinitionsByDefinitionId[result.weaponDefinitionId];
              return (
                <div className={`rarity-${weapon.rarity}`} key={`${result.weaponDefinitionId}-${index}`}>
                  <span>{weapon.family === 'sword' ? '⚔' : '➶'}</span>
                  <small>{result.duplicate ? '+1' : 'NEW'}</small>
                </div>
              );
            })}
          </div>
        )}

        <details className="forge-collection">
          <summary><span>WEAPON RACK</span><strong>{ownedWeapons.length} / {Object.keys(weaponDefinitions).length}</strong></summary>
          {ownedWeapons.length === 0 ? (
            <div className="forge-collection__empty">まだ武器はありません。Battle / DispatchでForge Keyを集めます。</div>
          ) : (
            <div className="forge-collection__list">
              {ownedWeapons.map((weapon) => (
                <div key={weapon.id}>
                  <span className={`weapon-rarity weapon-rarity--${weapon.rarity}`}>{weapon.rarity.toUpperCase()}</span>
                  <span><strong>{weapon.displayName}</strong><small>{weapon.family === 'sword' ? 'Sword' : 'Bow'} · DPS ×{weapon.dpsMultiplier.toFixed(2)}</small></span>
                  <em>+{weapon.refinementRank}</em>
                </div>
              ))}
            </div>
          )}
        </details>
      </div>

      {notice !== null && <button className="toast-notice" type="button" onClick={() => setNotice(null)}>{notice}</button>}
    </section>
  );
}

function rarityRank(rarity: string): number {
  switch (rarity) {
    case 'mythic': return 3;
    case 'rare': return 2;
    default: return 1;
  }
}
