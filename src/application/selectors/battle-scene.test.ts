import { describe, expect, it } from 'vitest';
import { grantToken } from 'idle-game-kit';
import {
  assignSlimeToFormation,
  balance,
  craftPlainSlime,
  createInitialSlimeMercenariesState,
  createJobSlime,
  firstSlimeIdByType,
  ids,
  withHighestStageClearedForArea,
} from '../../domain';
import { selectBattleSceneModel } from './battle-scene';

function createSwordBattleState() {
  let state = createInitialSlimeMercenariesState(0, 31);
  const crafted = craftPlainSlime(state);
  if (!crafted.accepted) throw new Error('setup craft failed');
  state = crafted.state;
  const created = createJobSlime(state, 'sword');
  if (!created.accepted) throw new Error('setup sword failed');
  const swordId = firstSlimeIdByType(created.state, 'sword');
  if (swordId === null) throw new Error('setup sword missing');
  const assigned = assignSlimeToFormation(created.state, swordId, 0);
  if (!assigned.accepted) throw new Error('setup formation failed');
  return assigned.state;
}

function createBowBattleState() {
  let state = createInitialSlimeMercenariesState(0, 41);
  state = {
    ...state,
    tokens: grantToken(grantToken(state.tokens, ids.token.plainSlime, 1), ids.token.trainingBow, 1),
  };
  const created = createJobSlime(state, 'bow');
  if (!created.accepted) throw new Error('setup bow failed');
  const bowId = firstSlimeIdByType(created.state, 'bow');
  if (bowId === null) throw new Error('setup bow missing');
  const assigned = assignSlimeToFormation(created.state, bowId, 5);
  if (!assigned.accepted) throw new Error('setup formation failed');
  return assigned.state;
}

