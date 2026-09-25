import { BottomSheet } from 'idle-game-kit/react';
import {
  battleActivityProgressLabel,
  formatBattleActivityElapsed,
  formatWorldStagePosition,
  type BattleActivityReport,
  type OfflineReturnView,
} from '../application/presentation-events';
import styles from './AppShell.module.css';

export function BattleActivityPeek({
  report,
  rewardLabel,
  onOpen,
}: {
  report: BattleActivityReport;
  rewardLabel: string | null;
  onOpen: () => void;
}) {
  return (
    <button
      className={styles.battleReportPeek}
      type="button"
      aria-label={[
        '戦闘レポート',
        battleActivityProgressLabel(report),
        formatBattleActivityElapsed(report.elapsedSec),
        rewardLabel,
      ].filter(Boolean).join(' · ')}
      onClick={onOpen}
    >
      <span>戦闘レポート</span>
      <strong>{battleActivityProgressLabel(report)}</strong>
    </button>
  );
}

export function BattleActivitySheet({
  report,
  onClose,
  onConfirm,
}: {
  report: BattleActivityReport;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <BottomSheet
      title="戦闘レポート"
      onClose={onClose}
      backdropClassName={styles.sheetBackdrop}
      sheetClassName={`${styles.sheetPanel} ${styles.offlineSheet}`}
      headerClassName={styles.sheetHeader}
      closeButtonClassName={styles.sheetClose}
    >
      <div className={styles.offlineSummary}>
        <div className={styles.offlineHero}>
          <span>離れていた間の自動戦闘</span>
          <strong>{battleActivityProgressLabel(report)}</strong>
          <small>{formatBattleActivityElapsed(report.elapsedSec)}ぶん進行しました</small>
        </div>

        <div className={styles.offlineGrid}>
          <div><span>ウェーブ突破</span><strong>{report.waveClearCount}</strong></div>
          <div><span>ステージ突破</span><strong>{report.stageClearCount}</strong></div>
          <div><span>周回完了</span><strong>{report.farmClearCount}</strong></div>
          <div><span>敗北</span><strong>{report.defeatCount}</strong></div>
        </div>

        {report.bossDefeatedCount > 0 && (
          <div className={styles.offlineReward}>
            <span>ボス撃破</span>
            <strong>{report.bossDefeatedCount}回</strong>
          </div>
        )}

        {report.retryCount > 0 && (
          <div className={styles.offlineReward}>
            <span>最前線へ再挑戦</span>
            <strong>{report.retryCount}回</strong>
          </div>
        )}

        <div className={styles.battleReportRewards}>
          <span>獲得報酬</span>
          {report.rewards.length > 0 ? (
            <div>
              {report.rewards.map((item) => (
                <div key={`${item.kind}:${item.id}`}>
                  <span>{item.label}</span>
                  <strong>+{Math.floor(item.amount).toLocaleString('ja-JP')}</strong>
                </div>
              ))}
            </div>
          ) : (
            <small>この期間は報酬獲得前まで戦闘が進みました。</small>
          )}
        </div>

        <button className={styles.primaryButton} type="button" onClick={onConfirm}>
          確認した
        </button>
      </div>
    </BottomSheet>
  );
}

export function OfflineReturnSheet({
  view,
  onClose,
  onBattle,
}: {
  view: OfflineReturnView;
  onClose: () => void;
  onBattle: () => void;
}) {
  return (
    <BottomSheet
      title="おかえりなさい"
      onClose={onClose}
      backdropClassName={styles.sheetBackdrop}
      sheetClassName={`${styles.sheetPanel} ${styles.offlineSheet}`}
      headerClassName={styles.sheetHeader}
      closeButtonClassName={styles.sheetClose}
    >
      <div className={styles.offlineSummary}>
        <div className={styles.offlineHero}>
          <span>放置進行</span>
          <strong>{view.elapsedLabel}</strong>
          <small>放置中も傭兵団は進み続けました。</small>
        </div>

        <div className={styles.offlineGrid}>
          <div><span>到達</span><strong>{formatWorldStagePosition(view.furthest)}</strong></div>
          <div><span>ステージ突破</span><strong>{view.stageClearCount}</strong></div>
          <div><span>ボス撃破</span><strong>{view.bossDefeatedCount}</strong></div>
          <div><span>派遣帰還</span><strong>{view.dispatchCompletedCount}</strong></div>
        </div>

        {view.frontier !== null && (
          <div className={styles.offlineReward}>
            <span>最前線</span>
            <strong>{formatWorldStagePosition(view.frontier)} 到達 · 周回継続中</strong>
          </div>
        )}

        {view.battleRewards.length > 0 && (
          <div className={styles.battleReportRewards}>
            <span>放置中の獲得</span>
            <div>
              {view.battleRewards.map((item) => (
                <div key={`offline:${item.kind}:${item.id}`}>
                  <span>{item.label}</span>
                  <strong>+{Math.floor(item.amount).toLocaleString('ja-JP')}</strong>
                </div>
              ))}
            </div>
          </div>
        )}

        <button className={styles.primaryButton} type="button" onClick={onBattle}>
          戦闘へ戻る
        </button>
      </div>
    </BottomSheet>
  );
}
