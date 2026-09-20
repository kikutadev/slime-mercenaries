import { useMemo, useState } from 'react';
import { useGameController, useGameState } from '../../app/GameProvider';
import { selectSlimeDetail } from '../../application/selectors/ui-selectors';
import { jobCreationDefinitions, type SlimeInstanceId } from '../../domain';
import { getSlimePresentation } from '../../game/slimes';
import { getNextFusionSteps } from '../../game/fusion';
import { getFusionIngredientPresentation, getFusionStepPresentation } from '../../game/fusion-presentation';
import { FusionStage } from './FusionStage';
import styles from './FusionWorkbench.module.css';

interface FusionWorkbenchProps {
  slimeId: SlimeInstanceId;
  onClose: () => void;
  onBattle: () => void;
  onRecruit: () => void;
}

type FusionRunRequirement = Readonly<{
  tokenId: string;
  label: string;
  owned: number;
  required: number;
  missing: number;
}>;

type FusionRun = Readonly<{
  stepId: string;
  fromRank: number;
  toRank: number;
  fromName: string;
  fromFusionFormId: string;
  fromJobTier: number;
  requirements: readonly FusionRunRequirement[];
}>;

export function FusionWorkbench({ slimeId, onClose, onBattle, onRecruit }: FusionWorkbenchProps) {
  const state = useGameState();
  const controller = useGameController();
  const detail = selectSlimeDetail(state, slimeId);
  const validationMode = controller.validationMode;
  const progress = state.gameData.roster.slimes[slimeId] ?? null;
  const spareDuplicates = progress === null ? [] : Object.values(state.gameData.roster.slimes)
    .filter((candidate) => candidate.id !== slimeId && candidate.typeId === progress.typeId && candidate.assignment === 'reserve')
    .sort((left, right) => left.serial - right.serial);
  const fusionCoreTokenId = progress === null ? null : jobCreationDefinitions[progress.typeId].fusionCoreTokenId;
  const [run, setRun] = useState<FusionRun | null>(null);
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const [sequenceKey, setSequenceKey] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [completedName, setCompletedName] = useState<string | null>(null);
  const [completedDescription, setCompletedDescription] = useState<string | null>(null);
  const [completedBehavior, setCompletedBehavior] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const displayFromRank = progress === null
    ? 1
    : run?.fromRank ?? (completed ? Math.max(1, progress.fusionRank - 1) : progress.fusionRank);

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

  const beginFusion = () => {
    if (!canFuse || run !== null) return;
    const stepPresentation = getFusionStepPresentation(next.id);
    const result = controller.fuseSlime(slimeId, next.id);
    if (!result.accepted) {
      setNotice(rejectionLabel(result.reason));
      return;
    }

    setCompletedName(next.resultName);
    setCompletedDescription(next.description);
    setCompletedBehavior(stepPresentation.behaviorTitle);
    setSequenceKey((value) => value + 1);
    setCompleted(false);
    setRun({
      stepId: next.id,
      fromRank: progress.fusionRank,
      toRank: progress.fusionRank + 1,
      fromName: detail.name,
      fromFusionFormId: progress.fusionFormId,
      fromJobTier: progress.jobTier,
      requirements: selectedFusion?.requirements ?? [],
    });
  };

  return (
    <div className={`${styles.workbench} ${run !== null ? styles.running : ''}`} aria-label="合成祭壇">
      <button className={styles.close} type="button" disabled={run !== null} onClick={onClose} aria-label="合成画面を閉じる">×</button>

      <div className={styles.header}>
        <span>合成祭壇</span>
        <strong>{run?.fromName ?? (completed ? completedName ?? detail.name : detail.name)}</strong>
        <small>合成ランク {displayFromRank} → {displayFromRank + 1}</small>
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
          ceremony={getFusionStepPresentation(next.id).ceremony}
          currentPresentation={currentPresentation}
          resultPresentation={resultPresentation}
          onFusionComplete={() => {
            setCompleted(true);
            setRun(null);
          }}
        />
        {!completed && run === null && <div className={styles.stageCaption}>同じ職の力と素材をひとつにする</div>}
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
            <span>次の形態</span>
            <strong>{next.resultName}</strong>
            <small>{next.description}</small>
          </div>

          <div className={styles.recipe}>
            {requirements.map((requirement) => {
              const meta = getFusionIngredientPresentation(requirement.tokenId);
              return (
                <button
                  type="button"
                  className={`${styles.ingredient} ${requirement.missing === 0 ? styles.ready : styles.missing}`}
                  key={requirement.tokenId}
                  onClick={() => {
                    if (requirement.missing === 0) return;
                    if (meta.route === 'recruit') onRecruit();
                    else onBattle();
                  }}
                >
                  <span className={`${styles.ingredientIcon} ${ingredientKindClass(meta.kind)}`} aria-hidden="true"><img src={`${import.meta.env.BASE_URL}${meta.asset}`} alt="" /></span>
                  <span><strong>{requirement.label}</strong><small>{validationMode ? '∞' : requirement.owned} / {requirement.required}</small></span>
                  {requirement.missing > 0 && <em>{meta.sourceLabel} ›</em>}
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
                    onClick={() => {
                      const result = controller.convertDuplicateToFusionCore(candidate.id);
                      setNotice(result.accepted
                        ? `${candidatePresentation.name} #${candidate.serial} を合成の核に変換しました`
                        : rejectionLabel(result.reason));
                    }}
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
            disabled={!canFuse || run !== null}
            onClick={beginFusion}
          >
            <span>{canFuse ? '合成可能' : '素材不足'}</span>
            <strong>{run !== null ? '合成中…' : canFuse ? '合成する' : '素材を集める'}</strong>
          </button>
        </div>
      ) : (
        <div className={styles.completePanel}>
          <span>合成完了</span>
          <strong>{completedName ?? resultPresentation.name}</strong>
          <p>{completedDescription ?? next.description}</p>
          <div className={styles.unlockBadge}>新攻撃 · {completedBehavior ?? '新しい戦闘挙動'}</div>
          <div className={styles.resultActions}>
            <button type="button" onClick={onClose}>キャンプで見る</button>
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

function rejectionLabel(reason: string | undefined): string {
  switch (reason) {
    case 'insufficient-materials': return '合成素材が足りません';
    case 'level-too-low': return 'レベルが足りません';
    case 'fusion-choice-required': return '合成先を選んでください';
    case 'invalid-fusion': return 'その合成先は選べません';
    case 'not-reserve': return '控えのスライムだけ合成素材にできます';
    case 'last-of-type': return '最後の1匹は合成素材にできません';
    default: return reason === undefined ? '合成できませんでした' : `合成できません: ${reason}`;
  }
}