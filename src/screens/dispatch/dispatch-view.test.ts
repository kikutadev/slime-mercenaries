import { describe, expect, it } from 'vitest';
import {
  dispatchProgress,
  dispatchRejectionLabel,
  dispatchSendButtonLabel,
  formatDispatchDuration,
} from './dispatch-view';

describe('dispatch view helpers', () => {
  it('formats durations defensively', () => {
    expect(formatDispatchDuration(0)).toBe('0:00');
    expect(formatDispatchDuration(61.9)).toBe('1:01');
    expect(formatDispatchDuration(-3)).toBe('0:00');
  });

  it('describes the send action from candidate eligibility', () => {
    expect(dispatchSendButtonLabel(null)).toBe('派遣するスライムを選ぶ');
    expect(dispatchSendButtonLabel({ eligible: true, powerGap: 0 })).toBe('このスライムを派遣');
    expect(dispatchSendButtonLabel({ eligible: false, powerGap: 4.1 })).toBe('戦力があと 5 必要');
  });

  it('maps dispatch rejection reasons without leaking raw reasons for known cases', () => {
    expect(dispatchRejectionLabel('not-reserve')).toBe('控えのスライムだけ派遣できます');
    expect(dispatchRejectionLabel('insufficient-power')).toBe('戦力が足りません');
    expect(dispatchRejectionLabel(undefined)).toBe('派遣できませんでした');
  });

  it('clamps traveler progress', () => {
    expect(dispatchProgress(100, 100)).toBe(0);
    expect(dispatchProgress(50, 100)).toBe(0.5);
    expect(dispatchProgress(-10, 100)).toBe(1);
    expect(dispatchProgress(120, 100)).toBe(0);
    expect(dispatchProgress(10, 0)).toBe(0);
  });
});
