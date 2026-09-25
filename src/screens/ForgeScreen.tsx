import { useGameState } from '../app/GameProvider';
import { selectForgeScreen, selectForgeWeaponTarget } from '../application/selectors/ui-selectors';
import { ForgeStage } from '../components/ForgeStage';
import { ForgeKeyIcon, WeaponFamilyIcon } from '../components/WeaponFamilyIcon';
import {
  weaponDefinitions,
  weaponDefinitionsByDefinitionId,
  type SlimeInstanceId,
  type WeaponRarity,
} from '../domain';
import { getForgeWeaponPresentation } from '../game/forge-presentation';
import styles from './ForgeScreen.module.css';
import { forgeRarityLabel } from './forge/forge-result';
import { useForgeSequence } from './forge/useForgeSequence';


export function ForgeScreen({ onOpenSlime }: { onOpenSlime: (slimeId: SlimeInstanceId) => void }) {
  const state = useGameState();
  const {
    controller,
    results,
    phase,
    sequenceKey,
    notice,
    setNotice,
    resultTargetSlimeId,
    resultEquipLabel,
    bestResult,
    draw,
  } = useForgeSequence();
  const view = selectForgeScreen(state);
  const validationMode = controller.validationMode;

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
            <span>{forgeRarityLabel(bestWeapon.rarity)}</span>
            <strong>{bestWeapon.displayName}</strong>
            <small>{bestResult?.duplicate ? '精錬 +1' : resultEquipLabel ?? '新武器'}</small>
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

      <div className={`${styles.console} ${phase === 'charging' || phase === 'impact' ? styles.consoleRetreat : ''}`}>
        <div className={styles.pity}>
          <div><span>神話級保証</span><strong>{view.pityMissCount} / {view.pityThreshold}</strong></div>
          <div className={styles.pityTrack}><i style={{ transform: `scaleX(${view.pityProgress})` }} /></div>
        </div>

        <div className={styles.actions}>
          <button
            type="button"
            aria-busy={phase === 'charging' || phase === 'impact'}
            disabled={!view.canSingle || phase === 'charging' || phase === 'impact'}
            onClick={() => draw(1)}
          >
            <span>{phase === 'charging' || phase === 'impact' ? '鍛造中…' : '1回鍛造'}</span>
            <strong><ForgeKeyIcon />{view.singleCost}</strong>
            <small>武器1個</small>
          </button>
          <button
            className={styles.ten}
            type="button"
            aria-busy={phase === 'charging' || phase === 'impact'}
            disabled={!view.canTen || phase === 'charging' || phase === 'impact'}
            onClick={() => draw(10)}
          >
            <span>{phase === 'charging' || phase === 'impact' ? '鍛造中…' : '10回鍛造'}</span>
            <strong><ForgeKeyIcon />{view.tenCost}</strong>
            <small>武器10個</small>
          </button>
        </div>

        {phase === 'reveal' && bestWeapon !== null && resultTargetSlimeId !== null && (
          <button
            className={styles.resultNextAction}
            type="button"
            onClick={() => onOpenSlime(resultTargetSlimeId)}
          >
            <span>次に試す</span>
            <strong>キャンプで装備を見る</strong>
          </button>
        )}

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
                const target = selectForgeWeaponTarget(state, weapon.id);
                const targetSlimeId = target?.slimeId ?? null;
                return (
                  <button
                    key={weapon.id}
                    type="button"
                    disabled={targetSlimeId === null}
                    onClick={() => {
                      if (targetSlimeId !== null) onOpenSlime(targetSlimeId);
                    }}
                    aria-label={`${weapon.displayName}の装備を見る`}
                  >
                    <span className={`${styles.weaponRarity} ${forgeRarityClass(weapon.rarity)}`}>{forgeRarityLabel(weapon.rarity)}</span>
                    <span>
                      <strong>{weapon.displayName}</strong>
                      <small>
                        {presentation.familyLabel} · 攻撃倍率 ×{weapon.dpsMultiplier.toFixed(2)}
                        {targetSlimeId === null ? ' · 対応する仲間なし' : ' · 装備を見る'}
                      </small>
                    </span>
                    <em>+{weapon.refinementRank}</em>
                  </button>
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
