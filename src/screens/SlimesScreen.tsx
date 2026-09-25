import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { useGameController, useGameState } from '../app/GameProvider';
import { useManagedTimeouts } from '../app/useManagedTimeouts';
import { validationToolsVisible } from '../application/validation-mode';
import {
  selectCampUpgradeOpportunities,
  selectCodexSummary,
  selectCreateSlimePanel,
  selectEarlyGameCue,
  selectFormation,
  selectGlobalHud,
  selectOwnedSlimeIds,
  selectSlimeDetail,
  selectSlimeWeaponOptions,
} from '../application/selectors/ui-selectors';
import type { CampSlimeReaction } from '../components/CampSlimeStage';
import { CampStrengthenEffect, type StrengthenCeremony, type StrengthenVariant } from '../components/CampStrengthenEffect';
import { CampFormationBoard, type CampFormationCeremony } from '../components/CampFormationBoard';
import { CampStationIcon } from '../components/CampStationIcon';
import type { NurseryCeremony } from '../components/NurseryCeremonyStage';
import { CodexSheet } from '../components/CodexSheet';
import { NurseryPanel } from '../components/NurseryPanel';
import { sameTypeCount, slimeInstanceIdForSerial, type JobSlimeId, type SlimeInstanceId, type SlimeMutationId } from '../domain';
import { selectCampLifeResidents } from '../game/camp-life-residents';
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
  onOpenForge: () => void;
  entryMode: CampMode;
  entryRevision: number;
}

export type CampMode = 'none' | 'train' | 'formation' | 'fusion' | 'mutation' | 'equipment';

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