describe('battle scene projection', () => {
  it('projects only authoritative formation members', () => {
    const state = createSwordBattleState();
    const model = selectBattleSceneModel(state);
    const swordId = firstSlimeIdByType(state, 'sword');
    expect(model.allies).toHaveLength(1);
    expect(model.allies[0]?.slimeId).toBe(swordId);
    expect(model.allies[0]?.asset).toContain('sword-slime.glb');
    expect(model.allies[0]?.behaviorId).toBe('sword-melee');
  });

  it('preserves formation slot and visual behavior metadata for a back-line ally', () => {
    const state = createBowBattleState();
    const model = selectBattleSceneModel(state);
    const bowId = firstSlimeIdByType(state, 'bow');
    expect(model.allies).toHaveLength(1);
    expect(model.allies[0]).toMatchObject({
      slimeId: bowId,
      slotIndex: 5,
      behaviorId: 'bow-ranged',
      equipmentAnchorName: 'BowAnchor',
      formationRole: 'back',
      maxHp: 4,
    });
  });

  it('projects mutation identity and reloads the visual runtime when it changes', () => {
    const state = createSwordBattleState();
    const swordId = firstSlimeIdByType(state, 'sword');
    if (swordId === null) throw new Error('setup sword missing');
    const before = selectBattleSceneModel(state);
    const sword = state.gameData.roster.slimes[swordId]!;
    const mutated = {
      ...state,
      gameData: {
        ...state.gameData,
        roster: {
          ...state.gameData.roster,
          slimes: {
            ...state.gameData.roster.slimes,
            [swordId]: { ...sword, mutationId: 'golden' as const },
          },
        },
      },
    };
    const after = selectBattleSceneModel(mutated);
    expect(after.allies[0]?.mutationId).toBe('golden');
    expect(after.runtimeKey).not.toBe(before.runtimeKey);
    expect(after.visualKey).not.toBe(before.visualKey);
  });

  it('does not change the visual key for unrelated token changes', () => {
    const state = createSwordBattleState();
    const before = selectBattleSceneModel(state);
    const after = selectBattleSceneModel({ ...state, tokens: { ...state.tokens, 'token.unrelated': 99 } });
    expect(after.visualKey).toBe(before.visualKey);
  });

  it('projects a stable absolute wall-clock deadline for the current Domain boundary', () => {
    const state = createSwordBattleState();
    const model = selectBattleSceneModel(state);
    expect(model.authoritativeResultDeadlineMs).toBe(state.lastWallClockMs + 6_000);
  });

  it('projects the authored Clover Road encounter without leaking Mushroom Forest enemies', () => {
    const state = createSwordBattleState();
    const model = selectBattleSceneModel(state);
    expect(model.areaId).toBe('area.clover-road');
    expect(model.encounter?.id).toBe('encounter.clover-road.01.01');
    expect(model.encounter?.displayName).toBe('ちびリーフ');
    expect(model.encounter?.enemies).toHaveLength(3);
    expect(model.encounter?.enemies.every((enemy) => enemy.id === 'leafling')).toBe(true);
    expect(model.authoritativeResult).toBe('victory');
    expect(model.authoritativeResultDeadlineMs).toBe(state.lastWallClockMs + 6_000);
  });

  it('changes enemy composition with stage and wave progression', () => {
    const state = createSwordBattleState();
    const advanced = {
      ...state,
      gameData: {
        ...state.gameData,
        progression: { ...state.gameData.progression, currentStage: 3 },
        combat: { ...state.gameData.combat, currentWaveIndex: 1 },
      },
    };
    const model = selectBattleSceneModel(advanced);
    expect(model.encounter?.id).toBe('encounter.clover-road.03.02');
    expect(model.encounter?.enemies).toHaveLength(3);
    expect(model.encounter?.enemies.every((enemy) => enemy.id === 'puff-flower')).toBe(true);
    expect(model.encounter?.enemies.every((enemy) => enemy.formationSlot.startsWith('back-'))).toBe(true);
    expect(model.encounterKey).toContain('encounter.clover-road.03.02');
  });

  it('projects the authored Mushroom Forest boss encounter', () => {
    const state = createSwordBattleState();
    const bossState = {
      ...state,
      gameData: {
        ...state.gameData,
        progression: {
          ...state.gameData.progression,
          currentAreaId: 'area.mushroom-forest',
          currentStage: 5,
        },
        combat: { ...state.gameData.combat, currentWaveIndex: 3 },
      },
    };
    const model = selectBattleSceneModel(bossState);
    expect(model.areaId).toBe('area.mushroom-forest');
    expect(model.encounter?.id).toBe('encounter.mushroom-forest.05.boss');
    expect(model.encounter?.boss).toBe(true);
    expect(model.encounter?.enemies).toHaveLength(1);
    expect(model.encounter?.enemies[0]?.id).toBe('great-mushroom');
  });

  it('keeps the final real boss visible after Dragon Crater reaches the world boundary', () => {
    const state = createSwordBattleState();
    const dragonProgress = withHighestStageClearedForArea(
      state.gameData.progression,
      'area.dragon-crater',
      5,
    );
    const boundaryState = {
      ...state,
      gameData: {
        ...state.gameData,
        progression: {
          ...dragonProgress,
          currentAreaId: 'area.dragon-crater',
          currentStage: 5,
        },
        combat: {
          ...state.gameData.combat,
          currentWaveIndex: 0,
          contentBoundaryReached: true,
        },
      },
    };

    const model = selectBattleSceneModel(boundaryState);
    expect(model.areaId).toBe('area.dragon-crater');
    expect(model.encounter?.id).toBe('encounter.dragon-crater.05.boss');
    expect(model.encounter?.boss).toBe(true);
    expect(model.encounter?.enemies[0]?.id).toBe('star-eater-dragon');
    expect(model.authoritativeResult).toBe('victory');
    expect(model.authoritativeResultDeadlineMs).toBe(boundaryState.lastWallClockMs);
  });

  it('projects an authored defeat for an underpowered normal frontier stage', () => {
    const state = createSwordBattleState();
    const frontierState = {
      ...state,
      gameData: {
        ...state.gameData,
        progression: {
          ...withHighestStageClearedForArea(state.gameData.progression, 'area.clover-road', 2),
          currentStage: 3,
        },
        combat: { ...state.gameData.combat, currentWaveIndex: 0 },
      },
    };
    const model = selectBattleSceneModel(frontierState);
    expect(model.encounter?.id).toBe('encounter.clover-road.03.01');
    expect(model.authoritativeResult).toBe('defeat');
    expect(model.authoritativeResultDeadlineMs)
      .toBe(frontierState.lastWallClockMs + balance.combat.frontier.defeatDurationSec * 1_000);
  });

  it('uses the stage-5 Clover gauntlet itself as the final Area 1 frontier', () => {
    const state = createSwordBattleState();
    const frontierState = {
      ...state,
      gameData: {
        ...state.gameData,
        progression: {
          ...withHighestStageClearedForArea(state.gameData.progression, 'area.clover-road', 4),
          currentStage: 5,
        },
        combat: { ...state.gameData.combat, currentWaveIndex: 0 },
      },
    };
    const model = selectBattleSceneModel(frontierState);
    expect(model.encounter?.id).toBe('encounter.clover-road.05.01');
    expect(model.encounter?.boss).toBe(false);
    expect(model.authoritativeResult).toBe('defeat');
    expect(model.authoritativeResultDeadlineMs)
      .toBe(frontierState.lastWallClockMs + balance.combat.frontier.defeatDurationSec * 1_000);
  });
});
