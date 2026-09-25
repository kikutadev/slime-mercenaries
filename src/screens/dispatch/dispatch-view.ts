import type { selectDispatchScreen } from '../../application/selectors/ui-selectors';

export type DispatchContractView = ReturnType<typeof selectDispatchScreen>['contracts'][number];
type DispatchCandidate = DispatchContractView['candidates'][number];

export function formatDispatchDuration(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safe / 60);
  const rest = safe % 60;
  return `${minutes}:${String(rest).padStart(2, '0')}`;
}

export function dispatchSendButtonLabel(candidate: Pick<DispatchCandidate, 'eligible' | 'powerGap'> | null): string {
  if (candidate === null) return '派遣するスライムを選ぶ';
  if (!candidate.eligible) return `戦力があと ${Math.ceil(candidate.powerGap)} 必要`;
  return 'このスライムを派遣';
}

export function dispatchRejectionLabel(reason: string | undefined): string {
  switch (reason) {
    case 'not-reserve': return '控えのスライムだけ派遣できます';
    case 'insufficient-power': return '戦力が足りません';
    case 'contract-running': return 'この依頼はすでに進行中です';
    default: return reason === undefined ? '派遣できませんでした' : `派遣できません: ${reason}`;
  }
}

export function dispatchProgress(remainingSec: number, durationSec: number): number {
  if (durationSec <= 0) return 0;
  return Math.max(0, Math.min(1, 1 - remainingSec / durationSec));
}
