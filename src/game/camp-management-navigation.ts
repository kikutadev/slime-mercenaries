import type { CampMode } from './camp-types';

export type CampManagementNavigation = Readonly<{
  eyebrow: string;
  title: string;
  backLabel: string;
  backToMenu: boolean;
}>;

/** Keep Camp management navigation strictly one level at a time. */
export function campManagementNavigation(mode: CampMode): CampManagementNavigation {
  switch (mode) {
    case 'train':
      return { eyebrow: '仲間・育成', title: '強化', backLabel: '‹ 仲間・育成', backToMenu: true };
    case 'formation':
      return { eyebrow: '仲間・育成', title: '編成', backLabel: '‹ 仲間・育成', backToMenu: true };
    case 'equipment':
      return { eyebrow: '仲間・育成', title: '装備', backLabel: '‹ 仲間・育成', backToMenu: true };
    case 'mutation':
      return { eyebrow: '仲間・育成', title: 'レア変異', backLabel: '‹ 仲間・育成', backToMenu: true };
    case 'fusion':
      return { eyebrow: '仲間・育成', title: '合成', backLabel: '‹ 仲間・育成', backToMenu: true };
    case 'none':
    default:
      return { eyebrow: 'キャンプ管理', title: '仲間・育成', backLabel: 'キャンプへ戻る', backToMenu: false };
  }
}
