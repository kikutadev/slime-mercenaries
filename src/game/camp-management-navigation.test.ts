import { describe, expect, it } from 'vitest';
import { campManagementNavigation } from './camp-management-navigation';

const SUBMODES = ['train', 'formation', 'equipment', 'mutation', 'fusion'] as const;

describe('campManagementNavigation', () => {
  it('returns to Camp only from the management root', () => {
    expect(campManagementNavigation('none')).toEqual({
      eyebrow: 'キャンプ管理',
      title: '仲間・育成',
      backLabel: 'キャンプへ戻る',
      backToMenu: false,
    });
  });

  it.each(SUBMODES)('returns one level to the management menu from %s', (mode) => {
    const navigation = campManagementNavigation(mode);
    expect(navigation.backToMenu).toBe(true);
    expect(navigation.backLabel).toBe('‹ 仲間・育成');
    expect(navigation.eyebrow).toBe('仲間・育成');
  });
});
