import { lazy, Suspense, useEffect, useRef } from 'react';
import { BottomSheet } from 'idle-game-kit/react';
import type { EarlyGameCue, selectCreateSlimePanel } from '../application/selectors/ui-selectors';
import { ids, type JobSlimeId } from '../domain';
import { NurseryIcon } from './NurseryIcon';
import type { NurseryCeremony } from './NurseryCeremonyStage';
import styles from './NurseryPanel.module.css';

const nurseryCeremonyStagePromise = import('./NurseryCeremonyStage');
const NurseryCeremonyStage = lazy(async () => {
  const module = await nurseryCeremonyStagePromise;
  return { default: module.NurseryCeremonyStage };
});

type CreateSlimePanel = ReturnType<typeof selectCreateSlimePanel>;

interface NurseryPanelProps {
  open: boolean;
  busy: boolean;
  ceremony: NurseryCeremony | null;
  validationMode: boolean;
  panel: CreateSlimePanel;
  onClose: () => void;
  onCraft: () => void;
  onPurchase: () => void;
  onCreateJob: (jobId: JobSlimeId) => void;
  onCaptureMimic: () => void;
  tutorialCue: EarlyGameCue | null;
}

export function NurseryPanel({
  open,
  busy,
  ceremony,
  validationMode,
  panel,
  onClose,
  onCraft,
  onPurchase,
  onCreateJob,
  onCaptureMimic,
  tutorialCue,
}: NurseryPanelProps) {
  const worldRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (ceremony === null) return;
    const scrollContainer = worldRef.current?.parentElement;
    scrollContainer?.scrollTo({ top: 0, behavior: 'auto' });
  }, [ceremony?.key]);

  if (!open) return null;

  const firstPlainGate = tutorialCue?.id === 'create-first-plain' || tutorialCue?.id === 'try-first-plain';
  const firstJobGate = tutorialCue?.id === 'give-first-job';
  const duplicateSwordGate = tutorialCue?.id === 'create-second-sword';
  const firstSwordReveal = ceremony?.kind === 'job' && ceremony.jobId === 'sword' && tutorialCue?.id === 'try-first-sword';
  const focusedSwordJob = firstJobGate || duplicateSwordGate || (busy && ceremony?.kind === 'job' && ceremony.jobId === 'sword');

  return (
    <BottomSheet
      title={ceremony?.kind === 'job' && ceremony.jobId === 'sword' ? "剣を渡す" : ceremony?.kind === 'job' ? "仕事を与える" : firstPlainGate ? "最初のスライム" : firstJobGate ? "剣を渡す" : duplicateSwordGate ? "同じ職の仲間を増やす" : "仲間を増やす"}
      onClose={onClose}
      backdropClassName={styles.backdrop}
      sheetClassName={`${styles.sheet} ${busy ? styles.busy : ''}`}
      headerClassName={styles.header}
      closeButtonClassName={styles.close}
    >
      <div className="nursery-world" ref={worldRef}>
        <Suspense fallback={<div className="nursery-stage" aria-hidden="true" />}>
          <NurseryCeremonyStage
            ceremony={ceremony}
            stockLabel={validationMode ? '∞' : String(ceremony?.beforeStock ?? panel.plainStock)}
            speech={speechForCeremony(ceremony, tutorialCue)}
            showResident={firstPlainGate ? ceremony !== null : panel.plainStock > 0 || ceremony !== null}
            firstPlain={firstPlainGate}
            firstSwordReveal={firstSwordReveal}
          />
        </Suspense>

        {!focusedSwordJob && <section
          className={`nursery-craft-panel ${tutorialCue?.action === 'Create Slime' ? 'is-tutorial-target' : ''}`}
          aria-label="素材からプレーンスライムを生み出す"
        >
          <div className="nursery-craft-panel__heading">
            <span><NurseryIcon kind="craft" /></span>
            <div>
              <strong>素材から生み出す</strong>
              <small>生成槽へ素材を集める</small>
            </div>
          </div>
          <div className="nursery-materials">
            {panel.craft.requirements.map((item) => (
              <div className={item.owned >= item.required || validationMode ? 'is-ready' : 'is-missing'} key={item.tokenId}>
                <span>
                  <NurseryIcon kind={item.tokenId === ids.token.lifeWater ? 'water' : 'gel'} />
                </span>
                <div>
                  <strong>{resourceLabel(item.tokenId)}</strong>
                  <small>{validationMode ? '∞' : item.owned} / {item.required}</small>
                </div>
              </div>
            ))}
          </div>
          <button
            className="nursery-craft-trigger"
            type="button"
            disabled={busy || !panel.craft.canCraft}
            onClick={onCraft}
          >
            <strong>{busy && ceremony?.kind === 'craft' ? '生まれています…' : '生み出す'}</strong>
            <small>プレーン +1</small>
          </button>
        </section>}

        {!firstPlainGate && <><div className="nursery-job-title nursery-job-title--roles">
          <span>{firstJobGate ? '最初の仕事道具' : duplicateSwordGate ? '同じ仕事の仲間' : '職業を与える'}</span>
          <strong>{focusedSwordJob ? '剣を渡す' : '6つの道具から選ぶ'}</strong>
        </div>
        <div className="nursery-jobs nursery-jobs--roles">
          {panel.jobs.filter((job) => !focusedSwordJob || job.id === 'sword').map((job) => (
            <button
              className={`nursery-job-option ${tutorialCue?.action === 'Create Job' && job.id === 'sword' ? 'is-tutorial-target' : ''}`}
              key={job.id}
              type="button"
              disabled={busy || !job.canCreate || firstPlainGate || (focusedSwordJob && job.id !== 'sword')}
              aria-label={`${job.name}にする。 ${firstPlainGate ? 'まずプレーンスライムを試します' : focusedSwordJob && job.id !== 'sword' ? '剣士スライムを作ります' : job.canCreate ? (job.isNew ? 'はじめての職業' : '仲間を増やす') : '素材不足'}`}
              onClick={() => onCreateJob(job.id)}
            >
              <img src={`${import.meta.env.BASE_URL}${job.icon}`} alt="" />
              <span>
                <strong>{job.name.replace('スライム', '')}</strong>
                <small>{job.isNew ? 'NEW' : '仲間を増やす'}</small>
              </span>
              <em>{job.canCreate ? '選ぶ' : '不足'}</em>
            </button>
          ))}
        </div></>}

        {!firstPlainGate && !focusedSwordJob && <button
          className="nursery-shop-action"
          type="button"
          disabled={busy || !panel.purchase.canAfford}
          onClick={onPurchase}
        >
          <span><NurseryIcon kind="shop" /></span>
          <div>
            <strong>ショップから迎える</strong>
            <small>Goldですぐにプレーンを追加</small>
          </div>
          <em>{validationMode ? '∞' : panel.purchase.cost} G</em>
        </button>}

        {!firstPlainGate && !focusedSwordJob && (panel.mimic.hearts > 0 || panel.mimic.alreadyOwned) && (
          <>
            <div className="nursery-job-title">
              <span>特殊な仲間</span>
              <strong>宝箱から残ったハートが震えています</strong>
            </div>
            <div className="nursery-jobs">
              <button
                type="button"
                disabled={busy || !panel.mimic.canCapture}
                onClick={onCaptureMimic}
              >
                <img src={`${import.meta.env.BASE_URL}${panel.mimic.icon}`} alt="" />
                <span>
                  <strong>{panel.mimic.name}</strong>
                  <small>{panel.mimic.alreadyOwned ? 'すでに仲間です' : `現在の仲間に合わせて Lv.${panel.mimic.captureLevel} で加入`}</small>
                </span>
                <em>{panel.mimic.alreadyOwned ? '仲間済み' : `ミミックハート ${panel.mimic.hearts}/${panel.mimic.heartCost}`}</em>
              </button>
            </div>
          </>
        )}

      </div>
    </BottomSheet>
  );
}

function resourceLabel(tokenId: string): string {
  if (tokenId === ids.token.slimeGel) return 'スライムジェル';
  if (tokenId === ids.token.lifeWater) return '生命の水';
  return tokenId;
}
function speechForCeremony(ceremony: NurseryCeremony | null, tutorialCue: EarlyGameCue | null): string | undefined {
  if (ceremony?.kind === 'craft') return '……ここ、どこ？';
  if (ceremony?.kind === 'purchase') return 'ここでいいの？';
  if (ceremony?.kind === 'job') {
    return tutorialCue?.id === 'create-second-sword' ? '同じ仕事？' : 'これ、ぼくに？';
  }
  if (tutorialCue?.action === 'Create Job') return tutorialCue.speech;
  return undefined;
}
