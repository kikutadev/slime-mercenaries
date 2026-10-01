import { lazy, Suspense, useEffect } from 'react';
import { useGameController, useGameState } from '../app/GameProvider';
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
import { CampManagementPanel } from '../components/CampManagementPanel';
import { CampEmptyWorld } from '../components/CampEmptyWorld';
import { CampWorld } from '../components/CampWorld';
import { CodexSheet } from '../components/CodexSheet';
import { NurseryPanel } from '../components/NurseryPanel';
import type { SlimeInstanceId } from '../domain';
import { selectCampLifeResidents } from '../game/camp-life-residents';
import { campTemperamentForInstance, type CampTemperament } from '../game/camp-temperament';
import type { CampMode } from '../game/camp-types';
import { getSlimePresentation } from '../game/slimes';
import styles from './SlimesScreen.module.css';
import { campRejectionLabel } from './camp/rejection-label';
import { useCampInteractions } from './camp/useCampInteractions';

const CampSwordTrialStage = lazy(async () => {
  const module = await import('../components/CampSwordTrialStage');
  return { default: module.CampSwordTrialStage };
});

const FusionWorkbench = lazy(async () => {
  const module = await import('../components/fusion/FusionWorkbench');
  return { default: module.FusionWorkbench };
});

interface Props {
  selectedId: SlimeInstanceId | null;
  onSelect: (id: SlimeInstanceId | null) => void;
  onOpenBattle: () => void;
  onOpenForge: () => void;
  entryMode: CampMode;
  entryRevision: number;
  defeatRecoveryActive: boolean;
}