export function SlimesScreen({
  selectedId,
  onSelect,
  onOpenBattle,
  onOpenForge,
  entryMode,
  entryRevision,
}: Props) {
  const state = useGameState();
  const controller = useGameController();
  const hud = selectGlobalHud(state);
  const validationMode = controller.validationMode;
  const showValidationTools = validationMode && validationToolsVisible();
  const ownedIds = selectOwnedSlimeIds(state);
  const selected = selectedId !== null && state.gameData.roster.slimes[selectedId] !== undefined
    ? selectedId
    : ownedIds[0] ?? null;
  const detail = selected === null ? null : selectSlimeDetail(state, selected);
  const campLifeResidents = selectCampLifeResidents(state, selected, 4);
  const weaponView = selected === null ? { current: null, options: [] } : selectSlimeWeaponOptions(state, selected);
  const formation = selectFormation(state);
  const createPanel = selectCreateSlimePanel(state);
  const codexSummary = selectCodexSummary(state);
  const upgradeOpportunities = selectCampUpgradeOpportunities(state);
  const selectedUpgrades = selected === null
    ? []
    : upgradeOpportunities.filter((opportunity) => opportunity.slimeId === selected);
  const primaryUpgrade = upgradeOpportunities[0] ?? null;
  const primaryUpgradeName = primaryUpgrade === null
    ? null
    : getSlimePresentation(state.gameData.roster.slimes[primaryUpgrade.slimeId]!).name;
  const primaryMutation = upgradeOpportunities.find((opportunity) => opportunity.kind === 'mutation') ?? null;
  const primaryMutationName = primaryMutation === null
    ? null
    : getSlimePresentation(state.gameData.roster.slimes[primaryMutation.slimeId]!).name;
  const cue = selectEarlyGameCue(state);
  const mutationRelevant = detail?.mutationOptions.some((option) =>
    option.eligible || option.fragments > 0 || option.catalysts > 0 || option.alreadyMutated) ?? false;
  const mutationReady = detail?.mutationOptions.some((option) => option.canMutate) ?? false;
  const [mode, setMode] = useState<CampMode>('none');
  const [createOpen, setCreateOpen] = useState(false);
  const [codexOpen, setCodexOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<CampFeedback>({ key: 0, reaction: 'idle', title: '' });
  const [nurseryCeremony, setNurseryCeremony] = useState<NurseryCeremony | null>(null);
  const [strengthenCeremony, setStrengthenCeremony] = useState<StrengthenCeremony | null>(null);
  const [formationCeremony, setFormationCeremony] = useState<CampFormationCeremony | null>(null);

  useEffect(() => {
    setMode(entryMode);
  }, [entryMode, entryRevision]);
  const nurseryCeremonyKey = useRef(0);
  const nurseryCommitLockRef = useRef(false);
  const strengthenCeremonyKey = useRef(0);
  const strengthenCommitLockRef = useRef(false);
  const formationCeremonyKey = useRef(0);
  const formationCommitLockRef = useRef(false);
  const { schedule } = useManagedTimeouts();
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
    const durationMs = ceremony.kind === 'swap'
      ? 380
      : ceremony.kind === 'replace'
        ? 400
        : 320;
    schedule(() => {
      formationCommitLockRef.current = false;
      setFormationCeremony((current) => current?.key === key ? null : current);
      triggerFeedback('formation', title, detailText);
    }, durationMs);
  };

  const handleEquipWeapon = (weaponDefinitionId: string) => {
    if (selected === null || detail === null || campInteractionBusy) return;
    const option = weaponView.options.find((candidate) => candidate.id === weaponDefinitionId);
    if (option === undefined || option.equipped) return;
    const result = controller.equipWeapon(selected, weaponDefinitionId);
    if (!result.accepted) {
      setNotice(rejectionLabel(result.reason));
      return;
    }
    setNotice(null);
    triggerFeedback(
      'formation',
      `${option.name}を装備`,
      option.equippedByName === null ? '戦闘力に反映されました' : `${option.equippedByName}から移し替えました`,
    );
  };

  const handleMutation = (mutationId: SlimeMutationId) => {
    if (selected === null || detail === null || campInteractionBusy) return;
    const option = detail.mutationOptions.find((candidate) => candidate.id === mutationId);
    if (option === undefined || !option.canMutate) return;
    const result = controller.mutateSlime(selected, mutationId);
    if (!result.accepted) {
      setNotice(rejectionLabel(result.reason));
      return;
    }
    setNotice(null);
    setMode('none');
    triggerFeedback('recruit', option.displayName, option.identity, 3);
  };

  const handleFormationSlot = (slotIndex: number) => {
    if (selected === null || detail === null || formationBusy || formationCommitLockRef.current || detail.assignment === 'dispatch') return;
    const fromSlot = formation.find((slot) => slot.slimeId === selected)?.slotIndex ?? null;
    const target = formation[slotIndex];
    if (target === undefined || target.slimeId === selected) return;

    formationCommitLockRef.current = true;
    const result = controller.assignSlime(selected, slotIndex);
    if (!result.accepted) {
      formationCommitLockRef.current = false;
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
    if (selected === null || detail === null || formationBusy || formationCommitLockRef.current) return;
    const fromSlot = formation.find((slot) => slot.slimeId === selected)?.slotIndex ?? null;
    if (fromSlot === null) return;

    formationCommitLockRef.current = true;
    const result = controller.removeSlime(fromSlot);
    if (!result.accepted) {
      formationCommitLockRef.current = false;
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
    if (selected === null || detail === null || strengthenCeremony?.phase === 'charging' || strengthenCommitLockRef.current) return;
    strengthenCommitLockRef.current = true;
    const result = controller.levelUpSlime(selected, action.count);
    if (!result.accepted) {
      strengthenCommitLockRef.current = false;
      setNotice(rejectionLabel(result.reason));
      return;
    }

    setNotice(null);
    const key = ++strengthenCeremonyKey.current;
    const strength: 1 | 2 | 3 = variant === 'one' ? 1 : variant === 'ten' ? 2 : 3;
    const chargeMs = variant === 'one' ? 200 : variant === 'ten' ? 280 : 360;
    const settleMs = variant === 'one' ? 480 : variant === 'ten' ? 560 : 650;
    setStrengthenCeremony({
      key,
      phase: 'charging',
      variant,
      fromLevel: detail.level,
      targetLevel: action.targetLevel,
      cost: action.cost,
    });

    schedule(() => {
      setStrengthenCeremony((current) => current?.key === key
        ? { ...current, phase: 'result' }
        : current);
      triggerFeedback('level-up', `Lv.${action.targetLevel}`, `-${action.cost} G`, strength);

      schedule(() => {
        strengthenCommitLockRef.current = false;
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
    schedule(() => {
      nurseryCommitLockRef.current = false;
      setNurseryCeremony((active) => active?.key === key ? null : active);
      onComplete?.();
    }, durationMs);
  };

  const handleCraftPlain = () => {
    if (nurseryBusy || nurseryCommitLockRef.current) return;
    nurseryCommitLockRef.current = true;
    const beforeStock = createPanel.plainStock;
    const result = controller.craftPlainSlime(1);
    if (!result.accepted) {
      nurseryCommitLockRef.current = false;
      setNotice(rejectionLabel(result.reason));
      return;
    }
    setNotice(null);
    playNurseryCeremony({ kind: 'craft', beforeStock }, 1280);
  };

  const handlePurchasePlain = () => {
    if (nurseryBusy || nurseryCommitLockRef.current) return;
    nurseryCommitLockRef.current = true;
    const beforeStock = createPanel.plainStock;
    const result = controller.buyPlainSlime(1);
    if (!result.accepted) {
      nurseryCommitLockRef.current = false;
      setNotice(rejectionLabel(result.reason));
      return;
    }
    setNotice(null);
    playNurseryCeremony({ kind: 'purchase', beforeStock }, 1040);
  };

  const handleCaptureMimic = () => {
    if (nurseryBusy || nurseryCommitLockRef.current) return;
    nurseryCommitLockRef.current = true;
    const nextSerial = state.gameData.roster.nextSlimeSerial;
    const result = controller.captureMimic();
    if (!result.accepted) {
      nurseryCommitLockRef.current = false;
      setNotice(rejectionLabel(result.reason));
      return;
    }
    const capturedId = slimeInstanceIdForSerial(nextSerial);
    const captured = result.state.gameData.roster.slimes[capturedId];
    if (captured === undefined) {
      nurseryCommitLockRef.current = false;
      setNotice('捕獲したミミックを確認できませんでした');
      return;
    }
    const open = result.state.gameData.roster.formationSlots.findIndex((slot) => slot === null);
    if (open >= 0) controller.assignSlime(capturedId, open);
    const name = getSlimePresentation(captured).name;
    setNotice(null);
    onSelect(capturedId);
    setCreateOpen(false);
    triggerFeedback('recruit', `${name}が仲間になった！`, '宝箱のふりをやめ、傭兵団についてきました', 3);
    schedule(() => { nurseryCommitLockRef.current = false; }, 320);
  };

  const handleCreateJob = (jobId: JobSlimeId) => {
    if (nurseryBusy || nurseryCommitLockRef.current) return;
    nurseryCommitLockRef.current = true;
    const wasDiscovered = sameTypeCount(state, jobId) > 0;
    const result = controller.createJobSlime(jobId);
    if (!result.accepted) {
      nurseryCommitLockRef.current = false;
      setNotice(rejectionLabel(result.reason));
      return;
    }
    const createdId = slimeInstanceIdForSerial(result.state.gameData.roster.nextSlimeSerial - 1);
    const created = result.state.gameData.roster.slimes[createdId];
    if (created === undefined) {
      nurseryCommitLockRef.current = false;
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
            <CampEnvironmentStage reaction="idle" reactionKey={0} fusionReady={false} residents={[]} />
          </Suspense>
          <button type="button" onClick={() => setCreateOpen(true)}>
            <span aria-hidden="true"><CampStationIcon kind="nursery" /></span>
            <strong>最初のスライムを生み出す</strong>
            <small>生成槽で仲間を迎える</small>
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
                residents={campLifeResidents}
              />
            </Suspense>
            <CampStrengthenEffect ceremony={strengthenCeremony} />
            {feedback.reaction === 'recruit' && feedback.title !== '' && (
              <div className="camp-reward-ring" key={`ring-${feedback.key}`} aria-hidden="true" />
            )}
            <div className="camp-slime-stage">
              <Suspense fallback={<div className="camp-resident-stage" aria-hidden="true" />}>
                <CampSlimeStage
                  presentation={detail.presentation}
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

          <div className={`camp-command-panel camp-command-panel--${mode}`} aria-busy={campInteractionBusy}>
            <div className="camp-roster-block">
              <div className="camp-roster-title">
                <strong>仲間</strong>
                <div className="camp-roster-meta">
                  <span>{ownedIds.length}匹</span>
                  <button
                    type="button"
                    className={codexSummary.newCount > 0 ? 'is-new' : ''}
                    disabled={campInteractionBusy}
                    onClick={() => setCodexOpen(true)}
                    aria-haspopup="dialog"
                  >
                    図鑑
                    {codexSummary.newCount > 0 && <em>{codexSummary.newCount}</em>}
                  </button>
                </div>
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
                      aria-pressed={id === selected}
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
                  <span aria-hidden="true"><CampStationIcon kind="nursery" /></span><strong>追加</strong>
                </button>
              </div>
            </div>

            {mode === 'none' && state.gameData.combat.retryFarmClearsRemaining > 0 && primaryUpgrade !== null && primaryUpgradeName !== null ? (
              <button
                className="camp-next-action"
                type="button"
                onClick={() => {
                  onSelect(primaryUpgrade.slimeId);
                  setMode(primaryUpgrade.kind === 'mutation' ? 'mutation' : primaryUpgrade.kind === 'fusion' ? 'fusion' : 'train');
                }}
              >
                <span>再出撃準備</span>
                <strong>{primaryUpgradeName} · {primaryUpgrade.label}</strong>
                <em>›</em>
              </button>
            ) : mode === 'none' && primaryMutation !== null && primaryMutationName !== null ? (
              <button className="camp-next-action" type="button" onClick={() => {
                onSelect(primaryMutation.slimeId);
                setMode('mutation');
              }}>
                <span>レア変異</span><strong>{primaryMutationName} · {primaryMutation.label}</strong><em>›</em>
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
                aria-pressed={mode === 'train'}
                disabled={campInteractionBusy}
                onClick={() => setMode(mode === 'train' ? 'none' : 'train')}
              >
                <span><CampStationIcon kind="train" /></span>
                <strong>強化</strong>
              </button>
              <button
                className={`camp-primary-action ${detail.fusionOptions.some((option) => option.canFuse) ? 'is-ready' : ''}`}
                type="button"
                aria-pressed={mode === 'fusion'}
                disabled={campInteractionBusy}
                onClick={() => setMode('fusion')}
              >
                <span><CampStationIcon kind="fusion" /></span>
                <strong>合成</strong>
              </button>
              <button
                className={`camp-primary-action ${mode === 'formation' ? 'is-active' : ''}`}
                type="button"
                aria-pressed={mode === 'formation'}
                disabled={campInteractionBusy}
                onClick={() => setMode(mode === 'formation' ? 'none' : 'formation')}
              >
                <span><CampStationIcon kind="formation" /></span>
                <strong>編成</strong>
              </button>
              <button className="camp-primary-action" type="button" aria-haspopup="dialog" disabled={campInteractionBusy} onClick={() => setCreateOpen(true)}>
                <span><CampStationIcon kind="nursery" /></span>
                <strong>仲間</strong>
              </button>
            </div>

            {detail.typeId !== 'mimic' && (mode === 'none' || mode === 'equipment') && (
              <button
                className={`camp-equipment-entry ${mode === 'equipment' ? 'is-active' : ''}`}
                type="button"
                aria-pressed={mode === 'equipment'}
                disabled={campInteractionBusy}
                onClick={() => setMode(mode === 'equipment' ? 'none' : 'equipment')}
              >
                <div>
                  <span>装備</span>
                  <strong>{weaponView.current?.name ?? '未装備'}</strong>
                </div>
                <small>{weaponView.options.length > 0 ? `${weaponView.options.length}本から選ぶ` : '鍛造で武器を入手'}</small>
                <em>›</em>
              </button>
            )}

            {mutationRelevant && mode === 'none' && (
              <button
                className={`camp-mutation-entry ${mutationReady ? 'is-ready' : ''}`}
                type="button"
                onClick={() => setMode('mutation')}
              >
                <span>✦</span>
                <div>
                  <strong>{detail.mutationId === null ? 'レア変異' : detail.name}</strong>
                  <small>
                    {detail.mutationId !== null
                      ? 'この個体は変異済みです'
                      : mutationReady
                        ? '変異核が反応しています'
                        : '欠片を集めると変異核になります'}
                  </small>
                </div>
                <em>›</em>
              </button>
            )}

            {mode === 'equipment' && (
              <div className="camp-inline-tool camp-equipment-tool">
                <div className="camp-inline-tool__heading">
                  <div>
                    <strong>{detail.name}の装備</strong>
                    <small>{weaponView.current === null ? '武器を選ぶと戦闘力へ反映されます' : `現在: ${weaponView.current.name}`}</small>
                  </div>
                  <button type="button" onClick={() => setMode('none')} aria-label="装備を閉じる">×</button>
                </div>
                {weaponView.options.length === 0 ? (
                  <div className="camp-equipment-empty">
                    <span>この職業の武器をまだ持っていません</span>
                    <button type="button" onClick={onOpenForge}>鍛造へ</button>
                  </div>
                ) : (
                  <div className="camp-weapon-strip" aria-label="装備できる武器">
                    {weaponView.options.map((weapon) => (
                      <button
                        key={weapon.instanceId}
                        type="button"
                        className={weapon.equipped ? 'is-equipped' : ''}
                        aria-pressed={weapon.equipped}
                        disabled={weapon.equipped || campInteractionBusy}
                        onClick={() => handleEquipWeapon(weapon.id)}
                      >
                        <span className={`camp-weapon-rarity camp-weapon-rarity--${weapon.rarity}`}>
                          {weapon.rarity === 'mythic' ? '神話' : weapon.rarity === 'rare' ? '希少' : '一般'}
                        </span>
                        <strong>{weapon.name}</strong>
                        <small>攻撃 ×{weapon.effectiveMultiplier.toFixed(2)} · +{weapon.refinementRank}</small>
                        <em>
                          {weapon.equipped
                            ? '装備中'
                            : weapon.equippedByName === null
                              ? '装備する'
                              : `${weapon.equippedByName}から移す`}
                        </em>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {mode === 'mutation' && (
              <div className="camp-inline-tool camp-mutation-tool">
                <div className="camp-inline-tool__heading">
                  <div>
                    <strong>レア変異</strong>
                    <small>職業はそのまま。特殊な性質だけを重ねます</small>
                  </div>
                  <button type="button" onClick={() => setMode('none')} aria-label="レア変異を閉じる">×</button>
                </div>
                <div className="camp-mutation-options">
                  {detail.mutationOptions
                    .filter((option) => option.eligible || option.fragments > 0 || option.catalysts > 0 || option.alreadyMutated)
                    .map((option) => (
                      <button
                        key={option.id}
                        className={`${option.canMutate ? 'is-ready' : ''} ${detail.mutationId === option.id ? 'is-current' : ''}`}
                        type="button"
                        disabled={!option.canMutate}
                        onClick={() => handleMutation(option.id)}
                      >
                        <div>
                          <strong>{option.displayName}</strong>
                          <small>{option.identity}</small>
                        </div>
                        <span>
                          {detail.mutationId === option.id
                            ? '変異済み'
                            : option.catalysts > 0
                              ? option.eligible ? `変異核 ×${option.catalysts}` : 'この形態は対象外'
                              : `${option.fragmentName} ${option.fragments}/${option.fragmentThreshold}`}
                        </span>
                      </button>
                    ))}
                </div>
              </div>
            )}

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
                        aria-busy={running}
                        disabled={formationBusy || strengthenCeremony?.phase === 'charging' || action === null || !action.available}
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

      {codexOpen && <CodexSheet onClose={() => setCodexOpen(false)} />}

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
        onCaptureMimic={handleCaptureMimic}
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
    case 'wrong-family': return 'この職業では装備できない武器です';
    case 'already-mutated': return 'この個体はすでに変異しています';
    case 'not-eligible': return 'この形態では選べない変異です';
    case 'missing-catalyst': return '変異核がありません';
    case 'validation-mode-disabled': return '検証モードでのみ使えます';
    case 'job-create-failed': return '全職解放に失敗しました';
    case 'formation-failed': return '派遣中のスライムがいるため6職編成できません';
    case 'missing-heart': return 'ミミックハートがありません';
    case 'already-owned': return 'ミミックスライムはすでに仲間です';
    case 'special-slime': return '特殊個体は合成素材にできません';
    default: return reason === undefined ? '実行できませんでした' : `実行できません: ${reason}`;
  }
}