import { useMemo, useState } from 'react';
import { useGameController, useGameState } from '../../app/GameProvider';
import { selectSlimeDetail } from '../../application/selectors/ui-selectors';
import type { JobSlimeId } from '../../domain';
import { getSlimePresentationForRank } from '../../game/slimes';
import { getNextFusionStep } from '../../game/fusion';
import { getFusionIngredientPresentation } from '../../game/fusion-presentation';
import { SlimePreview } from '../SlimePreview';

interface FusionWorkbenchProps {
  slimeId: JobSlimeId;
  onClose: () => void;
  onBattle: () => void;
  onRecruit: () => void;
}

type FusionRun = Readonly<{ fromRank: number; toRank: number; fromName: string }>;

export function FusionWorkbench({ slimeId, onClose, onBattle, onRecruit }: FusionWorkbenchProps) {
  const state = useGameState();
  const controller = useGameController();
  const detail = selectSlimeDetail(state, slimeId);
  const progress = state.gameData.roster.slimes[slimeId] ?? null;
  const [run, setRun] = useState<FusionRun | null>(null);
  const [sequenceKey, setSequenceKey] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [completedName, setCompletedName] = useState<string | null>(null);
  const [completedDescription, setCompletedDescription] = useState<string | null>(null);
  const [completedBehavior, setCompletedBehavior] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const displayFromRank = progress === null ? 1 : run?.fromRank ?? (completed ? Math.max(1, progress.fusionRank - 1) : progress.fusionRank);
  const next = progress === null ? null : getNextFusionStep({ ...progress, fusionRank: displayFromRank });
  const resultPresentation = useMemo(() => {
    if (progress === null) return null;
    return getSlimePresentationForRank(slimeId, displayFromRank + 1);
  }, [displayFromRank, progress, slimeId]);

  if (detail === null || progress === null) return null;

  if (next === null || detail.fusion === null || resultPresentation === null) {
    return (
      <div className="fusion-workbench fusion-workbench--empty">
        <button className="world-close" type="button" onClick={onClose}>×</button>
        <div className="fusion-complete-panel">
          <span>合成</span>
          <strong>現在の合成段階は上限です</strong>
          <button type="button" onClick={onClose}>キャンプへ戻る</button>
        </div>
      </div>
    );
  }

  const beginFusion = () => {
    if (!detail.fusion?.canFuse || run !== null) return;
    const fromRank = progress.fusionRank;
    const resultName = next.resultName ?? resultPresentation.name;
    const description = next.description;
    const behavior = behaviorLabel(detail.fusion.behaviorUnlockId);
    const result = controller.fuseSlime(slimeId);
    if (!result.accepted) {
      setNotice(rejectionLabel(result.reason));
      return;
    }
    setCompletedName(resultName);
    setCompletedDescription(description);
    setCompletedBehavior(behavior);
    setSequenceKey((value) => value + 1);
    setCompleted(false);
    setRun({ fromRank, toRank: fromRank + 1, fromName: detail.name });
  };

  return (
    <div className={`fusion-workbench ${run !== null ? 'is-running' : ''} ${completed ? 'is-complete' : ''}`} aria-label="合成祭壇">
      <button className="world-close" type="button" onClick={onClose} aria-label="合成画面を閉じる">×</button>

      <div className="fusion-workbench__header">
        <span>合成祭壇</span>
        <strong>{run?.fromName ?? (completed ? completedName ?? detail.name : detail.name)}</strong>
        <small>合成ランク {displayFromRank} → {displayFromRank + 1}</small>
      </div>

      <div className="fusion-workbench__stage">
        <div className="fusion-rune fusion-rune--outer" />
        <div className="fusion-rune fusion-rune--inner" />
        <SlimePreview
          slimeId={slimeId}
          fusionRank={run?.fromRank ?? progress.fusionRank}
          fusionReady={!completed}
          isFusing={run !== null && !completed}
          sequenceKey={sequenceKey}
          fromRank={run?.fromRank ?? progress.fusionRank}
          toRank={run?.toRank ?? progress.fusionRank + 1}
          onFusionComplete={() => {
            setCompleted(true);
            setRun(null);
          }}
        />
        {!completed && run === null && <div className="fusion-stage-caption">同じ職の力と素材をひとつにする</div>}
      </div>

      {!completed ? (
        <div className="fusion-workbench__console">
          <div className="fusion-result-tease">
            <span>次の形態</span>
            <strong>{next.resultName ?? resultPresentation.name}</strong>
            <small>{next.description}</small>
          </div>

          <div className="fusion-recipe-orbit">
            {detail.fusion.requirements.map((requirement) => {
              const meta = getFusionIngredientPresentation(requirement.tokenId);
              return (
                <button
                  type="button"
                  className={`fusion-ingredient ${requirement.missing === 0 ? 'is-ready' : 'is-missing'}`}
                  key={requirement.tokenId}
                  onClick={() => {
                    if (requirement.missing === 0) return;
                    if (meta.route === 'recruit') onRecruit();
                    else onBattle();
                  }}
                >
                  <span className={`fusion-ingredient__icon fusion-ingredient__icon--${meta.kind}`} aria-hidden="true"><img src={`${import.meta.env.BASE_URL}${meta.asset}`} alt="" /></span>
                  <span><strong>{requirement.label}</strong><small>{requirement.owned} / {requirement.required}</small></span>
                  {requirement.missing > 0 && <em>{meta.sourceLabel} ›</em>}
                </button>
              );
            })}
          </div>

          {!detail.fusion.levelMet && (
            <div className="fusion-level-lock">Lv.{detail.fusion.minLevel}で合成陣が安定します。現在 Lv.{detail.level}</div>
          )}

          <button
            className={`fusion-trigger ${detail.fusion.canFuse ? 'is-ready' : ''}`}
            type="button"
            disabled={!detail.fusion.canFuse || run !== null}
            onClick={beginFusion}
          >
            <span>{detail.fusion.canFuse ? '合成可能' : '素材不足'}</span>
            <strong>{run !== null ? '合成中…' : detail.fusion.canFuse ? '合成する' : '素材を集める'}</strong>
          </button>
        </div>
      ) : (
        <div className="fusion-complete-panel">
          <span>合成完了</span>
          <strong>{completedName ?? resultPresentation.name}</strong>
          <p>{completedDescription ?? next.description}</p>
          <div className="fusion-unlock-badge">新攻撃 · {completedBehavior ?? '新しい戦闘挙動'}</div>
          <div className="fusion-result-actions">
            <button type="button" onClick={onClose}>キャンプで見る</button>
            <button className="is-primary" type="button" onClick={onBattle}>戦闘で試す</button>
          </div>
        </div>
      )}

      {notice !== null && <button className="toast-notice" type="button" onClick={() => setNotice(null)}>{notice}</button>}
    </div>
  );
}

function behaviorLabel(id: string): string {
  if (id.includes('spinning-cleave')) return '横薙ぎ範囲攻撃';
  if (id.includes('heavy-impact')) return '重撃インパクト';
  if (id.includes('whirlwind')) return '旋風斬り';
  if (id.includes('follow-up')) return '追撃射撃';
  if (id.includes('pierce')) return '貫通射撃';
  if (id.includes('triple')) return '三連射';
  return '新しい戦闘挙動';
}

function rejectionLabel(reason: string | undefined): string {
  switch (reason) {
    case 'insufficient-materials': return '合成素材が足りません';
    case 'level-too-low': return 'レベルが足りません';
    default: return reason === undefined ? '合成できませんでした' : `合成できません: ${reason}`;
  }
}
