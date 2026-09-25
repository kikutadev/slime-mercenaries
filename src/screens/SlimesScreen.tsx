import { lazy, Suspense } from 'react';
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
import type { CampMode } from '../game/camp-types';
import { getSlimePresentation } from '../game/slimes';
import styles from './SlimesScreen.module.css';
import { campRejectionLabel } from './camp/rejection-label';
import { useCampInteractions } from './camp/useCampInteractions';

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
}

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
    : null;
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
        <CampEmptyWorld onCreate={() => setCreateOpen(true)} />
      ) : (
        <>
          <CampWorld
            feedback={feedback}
            hero={detail === null ? null : {
              presentation: detail.presentation,
              role: detail.role,
              name: detail.name,
              level: detail.level,
              fusionRank: detail.fusionRank,
            }}
            residents={campLifeResidents}
            fusionReady={detail?.fusionOptions.some((option) => option.canFuse) ?? false}
            strengthenCeremony={strengthenCeremony}
          />

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
      />

    </section>
  );
}
