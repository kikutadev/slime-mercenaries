import { describe, expect, it } from 'vitest';
import { applyRewards, grantToken } from 'idle-game-kit';
import {
  assignSlimeToFormation,
  craftPlainSlime,
  createInitialSlimeMercenariesState,
  createJobSlime,
  firstSlimeIdByType,
  ids,
  grantMutationCatalyst,
  markCodexEntriesViewed,
  resolveCurrencyDefinition,
} from '../../domain';
import { selectCampUpgradeOpportunities, selectCreateSlimePanel, selectDispatchScreen, selectEarlyGameCue, selectCodexSummary, selectNavigationAttention, selectSlimeDetail, selectWorldAreas } from './ui-selectors';

function createSwordState() {
  let state = createInitialSlimeMercenariesState(0, 11);
  const crafted = craftPlainSlime(state);
  if (!crafted.accepted) throw new Error('setup craft failed');
  state = crafted.state;
  const created = createJobSlime(state, 'sword');
  if (!created.accepted) throw new Error('setup sword failed');
  const swordId = firstSlimeIdByType(created.state, 'sword');
  if (swordId === null) throw new Error('setup sword missing');
  return { state: created.state, swordId };
}

describe('UI selectors', () => {
  it('projects Plain creation from the authoritative recipe state', () => {
    const view = selectCreateSlimePanel(createInitialSlimeMercenariesState(0, 3));
    expect(view.plainStock).toBe(0);
    expect(view.craft.canCraft).toBe(true);
    expect(view.jobs.find((job) => job.id === 'sword')?.canCreate).toBe(false);
  });

  it('only exposes reserve slime instances to dispatch selection', () => {
    const setup = createSwordState();
    expect(selectDispatchScreen(setup.state).reserve.map((slime) => slime.id)).toContain(setup.swordId);

    const assigned = assignSlimeToFormation(setup.state, setup.swordId, 0);
    if (!assigned.accepted) throw new Error('setup formation failed');
    expect(selectDispatchScreen(assigned.state).reserve.map((slime) => slime.id)).not.toContain(setup.swordId);
  });

  it('derives Forge attention from earned Forge Keys without React-local state', () => {
    const initial = createInitialSlimeMercenariesState(0, 5);
    expect(selectNavigationAttention(initial).has('forge')).toBe(false);
    const withKey = { ...initial, tokens: grantToken(initial.tokens, ids.token.forgeKey, 1) };
    expect(selectNavigationAttention(withKey).has('forge')).toBe(true);
  });

  it('derives retreat strengthening attention from production upgrade previews', () => {
    const setup = createSwordState();
    const viewed = markCodexEntriesViewed(setup.state, 'slime-form', ['slime.sword']);
    if (!viewed.accepted) throw new Error('setup Codex view failed');
    let state = applyRewards(viewed.state, [
      { type: 'currency', currencyId: ids.currency.gold, amount: 100, source: 'test' },
    ], { resolveCurrencyDefinition }) as typeof setup.state;

    expect(selectCampUpgradeOpportunities(state).some((opportunity) => opportunity.kind === 'level')).toBe(true);
    expect(selectNavigationAttention(state).has('slimes')).toBe(false);
    state = { ...state, gameData: { ...state.gameData, combat: { ...state.gameData.combat, retryFarmClearsRemaining: 3 } } };
    expect(selectNavigationAttention(state).has('slimes')).toBe(true);
  });

  it('guides first-use progression from Plain creation into battle without storing tutorial state', () => {
    const initial = createInitialSlimeMercenariesState(0, 7);
    expect(selectEarlyGameCue(initial)?.title).toContain('プレーンスライム');
    const crafted = craftPlainSlime(initial);
    if (!crafted.accepted) throw new Error('setup craft failed');
    expect(selectEarlyGameCue(crafted.state)?.title).toContain('剣');
    const created = createJobSlime(crafted.state, 'sword');
    if (!created.accepted) throw new Error('setup sword failed');
    expect(selectEarlyGameCue(created.state)?.action).toBe('Battle');
  });
  it('projects per-instance mutation eligibility and catalyst readiness for presentation', () => {
    const setup = createSwordState();
    const sword = setup.state.gameData.roster.slimes[setup.swordId]!;
    const tier2State = {
      ...setup.state,
      gameData: {
        ...setup.state.gameData,
        roster: {
          ...setup.state.gameData.roster,
          slimes: { ...setup.state.gameData.roster.slimes, [setup.swordId]: { ...sword, jobTier: 2 } },
        },
      },
    };
    const ready = grantMutationCatalyst(tier2State, 'golden');
    const detail = selectSlimeDetail(ready, setup.swordId);
    expect(detail?.mutationId).toBeNull();
    expect(detail?.mutations.find((mutation) => mutation.id === 'golden')).toMatchObject({
      name: 'ゴールデンスライム', eligible: true, canMutate: true, catalysts: 1,
    });
    expect(detail?.mutations.find((mutation) => mutation.id === 'king')?.eligible).toBe(false);
  });

  it('projects the eight-area catalog without treating future content as unlocked', () => {
    const areas = selectWorldAreas(createInitialSlimeMercenariesState(0, 5));
    expect(areas).toHaveLength(8);
    expect(areas[0]).toMatchObject({ id: 'area.clover-road', current: true, unlocked: true, contentAvailable: true });
    expect(areas[1]).toMatchObject({ id: 'area.mushroom-forest', current: false, unlocked: false, contentAvailable: false });
    expect(areas.at(-1)?.id).toBe('area.dragon-crater');
  });

  it('surfaces unviewed Codex discoveries as Slimes attention and clears them when viewed', () => {
    const setup = createSwordState();
    expect(selectCodexSummary(setup.state)).toMatchObject({ newSlimeFormCount: 1, newWeaponCount: 0, newCount: 1 });
    expect(selectNavigationAttention(setup.state).has('slimes')).toBe(true);
    const viewed = markCodexEntriesViewed(setup.state, 'slime-form', ['slime.sword']);
    if (!viewed.accepted) throw new Error('Codex view failed');
    expect(selectCodexSummary(viewed.state).newCount).toBe(0);
  });

});
