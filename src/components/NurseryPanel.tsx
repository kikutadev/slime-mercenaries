import { lazy, Suspense } from 'react';
import { BottomSheet } from 'idle-game-kit/react';
import type { selectCreateSlimePanel } from '../application/selectors/ui-selectors';
import { ids, type JobSlimeId } from '../domain';
import { NurseryIcon } from './NurseryIcon';
import type { NurseryCeremony } from './NurseryCeremonyStage';
import styles from './NurseryPanel.module.css';

const NurseryCeremonyStage = lazy(async () => {
  const module = await import('./NurseryCeremonyStage');
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
}: NurseryPanelProps) {
  if (!open) return null;

  return (
    <BottomSheet
      title="仲間を増やす"
      onClose={onClose}
      backdropClassName={styles.backdrop}
      sheetClassName={`${styles.sheet} ${busy ? styles.busy : ''}`}
      headerClassName={styles.header}
      closeButtonClassName={styles.close}
    >
      <div className="nursery-world">
        <Suspense fallback={<div className="nursery-stage nursery-stage--loading" aria-hidden="true" />}>
          <NurseryCeremonyStage
            ceremony={ceremony}
            stockLabel={validationMode ? '∞' : String(ceremony?.beforeStock ?? panel.plainStock)}
          />
        </Suspense>

        <section className="nursery-craft-panel" aria-label="素材からプレーンスライムを生み出す">
          <div className="nursery-craft-panel__heading">
            <span><NurseryIcon kind="craft" /></span>
            <div>
              <strong>素材から生み出す</strong>
              <small>素材が生成槽に集まり、スライムになります</small>
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
            <small>プレーンスライム +1</small>
          </button>
        </section>

        <button
          className="nursery-shop-action"
          type="button"
          disabled={busy || !panel.purchase.canAfford}
          onClick={onPurchase}
        >
          <span><NurseryIcon kind="shop" /></span>
          <div>
            <strong>ショップから迎える</strong>
            <small>すぐにキャンプへ仲間入り</small>
          </div>
          <em>{validationMode ? '∞' : panel.purchase.cost} G</em>
        </button>

        <div className="nursery-job-title">
          <span>職業を与える</span>
          <strong>プレーンスライムに道具を渡す</strong>
        </div>
        <div className="nursery-jobs">
          {panel.jobs.map((job) => (
            <button
              key={job.id}
              type="button"
              disabled={busy || !job.canCreate}
              onClick={() => onCreateJob(job.id)}
            >
              <img src={`${import.meta.env.BASE_URL}${job.icon}`} alt="" />
              <span>
                <strong>{job.name}</strong>
                <small>{job.isNew ? 'はじめての職業' : '同じ職業の仲間を増やす'}</small>
              </span>
              <em>{job.canCreate ? '道具を渡す' : '素材不足'}</em>
            </button>
          ))}
        </div>
      </div>
    </BottomSheet>
  );
}

function resourceLabel(tokenId: string): string {
  if (tokenId === ids.token.slimeGel) return 'スライムジェル';
  if (tokenId === ids.token.lifeWater) return '生命の水';
  return tokenId;
}
