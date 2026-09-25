export function campRejectionLabel(reason: string | undefined): string {
  switch (reason) {
    case 'insufficient-materials': return '素材が足りません';
    case 'insufficient-inputs': return 'プレーンスライムまたは職業装備が足りません';
    case 'insufficient-gold': return 'ゴールドが足りません';
    case 'dispatched': return '派遣中です';
    case 'weapon-not-owned': return 'その武器を所持していません';
    case 'wrong-family': return 'この職業では装備できない武器です';
    case 'already-mutated': return 'この個体はすでに変異しています';
    case 'not-eligible': return 'この形態では選べない変異です';
    case 'missing-catalyst': return '変異核がありません';
    case 'validation-mode-disabled': return '検証モードでのみ使えます';
    case 'job-create-failed': return '全職解放に失敗しました';
    case 'formation-failed': return '派遣中のスライムがいるため6職編成できません';
    case 'missing-heart': return 'ミミックハートがありません';
    case 'already-owned': return 'ミミックスライムはすでに仲間です';
    case 'special-slime': return '特殊個体は合成素材にできません';
    default: return reason === undefined ? '実行できませんでした' : `実行できません: ${reason}`;
  }
}
