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
import { SlimePreview } from '../components/SlimePreview';
import { ids, weaponDefinitions, type JobSlimeId } from '../domain';
import { FUSION_ITEMS, getSlimePresentation, getSlimePresentationForRank } from '../game/slimes';
import { getNextFusionStep } from '../game/fusion';

interface FusionRun {
  slimeId: JobSlimeId;
  fromRank: number;
  toRank: number;
  title: string;
}

export function SlimesScreen({
  selectedId,
  onSelect,
  onOpenBattle,
}: {
  selectedId: JobSlimeId | null;
  onSelect: (id: JobSlimeId) => void;
  onOpenBattle: () => void;
}) {
  const state = useGameState();
  const controller = useGameController();
  const hud = selectGlobalHud(state);
  const ownedIds = selectOwnedSlimeIds(state);
  const effectiveSelectedId = selectedId !== null && state.gameData.roster.slimes[selectedId] !== undefined
    ? selectedId
    : ownedIds[0] ?? null;
  const detail = effectiveSelectedId === null ? null : selectSlimeDetail(state, effectiveSelectedId);
  const formation = selectFormation(state);
  const createPanel = selectCreateSlimePanel(state);
  const earlyGameCue = selectEarlyGameCue(state);
  const [createOpen, setCreateOpen] = useState(false);
  const [weaponOpen, setWeaponOpen] = useState(false);
  const [fusionRun, setFusionRun] = useState<FusionRun | null>(null);
  const [fusionSequenceKey, setFusionSequenceKey] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);

  const selectedProgress = effectiveSelectedId === null ? null : state.gameData.roster.slimes[effectiveSelectedId] ?? null;
  const nextFusion = selectedProgress === null ? null : getNextFusionStep(selectedProgress);
  const selectedSlotIndex = effectiveSelectedId === null
    ? -1
    : state.gameData.roster.formationSlots.findIndex((id) => id === effectiveSelectedId);

  const compatibleWeapons = useMemo(() => {
    if (effectiveSelectedId === null) return [];
    return Object.values(weaponDefinitions).filter((weapon) => weapon.family === effectiveSelectedId);
  }, [effectiveSelectedId]);

  const runAction = (message: string, action: () => { accepted: boolean; reason?: string }) => {
    const result = action();
    if (result.accepted) setNotice(message);
    else setNotice(rejectionLabel(result.reason));
    return result.accepted;
  };

  const handleCreateJob = (jobId: JobSlimeId) => {
    const wasOwned = state.gameData.roster.slimes[jobId] !== undefined;
    const created = controller.createJobSlime(jobId);
    if (!created.accepted) {
      setNotice(rejectionLabel(created.reason));
      return;
    }
    if (!wasOwned) {
      const slotIndex = created.state.gameData.roster.formationSlots.findIndex((candidate) => candidate === null);
      if (slotIndex >= 0) controller.assignSlime(jobId, slotIndex);
      onSelect(jobId);
      setCreateOpen(false);
      onOpenBattle();
    }
  };

  const handleFuse = () => {
    if (effectiveSelectedId === null || selectedProgress === null || detail?.fusion?.canFuse !== true || nextFusion === null) return;
    const fromRank = selectedProgress.fusionRank;
    const result = controller.fuseSlime(effectiveSelectedId);
    if (!result.accepted) {
      setNotice(rejectionLabel(result.reason));
      return;
    }
    setFusionSequenceKey((value) => value + 1);
    setFusionRun({
      slimeId: effectiveSelectedId,
      fromRank,
      toRank: fromRank + 1,
      title: nextFusion.title,
    });
  };

  const handleAssignToFirstOpenSlot = () => {
    if (effectiveSelectedId === null) return;
    const openSlot = state.gameData.roster.formationSlots.findIndex((id) => id === null);
    if (openSlot < 0) {
      setNotice('空き編成枠がありません');
      return;
    }
    runAction('戦闘編成に追加しました', () => controller.assignSlime(effectiveSelectedId, openSlot));
  };

  return (
    <section className="screen screen--menu screen--active" aria-label="Slimes">
      <header className="menu-header">
        <div>
          <p className="eyebrow">MERCENARY ROSTER</p>
          <h1>Slimes</h1>
        </div>
        <div className="menu-header__resources"><span>G {hud.gold}</span><button type="button" onClick={() => setCreateOpen(true)}>＋ Create</button></div>
      </header>

      {earlyGameCue !== null && (
        <button
          className="next-goal-strip"
          type="button"
          onClick={() => {
            if (earlyGameCue.action === 'Battle') onOpenBattle();
            else if (earlyGameCue.action === 'Fuse') document.querySelector('.growth-card--fusion')?.scrollIntoView({ block: 'center' });
            else setCreateOpen(true);
          }}
        >
          <span>NEXT</span>
          <div><strong>{earlyGameCue.title}</strong><small>{earlyGameCue.body}</small></div>
          <em>{earlyGameCue.action} ›</em>
        </button>
      )}

      <div className="formation-editor" aria-label="battle formation">
        <div className="section-title-row"><div><span>FORMATION</span><strong>最大6匹の主力</strong></div><small>{formation.filter((slot) => slot.slimeId !== null).length} / 6</small></div>
        <div className="formation-strip formation-strip--editor">
          {formation.map((slot) => {
            if (slot.slimeId === null) {
              return (
                <button
                  className="formation-slot formation-slot--empty"
                  type="button"
                  key={slot.slotIndex}
                  disabled={effectiveSelectedId === null}
                  onClick={() => effectiveSelectedId !== null && runAction('編成を更新しました', () => controller.assignSlime(effectiveSelectedId, slot.slotIndex))}
                >
                  <span>＋</span><small>{slot.slotIndex + 1}</small>
                </button>
              );
            }
            return (
              <button
                className={`formation-slot ${effectiveSelectedId === slot.slimeId ? 'is-selected' : ''}`}
                type="button"
                key={slot.slotIndex}
                onClick={() => onSelect(slot.slimeId!)}
              >
                <span className="formation-slot__icon"><img src={`${import.meta.env.BASE_URL}${slot.icon}`} alt="" /></span>
                <span className="formation-slot__name">{slot.name?.replace(' Slime', '')}</span>
              </button>
            );
          })}
        </div>
      </div>

      {ownedIds.length > 0 && (
        <div className="roster-selector" aria-label="owned slimes">
          {ownedIds.map((id) => {
            const slime = state.gameData.roster.slimes[id]!;
            const presentation = getSlimePresentation(slime);
            const selected = id === effectiveSelectedId;
            return (
              <button className={`roster-chip ${selected ? 'is-selected' : ''}`} type="button" key={id} onClick={() => onSelect(id)}>
                <img src={`${import.meta.env.BASE_URL}${presentation.icon}`} alt="" />
                <span><strong>{presentation.name}</strong><small>Lv.{slime.level} · F{slime.fusionRank}</small></span>
                <i className={`assignment-dot assignment-dot--${slime.assignment}`} />
              </button>
            );
          })}
        </div>
      )}

      {detail === null || effectiveSelectedId === null ? (
        <section className="empty-card">
          <div className="empty-card__slime">●</div>
          <h2>最初のスライム傭兵を作ろう</h2>
          <p>Plain Slimeを生成してJob Gearを渡すと、最初の職業が生まれます。</p>
          <button className="primary-button" type="button" onClick={() => setCreateOpen(true)}>Create Slime</button>
        </section>
      ) : (
        <>
          <section className="slime-hero-card">
            <div className="slime-focus__meta">
              <div><p className="slime-role">{detail.role}</p><h2>{detail.name}</h2></div>
              <span className={`assignment assignment--${detail.assignment}`}>{assignmentLabel(detail.assignment)}</span>
            </div>
            <SlimePreview
              slimeId={effectiveSelectedId}
              fusionRank={detail.fusionRank}
              fusionReady={detail.fusion?.canFuse ?? false}
              isFusing={fusionRun?.slimeId === effectiveSelectedId}
              sequenceKey={fusionSequenceKey}
              fromRank={fusionRun?.fromRank ?? detail.fusionRank}
              toRank={fusionRun?.toRank ?? detail.fusionRank + 1}
              onFusionCommit={() => undefined}
              onFusionComplete={() => setFusionRun(null)}
            />
            <div className="slime-stat-row">
              <span><small>LEVEL</small><strong>{detail.level}</strong></span>
              <span><small>TIER</small><strong>{detail.tier}</strong></span>
              <span><small>FUSION</small><strong>{detail.fusionRank}</strong></span>
              <button type="button" onClick={() => setWeaponOpen(true)}><small>WEAPON</small><strong>{detail.weaponName}</strong></button>
            </div>
          </section>

          <section className="growth-card">
            <div className="section-title-row"><div><span>LEVEL</span><strong>Goldで即時強化</strong></div><small>Lv.{detail.level}</small></div>
            <div className="level-action-grid">
              {[detail.levelActions.one, detail.levelActions.ten, detail.levelActions.max].map((action, index) => (
                <button
                  type="button"
                  key={index}
                  disabled={action === null || !action.available}
                  onClick={() => action !== null && runAction(`Lv.${action.targetLevel} へ強化`, () => controller.levelUpSlime(effectiveSelectedId, action.count))}
                >
                  <strong>{index === 0 ? '+1' : index === 1 ? '+10' : 'MAX'}</strong>
                  <small>{action === null ? '上限' : `${action.cost} G`}</small>
                </button>
              ))}
            </div>
          </section>

          {detail.fusion !== null && nextFusion !== null && (
            <section className={`growth-card growth-card--fusion ${detail.fusion.canFuse ? 'is-ready' : ''}`}>
              <div className="section-title-row"><div><span>FUSION</span><strong>{nextFusion.resultName ?? nextFusion.title}</strong></div>{detail.fusion.canFuse && <em>READY</em>}</div>
              <p className="growth-copy">{nextFusion.description}</p>
              <div className="recipe-row">
                {detail.fusion.requirements.map((requirement) => (
                  <div className={requirement.missing === 0 ? 'is-ready' : 'is-missing'} key={requirement.tokenId}>
                    <span>{FUSION_ITEMS[requirement.tokenId as keyof typeof FUSION_ITEMS]?.glyph ?? '◆'}</span>
                    <small>{requirement.label}</small>
                    <strong>{requirement.owned}/{requirement.required}</strong>
                  </div>
                ))}
              </div>
              <button className="primary-button" type="button" disabled={!detail.fusion.canFuse || fusionRun !== null} onClick={handleFuse}>
                {fusionRun !== null ? '合成中…' : detail.fusion.levelMet ? 'Fuse' : `Lv.${detail.fusion.minLevel}で解放`}
              </button>
            </section>
          )}

          {detail.promotion !== null && (
            <section className={`growth-card ${detail.promotion.canPromote ? 'is-ready' : ''}`}>
              <div className="section-title-row"><div><span>PROMOTION</span><strong>{detail.promotion.resultName}</strong></div>{detail.promotion.canPromote && <em>READY</em>}</div>
              <p className="growth-copy">Tierを進めます。Fusion Rankはそのまま引き継ぎます。</p>
              <div className="requirement-line"><span>Lv.{detail.promotion.minLevel}</span><span>{detail.promotion.goldCost} G</span><span>昇格素材</span></div>
              <button className="secondary-button" type="button" disabled={!detail.promotion.canPromote} onClick={() => {
                const result = controller.promoteSlime(effectiveSelectedId);
                if (!result.accepted) setNotice(rejectionLabel(result.reason));
              }}>Promote</button>
            </section>
          )}

          <section className="assignment-actions">
            {detail.assignment === 'battle' && selectedSlotIndex >= 0 ? (
              <button className="secondary-button" type="button" onClick={() => runAction('控えに戻しました', () => controller.removeSlime(selectedSlotIndex))}>編成から外す</button>
            ) : detail.assignment === 'reserve' ? (
              <button className="secondary-button" type="button" onClick={handleAssignToFirstOpenSlot}>戦闘編成に入れる</button>
            ) : (
              <div className="inline-note">派遣から帰還すると編成できます。</div>
            )}
          </section>
        </>
      )}

      {notice !== null && <button className="toast-notice" type="button" onClick={() => setNotice(null)}>{notice}</button>}

      {createOpen && (
        <BottomSheet
          title="Create Slime"
          onClose={() => setCreateOpen(false)}
          backdropClassName="sheet-backdrop"
          sheetClassName="sheet-panel"
          headerClassName="sheet-header"
          closeButtonClassName="sheet-close"
        >
          <div className="create-sheet">
            <div className="plain-stock-card"><span>Plain Slime Stock</span><strong>{createPanel.plainStock}</strong></div>
            <div className="create-action-grid">
              <button type="button" disabled={!createPanel.craft.canCraft} onClick={() => runAction('Plain Slimeを生成しました', () => controller.craftPlainSlime(1))}>
                <strong>素材から生成</strong><small>{createPanel.craft.requirements.map((item) => `${resourceLabel(item.tokenId)} ${item.owned}/${item.required}`).join(' · ')}</small>
              </button>
              <button type="button" disabled={!createPanel.purchase.canAfford} onClick={() => runAction('Plain Slimeを購入しました', () => controller.buyPlainSlime(1))}>
                <strong>Goldで購入</strong><small>{createPanel.purchase.cost} G</small>
              </button>
            </div>
            <div className="sheet-section-title"><span>JOB</span><strong>仕事道具を渡す</strong></div>
            <div className="job-create-list">
              {createPanel.jobs.map((job) => (
                <button type="button" key={job.id} disabled={!job.canCreate} onClick={() => handleCreateJob(job.id)}>
                  <img src={`${import.meta.env.BASE_URL}${job.icon}`} alt="" />
                  <span><strong>{job.name}</strong><small>{job.isNew ? 'NEW · 新しい職業を発見' : '発見済み · Slime Coreへ変換'}</small></span>
                  <em>{job.canCreate ? 'CREATE' : '不足'}</em>
                </button>
              ))}
            </div>
          </div>
        </BottomSheet>
      )}

      {weaponOpen && detail !== null && effectiveSelectedId !== null && (
        <BottomSheet
          title="Change Weapon"
          onClose={() => setWeaponOpen(false)}
          backdropClassName="sheet-backdrop"
          sheetClassName="sheet-panel"
          headerClassName="sheet-header"
          closeButtonClassName="sheet-close"
        >
          <div className="weapon-list">
            {compatibleWeapons.map((weapon) => {
              const instance = Object.values(state.gameData.equipment.inventory).find((candidate) => candidate.definitionId === weapon.id);
              const owned = instance !== undefined;
              const refinement = (instance?.data as { refinementRank?: number } | undefined)?.refinementRank ?? 0;
              const equipped = detail.weaponName === weapon.displayName;
              return (
                <button type="button" key={weapon.id} disabled={!owned || equipped} onClick={() => {
                  const result = controller.equipWeapon(effectiveSelectedId, weapon.id);
                  if (!result.accepted) setNotice(rejectionLabel(result.reason));
                  else setWeaponOpen(false);
                }}>
                  <span className={`weapon-rarity weapon-rarity--${weapon.rarity}`}>{weapon.rarity.toUpperCase()}</span>
                  <span><strong>{weapon.displayName}</strong><small>Refine +{refinement} · DPS ×{weapon.dpsMultiplier.toFixed(2)}</small></span>
                  <em>{equipped ? 'EQUIPPED' : owned ? 'EQUIP' : '未所持'}</em>
                </button>
              );
            })}
          </div>
        </BottomSheet>
      )}
    </section>
  );
}

function assignmentLabel(value: 'battle' | 'reserve' | 'dispatch'): string {
  switch (value) {
    case 'battle': return '戦闘中';
    case 'reserve': return '控え';
    case 'dispatch': return '派遣中';
  }
}

function rejectionLabel(reason: string | undefined): string {
  switch (reason) {
    case 'insufficient-materials': return '素材が足りません';
    case 'insufficient-inputs': return 'Plain SlimeまたはJob Gearが足りません';
    case 'insufficient-gold': return 'Goldが足りません';
    case 'level-too-low': return 'レベルが足りません';
    case 'dispatched': return '派遣中のため編成できません';
    case 'not-reserve': return '控えのスライムを選んでください';
    case 'insufficient-power': return 'この依頼には戦力が足りません';
    case 'weapon-not-owned': return 'その武器を所持していません';
    case 'wrong-family': return 'このスライムには装備できません';
    default: return reason === undefined ? '実行できませんでした' : `実行できません: ${reason}`;
  }
}

function resourceLabel(tokenId: string): string {
  if (tokenId === ids.token.slimeGel) return 'Gel';
  if (tokenId === ids.token.lifeWater) return 'Life Water';
  return tokenId;
}
