import { useState } from 'react';
import { useGameController, useGameState } from '../app/GameProvider';
import { selectForgeScreen } from '../application/selectors/ui-selectors';
import { equipmentForgeDefinition, weaponDefinitions, weaponDefinitionsByDefinitionId } from '../domain';

interface ForgeResultView {
  weaponDefinitionId: string;
  duplicate: boolean;
  rarity: string;
}

export function ForgeScreen() {
  const state = useGameState();
  const controller = useGameController();
  const view = selectForgeScreen(state);
  const [results, setResults] = useState<readonly ForgeResultView[]>([]);
  const [notice, setNotice] = useState<string | null>(null);

  const draw = (count: 1 | 10) => {
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
    const best = [...nextResults].sort((left, right) => rarityRank(right.rarity) - rarityRank(left.rarity))[0];
    if (best !== undefined) {
      const weapon = weaponDefinitionsByDefinitionId[best.weaponDefinitionId];
      setNotice(best.duplicate ? `${weapon.displayName} · Refinement進行` : `${weapon.displayName} を獲得`);
    }
  };

  const ownedWeapons = Object.values(weaponDefinitions).flatMap((weapon) => {
    const runtime = view.inventory.find((item) => item.definitionId === weapon.id);
    if (runtime === undefined) return [];
    return [{ ...weapon, refinementRank: runtime.refinementRank }];
  });

  return (
    <section className="screen screen--menu screen--active" aria-label="Forge">
      <header className="menu-header">
        <div><p className="eyebrow">EQUIPMENT FORGE</p><h1>Forge</h1></div>
        <div className="forge-key-pill"><span>◆</span><strong>{view.keys}</strong><small>KEY</small></div>
      </header>

      <section className="forge-hero">
        <div className="forge-emblem" aria-hidden="true"><span>✦</span><i /></div>
        <div className="forge-copy">
          <span>WEAPON DRAW</span>
          <h2>武器を鋳造する</h2>
          <p>重複した武器は消えず、その武器のRefinementへ変換されます。</p>
        </div>
        <div className="pity-block">
          <div><span>MYTHIC PITY</span><strong>{view.pityMissCount} / {view.pityThreshold}</strong></div>
          <div className="pity-track"><i style={{ transform: `scaleX(${view.pityProgress})` }} /></div>
        </div>
        <div className="forge-actions">
          <button type="button" disabled={!view.canSingle} onClick={() => draw(1)}><span>1 FORGE</span><strong>◆ {view.singleCost}</strong></button>
          <button type="button" disabled={!view.canTen} onClick={() => draw(10)}><span>10 FORGE</span><strong>◆ {view.tenCost}</strong></button>
        </div>
      </section>

      {results.length > 0 && (
        <section className="forge-results">
          <div className="section-title-row"><div><span>RESULT</span><strong>今回の鍛造</strong></div><small>{results.length} items</small></div>
          <div className="forge-result-grid">
            {results.map((result, index) => {
              const weapon = weaponDefinitionsByDefinitionId[result.weaponDefinitionId];
              return (
                <div className={`forge-result-card rarity-${weapon.rarity}`} key={`${result.weaponDefinitionId}-${index}`}>
                  <span>{weapon.rarity.toUpperCase()}</span>
                  <div className="forge-result-card__weapon">⚔</div>
                  <strong>{weapon.displayName}</strong>
                  <small>{result.duplicate ? 'REFINE +1' : 'NEW'}</small>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section className="owned-weapons">
        <div className="section-title-row"><div><span>COLLECTION</span><strong>Owned Weapons</strong></div><small>{ownedWeapons.length} / {Object.keys(weaponDefinitions).length}</small></div>
        {ownedWeapons.length === 0 ? (
          <div className="inline-note">まだ武器を所持していません。Forge Keyは戦闘や探索派遣で獲得できます。</div>
        ) : (
          <div className="weapon-collection-list">
            {ownedWeapons.map((weapon) => (
              <div key={weapon.id}>
                <span className={`weapon-rarity weapon-rarity--${weapon.rarity}`}>{weapon.rarity.toUpperCase()}</span>
                <span><strong>{weapon.displayName}</strong><small>{weapon.family === 'sword' ? 'Sword' : 'Bow'} · DPS ×{weapon.dpsMultiplier.toFixed(2)}</small></span>
                <em>+{weapon.refinementRank}</em>
              </div>
            ))}
          </div>
        )}
      </section>

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
