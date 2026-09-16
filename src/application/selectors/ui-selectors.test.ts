import { describe, expect, it } from 'vitest';
import { grantToken } from 'idle-game-kit';
import { assignSlimeToFormation, craftPlainSlime, createInitialSlimeMercenariesState, createJobSlime, ids } from '../../domain';
import { selectCreateSlimePanel, selectDispatchScreen, selectEarlyGameCue, selectNavigationAttention } from './ui-selectors';

function createSwordState() {
  let state = createInitialSlimeMercenariesState(0, 11);
  const crafted = craftPlainSlime(state);
  if (!crafted.accepted) throw new Error('setup craft failed');
  state = crafted.state;
  const created = createJobSlime(state, 'sword');
  if (!created.accepted) throw new Error('setup sword failed');
  return created.state;
}

describe('UI selectors', () => {
  it('projects Plain creation from the authoritative recipe state', () => {
    const view = selectCreateSlimePanel(createInitialSlimeMercenariesState(0, 3));
    expect(view.plainStock).toBe(0);
    expect(view.craft.canCraft).toBe(true);
    expect(view.jobs.find((job) => job.id === 'sword')?.canCreate).toBe(false);
  });

  it('only exposes reserve slimes to dispatch selection', () => {
    const reserve = createSwordState();
    expect(selectDispatchScreen(reserve).reserve.map((slime) => slime.id)).toContain('sword');

    const assigned = assignSlimeToFormation(reserve, 'sword', 0);
    if (!assigned.accepted) throw new Error('setup formation failed');
    expect(selectDispatchScreen(assigned.state).reserve.map((slime) => slime.id)).not.toContain('sword');
  });

  it('derives Forge attention from earned Forge Keys without React-local state', () => {
    const initial = createInitialSlimeMercenariesState(0, 5);
    expect(selectNavigationAttention(initial).has('forge')).toBe(false);

    const withKey = { ...initial, tokens: grantToken(initial.tokens, ids.token.forgeKey, 1) };
    expect(selectNavigationAttention(withKey).has('forge')).toBe(true);
  });
  it('guides first-use progression from Plain creation into battle without storing tutorial state', () => {
    const initial = createInitialSlimeMercenariesState(0, 7);
    expect(selectEarlyGameCue(initial)?.title).toContain('Plain Slime');

    const crafted = craftPlainSlime(initial);
    if (!crafted.accepted) throw new Error('setup craft failed');
    expect(selectEarlyGameCue(crafted.state)?.title).toContain('剣');

    const created = createJobSlime(crafted.state, 'sword');
    if (!created.accepted) throw new Error('setup sword failed');
    expect(selectEarlyGameCue(created.state)?.action).toBe('Battle');
  });

});
