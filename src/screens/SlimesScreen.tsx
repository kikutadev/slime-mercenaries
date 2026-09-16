import { useState } from 'react';
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
import { CampSlimeStage, type CampSlimeReaction } from '../components/CampSlimeStage';
import { ids, type JobSlimeId } from '../domain';
import { getSlimePresentation } from '../game/slimes';

interface Props {
  selectedId: JobSlimeId | null;
  onSelect: (id: JobSlimeId) => void;
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
  const [feedback, setFeedback] = useState<CampFeedback>({ key: 0, reaction: 'idle', title: '' });

  const triggerFeedback = (reaction: CampSlimeReaction, title: string, detail?: string) => {
    setFeedback((current) => ({ key: current.key + 1, reaction, title, ...(detail === undefined ? {} : { detail }) }));
  };

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
      const name = getSlimePresentation(result.state.gameData.roster.slimes[jobId]!).name;
      setNotice(null);
      triggerFeedback('recruit', `${name}が仲間になった！`, '出撃編成に自動で加わりました');
    } else {
      setNotice(`${getSlimePresentation(result.state.gameData.roster.slimes[jobId]!).name} の核を獲得`);
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
    <section className="screen screen--camp screen--active" aria-label="キャンプ">
      <header className="camp-topbar">
        <div className="camp-resources"><span>G</span><strong>{hud.gold}</strong></div>
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
              <CampSlimeStage
                slimeId={selected}
                fusionRank={detail.fusionRank}
                reaction={feedback.reaction}
                reactionKey={feedback.key}
              />
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

            <button className={`camp-hotspot camp-hotspot--train ${mode === 'train' ? 'is-active' : ''}`} type="button" onClick={() => setMode(mode === 'train' ? 'none' : 'train')}>
              <span>⚔</span><strong>訓練</strong><small>育成</small>
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
            <div className="nursery-vat"><div className="nursery-vat__bubble">●</div><span>プレーンスライム</span><strong>{createPanel.plainStock}</strong></div>
            <div className="nursery-actions">
              <button type="button" disabled={!createPanel.craft.canCraft} onClick={() => runAction('プレーンスライムが生まれました', () => controller.craftPlainSlime(1))}>
                <span>♨</span><strong>素材から生み出す</strong><small>{createPanel.craft.requirements.map((item) => `${resourceLabel(item.tokenId)} ${item.owned}/${item.required}`).join(' · ')}</small>
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
                  <span><strong>{job.name}</strong><small>{job.isNew ? '新しい職業' : '再生成 → 合成の核'}</small></span>
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
    default: return reason === undefined ? '実行できませんでした' : `実行できません: ${reason}`;
  }
}

function resourceLabel(tokenId: string): string {
  if (tokenId === ids.token.slimeGel) return 'スライムジェル';
  if (tokenId === ids.token.lifeWater) return '生命の水';
  return tokenId;
}
