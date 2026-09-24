import { useEffect, type CSSProperties } from 'react';
import { BottomSheet } from 'idle-game-kit/react';
import { useGameController, useGameState } from '../app/GameProvider';
import { selectCodexCatalog } from '../application/selectors/ui-selectors';
import { SlimeMark } from './SlimeMark';
import { WeaponFamilyIcon } from './WeaponFamilyIcon';
import styles from './CodexSheet.module.css';

export function CodexSheet({ onClose }: { onClose: () => void }) {
  const state = useGameState();
  const controller = useGameController();
  const catalog = selectCodexCatalog(state);
  const newSlimeIds = catalog.slimeForms.filter((entry) => entry.isNew).map((entry) => entry.id);
  const newWeaponIds = catalog.weapons.filter((entry) => entry.isNew).map((entry) => entry.id);
  const newSlimeKey = newSlimeIds.join('|');
  const newWeaponKey = newWeaponIds.join('|');

  useEffect(() => {
    if (newSlimeIds.length > 0) controller.markCodexViewed('slime-form', newSlimeIds);
    if (newWeaponIds.length > 0) controller.markCodexViewed('weapon', newWeaponIds);
  }, [controller, newSlimeKey, newWeaponKey]);

  return (
    <BottomSheet
      title="図鑑"
      onClose={onClose}
      backdropClassName={styles.backdrop}
      sheetClassName={styles.sheet}
      headerClassName={styles.header}
      closeButtonClassName={styles.close}
    >
      <div className={styles.content}>
        <section className={styles.section} aria-label="発見したスライム">
          <div className={styles.sectionHeading}>
            <div><span>スライム</span><strong>{catalog.slimeForms.length}種 発見</strong></div>
            {catalog.newSlimeFormCount > 0 && <em>{catalog.newSlimeFormCount} NEW</em>}
          </div>
          {catalog.slimeForms.length === 0 ? (
            <div className={styles.empty}>仲間や新しい形態を発見すると、ここに記録されます。</div>
          ) : (
            <div className={styles.slimeGrid}>
              {catalog.slimeForms.map((entry) => (
                <article className={entry.isNew ? styles.newEntry : ''} key={entry.id}>
                  <div className={styles.slimeIcon} style={{ '--codex-accent': entry.accent } as CSSProperties}>
                    {entry.icon === null
                      ? <SlimeMark className={styles.slimeMark} />
                      : <img src={import.meta.env.BASE_URL + entry.icon} alt="" />}
                  </div>
                  <div>
                    <span>{entry.tier === null ? 'RARE MUTATION' : 'TIER ' + entry.tier}</span>
                    <strong>{entry.name}</strong>
                    <small>{entry.role}</small>
                  </div>
                  {entry.isNew && <em>NEW</em>}
                </article>
              ))}
            </div>
          )}
        </section>

        <section className={styles.section} aria-label="発見した武器">
          <div className={styles.sectionHeading}>
            <div><span>武器</span><strong>{catalog.weapons.length}種 発見</strong></div>
            {catalog.newWeaponCount > 0 && <em>{catalog.newWeaponCount} NEW</em>}
          </div>
          {catalog.weapons.length === 0 ? (
            <div className={styles.empty}>鍛造で新しい武器を引くと、ここに記録されます。</div>
          ) : (
            <div className={styles.weaponList}>
              {catalog.weapons.map((entry) => (
                <article className={entry.isNew ? styles.newEntry : ''} key={entry.id}>
                  <span className={styles.weaponIcon}><WeaponFamilyIcon family={entry.family} /></span>
                  <div>
                    <span>{rarityLabel(entry.rarity)}</span>
                    <strong>{entry.name}</strong>
                    <small>攻撃倍率 ×{entry.multiplier.toFixed(2)}</small>
                  </div>
                  {entry.isNew && <em>NEW</em>}
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </BottomSheet>
  );
}

function rarityLabel(rarity: 'common' | 'rare' | 'mythic'): string {
  switch (rarity) {
    case 'mythic': return '神話';
    case 'rare': return '希少';
    default: return '一般';
  }
}
