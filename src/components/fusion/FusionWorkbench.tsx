import { useMemo } from 'react';
import { useGameState } from '../../app/GameProvider';
import { selectSlimeDetail } from '../../application/selectors/ui-selectors';
import { isNormalJobSlimeId, jobCreationDefinitions, type SlimeInstanceId } from '../../domain';
import { getSlimePresentation } from '../../game/slimes';
import { getNextFusionSteps } from '../../game/fusion';
import { getFusionIngredientPresentation, getFusionStepPresentation } from '../../game/fusion-presentation';
import { FusionStage } from './FusionStage';
import styles from './FusionWorkbench.module.css';
import { fusionDisplayFromRank } from './fusion-workbench-view';
import { useFusionWorkbenchInteraction } from './useFusionWorkbenchInteraction';

interface FusionWorkbenchProps {
  slimeId: SlimeInstanceId;
  onClose: () => void;
  onBattle: () => void;
  onRecruit: () => void;
  onReturnToCamp?: (resultName: string) => void;
}


export function FusionWorkbench({ slimeId, onClose, onBattle, onRecruit, onReturnToCamp }: FusionWorkbenchProps) {
  const state = useGameState();
  const detail = selectSlimeDetail(state, slimeId);
  const {
    controller,
    run,
    selectedStepId,
    setSelectedStepId,
    sequenceKey,
    completed,
    completedName,
    completedBehavior,
    notice,
    setNotice,
    beginFusion,
    completeFusion,
    convertDuplicate,
  } = useFusionWorkbenchInteraction();
  const validationMode = controller.validationMode;
  const progress = state.gameData.roster.slimes[slimeId] ?? null;
  const spareDuplicates = progress === null ? [] : Object.values(state.gameData.roster.slimes)
    .filter((candidate) => candidate.id !== slimeId && candidate.typeId === progress.typeId && candidate.assignment === 'reserve')
    .sort((left, right) => left.serial - right.serial);
  const fusionCoreTokenId = progress === null || !isNormalJobSlimeId(progress.typeId)
    ? null
    : jobCreationDefinitions[progress.typeId].fusionCoreTokenId;
  const displayFromRank = progress === null
    ? 1
    : fusionDisplayFromRank(progress.fusionRank, run?.fromRank ?? null, completed);

  const nextChoices = useMemo(() => (
    progress === null
      ? []
      : getNextFusionSteps({ ...progress, fusionRank: displayFromRank })
  ), [displayFromRank, progress]);

  const next = nextChoices.find((candidate) => candidate.id === selectedStepId) ?? nextChoices[0] ?? null;
  const selectedFusion = next === null
    ? null
    : detail?.fusionOptions.find((option) => option.id === next.id) ?? null;

  const currentPresentation = useMemo(() => {
    if (progress === null) return null;
    if (run === null) return getSlimePresentation(progress);
    return getSlimePresentation({
      ...progress,
      fusionRank: run.fromRank,
      fusionFormId: run.fromFusionFormId,
      jobTier: run.fromJobTier,
    });
  }, [progress, run]);

  const resultPresentation = useMemo(() => {
    if (progress === null || next === null) return null;
    return getSlimePresentation({
      ...progress,
      fusionRank: next.rank + 1,
      fusionFormId: next.resultFusionFormId,
      jobTier: next.resultJobTier,
    });
  }, [next, progress]);



  if (detail === null || progress === null) return null;

  if (
    next === null
    || currentPresentation === null
    || resultPresentation === null
    || (!completed && run === null && selectedFusion === null)
  ) {
    return (
      <div className={styles.workbench}>
        <button className={styles.close} type="button" onClick={onClose}>×</button>
        <div className={styles.completePanel}>
          <span>合成</span>
          <strong>現在の合成段階は上限です</strong>
          <button type="button" onClick={onClose}>キャンプへ戻る</button>
        </div>
      </div>
    );
  }

  const requirements = run?.requirements ?? selectedFusion?.requirements ?? [];
  const canFuse = selectedFusion?.canFuse ?? false;
  const levelMet = selectedFusion?.levelMet ?? true;
  const minLevel = selectedFusion?.minLevel ?? next.minLevel;
  const stepPresentation = getFusionStepPresentation(next.id);

  return (
    <div className={`${styles.workbench} ${run !== null ? styles.running : ''}`} aria-label="合成祭壇" aria-busy={run !== null}>
      <button className={styles.close} type="button" disabled={run !== null} onClick={onClose} aria-label="合成画面を閉じる">×</button>

      <div className={styles.header}>
        <span>合成ランク {displayFromRank} → {displayFromRank + 1}</span>
        <strong>{run?.fromName ?? (completed ? completedName ?? detail.name : detail.name)}</strong>
      </div>

      <div className={styles.stageArea}>
        <div className={`${styles.rune} ${styles.runeOuter}`} />
        <div className={`${styles.rune} ${styles.runeInner}`} />
        {run !== null && (
          <div className={styles.absorbLayer} key={`absorb-${sequenceKey}`} aria-hidden="true">
            {requirements.map((requirement) => {
              const meta = getFusionIngredientPresentation(requirement.tokenId);
              return (
                <span key={requirement.tokenId}>
                  <img src={`${import.meta.env.BASE_URL}${meta.asset}`} alt="" />
                </span>
              );
            })}
          </div>
        )}
        <FusionStage
          slimeId={progress.typeId}
          fusionRank={displayFromRank}
          fusionReady={!completed}
          isFusing={run !== null && !completed}
          sequenceKey={sequenceKey}
          fromRank={run?.fromRank ?? displayFromRank}
          toRank={run?.toRank ?? displayFromRank + 1}
          ceremony={stepPresentation.ceremony}
          currentPresentation={currentPresentation}
          resultPresentation={resultPresentation}
          onFusionComplete={completeFusion}
        />
        {!completed && run === null && (
          <div className={styles.stageCaption}>
            {stepPresentation.ceremony === 'major-form' ? `${detail.name} × 2` : '力を重ねて次の段階へ'}
          </div>
        )}
      </div>

      {!completed ? (
        <div className={styles.console}>
          {run === null && nextChoices.length > 1 && (
            <div className={styles.pathChoices} aria-label="合成先を選ぶ">
              <span>合成先を選択</span>
              <div>
                {nextChoices.map((choice) => (
                  <button
                    key={choice.id}
                    type="button"
                    className={choice.id === next.id ? styles.selected : ''}
                    aria-pressed={choice.id === next.id}
                    disabled={run !== null}
                    onClick={() => setSelectedStepId(choice.id)}
                  >
                    <strong>{choice.resultName}</strong>
                    <small>{choice.description}</small>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className={styles.resultTease}>
            <span>合成後</span>
            <strong>{next.resultName}</strong>
            <small>{stepPresentation.behaviorTitle}</small>
          </div>

          <div className={styles.recipe}>
            {requirements.map((requirement) => {
              const meta = getFusionIngredientPresentation(requirement.tokenId);
              return (
                <button
                  type="button"
                  className={`${styles.ingredient} ${requirement.missing === 0 ? styles.ready : styles.missing}`}
                  key={requirement.tokenId}
                  disabled={requirement.missing === 0}
                  onClick={() => {
                    if (requirement.missing === 0) return;
                    if (meta.route === 'recruit') onRecruit();
                    else onBattle();
                  }}
                >
                  <span className={`${styles.ingredientIcon} ${ingredientKindClass(meta.kind)}`} aria-hidden="true"><img src={`${import.meta.env.BASE_URL}${meta.asset}`} alt="" /></span>
                  <span><strong>{requirement.label}</strong><small>{validationMode ? '∞' : requirement.owned} / {requirement.required}</small></span>
                  <em className={requirement.missing === 0 ? styles.prepared : ''}>
                    {requirement.missing === 0 ? '準備OK' : `${meta.sourceLabel} ›`}
                  </em>
                </button>
              );
            })}
          </div>

          {fusionCoreTokenId !== null && requirements.some((requirement) => requirement.tokenId === fusionCoreTokenId && requirement.missing > 0) && spareDuplicates.length > 0 && (
            <div className={styles.spareList} aria-label="合成の核に変換する控えスライム">
              {spareDuplicates.map((candidate) => {
                const candidatePresentation = getSlimePresentation(candidate);
                return (
                  <button
                    className={styles.trigger}
                    type="button"
                    key={candidate.id}
                    onClick={() => convertDuplicate(candidate, candidatePresentation.name)}
                  >
                    <span>余剰個体 · Lv.{candidate.level}</span>
                    <strong>{candidatePresentation.name} #{candidate.serial} を核にする</strong>
                  </button>
                );
              })}
            </div>
          )}

          {run === null && !levelMet && (
            <div className={styles.levelLock}>Lv.{minLevel}で合成陣が安定します。現在 Lv.{detail.level}</div>
          )}

          <button
            className={`${styles.trigger} ${canFuse ? styles.ready : ''}`}
            type="button"
            aria-busy={run !== null}
            disabled={!canFuse || run !== null}
            onClick={() => beginFusion({
              slimeId,
              canFuse,
              next,
              progress,
              fromName: detail.name,
              requirements: selectedFusion?.requirements ?? [],
              behaviorTitle: stepPresentation.behaviorTitle,
              resultPresentation,
            })}
          >
            <span>{canFuse ? `合成ランク ${displayFromRank + 1}` : '素材不足'}</span>
            <strong>{run !== null ? '合成中…' : canFuse ? `${next.resultName}へ合成` : '素材が足りません'}</strong>
          </button>
        </div>
      ) : (
        <div className={styles.completePanel}>
          <span>合成完了</span>
          <strong>{completedName ?? resultPresentation.name}</strong>
          <div className={styles.unlockBadge}>新攻撃 · {completedBehavior ?? '新しい戦闘挙動'}</div>
          <div className={styles.resultActions}>
            <button type="button" onClick={() => {
              const name = completedName ?? resultPresentation.name;
              if (onReturnToCamp !== undefined) onReturnToCamp(name);
              else onClose();
            }}>キャンプで見る</button>
            <button className={styles.primary} type="button" onClick={onBattle}>戦闘で試す</button>
          </div>
        </div>
      )}

      {notice !== null && <button className={styles.toast} type="button" onClick={() => setNotice(null)}>{notice}</button>}
    </div>
  );
}

function ingredientKindClass(kind: string): string {
  switch (kind) {
    case 'weapon': return styles.weapon;
    case 'steel': return styles.steel;
    case 'gel': return styles.gel;
    default: return '';
  }
}
