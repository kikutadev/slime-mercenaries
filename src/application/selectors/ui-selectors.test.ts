import { describe, expect, it } from 'vitest';
import { applyRewards, grantToken } from 'idle-game-kit';
import {
  assignSlimeToFormation,
  craftPlainSlime,
  createInitialSlimeMercenariesState,
  createJobSlime,
  firstSlimeIdByType,
  grantMutationCatalyst,
  ids,
  markCodexEntriesViewed,
  resolveCurrencyDefinition,
} from '../../domain';
import { selectCampUpgradeOpportunities, selectCreateSlimePanel, selectDispatchScreen, selectEarlyGameCue, selectNavigationAttention, selectSlimeDetail, selectSlimeMutationOptions } from './ui-selectors';

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
    expect(view.mimic.icon).toBe('assets/mimic-slime-icon.svg');
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
    let state = applyRewards(setup.state, [
      { type: 'currency', currencyId: ids.currency.gold, amount: 100, source: 'test' },
    ], { resolveCurrencyDefinition }) as typeof setup.state;
    const viewed = markCodexEntriesViewed(state, 'slime-form', Object.keys(state.gameData.codex.slimeForms));
    if (!viewed.accepted) throw new Error('setup codex view failed');
    state = viewed.state;

    expect(selectCampUpgradeOpportunities(state).some((opportunity) => opportunity.kind === 'level')).toBe(true);
    expect(selectNavigationAttention(state).has('slimes')).toBe(false);
    state = { ...state, gameData: { ...state.gameData, combat: { ...state.gameData.combat, retryFarmClearsRemaining: 3 } } };
    expect(selectNavigationAttention(state).has('slimes')).toBe(true);
  });

  it('projects per-instance mutation eligibility and catalyst readiness from Domain state', () => {
    const setup = createSwordState();
    const sword = setup.state.gameData.roster.slimes[setup.swordId]!;
    const tier2State = {
      ...setup.state,
      gameData: {
        ...setup.state.gameData,
        roster: {
          ...setup.state.gameData.roster,
          slimes: {
            ...setup.state.gameData.roster.slimes,
            [setup.swordId]: { ...sword, jobTier: 2 },
          },
        },
      },
    };
    const ready = grantMutationCatalyst(tier2State, 'golden');
    const options = selectSlimeMutationOptions(ready, setup.swordId);
    const golden = options.find((option) => option.id === 'golden');
    const king = options.find((option) => option.id === 'king');

    expect(golden).toMatchObject({
      displayName: 'ゴールデンスライム',
      fragmentName: '黄金ジェル',
      fragmentThreshold: 10,
      eligible: true,
      catalysts: 1,
      canMutate: true,
    });
    expect(king).toMatchObject({ displayName: 'キングスライム', eligible: false, canMutate: false });
    expect(selectSlimeDetail(ready, setup.swordId)?.mutationOptions).toEqual(options);
    expect(selectCampUpgradeOpportunities(ready)).toContainEqual({
      slimeId: setup.swordId,
      kind: 'mutation',
      label: 'レア変異可能',
      priority: 40,
    });
    const viewed = markCodexEntriesViewed(ready, 'slime-form', Object.keys(ready.gameData.codex.slimeForms));
    if (!viewed.accepted) throw new Error('setup codex view failed');
    expect(selectNavigationAttention(viewed.state).has('slimes')).toBe(true);
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
});
