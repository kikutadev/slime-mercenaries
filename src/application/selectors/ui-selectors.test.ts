import { describe, expect, it } from 'vitest';
import { addItemInstance, applyRewards, grantToken } from 'idle-game-kit';
import {
  assignSlimeToFormation,
  balance,
  craftPlainSlime,
  createInitialSlimeMercenariesState,
  createJobSlime,
  firstSlimeIdByType,
  grantMutationCatalyst,
  ids,
  fusionSlimeCodexId,
  markCodexDiscovery,
  markCodexEntriesViewed,
  mutationSlimeCodexId,
  resolveCurrencyDefinition,
  weaponDefinitions,
} from '../../domain';
import { selectCampUpgradeOpportunities, selectCodexCatalog, selectCreateSlimePanel, selectDispatchScreen, selectEarlyGameCue, selectForgeWeaponTarget, selectNavigationAttention, selectSlimeDetail, selectSlimeMutationOptions, selectSlimeWeaponOptions } from './ui-selectors';

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

function createBowState() {
  const initial = createInitialSlimeMercenariesState(0, 12);
  const crafted = craftPlainSlime(initial);
  if (!crafted.accepted) throw new Error('setup craft failed');
  const prepared = {
    ...crafted.state,
    tokens: grantToken(crafted.state.tokens, ids.token.trainingBow, 1),
  };
  const created = createJobSlime(prepared, 'bow');
  if (!created.accepted) throw new Error('setup bow failed');
  const bowId = firstSlimeIdByType(created.state, 'bow');
  if (bowId === null) throw new Error('setup bow missing');
  return { state: created.state, bowId };
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

  it('keeps underpowered reserve slimes visible and projects concrete dispatch rewards', () => {
    const setup = createBowState();
    const view = selectDispatchScreen(setup.state);
    const gathering = view.contracts.find((contract) => contract.id === 'materialGathering');
    const escort = view.contracts.find((contract) => contract.id === 'roadEscort');

    expect(gathering?.candidates).toHaveLength(1);
    expect(gathering?.candidates[0]).toMatchObject({
      id: setup.bowId,
      eligible: false,
    });
    expect(gathering?.candidates[0]?.powerGap).toBeGreaterThan(0);
    expect(gathering?.reward).toMatchObject({
      kind: 'hardening-gel',
      label: '硬化ジェル',
      amount: '2',
    });
    expect(escort?.reward.kind).toBe('gold');
    expect(Number(escort?.reward.amount)).toBeGreaterThan(0);
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

  it('projects only compatible owned weapons and exposes transfer ownership before equip', () => {
    const first = createSwordState();
    const stocked = {
      ...first.state,
      tokens: grantToken(
        grantToken(
          grantToken(first.state.tokens, ids.token.slimeGel, balance.plainSlime.craft.slimeGelCost),
          ids.token.lifeWater,
          balance.plainSlime.craft.lifeWaterCost,
        ),
        ids.token.trainingSword,
        1,
      ),
    };
    const crafted = craftPlainSlime(stocked);
    if (!crafted.accepted) throw new Error('setup second plain failed');
    const secondCreated = createJobSlime(crafted.state, 'sword');
    if (!secondCreated.accepted) throw new Error('setup second sword failed');
    const secondSwordId = Object.values(secondCreated.state.gameData.roster.slimes)
      .find((slime) => slime.typeId === 'sword' && slime.id !== first.swordId)?.id;
    if (secondSwordId === undefined) throw new Error('second sword missing');

    let inventory = secondCreated.state.gameData.equipment.inventory;
    for (const definition of [weaponDefinitions.bronzeSaber, weaponDefinitions.cloverBlade, weaponDefinitions.hunterBow]) {
      const added = addItemInstance(inventory, {
        instanceId: `test.${definition.id}`,
        definitionId: definition.id,
        quantity: 1,
        data: { refinementRank: definition.id === weaponDefinitions.cloverBlade.id ? 2 : 0 },
      });
      if (!added.accepted) throw new Error('weapon setup failed');
      inventory = added.inventory;
    }
    let state = {
      ...secondCreated.state,
      gameData: {
        ...secondCreated.state.gameData,
        equipment: { ...secondCreated.state.gameData.equipment, inventory },
      },
    };
    const equipped = {
      ...state.gameData.equipment.loadouts[first.swordId]!,
      equipped: { weapon: `test.${weaponDefinitions.bronzeSaber.id}` },
    };
    state = {
      ...state,
      gameData: {
        ...state.gameData,
        equipment: {
          ...state.gameData.equipment,
          loadouts: { ...state.gameData.equipment.loadouts, [first.swordId]: equipped },
        },
      },
    };

    const view = selectSlimeWeaponOptions(state, secondSwordId);

    expect(view.options.map((option) => option.id)).toEqual([
      weaponDefinitions.cloverBlade.id,
      weaponDefinitions.bronzeSaber.id,
    ]);
    expect(view.options.find((option) => option.id === weaponDefinitions.bronzeSaber.id)).toMatchObject({
      equipped: false,
      equippedBySlimeId: first.swordId,
      equippedByName: '剣士スライム',
    });
    expect(view.options[0]?.effectiveMultiplier).toBeGreaterThan(view.options[1]!.effectiveMultiplier);

    expect(selectForgeWeaponTarget(state, weaponDefinitions.bronzeSaber.id)).toEqual({
      slimeId: first.swordId,
      slimeName: '剣士スライム',
      equipped: true,
    });
    expect(selectForgeWeaponTarget(state, weaponDefinitions.cloverBlade.id)).toMatchObject({
      slimeId: first.swordId,
      slimeName: '剣士スライム',
      equipped: false,
    });
    expect(selectForgeWeaponTarget(state, weaponDefinitions.hunterBow.id)).toBeNull();
    expect(selectForgeWeaponTarget(state, 'weapon.missing')).toBeNull();
  });

  it('projects discovered codex IDs into player-facing slime and weapon metadata', () => {
    const setup = createSwordState();
    let state = markCodexDiscovery(
      setup.state,
      'slime-form',
      fusionSlimeCodexId('sword', 'blademaster'),
    );
    state = markCodexDiscovery(state, 'slime-form', mutationSlimeCodexId('golden'));
    state = markCodexDiscovery(state, 'weapon', weaponDefinitions.starcleaver.id);

    const catalog = selectCodexCatalog(state);

    expect(catalog.slimeForms).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: '剣士スライム', tier: 1 }),
      expect.objectContaining({ name: '剣聖スライム', tier: 3 }),
      expect.objectContaining({ name: 'ゴールデンスライム', tier: null }),
    ]));
    expect(catalog.weapons).toContainEqual(expect.objectContaining({
      id: weaponDefinitions.starcleaver.id,
      name: '星断ちの大剣',
      family: 'sword',
      rarity: 'mythic',
    }));
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