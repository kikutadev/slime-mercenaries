import { describe, expect, it } from 'vitest';

import {
  AREA_IDS,
  areaDefinitions,
  advanceCombatTo,
  assignSlimeToFormation,
  craftPlainSlime,
  createInitialSlimeMercenariesState,
  createJobSlime,
  firstSlimeIdByType,
  highestStageClearedForArea,
  ids,
  nextCombatBoundarySec,
  type SlimeMercenariesState,
} from './index';

function createOverpoweredWorldParty(): SlimeMercenariesState {
  let state = createInitialSlimeMercenariesState(0, 20260921);
  const crafted = craftPlainSlime(state);
  if (!crafted.accepted) throw new Error('test setup: craft failed');
  state = crafted.state;

  const created = createJobSlime(state, 'sword');
  if (!created.accepted) throw new Error('test setup: sword creation failed');
  state = created.state;

  const swordId = firstSlimeIdByType(state, 'sword');
  if (swordId === null) throw new Error('test setup: sword missing');
  const assigned = assignSlimeToFormation(state, swordId, 0);
  if (!assigned.accepted) throw new Error('test setup: formation failed');
  state = assigned.state;

  const sword = state.gameData.roster.slimes[swordId]!;
  return {
    ...state,
    gameData: {
      ...state.gameData,
      roster: {
        ...state.gameData.roster,
        slimes: {
          ...state.gameData.roster.slimes,
          [swordId]: {
            ...sword,
            level: 100,
            jobTier: 3,
            fusionRank: 4,
            fusionFormId: 'blademaster',
          },
        },
      },
    },
  };
}

describe('full authored world progression', () => {
  it('runs all 40 stages in order and stops only after Dragon Crater stage 5', () => {
    let state = createOverpoweredWorldParty();
    const eventTypes: string[] = [];
    const unlockedAreas: string[] = [];
    let stageClearCount = 0;
    let bossDefeatedCount = 0;

    for (let guard = 0; guard < 500 && !state.gameData.combat.contentBoundaryReached; guard += 1) {
      const boundary = nextCombatBoundarySec(state);
      if (boundary === null) throw new Error('authored world unexpectedly has no next combat boundary');
      const advanced = advanceCombatTo(state, boundary);
      state = advanced.state;
      for (const event of advanced.events) {
        eventTypes.push(event.type);
        if (event.type === 'stageCleared') stageClearCount += 1;
        if (event.type === 'bossDefeated') bossDefeatedCount += 1;
        if (event.type === 'areaUnlocked' && typeof event.payload?.areaId === 'string') {
          unlockedAreas.push(event.payload.areaId);
        }
      }
    }

    expect(state.gameData.combat.contentBoundaryReached).toBe(true);
    expect(state.gameData.progression.currentAreaId).toBe('area.dragon-crater');
    expect(state.gameData.progression.currentStage).toBe(5);
    expect(stageClearCount).toBe(40);
    expect(bossDefeatedCount).toBe(7);
    expect(unlockedAreas).toEqual(AREA_IDS.slice(1));
    expect(eventTypes).not.toContain('partyDefeated');

    for (const areaId of AREA_IDS) {
      expect(highestStageClearedForArea(state.gameData.progression, areaId), areaId).toBe(5);
    }
  });
  it('awards one non-farmable Mimic Heart at the authored hostile Mimic milestone', () => {
    const stage = areaDefinitions['area.moonlit-castle'].stages[2]!;
    const heartRewards = stage.clearRewards.filter((reward) =>
      reward.type === 'token' && reward.tokenId === ids.token.mimicHeart);

    expect(stage.stageNumber).toBe(3);
    expect(heartRewards).toEqual([
      expect.objectContaining({ type: 'token', tokenId: ids.token.mimicHeart, count: 1 }),
    ]);
  });

});
