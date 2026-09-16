import { useMemo, useState } from 'react';
import { BottomSheet } from 'idle-game-kit/react';
import { useGameController, useGameState } from '../app/GameProvider';
import {
  selectCreateSlimePanel,
  selectEarlyGameCue,
  selectFormation,
  selectGlobalHud,
  selectOwnedSlimeIds,
  selectSlimeDetail,
} from '../application/selectors/ui-selectors';
import { FusionWorkbench } from '../components/fusion/FusionWorkbench';
import { SlimePreview } from '../components/SlimePreview';
import { ids, weaponDefinitions, type JobSlimeId } from '../domain';
import { getSlimePresentation } from '../game/slimes';

interface Props {
  selectedId: JobSlimeId | null;
  onSelect: (id: JobSlimeId) => void;
  onOpenBattle: () => void;
}

type CampMode = 'none' | 'train' | 'weapon' | 'formation' | 'fusion';

export function SlimesScreen({ selectedId, onSelect, onOpenBattle }: Props) {
  const state = useGameState();
  const controller = useGameController();
  const hud = selectGlobalHud(state);
  const ownedIds = selectOwnedSlimeIds(state);
  const selected = selectedId !== null && state.gameData.roster.slimes[selectedId] !== undefined
    ? selectedId
    : ownedIds[0] ?? null;
  const detail = selected === null ? null : selectSlimeDetail(state, selected);
  const formation = selectFormation(state);
  const createPanel = selectCreateSlimePanel(state);
  const cue = selectEarlyGameCue(state);
  const [mode, setMode] = useState<CampMode>('none');
  const [createOpen, setCreateOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const compatibleWeapons = useMemo(() => {
    if (selected === null) return [];
    return Object.values(weaponDefinitions).filter((weapon) => weapon.family === selected);
  }, [selected]);

  const runAction = (success: string, action: () => { accepted: boolean; reason?: string }) => {
    const result = action();
    setNotice(result.accepted ? success : rejectionLabel(result.reason));
  };

  const handleCreateJob = (jobId: JobSlimeId) => {
    const alreadyOwned = state.gameData.roster.slimes[jobId] !== undefined;
    const result = controller.createJobSlime(jobId);
    if (!result.accepted) {
      setNotice(rejectionLabel(result.reason));
      return;
    }
    onSelect(jobId);
    if (!alreadyOwned) {
      const open = result.state.gameData.roster.formationSlots.findIndex((slot) => slot === null);
      if (open >= 0) controller.assignSlime(jobId, open);
      setNotice(`${getSlimePresentation(result.state.gameData.roster.slimes[jobId]!).name} が仲間になりました`);
    } else {
      setNotice(`${getSlimePresentation(result.state.gameData.roster.slimes[jobId]!).name} Coreを獲得`);
    }
    setCreateOpen(false);
  };

  if (mode === 'fusion' && selected !== null) {
    return (
      <FusionWorkbench
        slimeId={selected}
        onClose={() => setMode('none')}
        onBattle={onOpenBattle}
        onRecruit={() => { setMode('none'); setCreateOpen(true); }}
      />
    );
  }

  return (
    <section className="screen screen--camp screen--active" aria-label="Camp">
      <header className="camp-topbar">
        <div><p className="eyebrow">MERCENARY CAMP</p><h1>Camp</h1></div>
        <div className="camp-resources"><span>G</span><strong>{hud.gold}</strong></div>
      </header>

      <div className="camp-roster" aria-label="owned slimes">
        {ownedIds.map((id) => {
          const slime = state.gameData.roster.slimes[id]!;
          const p = getSlimePresentation(slime);
          return (
            <button key={id} className={id === selected ? 'is-selected' : ''} type="button" onClick={() => { onSelect(id); setMode('none'); }}>
              <img src={`${import.meta.env.BASE_URL}${p.icon}`} alt="" />
              <span>Lv.{slime.level}</span>
            </button>
          );
        })}
        <button className="camp-roster__add" type="button" onClick={() => setCreateOpen(true)}>＋</button>
      </div>

      {detail === null || selected === null ? (
        <div className="camp-empty-world">
          <div className="camp-empty-world__pond" />
          <button type="button" onClick={() => setCreateOpen(true)}>
            <span>＋</span><strong>最初のスライムを生み出す</strong><small>素材は揃っています</small>
          </button>
        </div>
      ) : (
        <>
          <div className="camp-world">
            <div className="camp-world__sky" />
            <div className="camp-world__hills camp-world__hills--far" />
            <div className="camp-world__hills camp-world__hills--near" />
            <div className="camp-world__ground" />
            <div className="camp-prop camp-prop--tent"><span>▲</span></div>
            <div className="camp-prop camp-prop--dummy"><span>＋</span></div>
            <div className="camp-prop camp-prop--forge"><span>✦</span></div>
            <div className="camp-prop camp-prop--flag"><span>⚑</span></div>

            <div className="camp-slime-stage">
              <SlimePreview
                slimeId={selected}
                fusionRank={detail.fusionRank}
                fusionReady={false}
                isFusing={false}
                sequenceKey={0}
                fromRank={detail.fusionRank}
                toRank={detail.fusionRank + 1}
                      onFusionComplete={() => undefined}
              />
              <div className="camp-slime-name">
                <span>{detail.role}</span><strong>{detail.name}</strong><small>Lv.{detail.level} · Fusion {detail.fusionRank}</small>
              </div>
            </div>

            <button className={`camp-hotspot camp-hotspot--train ${mode === 'train' ? 'is-active' : ''}`} type="button" onClick={() => setMode(mode === 'train' ? 'none' : 'train')}>
              <span>⚔</span><strong>Training</strong><small>育成</small>
            </button>
            <button className={`camp-hotspot camp-hotspot--fusion ${detail.fusion?.canFuse ? 'is-ready' : ''}`} type="button" onClick={() => setMode('fusion')}>
              <span>✦</span><strong>Fusion</strong><small>{detail.fusion?.canFuse ? 'READY!' : '合成台'}</small>
            </button>
            <button className={`camp-hotspot camp-hotspot--weapon ${mode === 'weapon' ? 'is-active' : ''}`} type="button" onClick={() => setMode(mode === 'weapon' ? 'none' : 'weapon')}>
              <span>⌁</span><strong>Arsenal</strong><small>{detail.weaponName}</small>
            </button>
            <button className={`camp-hotspot camp-hotspot--formation ${mode === 'formation' ? 'is-active' : ''}`} type="button" onClick={() => setMode(mode === 'formation' ? 'none' : 'formation')}>
              <span>⚑</span><strong>Formation</strong><small>{detail.assignment === 'battle' ? '出撃中' : '控え'}</small>
            </button>

            {cue !== null && (
              <button className="camp-quest" type="button" onClick={() => {
                if (cue.action === 'Battle') onOpenBattle();
                else if (cue.action === 'Fuse') setMode('fusion');
                else setCreateOpen(true);
              }}>
                <span>NEXT</span><strong>{cue.title}</strong><em>›</em>
              </button>
            )}
          </div>

          {mode === 'train' && (
            <div className="camp-action-dock camp-action-dock--train">
              <div><span>TRAINING</span><strong>Goldを力に変える</strong><small>強化するとすぐ戦闘能力へ反映されます</small></div>
              <div className="camp-level-buttons">
                {[detail.levelActions.one, detail.levelActions.ten, detail.levelActions.max].map((action, index) => (
                  <button
                    key={index}
                    type="button"
                    disabled={action === null || !action.available}
                    onClick={() => action !== null && runAction(`Lv.${action.targetLevel}へ強化`, () => controller.levelUpSlime(selected, action.count))}
                  >
                    <span>{index === 0 ? '+1' : index === 1 ? '+10' : 'MAX'}</span>
                    <strong>{action?.cost ?? '—'} G</strong>
                  </button>
                ))}
              </div>
            </div>
          )}

          {mode === 'weapon' && (
            <div className="camp-action-dock camp-action-dock--weapon">
              <div><span>ARSENAL</span><strong>武器を付け替える</strong><small>武器はForgeで獲得できます</small></div>
              <div className="camp-weapon-strip">
                {compatibleWeapons.map((weapon) => {
                  const instance = Object.values(state.gameData.equipment.inventory).find((item) => item.definitionId === weapon.id);
                  const owned = instance !== undefined;
                  const equipped = detail.weaponName === weapon.displayName;
                  return (
                    <button key={weapon.id} type="button" disabled={!owned || equipped} className={equipped ? 'is-equipped' : ''} onClick={() => {
                      const result = controller.equipWeapon(selected, weapon.id);
                      setNotice(result.accepted ? `${weapon.displayName}を装備` : rejectionLabel(result.reason));
                    }}>
                      <span className={`weapon-rarity weapon-rarity--${weapon.rarity}`}>{weapon.rarity.toUpperCase()}</span>
                      <strong>{weapon.displayName}</strong><small>{equipped ? 'EQUIPPED' : owned ? `DPS ×${weapon.dpsMultiplier.toFixed(2)}` : '未所持'}</small>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {mode === 'formation' && (
            <div className="camp-action-dock camp-action-dock--formation">
              <div><span>FORMATION</span><strong>出撃する位置を決める</strong><small>タップした枠へ選択中のスライムを配置</small></div>
              <div className="camp-formation-strip">
                {formation.map((slot) => (
                  <button
                    key={slot.slotIndex}
                    type="button"
                    className={slot.slimeId === selected ? 'is-selected' : ''}
                    onClick={() => {
                      if (slot.slimeId === selected) controller.removeSlime(slot.slotIndex);
                      else runAction('編成を更新しました', () => controller.assignSlime(selected, slot.slotIndex));
                    }}
                  >
                    {slot.icon !== null ? <img src={`${import.meta.env.BASE_URL}${slot.icon}`} alt="" /> : <span>＋</span>}
                    <small>{slot.slotIndex + 1}</small>
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {notice !== null && <button className="toast-notice" type="button" onClick={() => setNotice(null)}>{notice}</button>}

      {createOpen && (
        <BottomSheet
          title="Slime Nursery"
          onClose={() => setCreateOpen(false)}
          backdropClassName="sheet-backdrop"
          sheetClassName="sheet-panel nursery-sheet"
          headerClassName="sheet-header"
          closeButtonClassName="sheet-close"
        >
          <div className="nursery-world">
            <div className="nursery-vat"><div className="nursery-vat__bubble">●</div><span>PLAIN STOCK</span><strong>{createPanel.plainStock}</strong></div>
            <div className="nursery-actions">
              <button type="button" disabled={!createPanel.craft.canCraft} onClick={() => runAction('Plain Slimeが生まれました', () => controller.craftPlainSlime(1))}>
                <span>♨</span><strong>素材から生み出す</strong><small>{createPanel.craft.requirements.map((item) => `${resourceLabel(item.tokenId)} ${item.owned}/${item.required}`).join(' · ')}</small>
              </button>
              <button type="button" disabled={!createPanel.purchase.canAfford} onClick={() => runAction('Plain Slimeを迎えました', () => controller.buyPlainSlime(1))}>
                <span>G</span><strong>ショップから迎える</strong><small>{createPanel.purchase.cost} G</small>
              </button>
            </div>
            <div className="nursery-job-title"><span>JOB GEAR</span><strong>道具を渡して職業を生む</strong></div>
            <div className="nursery-jobs">
              {createPanel.jobs.map((job) => (
                <button key={job.id} type="button" disabled={!job.canCreate} onClick={() => handleCreateJob(job.id)}>
                  <img src={`${import.meta.env.BASE_URL}${job.icon}`} alt="" />
                  <span><strong>{job.name}</strong><small>{job.isNew ? 'NEW JOB' : '再生成 → Fusion Core'}</small></span>
                  <em>{job.canCreate ? 'CREATE' : '素材不足'}</em>
                </button>
              ))}
            </div>
          </div>
        </BottomSheet>
      )}
    </section>
  );
}

function rejectionLabel(reason: string | undefined): string {
  switch (reason) {
    case 'insufficient-materials': return '素材が足りません';
    case 'insufficient-inputs': return 'Plain SlimeまたはJob Gearが足りません';
    case 'insufficient-gold': return 'Goldが足りません';
    case 'dispatched': return '派遣中です';
    case 'weapon-not-owned': return 'その武器を所持していません';
    default: return reason === undefined ? '実行できませんでした' : `実行できません: ${reason}`;
  }
}

function resourceLabel(tokenId: string): string {
  if (tokenId === ids.token.slimeGel) return 'Gel';
  if (tokenId === ids.token.lifeWater) return 'Life Water';
  return tokenId;
}
