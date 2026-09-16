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
      setNotice(result.reason === 'insufficient-token' ? '鍛造キーが足りません' : `鍛造できません: ${result.reason}`);
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
        setNotice(best.duplicate ? `${weapon.displayName}  · 精錬 +1` : `${weapon.displayName} を獲得`);
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
    <section className={`screen screen--forge-world screen--active forge-phase--${phase}`} aria-label="鍛造">
      <header className="forge-world__topbar">
        <div><p className="eyebrow">魔導工房</p><h1>鍛造</h1></div>
        <div className="forge-world__keys"><span>◆</span><strong>{view.keys}</strong><small>キー</small></div>
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
            <span>{rarityLabel(bestWeapon.rarity)}</span>
            <div className="forge-weapon-reveal__silhouette">{bestWeapon.family === 'sword' ? '⚔' : '➶'}</div>
            <strong>{bestWeapon.displayName}</strong>
            <small>{bestResult?.duplicate ? '精錬 +1' : '新武器'}</small>
          </div>
        )}

        {phase === 'idle' && (
          <div className="forge-room__prompt">
            <span>鍛造キーを炉へ投入</span>
            <strong>武器を鋳造する</strong>
            <small>重複武器は精錬値へ変換</small>
          </div>
        )}
      </div>

      <div className="forge-console">
        <div className="forge-pity">
          <div><span>神話級保証</span><strong>{view.pityMissCount} / {view.pityThreshold}</strong></div>
          <div className="forge-pity__track"><i style={{ transform: `scaleX(${view.pityProgress})` }} /></div>
        </div>

        <div className="forge-console__actions">
          <button type="button" disabled={!view.canSingle || phase === 'charging' || phase === 'impact'} onClick={() => draw(1)}>
            <span>1回鍛造</span><strong>◆ {view.singleCost}</strong><small>武器1個</small>
          </button>
          <button className="is-ten" type="button" disabled={!view.canTen || phase === 'charging' || phase === 'impact'} onClick={() => draw(10)}>
            <span>10回鍛造</span><strong>◆ {view.tenCost}</strong><small>武器10個</small>
          </button>
        </div>

        {phase === 'reveal' && results.length > 1 && (
          <div className="forge-result-rack">
            {results.map((result, index) => {
              const weapon = weaponDefinitionsByDefinitionId[result.weaponDefinitionId];
              return (
                <div className={`rarity-${weapon.rarity}`} key={`${result.weaponDefinitionId}-${index}`}>
                  <span>{weapon.family === 'sword' ? '⚔' : '➶'}</span>
                  <small>{result.duplicate ? '+1' : '新規'}</small>
                </div>
              );
            })}
          </div>
        )}

        <details className="forge-collection">
          <summary><span>武器棚</span><strong>{ownedWeapons.length} / {Object.keys(weaponDefinitions).length}</strong></summary>
          {ownedWeapons.length === 0 ? (
            <div className="forge-collection__empty">まだ武器はありません。戦闘や派遣で鍛造キーを集めます。</div>
          ) : (
            <div className="forge-collection__list">
              {ownedWeapons.map((weapon) => (
                <div key={weapon.id}>
                  <span className={`weapon-rarity weapon-rarity--${weapon.rarity}`}>{rarityLabel(weapon.rarity)}</span>
                  <span><strong>{weapon.displayName}</strong><small>{weapon.family === 'sword' ? '剣' : '弓'} · 攻撃倍率 ×{weapon.dpsMultiplier.toFixed(2)}</small></span>
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

function rarityLabel(rarity: string): string {
  switch (rarity) {
    case 'mythic': return '神話';
    case 'rare': return '希少';
    default: return '一般';
  }
}
