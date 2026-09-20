import { lazy, Suspense, useRef, useState } from 'react';
import { useGameController, useGameState } from '../app/GameProvider';
import { validationToolsVisible } from '../application/validation-mode';
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
import { CampStrengthenEffect, type StrengthenCeremony, type StrengthenVariant } from '../components/CampStrengthenEffect';
import { CampFormationBoard, type CampFormationCeremony } from '../components/CampFormationBoard';
import { CampStationIcon } from '../components/CampStationIcon';
import type { NurseryCeremony } from '../components/NurseryCeremonyStage';
import { NurseryPanel } from '../components/NurseryPanel';
import { sameTypeCount, slimeInstanceIdForSerial, type JobSlimeId, type SlimeInstanceId } from '../domain';
import { getSlimePresentation } from '../game/slimes';
import styles from './SlimesScreen.module.css';

const CampSlimeStage = lazy(async () => {
  const module = await import('../components/CampSlimeStage');
  return { default: module.CampSlimeStage };
});

const CampEnvironmentStage = lazy(async () => {
  const module = await import('../components/CampEnvironmentStage');
  return { default: module.CampEnvironmentStage };
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
  strength?: 1 | 2 | 3;
}>;

type CampLevelAction = Readonly<{
  count: number;
  targetLevel: number;
  cost: string;
  available: boolean;
}>;

export function SlimesScreen({ selectedId, onSelect, onOpenBattle }: Props) {
  const state = useGameState();
  const controller = useGameController();
  const hud = selectGlobalHud(state);
  const validationMode = controller.validationMode;
  const showValidationTools = validationToolsVisible();
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
  const [nurseryCeremony, setNurseryCeremony] = useState<NurseryCeremony | null>(null);
  const [strengthenCeremony, setStrengthenCeremony] = useState<StrengthenCeremony | null>(null);
  const [formationCeremony, setFormationCeremony] = useState<CampFormationCeremony | null>(null);
  const nurseryCeremonyKey = useRef(0);
  const strengthenCeremonyKey = useRef(0);
  const formationCeremonyKey = useRef(0);
  const nurseryBusy = nurseryCeremony !== null;
  const strengthenBusy = strengthenCeremony !== null;
  const formationBusy = formationCeremony !== null;
  const campInteractionBusy = strengthenBusy || formationBusy;

  const triggerFeedback = (
    reaction: CampSlimeReaction,
    title: string,
    detail?: string,
    strength: 1 | 2 | 3 = 1,
  ) => {
    setFeedback((current) => ({
      key: current.key + 1,
      reaction,
      title,
      strength,
      ...(detail === undefined ? {} : { detail }),
    }));
  };

  const playFormationCeremony = (
    ceremony: Omit<CampFormationCeremony, 'key'>,
    title: string,
    detailText: string,
  ) => {
    const key = ++formationCeremonyKey.current;
    setFormationCeremony({ ...ceremony, key });
    window.setTimeout(() => {
      setFormationCeremony((current) => current?.key === key ? null : current);
      triggerFeedback('formation', title, detailText);
    }, 560);
  };

  const handleFormationSlot = (slotIndex: number) => {
    if (selected === null || detail === null || formationBusy || detail.assignment === 'dispatch') return;
    const fromSlot = formation.find((slot) => slot.slimeId === selected)?.slotIndex ?? null;
    const target = formation[slotIndex];
    if (target === undefined || target.slimeId === selected) return;

    const result = controller.assignSlime(selected, slotIndex);
    if (!result.accepted) {
      setNotice(rejectionLabel(result.reason));
      return;
    }

    setNotice(null);
    const kind: CampFormationCeremony['kind'] = fromSlot !== null
      ? target.slimeId === null ? 'move' : 'swap'
      : target.slimeId === null ? 'move' : 'replace';
    const rowLabel = slotIndex < 3 ? '前衛' : '後衛';
    playFormationCeremony(
      {
        kind,
        fromSlot,
        toSlot: slotIndex,
        selectedIcon: import.meta.env.BASE_URL + detail.icon,
        ...(target.icon === null ? {} : { displacedIcon: import.meta.env.BASE_URL + target.icon }),
      },
      kind === 'swap' ? '配置を入れ替え' : '配置を変更',
      rowLabel + 'へ移動しました',
    );
  };

  const handleFormationReserve = () => {
    if (selected === null || detail === null || formationBusy) return;
    const fromSlot = formation.find((slot) => slot.slimeId === selected)?.slotIndex ?? null;
    if (fromSlot === null) return;

    const result = controller.removeSlime(fromSlot);
    if (!result.accepted) {
      setNotice(rejectionLabel(result.reason));
      return;
    }

    setNotice(null);
    playFormationCeremony(
      {
        kind: 'reserve',
        fromSlot,
        toSlot: null,
        selectedIcon: import.meta.env.BASE_URL + detail.icon,
      },
      '控えへ移動',
      '戦闘編成から外れました',
    );
  };

  const handleStrengthen = (
    action: CampLevelAction,
    variant: StrengthenVariant,
  ) => {
    if (selected === null || detail === null || strengthenBusy) return;
    const result = controller.levelUpSlime(selected, action.count);
    if (!result.accepted) {
      setNotice(rejectionLabel(result.reason));
      return;
    }

    setNotice(null);
    const key = ++strengthenCeremonyKey.current;
    const strength: 1 | 2 | 3 = variant === 'one' ? 1 : variant === 'ten' ? 2 : 3;
    const chargeMs = variant === 'one' ? 280 : variant === 'ten' ? 360 : 430;
    const settleMs = variant === 'one' ? 760 : variant === 'ten' ? 900 : 1040;
    setStrengthenCeremony({
      key,
      phase: 'charging',
      variant,
      fromLevel: detail.level,
      targetLevel: action.targetLevel,
      cost: action.cost,
    });

    window.setTimeout(() => {
      setStrengthenCeremony((current) => current?.key === key
        ? { ...current, phase: 'result' }
        : current);
      triggerFeedback('level-up', `Lv.${action.targetLevel}`, `-${action.cost} G`, strength);

      window.setTimeout(() => {
        setStrengthenCeremony((current) => current?.key === key ? null : current);
      }, settleMs);
    }, chargeMs);
  };

  const playNurseryCeremony = (
    ceremony: Omit<NurseryCeremony, 'key'>,
    durationMs: number,
    onComplete?: () => void,
  ) => {
    const key = ++nurseryCeremonyKey.current;
    setNurseryCeremony({ ...ceremony, key });
    window.setTimeout(() => {
      setNurseryCeremony((active) => active?.key === key ? null : active);
      onComplete?.();
    }, durationMs);
  };

  const handleCraftPlain = () => {
    if (nurseryBusy) return;
    const beforeStock = createPanel.plainStock;
    const result = controller.craftPlainSlime(1);
    if (!result.accepted) {
      setNotice(rejectionLabel(result.reason));
      return;
    }
    setNotice(null);
    playNurseryCeremony({ kind: 'craft', beforeStock }, 1280);
  };

  const handlePurchasePlain = () => {
    if (nurseryBusy) return;
    const beforeStock = createPanel.plainStock;
    const result = controller.buyPlainSlime(1);
    if (!result.accepted) {
      setNotice(rejectionLabel(result.reason));
      return;
    }
    setNotice(null);
    playNurseryCeremony({ kind: 'purchase', beforeStock }, 1040);
  };

  const handleCreateJob = (jobId: JobSlimeId) => {
    if (nurseryBusy) return;
    const jobView = createPanel.jobs.find((job) => job.id === jobId);
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
    const name = getSlimePresentation(created).name;
    if (!wasDiscovered) {
      const open = result.state.gameData.roster.formationSlots.findIndex((slot) => slot === null);
      if (open >= 0) controller.assignSlime(createdId, open);
    }
    setNotice(null);
    playNurseryCeremony({
      kind: 'job',
      beforeStock: createPanel.plainStock,
      jobName: name,
      jobId,
      ...(jobView === undefined ? {} : { jobIcon: `${import.meta.env.BASE_URL}${jobView.icon}` }),
    }, 1380, () => {
      onSelect(createdId);
      setCreateOpen(false);
      triggerFeedback(
        'recruit',
        `${name}が仲間になった！`,
        wasDiscovered ? '同じ職業の仲間が増えました' : '出撃編成に自動で加わりました',
      );
    });
  };

  if (mode === 'fusion' && selected !== null) {
    return (
      <Suspense fallback={<div className={styles.fusionLoading} aria-label="合成画面を読み込み中" />}>
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
    <section className={`screen screen--active ${styles.root}`} aria-label="キャンプ">
      <header className="camp-topbar">
        <div className="camp-resources"><span>G</span><strong>{validationMode ? '∞' : hud.gold}</strong></div>
        {showValidationTools && (
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

      {detail === null || selected === null ? (
        <div className="camp-empty-world">
          <Suspense fallback={<div className="camp-environment-stage" aria-hidden="true" />}>
            <CampEnvironmentStage reaction="idle" reactionKey={0} fusionReady={false} />
          </Suspense>
          <button type="button" onClick={() => setCreateOpen(true)}>
            <span>＋</span><strong>最初のスライムを生み出す</strong><small>素材は揃っています</small>
          </button>
        </div>
      ) : (
        <>
          <div className={`camp-world camp-world--${feedback.reaction}`}>
            <Suspense fallback={<div className="camp-environment-stage" aria-hidden="true" />}>
              <CampEnvironmentStage
                reaction={feedback.reaction}
                reactionKey={feedback.key}
                fusionReady={detail.fusionOptions.some((option) => option.canFuse)}
              />
            </Suspense>
            <CampStrengthenEffect ceremony={strengthenCeremony} />
            {feedback.reaction === 'recruit' && feedback.title !== '' && (
              <div className="camp-reward-ring" key={`ring-${feedback.key}`} aria-hidden="true" />
            )}
            <div className="camp-slime-stage">
              <Suspense fallback={<div className="camp-resident-stage" aria-hidden="true" />}>
                <CampSlimeStage
                  slimeId={detail.typeId}
                  fusionRank={detail.fusionRank}
                  reaction={feedback.reaction}
                  reactionKey={feedback.key}
                  reactionStrength={feedback.strength ?? 1}
                />
              </Suspense>
              {feedback.title !== '' && (
                <div className={`camp-action-feedback camp-action-feedback--${feedback.reaction}`} key={feedback.key}>
                  <strong>{feedback.title}</strong>
                  {feedback.detail !== undefined && <small>{feedback.detail}</small>}
                </div>
              )}
              <div className="camp-slime-name">
                <span>{detail.role}</span><strong>{detail.name}</strong><small>Lv.{strengthenCeremony?.phase === 'charging' ? strengthenCeremony.fromLevel : detail.level} · 合成ランク {detail.fusionRank}</small>
              </div>
            </div>
          </div>

          <div className={`camp-command-panel camp-command-panel--${mode}`}>
            <div className="camp-roster-block">
              <div className="camp-roster-title">
                <strong>仲間</strong>
                <span>{ownedIds.length}匹</span>
              </div>
              <div className="camp-roster" aria-label="仲間のスライム">
                {ownedIds.map((id) => {
                  const slime = state.gameData.roster.slimes[id]!;
                  const p = getSlimePresentation(slime);
                  return (
                    <button
                      key={id}
                      className={id === selected ? 'is-selected' : ''}
                      type="button"
                      aria-label={`${p.name} Lv.${strengthenCeremony?.phase === 'charging' && id === selected ? strengthenCeremony.fromLevel : slime.level}`}
                      disabled={campInteractionBusy}
                      onClick={() => {
                        onSelect(id);
                        setFeedback((current) => ({ key: current.key + 1, reaction: 'idle', title: '' }));
                      }}
                    >
                      <img src={`${import.meta.env.BASE_URL}${p.icon}`} alt="" />
                      <strong>{p.name.replace('スライム', '')}</strong>
                      <small>Lv.{strengthenCeremony?.phase === 'charging' && id === selected ? strengthenCeremony.fromLevel : slime.level}</small>
                    </button>
                  );
                })}
                <button className="camp-roster__add" type="button" disabled={campInteractionBusy} onClick={() => setCreateOpen(true)} aria-label="仲間を増やす">
                  <span>＋</span><strong>追加</strong>
                </button>
              </div>
            </div>

            {mode === 'none' && state.gameData.combat.retryFarmClearsRemaining > 0 && primaryUpgrade !== null && primaryUpgradeName !== null ? (
              <button
                className="camp-next-action"
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
            ) : mode === 'none' && cue !== null ? (
              <button className="camp-next-action" type="button" onClick={() => {
                if (cue.action === 'Battle') onOpenBattle();
                else if (cue.action === 'Fuse') setMode('fusion');
                else setCreateOpen(true);
              }}>
                <span>次にやること</span><strong>{cue.title}</strong><em>›</em>
              </button>
            ) : null}

            <div className="camp-primary-actions" aria-label="キャンプの操作">
              <button
                className={`camp-primary-action ${mode === 'train' ? 'is-active' : ''} ${state.gameData.combat.retryFarmClearsRemaining > 0 && selectedUpgrades.some((opportunity) => opportunity.kind === 'level') ? 'is-ready' : ''}`}
                type="button"
                disabled={campInteractionBusy}
                onClick={() => setMode(mode === 'train' ? 'none' : 'train')}
              >
                <span><CampStationIcon kind="train" /></span>
                <strong>強化</strong>
              </button>
              <button
                className={`camp-primary-action ${detail.fusionOptions.some((option) => option.canFuse) ? 'is-ready' : ''}`}
                type="button"
                disabled={campInteractionBusy}
                onClick={() => setMode('fusion')}
              >
                <span><CampStationIcon kind="fusion" /></span>
                <strong>合成</strong>
              </button>
              <button
                className={`camp-primary-action ${mode === 'formation' ? 'is-active' : ''}`}
                type="button"
                disabled={campInteractionBusy}
                onClick={() => setMode(mode === 'formation' ? 'none' : 'formation')}
              >
                <span><CampStationIcon kind="formation" /></span>
                <strong>編成</strong>
              </button>
              <button className="camp-primary-action" type="button" disabled={campInteractionBusy} onClick={() => setCreateOpen(true)}>
                <span><CampStationIcon kind="nursery" /></span>
                <strong>仲間</strong>
              </button>
            </div>

            {mode === 'train' && (
              <div className="camp-inline-tool">
                <div className="camp-inline-tool__heading">
                  <div>
                    <strong>{detail.name}を強化</strong>
                    <small>Lv.{strengthenCeremony?.phase === 'charging' ? strengthenCeremony.fromLevel : detail.level}</small>
                  </div>
                  <button type="button" disabled={campInteractionBusy} onClick={() => setMode('none')} aria-label="強化を閉じる">×</button>
                </div>
                <div className={`camp-level-buttons ${strengthenBusy ? 'is-busy' : ''}`}>
                  {([
                    ['one', '+1', detail.levelActions.one],
                    ['ten', '+10', detail.levelActions.ten],
                    ['max', '最大', detail.levelActions.max],
                  ] as const).map(([variant, label, action]) => {
                    const running = strengthenCeremony?.variant === variant;
                    return (
                      <button
                        key={variant}
                        className={running ? 'is-running' : ''}
                        type="button"
                        disabled={campInteractionBusy || action === null || !action.available}
                        onClick={() => {
                          if (action === null) return;
                          handleStrengthen(action, variant);
                        }}
                      >
                        <span>{running ? '強化中' : label}</span>
                        <strong>{running ? `-${strengthenCeremony.cost} G` : `${action?.cost ?? '—'} G`}</strong>
                        <em>{running ? `Lv.${strengthenCeremony.targetLevel}` : action === null ? '—' : `→ Lv.${action.targetLevel}`}</em>
                      </button>
                    );
                  })}
                </div>
                {showValidationTools && (
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
              </div>
            )}

            {mode === 'formation' && (
              <div className="camp-inline-tool">
                <CampFormationBoard
                  slots={formation}
                  selectedId={selected}
                  selectedName={detail.name}
                  selectedRole={detail.formationRole}
                  selectedAssignment={detail.assignment}
                  ceremony={formationCeremony}
                  disabled={formationBusy || detail.assignment === 'dispatch'}
                  onSlot={handleFormationSlot}
                  onReserve={handleFormationReserve}
                  onClose={() => setMode('none')}
                />
              </div>
            )}
          </div>
        </>
      )}

      {notice !== null && <button className={styles.toast} type="button" onClick={() => setNotice(null)}>{notice}</button>}

      <NurseryPanel
        open={createOpen}
        busy={nurseryBusy}
        ceremony={nurseryCeremony}
        validationMode={validationMode}
        panel={createPanel}
        onClose={() => { if (!nurseryBusy) setCreateOpen(false); }}
        onCraft={handleCraftPlain}
        onPurchase={handlePurchasePlain}
        onCreateJob={handleCreateJob}
      />

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
    case 'validation-mode-disabled': return '検証モードでのみ使えます';
    case 'job-create-failed': return '全職解放に失敗しました';
    case 'formation-failed': return '派遣中のスライムがいるため6職編成できません';
    default: return reason === undefined ? '実行できませんでした' : `実行できません: ${reason}`;
  }
}
