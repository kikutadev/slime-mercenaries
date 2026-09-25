import type { BattleActivityReport } from '../application/presentation-events';

export function battleActivityRewardLabel(report: BattleActivityReport | null): string | null {
  if (report === null) return null;
  if (report.rewards.length === 0) return '戦闘進行のみ';

  const visible = report.rewards
    .slice(0, 2)
    .map((item) => `${item.label} +${Math.floor(item.amount).toLocaleString('ja-JP')}`);
  const remaining = report.rewards.length - visible.length;

  return remaining > 0
    ? `${visible.join(' · ')} · ほか${remaining}種`
    : visible.join(' · ');
}
