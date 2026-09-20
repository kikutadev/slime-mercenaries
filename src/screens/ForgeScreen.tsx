import { useEffect, useMemo, useRef, useState } from 'react';
import { useGameController, useGameState } from '../app/GameProvider';
import { selectForgeScreen } from '../application/selectors/ui-selectors';
import { ForgeStage, type ForgeVisualPhase } from '../components/ForgeStage';
import { ForgeKeyIcon, WeaponFamilyIcon } from '../components/WeaponFamilyIcon';
import {
  equipmentForgeDefinition,
  weaponDefinitions,
  weaponDefinitionsByDefinitionId,
  type WeaponRarity,
} from '../domain';
import { getForgeWeaponPresentation } from '../game/forge-presentation';
import styles from './ForgeScreen.module.css';

interface ForgeResultView {
  weaponDefinitionId: string;
  duplicate: boolean;
  rarity: string;
}

type ForgePhase = ForgeVisualPhase;

export function ForgeScreen() {
  const state = useGameState();
  const controller = useGameController();
  const view = selectForgeScreen(state);
  const validationMode = controller.validationMode;
  const [results, setResults] = useState<readonly ForgeResultView[]>([]);
  const [phase, setPhase] = useState<ForgePhase>('idle');
  const [sequenceKey, setSequenceKey] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);
  const impactTimer = useRef<number | null>(null);
  const revealTimer = useRef<number | null>(null);

  useEffect(() => () => {
    if (impactTimer.current !== null) window.clearTimeout(impactTimer.current);
    if (revealTimer.current !== null) window.clearTimeout(revealTimer.current);
  }, []);

  const bestResult = useMemo(
    () => [...results].sort((left, right) => rarityRank(right.rarity) - rarityRank(left.rarity))[0] ?? null,
    [results],
  );

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

    if (impactTimer.current !== null) window.clearTimeout(impactTimer.current);
    if (revealTimer.current !== null) window.clearTimeout(revealTimer.current);
    setNotice(null);
    setResults(nextResults);
    setSequenceKey((current) => current + 1);
    setPhase('charging');

    impactTimer.current = window.setTimeout(() => setPhase('impact'), 360);
    revealTimer.current = window.setTimeout(() => {
      setPhase('reveal');
      const best = [...nextResults].sort((left, right) => rarityRank(right.rarity) - rarityRank(left.rarity))[0];
      if (best !== undefined) {
        const weapon = weaponDefinitionsByDefinitionId[best.weaponDefinitionId];
        setNotice(best.duplicate ? `${weapon.displayName} · 精錬 +1` : `${weapon.displayName} を獲得`);
      }
    }, 760);
  };

  const ownedWeapons = Object.values(weaponDefinitions).flatMap((weapon) => {
    const runtime = view.inventory.find((item) => item.definitionId === weapon.id);
    if (runtime === undefined) return [];
    return [{ ...weapon, refinementRank: runtime.refinementRank }];
  });

  const bestWeapon = bestResult === null ? null : weaponDefinitionsByDefinitionId[bestResult.weaponDefinitionId];
  const bestPresentation = bestWeapon === null ? null : getForgeWeaponPresentation(bestWeapon.id);

  return (
    <section className={`screen screen--active ${styles.root}`} aria-label="鍛造">
      <header className={styles.topbar}>
        <div><p className="eyebrow">魔導工房</p><h1>鍛造</h1></div>
        <div className={styles.keys}>
          <span><ForgeKeyIcon /></span>
          <strong>{validationMode ? '∞' : view.keys}</strong>
          <small>キー</small>
        </div>
      </header>

      <div className={styles.room}>
        <ForgeStage
          phase={phase}
          sequenceKey={sequenceKey}
          weaponAsset={bestPresentation?.asset ?? null}
          weaponRarity={(bestWeapon?.rarity as WeaponRarity | undefined) ?? null}
        />

        {phase === 'reveal' && bestWeapon !== null && (
          <div className={`${styles.reveal} ${forgeRarityClass(bestWeapon.rarity)} `}>
            <span>{rarityLabel(bestWeapon.rarity)}</span>
            <strong>{bestWeapon.displayName}</strong>
            <small>{bestResult?.duplicate ? '精錬 +1' : '新武器'}</small>
          </div>
        )}

        {phase === 'idle' && (
          <div className={styles.prompt}>
            <span>鍛造キーを炉へ</span>
            <strong>武器を鋳造する</strong>
            <small>重複した武器は精錬へ変わります</small>
          </div>
        )}
      </div>

      <div className={styles.console}>
        <div className={styles.pity}>
          <div><span>神話級保証</span><strong>{view.pityMissCount} / {view.pityThreshold}</strong></div>
          <div className={styles.pityTrack}><i style={{ transform: `scaleX(${view.pityProgress})` }} /></div>
        </div>

        <div className={styles.actions}>
          <button type="button" disabled={!view.canSingle || phase === 'charging' || phase === 'impact'} onClick={() => draw(1)}>
            <span>1回鍛造</span>
            <strong><ForgeKeyIcon />{view.singleCost}</strong>
            <small>武器1個</small>
          </button>
          <button className={styles.ten} type="button" disabled={!view.canTen || phase === 'charging' || phase === 'impact'} onClick={() => draw(10)}>
            <span>10回鍛造</span>
            <strong><ForgeKeyIcon />{view.tenCost}</strong>
            <small>武器10個</small>
          </button>
        </div>

        {phase === 'reveal' && results.length > 1 && (
          <div className={styles.resultRack} aria-label="10回鍛造の結果">
            {results.map((result, index) => {
              const weapon = weaponDefinitionsByDefinitionId[result.weaponDefinitionId];
              return (
                <div className={forgeRarityClass(weapon.rarity)} key={`${result.weaponDefinitionId}-${index}`}>
                  <WeaponFamilyIcon family={weapon.family} />
                  <small>{result.duplicate ? '+1' : '新規'}</small>
                </div>
              );
            })}
          </div>
        )}

        <details className={styles.collection}>
          <summary><span>武器棚</span><strong>{ownedWeapons.length} / {Object.keys(weaponDefinitions).length}</strong></summary>
          {ownedWeapons.length === 0 ? (
            <div className={styles.collectionEmpty}>まだ武器はありません。戦闘や派遣で鍛造キーを集めます。</div>
          ) : (
            <div className={styles.collectionList}>
              {ownedWeapons.map((weapon) => {
                const presentation = getForgeWeaponPresentation(weapon.id);
                return (
                  <div key={weapon.id}>
                    <span className={`${styles.weaponRarity} ${forgeRarityClass(weapon.rarity)}`}>{rarityLabel(weapon.rarity)}</span>
                    <span>
                      <strong>{weapon.displayName}</strong>
                      <small>{presentation.familyLabel} · 攻撃倍率 ×{weapon.dpsMultiplier.toFixed(2)}</small>
                    </span>
                    <em>+{weapon.refinementRank}</em>
                  </div>
                );
              })}
            </div>
          )}
        </details>
      </div>

      {notice !== null && <button className={styles.toast} type="button" onClick={() => setNotice(null)}>{notice}</button>}
    </section>
  );
}

function forgeRarityClass(rarity: string): string {
  switch (rarity) {
    case 'mythic': return styles.rarityMythic;
    case 'rare': return styles.rarityRare;
    default: return styles.rarityCommon;
  }
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