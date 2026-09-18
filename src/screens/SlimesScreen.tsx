import { lazy, Suspense, useState } from 'react';
import { BottomSheet } from 'idle-game-kit/react';
import { useGameController, useGameState } from '../app/GameProvider';
import {
  selectCampUpgradeOpportunities,
  selectCreateSlimePanel,
  selectEarlyGameCue,
  selectFormation,
  selectGlobalHud,
  selectOwnedSlimeIds,
  selectSlimeDetail,
} from '../application/selectors/ui-selectors';
import type { CampSlimeReaction } from '../components/CampSlimeStage';
import { ids, sameTypeCount, slimeInstanceIdForSerial, type JobSlimeId, type SlimeInstanceId } from '../domain';
import { getSlimePresentation } from '../game/slimes';

const CampSlimeStage = lazy(async () => {
  const module = await import('../components/CampSlimeStage');
  return { default: module.CampSlimeStage };
});

const FusionWorkbench = lazy(async () => {
  const module = await import('../components/fusion/FusionWorkbench');
  return { default: module.FusionWorkbench };
});

interface Props {
  selectedId: SlimeInstanceId | null;
  onSelect: (id: SlimeInstanceId) => void;
  onOpenBattle: () => void;
}

type CampMode = 'none' | 'train' | 'formation' | 'fusion';

type CampFeedback = Readonly<{
  key: number;
  reaction: CampSlimeReaction;
  title: string;
  detail?: string;
}>;

