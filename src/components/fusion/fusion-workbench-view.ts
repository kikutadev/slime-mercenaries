export function fusionRejectionLabel(reason: string | undefined): string {
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

export function fusionDisplayFromRank(
  currentRank: number,
  runFromRank: number | null,
  completed: boolean,
): number {
  if (runFromRank !== null) return runFromRank;
  return completed ? Math.max(1, currentRank - 1) : currentRank;
}
