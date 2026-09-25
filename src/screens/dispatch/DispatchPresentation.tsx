import type { SlimeMercenariesState } from '../../domain';
import { getSlimePresentation } from '../../game/slimes';
import styles from '../DispatchScreen.module.css';
import { formatDispatchDuration, type DispatchContractView } from './dispatch-view';

export function DispatchRewardBadge({ contract }: { contract: DispatchContractView }) {
  return (
    <div className={styles.rewardBadge}>
      <DispatchRewardMark kind={contract.reward.kind} />
      <span>
        <small>持ち帰るもの</small>
        <strong>{contract.reward.label} ×{contract.reward.amount}</strong>
      </span>
    </div>
  );
}

export function DispatchRewardMark({
  kind,
}: {
  kind: DispatchContractView['reward']['kind'];
}) {
  if (kind === 'gold') {
    return (
      <svg className={styles.rewardMark} viewBox="0 0 28 28" aria-hidden="true">
        <ellipse cx="14" cy="8" rx="8" ry="4" />
        <path d="M6 8v5c0 2.2 3.6 4 8 4s8-1.8 8-4V8M6 13v5c0 2.2 3.6 4 8 4s8-1.8 8-4v-5" />
      </svg>
    );
  }

  if (kind === 'forge-key') {
    return (
      <svg className={styles.rewardMark} viewBox="0 0 28 28" aria-hidden="true">
        <circle cx="10" cy="10" r="5" />
        <path d="M13.5 13.5 23 23M18.5 18.5l2.5-2.5M21 21l2.5-2.5" />
      </svg>
    );
  }

  return (
    <svg className={styles.rewardMark} viewBox="0 0 28 28" aria-hidden="true">
      <path d="M14 3 22 10 18 23H10L6 10Z" />
      <path d="m10 12 4-3 4 3-1.5 6h-5Z" />
    </svg>
  );
}

export function RunningDispatch({
  contract,
  roster,
}: {
  contract: DispatchContractView;
  roster: SlimeMercenariesState['gameData']['roster']['slimes'];
}) {
  const slime = contract.slimeId === null ? null : roster[contract.slimeId];
  const presentation = slime === undefined || slime === null
    ? null
    : getSlimePresentation(slime);

  return (
    <div className={styles.runningPanel}>
      <div>
        <span className={styles.runningLabel}>
          {presentation?.name ?? 'スライム'}が移動中
        </span>
        <strong>{formatDispatchDuration(contract.remainingSec)}</strong>
        <small>帰還まで</small>
      </div>
      <div className={styles.runningReward}>
        <DispatchRewardMark kind={contract.reward.kind} />
        <span>{contract.reward.label} ×{contract.reward.amount}</span>
      </div>
    </div>
  );
}