export function SlimesScreen({
  selectedId,
  onSelect,
  onOpenBattle,
  onOpenForge,
  entryMode,
  entryRevision,
  defeatRecoveryActive,
}: Props) {
  const state = useGameState();
  const controller = useGameController();
  const hud = selectGlobalHud(state);
  const validationMode = controller.validationMode;
  const showValidationTools = validationMode && validationToolsVisible();
  const ownedIds = selectOwnedSlimeIds(state);
  const selected = selectedId !== null && state.gameData.roster.slimes[selectedId] !== undefined
    ? selectedId
    : null;
  const detail = selected === null ? null : selectSlimeDetail(state, selected);
  const selectedTemperament = selected === null ? null : campTemperamentForInstance(selected);
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

  useEffect(() => {
    if (cue?.speakerSlimeId === undefined || selected !== null) return;
    if (state.gameData.roster.slimes[cue.speakerSlimeId] === undefined) return;
    onSelect(cue.speakerSlimeId);
  }, [cue?.id, cue?.speakerSlimeId, onSelect, selected, state.gameData.roster.slimes]);

  const openCueAction = () => {
    if (cue === null) return;
    if (cue.speakerSlimeId !== undefined) onSelect(cue.speakerSlimeId);
    if (cue.action === 'Battle') {
      onOpenBattle();
      return;
    }
    if (cue.action === 'Fuse') {
      setCommandPanelOpen(true);
      setMode('fusion');
      return;
    }
    setCreateOpen(true);
  };

  const {
    mode,
    setMode,
    commandPanelOpen,
    setCommandPanelOpen,
    createOpen,
    setCreateOpen,
    codexOpen,
    setCodexOpen,
    notice,
    setNotice,
    feedback,
    setFeedback,
    nurseryCeremony,
    strengthenCeremony,
    formationCeremony,
    nurseryBusy,
    strengthenBusy,
    formationBusy,
    campInteractionBusy,
    triggerFeedback,
    handleEquipWeapon,
    handleMutation,
    handleFormationSlot,
    handleFormationReserve,
    handleStrengthen,
    handleCraftPlain,
    handlePurchasePlain,
    handleCaptureMimic,
    handleCreateJob,
  } = useCampInteractions({
    state,
    selected,
    detail,
    weaponView,
    formation,
    createPanel,
    entryMode,
    entryRevision,
    onSelect,
  });

  const focusSelectedInCamp = selected !== null
    || commandPanelOpen
    || cue?.id === 'strengthen-first-sword'
    || feedback.title !== ''
    || strengthenCeremony !== null;
  const campLifeResidents = selectCampLifeResidents(
    state,
    focusSelectedInCamp ? selected : null,
    6,
  );
  const campFeedback = feedback.reaction === 'idle'
    && (defeatRecoveryActive || state.gameData.combat.retryFarmClearsRemaining > 0)
    ? { ...feedback, reaction: 'retreat' as const }
    : feedback;


  if (mode === 'fusion' && selected !== null) {
    return (
      <Suspense fallback={<div className={styles.fusionLoading} aria-label="合成画面を読み込み中" />}>
        <FusionWorkbench
          slimeId={selected}
          onClose={() => setMode('none')}
          onBattle={onOpenBattle}
          onRecruit={() => { setMode('none'); setCreateOpen(true); }}
          onReturnToCamp={(resultName) => {
            setMode('none');
            setCommandPanelOpen(false);
            triggerFeedback('fusion', '合成完了', `${resultName}の力に周囲が反応しています`, 3);
          }}
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
              if (!result.accepted) { setNotice(campRejectionLabel(result.reason)); return; }
            }}
          >
            検証 · 全6職編成
          </button>
        )}
      </header>

      {ownedIds.length === 0 ? (
        <CampEmptyWorld
          cueId={createOpen && nurseryCeremony?.kind === 'craft' ? 'create-first-plain' : cue?.id ?? null}
          onCreate={() => setCreateOpen(true)}
          onPlainTrialComplete={() => controller.completeFirstPlainTrial()}
        />
      ) : (
        <>
          <CampWorld
            feedback={campFeedback}
            hero={createOpen || cue?.id === 'try-first-sword' || detail === null || selectedTemperament === null || !focusSelectedInCamp ? null : {
              presentation: detail.presentation,
              role: detail.role,
              name: detail.name,
              level: detail.level,
              fusionRank: detail.fusionRank,
              temperament: selectedTemperament,
            }}
            residents={createOpen ? [] : campLifeResidents}
            fusionReady={detail?.fusionOptions.some((option) => option.canFuse) ?? false}
            strengthenCeremony={strengthenCeremony}
            speech={cue?.id === 'try-first-sword'
              ? undefined
              : cue?.speakerSlimeId === selected
                ? cue.speech
                : selectedTemperament !== null && cue === null && !commandPanelOpen
                  ? campTemperamentTapLine(selectedTemperament)
                  : undefined}
            onResidentSelect={cue === null && !commandPanelOpen ? onSelect : undefined}
          />

          {cue?.id === 'try-first-sword' && !createOpen && !commandPanelOpen && (
            <Suspense fallback={null}>
              <CampSwordTrialStage onComplete={() => controller.completeFirstSwordTrial()} />
            </Suspense>
          )}

          {cue !== null && cue.id !== 'try-first-sword' && !createOpen && !commandPanelOpen && (
            <div className={`camp-onboarding-card ${cue.action === 'Battle' ? 'camp-onboarding-card--character' : ''}`} role="status" aria-live="polite">
              <span>はじめてガイド</span>
              <strong>{cue.title}</strong>
              <small>{cue.body}</small>
              <button type="button" onClick={openCueAction}>
                {cue.action === 'Battle' ? '戦闘へ' : cue.action === 'Fuse' ? '合成を見る' : '生成槽へ'}
              </button>
            </div>
          )}

          {!commandPanelOpen || detail === null || selected === null ? (
            <button
              className="camp-command-launcher"
              type="button"
              aria-expanded="false"
              aria-controls="camp-command-panel"
              onClick={() => {
                if (selected === null) onSelect(ownedIds[0] ?? null);
                setCommandPanelOpen(true);
              }}
            >
              <span>管理</span>
              <strong>仲間・育成</strong>
              <em>{ownedIds.length}</em>
            </button>
          ) : (
          <CampManagementPanel
            model={{
              mode,
              busy: campInteractionBusy,
              roster: state.gameData.roster.slimes,
              ownedIds,
              selected,
              detail,
              codexNewCount: codexSummary.newCount,
              retryFarmClearsRemaining: state.gameData.combat.retryFarmClearsRemaining,
              primaryUpgrade,
              primaryUpgradeName,
              primaryMutation,
              primaryMutationName,
              cue,
              selectedUpgrades,
              weaponView,
              mutationRelevant,
              mutationReady,
              strengthenCeremony,
              strengthenBusy,
              formation,
              formationCeremony,
              formationBusy,
              showValidationTools,
            }}
            actions={{
              setMode,
              closeManagement: () => {
                setMode('none');
                setCommandPanelOpen(false);
                onSelect(null);
              },
              openCodex: () => setCodexOpen(true),
              openCreate: () => setCreateOpen(true),
              openBattle: onOpenBattle,
              openForge: onOpenForge,
              selectSlime: onSelect,
              resetFeedback: () => {
                setFeedback((current) => ({ key: current.key + 1, reaction: 'idle', title: '' }));
              },
              equipWeapon: handleEquipWeapon,
              mutate: handleMutation,
              strengthen: handleStrengthen,
              validationSetLevel40: () => {
                const result = controller.validationSetSlimeLevel(selected, 40);
                setNotice(result.accepted ? 'Lv.40に設定しました' : campRejectionLabel(result.reason));
              },
              validationReset: () => {
                const result = controller.validationResetSlime(selected);
                if (!result.accepted) {
                  setNotice(campRejectionLabel(result.reason));
                  return;
                }
                setNotice('Tier1・合成ランク1へ戻しました');
                triggerFeedback('idle', '');
              },
              formationSlot: handleFormationSlot,
              formationReserve: handleFormationReserve,
            }}
          />
          )}
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
        tutorialCue={cue}
      />

    </section>
  );
}

function campTemperamentTapLine(temperament: CampTemperament): string {
  switch (temperament) {
    case 'eager': return 'もう一回、やる。';
    case 'sleepy': return '……ちょっと、ねむい。';
    case 'social': return 'いた。';
    case 'curious': return 'あれ、なに？';
  }
}
