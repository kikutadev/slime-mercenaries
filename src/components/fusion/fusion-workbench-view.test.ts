import { describe, expect, it } from 'vitest';
import { fusionDisplayFromRank, fusionRejectionLabel } from './fusion-workbench-view';

describe('fusion workbench view helpers', () => {
  it('keeps the source rank visible while a ceremony is running', () => {
    expect(fusionDisplayFromRank(3, 2, false)).toBe(2);
  });

  it('shows the previous rank after completion for the result presentation', () => {
    expect(fusionDisplayFromRank(3, null, true)).toBe(2);
    expect(fusionDisplayFromRank(1, null, true)).toBe(1);
  });

  it('uses the current rank before fusion starts', () => {
    expect(fusionDisplayFromRank(2, null, false)).toBe(2);
  });

  it('maps known rejections to product copy', () => {
    expect(fusionRejectionLabel('insufficient-materials')).toBe('合成素材が足りません');
    expect(fusionRejectionLabel('last-of-type')).toBe('最後の1匹は合成素材にできません');
    expect(fusionRejectionLabel(undefined)).toBe('合成できませんでした');
  });
});