export function SlimesScreen({ selectedId, onSelect, onOpenBattle }: Props) {
  const state = useGameState();
  const controller = useGameController();
  const hud = selectGlobalHud(state);
  const validationMode = controller.validationMode;
  const ownedIds = selectOwnedSlimeIds(state);
  const selected = selectedId !== null && state.gameData.roster.slimes[selectedId] !== undefined
    ? selectedId
    : ownedIds[0] ?? null;
  const detail = selected === null ? null : selectSlimeDetail(state, selected);
  const formation = selectFormation(state);
  const createPanel = selectCreateSlimePanel(state);
  const upgradeOpportunities = selectCampUpgradeOpportunities(state);
  const selectedUpgrades = selected === null
    ? []
    : upgradeOpportunities.filter((opportunity) => opportunity.slimeId === selected);
  const primaryUpgrade = upgradeOpportunities[0] ?? null;
  const primaryUpgradeName = primaryUpgrade === null
    ? null
    : getSlimePresentation(state.gameData.roster.slimes[primaryUpgrade.slimeId]!).name;
  const cue = selectEarlyGameCue(state);
  const [mode, setMode] = useState<CampMode>('none');
  const [createOpen, setCreateOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<CampFeedback>({ key: 0, reaction: 'idle', title: '' });

  const triggerFeedback = (reaction: CampSlimeReaction, title: string, detail?: string) => {
    setFeedback((current) => ({ key: current.key + 1, reaction, title, ...(detail === undefined ? {} : { detail }) }));
  };

  const runAction = (success: string, action: () => { accepted: boolean; reason?: string }) => {
    const result = action();
    setNotice(result.accepted ? success : rejectionLabel(result.reason));
  };

  const handleCreateJob = (jobId: JobSlimeId) => {
    const wasDiscovered = sameTypeCount(state, jobId) > 0;
    const result = controller.createJobSlime(jobId);
    if (!result.accepted) {
      setNotice(rejectionLabel(result.reason));
      return;
    }
    const createdId = slimeInstanceIdForSerial(result.state.gameData.roster.nextSlimeSerial - 1);
    const created = result.state.gameData.roster.slimes[createdId];
    if (created === undefined) {
      setNotice('作成したスライムを確認できませんでした');
      return;
    }
    onSelect(createdId);
    const name = getSlimePresentation(created).name;
    if (!wasDiscovered) {
      const open = result.state.gameData.roster.formationSlots.findIndex((slot) => slot === null);
      if (open >= 0) controller.assignSlime(createdId, open);
      setNotice(null);
      triggerFeedback('recruit', `${name}が仲間になった！`, '出撃編成に自動で加わりました');
    } else {
      setNotice(`${name}がもう1匹仲間になりました。編成・派遣・合成素材化を選べます`);
    }
    setCreateOpen(false);
  };

  if (mode === 'fusion' && selected !== null) {
    return (
      <Suspense fallback={<div className="fusion-workbench fusion-workbench--empty" aria-label="合成画面を読み込み中" />}>
        <FusionWorkbench
          slimeId={selected}
          onClose={() => setMode('none')}
          onBattle={onOpenBattle}
          onRecruit={() => { setMode('none'); setCreateOpen(true); }}
        />
      </Suspense>
    );
  }

  return (
    <section className="screen screen--camp screen--active" aria-label="キャンプ">
      <header className="camp-topbar">
        <div className="camp-resources"><span>G</span><strong>{validationMode ? '∞' : hud.gold}</strong></div>
        {validationMode && (
          <button
            className="validation-mode-badge validation-mode-badge--action"
            type="button"
            onClick={() => {
              const result = controller.validationPrepareRoster();
              if (!result.accepted) { setNotice(rejectionLabel(result.reason)); return; }
              const first = result.state.gameData.roster.formationSlots[0];
              if (first !== null) onSelect(first);
            }}
          >
            検証 · 全6職編成
          </button>
        )}
      </header>

      <div className="camp-roster" aria-label="仲間のスライム">
        {ownedIds.map((id) => {
          const slime = state.gameData.roster.slimes[id]!;
          const p = getSlimePresentation(slime);
          return (
            <button key={id} className={id === selected ? 'is-selected' : ''} type="button" onClick={() => { onSelect(id); setMode('none'); setFeedback((current) => ({ key: current.key + 1, reaction: 'idle', title: '' })); }}>
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
          <div className={`camp-world camp-world--${feedback.reaction}`}>
            <div className="camp-world__sky" />
            <div className="camp-world__hills camp-world__hills--far" />
            <div className="camp-world__hills camp-world__hills--near" />
            <div className="camp-world__ground" />
            {feedback.reaction === 'level-up' && feedback.title !== '' && (
              <div className="camp-gold-flight" key={`gold-${feedback.key}`} aria-hidden="true">
                <i /><i /><i /><i /><i /><i />
              </div>
            )}
            {(feedback.reaction === 'level-up' || feedback.reaction === 'recruit') && feedback.title !== '' && (
              <div className="camp-reward-ring" key={`ring-${feedback.key}`} aria-hidden="true" />
            )}
            <div className="camp-prop camp-prop--tent"><span>▲</span></div>
            <div className="camp-prop camp-prop--dummy"><span>＋</span></div>
            <div className="camp-prop camp-prop--flag"><span>⚑</span></div>

            <div className="camp-slime-stage">
              <Suspense fallback={<div className="camp-resident-stage" aria-hidden="true" />}>
                <CampSlimeStage
                  slimeId={detail.typeId}
                  fusionRank={detail.fusionRank}
                  reaction={feedback.reaction}
                  reactionKey={feedback.key}
                />
              </Suspense>
              {feedback.title !== '' && (
                <div className={`camp-action-feedback camp-action-feedback--${feedback.reaction}`} key={feedback.key}>
                  <strong>{feedback.title}</strong>
                  {feedback.detail !== undefined && <small>{feedback.detail}</small>}
                </div>
              )}
              <div className="camp-slime-name">
                <span>{detail.role}</span><strong>{detail.name}</strong><small>Lv.{detail.level} · 合成ランク {detail.fusionRank}</small>
              </div>
            </div>

            <button
              className={`camp-hotspot camp-hotspot--train ${mode === 'train' ? 'is-active' : ''} ${selectedUpgrades.some((opportunity) => opportunity.kind === 'promotion') || (state.gameData.combat.retryFarmClearsRemaining > 0 && selectedUpgrades.some((opportunity) => opportunity.kind === 'level')) ? 'is-ready' : ''}`}
              type="button"
              onClick={() => setMode(mode === 'train' ? 'none' : 'train')}
            >
              <span>⚔</span><strong>訓練</strong><small>{selectedUpgrades.some((opportunity) => opportunity.kind === 'promotion') ? '昇格可能' : selectedUpgrades.some((opportunity) => opportunity.kind === 'level') ? '強化可能' : '育成'}</small>
            </button>
            <button className={`camp-hotspot camp-hotspot--fusion ${detail.fusion?.canFuse ? 'is-ready' : ''}`} type="button" onClick={() => setMode('fusion')}>
              <span>✦</span><strong>合成</strong><small>{detail.fusion?.canFuse ? '合成可能' : '合成台'}</small>
            </button>
            <button className="camp-hotspot camp-hotspot--nursery" type="button" onClick={() => setCreateOpen(true)}>
              <span>●</span><strong>育成所</strong><small>仲間を増やす</small>
            </button>
            <button className={`camp-hotspot camp-hotspot--formation ${mode === 'formation' ? 'is-active' : ''}`} type="button" onClick={() => setMode(mode === 'formation' ? 'none' : 'formation')}>
              <span>⚑</span><strong>編成</strong><small>{detail.assignment === 'battle' ? '出撃中' : '控え'}</small>
            </button>

            {mode === 'none' && state.gameData.combat.retryFarmClearsRemaining > 0 && primaryUpgrade !== null && primaryUpgradeName !== null && (
              <button
                className="camp-upgrade-alert"
                type="button"
                onClick={() => {
                  onSelect(primaryUpgrade.slimeId);
                  setMode(primaryUpgrade.kind === 'fusion' ? 'fusion' : 'train');
                }}
              >
                <span>再出撃準備</span>
                <strong>{primaryUpgradeName} · {primaryUpgrade.label}</strong>
                <em>›</em>
              </button>
            )}

            {cue !== null && (
              <button className="camp-quest" type="button" onClick={() => {
                if (cue.action === 'Battle') onOpenBattle();
                else if (cue.action === 'Fuse') setMode('fusion');
                else setCreateOpen(true);
              }}>
                <span>次へ</span><strong>{cue.title}</strong><em>›</em>
              </button>
            )}
          </div>

          {mode === 'train' && (
            <div className="camp-action-dock camp-action-dock--train">
              <div><span>訓練</span><strong>ゴールドを力に変える</strong><small>強化するとすぐ戦闘能力へ反映されます</small></div>
              <div className="camp-level-buttons">
                {[detail.levelActions.one, detail.levelActions.ten, detail.levelActions.max].map((action, index) => (
                  <button
                    key={index}
                    type="button"
                    disabled={action === null || !action.available}
                    onClick={() => {
                      if (action === null) return;
                      const result = controller.levelUpSlime(selected, action.count);
                      if (!result.accepted) { setNotice(rejectionLabel(result.reason)); return; }
                      setNotice(null);
                      triggerFeedback('level-up', `Lv.${action.targetLevel}`, `-${action.cost} G`);
                    }}
                  >
                    <span>{index === 0 ? '+1' : index === 1 ? '+10' : '最大'}</span>
                    <strong>{action?.cost ?? '—'} G</strong>
                  </button>
                ))}
              </div>
              {validationMode && (
                <div className="camp-validation-tools">
                  <span>検証ツール</span>
                  <button type="button" onClick={() => {
                    const result = controller.validationSetSlimeLevel(selected, 40);
                    setNotice(result.accepted ? 'Lv.40に設定しました' : rejectionLabel(result.reason));
                  }}>Lv.40へ</button>
                  <button type="button" onClick={() => {
                    const result = controller.validationResetSlime(selected);
                    if (!result.accepted) { setNotice(rejectionLabel(result.reason)); return; }
                    setNotice('Tier1・合成ランク1へ戻しました');
                    triggerFeedback('idle', '');
                  }}>初期形態へ戻す</button>
                </div>
              )}

              {detail.promotions.length > 0 && (
                <div className={`camp-promotion-choices ${detail.promotions.length > 1 ? 'is-branching' : ''}`}>
                  {detail.promotions.map((promotion) => (
                    <button
                      key={promotion.id}
                      className={`camp-promotion-action ${promotion.canPromote ? 'is-ready' : ''}`}
                      type="button"
                      disabled={!promotion.canPromote}
                      onClick={() => {
                        const result = controller.promoteSlime(selected, promotion.id);
                        if (!result.accepted) { setNotice(rejectionLabel(result.reason)); return; }
                        setNotice(null);
                        triggerFeedback('level-up', `${promotion.resultName}へ昇格`, `Tier ${detail.tier + 1}`);
                      }}
                    >
                      <span>{detail.promotions.length > 1 ? '分岐昇格' : '昇格'}</span>
                      <strong>{promotion.resultName}</strong>
                      <small>Lv.{promotion.minLevel} · {promotion.goldCost} G · 素材 {promotion.requirements.every((item) => item.missing === 0) ? 'OK' : '不足'}</small>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {mode === 'formation' && (
            <div className="camp-action-dock camp-action-dock--formation">
              <div><span>編成</span><strong>出撃する位置を決める</strong><small>タップした枠へ選択中のスライムを配置</small></div>
              <div className="camp-formation-strip">
                {formation.map((slot) => (
                  <button
                    key={slot.slotIndex}
                    type="button"
                    className={slot.slimeId === selected ? 'is-selected' : ''}
                    onClick={() => {
                      if (slot.slimeId === selected) {
                        const result = controller.removeSlime(slot.slotIndex);
                        if (!result.accepted) { setNotice(rejectionLabel(result.reason)); return; }
                        setNotice(null);
                        triggerFeedback('formation', '控えへ移動', '派遣に出せるようになりました');
                      } else {
                        const result = controller.assignSlime(selected, slot.slotIndex);
                        if (!result.accepted) { setNotice(rejectionLabel(result.reason)); return; }
                        setNotice(null);
                        triggerFeedback('formation', `編成 ${slot.slotIndex + 1}へ`, '次の戦闘から反映されます');
                      }
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
          title="スライム育成所"
          onClose={() => setCreateOpen(false)}
          backdropClassName="sheet-backdrop"
          sheetClassName="sheet-panel nursery-sheet"
          headerClassName="sheet-header"
          closeButtonClassName="sheet-close"
        >
          <div className="nursery-world">
            <div className="nursery-vat"><div className="nursery-vat__bubble">●</div><span>プレーンスライム</span><strong>{validationMode ? '∞' : createPanel.plainStock}</strong></div>
            <div className="nursery-actions">
              <button type="button" disabled={!createPanel.craft.canCraft} onClick={() => runAction('プレーンスライムが生まれました', () => controller.craftPlainSlime(1))}>
                <span>♨</span><strong>素材から生み出す</strong><small>{createPanel.craft.requirements.map((item) => `${resourceLabel(item.tokenId)} ${validationMode ? '∞' : item.owned}/${item.required}`).join(' · ')}</small>
              </button>
              <button type="button" disabled={!createPanel.purchase.canAfford} onClick={() => runAction('プレーンスライムを迎えました', () => controller.buyPlainSlime(1))}>
                <span>G</span><strong>ショップから迎える</strong><small>{createPanel.purchase.cost} G</small>
              </button>
            </div>
            <div className="nursery-job-title"><span>職業装備</span><strong>道具を渡して職業を生む</strong></div>
            <div className="nursery-jobs">
              {createPanel.jobs.map((job) => (
                <button key={job.id} type="button" disabled={!job.canCreate} onClick={() => handleCreateJob(job.id)}>
                  <img src={`${import.meta.env.BASE_URL}${job.icon}`} alt="" />
                  <span><strong>{job.name}</strong><small>{job.isNew ? '新しい職業' : '同職の別個体として加入'}</small></span>
                  <em>{job.canCreate ? '作成' : '素材不足'}</em>
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
    case 'insufficient-inputs': return 'プレーンスライムまたは職業装備が足りません';
    case 'insufficient-gold': return 'ゴールドが足りません';
    case 'dispatched': return '派遣中です';
    case 'weapon-not-owned': return 'その武器を所持していません';
    case 'promotion-choice-required': return '昇格先を選んでください';
    case 'invalid-promotion': return 'その昇格先は選べません';
    case 'validation-mode-disabled': return '検証モードでのみ使えます';
    case 'job-create-failed': return '全職解放に失敗しました';
    case 'formation-failed': return '派遣中のスライムがいるため6職編成できません';
    default: return reason === undefined ? '実行できませんでした' : `実行できません: ${reason}`;
  }
}

function resourceLabel(tokenId: string): string {
  if (tokenId === ids.token.slimeGel) return 'スライムジェル';
  if (tokenId === ids.token.lifeWater) return '生命の水';
  return tokenId;
}
