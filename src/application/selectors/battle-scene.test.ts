import { describe, expect, it } from 'vitest';
import { grantToken } from 'idle-game-kit';
import {
  assignSlimeToFormation,
  craftPlainSlime,
  createInitialSlimeMercenariesState,
  createJobSlime,
  ids,
} from '../../domain';
import { selectBattleSceneModel } from './battle-scene';

function createSwordBattleState() {
  let state = createInitialSlimeMercenariesState(0, 31);
  const crafted = craftPlainSlime(state);
  if (!crafted.accepted) throw new Error('setup craft failed');
  state = crafted.state;
  const created = createJobSlime(state, 'sword');
  if (!created.accepted) throw new Error('setup sword failed');
  const assigned = assignSlimeToFormation(created.state, 'sword', 0);
  if (!assigned.accepted) throw new Error('setup formation failed');
  return assigned.state;
}

function createBowBattleState() {
  let state = createInitialSlimeMercenariesState(0, 41);
  state = {
    ...state,
    tokens: grantToken(
      grantToken(state.tokens, ids.token.plainSlime, 1),
      ids.token.trainingBow,
      1,
    ),
  };
  const created = createJobSlime(state, 'bow');
  if (!created.accepted) throw new Error('setup bow failed');
  const assigned = assignSlimeToFormation(created.state, 'bow', 5);
  if (!assigned.accepted) throw new Error('setup formation failed');
  return assigned.state;
}

describe('battle scene projection', () => {
  it('projects only authoritative formation members', () => {
    const model = selectBattleSceneModel(createSwordBattleState());
    expect(model.allies).toHaveLength(1);
    expect(model.allies[0]?.slimeId).toBe('sword');
    expect(model.allies[0]?.asset).toContain('sword-slime.glb');
    expect(model.allies[0]?.behaviorId).toBe('sword-melee');
  });

  it('preserves formation slot and visual behavior metadata for a back-line ally', () => {
    const model = selectBattleSceneModel(createBowBattleState());
    expect(model.allies).toHaveLength(1);
    expect(model.allies[0]).toMatchObject({
      slimeId: 'bow',
      slotIndex: 5,
      behaviorId: 'bow-ranged',
      equipmentAnchorName: 'BowAnchor',
      formationRole: 'back',
      maxHp: 4,
    });
  });

  it('does not change the visual key for unrelated token changes', () => {
    const state = createSwordBattleState();
    const before = selectBattleSceneModel(state);
    const after = selectBattleSceneModel({ ...state, tokens: { ...state.tokens, 'token.unrelated': 99 } });
    expect(after.visualKey).toBe(before.visualKey);
  });

  it('projects the authored enemy encounter for the current wave', () => {
    const model = selectBattleSceneModel(createSwordBattleState());
    expect(model.encounter?.id).toBe('encounter.clover-road.01.01');
    expect(model.encounter?.displayName).toBe('ちびキノコの群れ');
    expect(model.encounter?.enemies).toHaveLength(3);
    expect(model.encounter?.enemies.every((enemy) => enemy.id === 'tiny-mushroom')).toBe(true);
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
    expect(model.encounter?.enemies.filter((enemy) => enemy.id === 'puff-flower')).toHaveLength(2);
    expect(model.encounter?.enemies.filter((enemy) => enemy.id === 'bud-bloom')).toHaveLength(3);
    expect(model.encounter?.enemies.filter((enemy) => enemy.id === 'puff-flower').every((enemy) => enemy.formationSlot.startsWith('back-'))).toBe(true);
    expect(model.encounterKey).toContain('encounter.clover-road.03.02');
  });

  it('marks only the first farming wave after a boss failure as a retreat handoff', () => {
    const state = createSwordBattleState();
    const retreated = {
      ...state,
      gameData: {
        ...state.gameData,
        progression: { ...state.gameData.progression, currentStage: 4 },
        combat: { ...state.gameData.combat, currentWaveIndex: 0, blockedBossStage: 5 },
      },
    };
    const firstFarmWave = selectBattleSceneModel(retreated);
    expect(firstFarmWave.retreatingFromBoss).toBe(true);
    expect(firstFarmWave.encounterKey).toContain(':retreat');

    const laterFarmWave = selectBattleSceneModel({
      ...retreated,
      gameData: {
        ...retreated.gameData,
        combat: { ...retreated.gameData.combat, currentWaveIndex: 1 },
      },
    });
    expect(laterFarmWave.retreatingFromBoss).toBe(false);
    expect(laterFarmWave.encounterKey).toContain(':advance');
  });

  it('projects the authored great mushroom boss encounter', () => {
    const state = createSwordBattleState();
    const bossState = {
      ...state,
      gameData: {
        ...state.gameData,
        progression: { ...state.gameData.progression, currentStage: 5 },
        combat: { ...state.gameData.combat, currentWaveIndex: 3 },
      },
    };
    const model = selectBattleSceneModel(bossState);
    expect(model.encounter?.id).toBe('encounter.clover-road.05.boss');
    expect(model.encounter?.boss).toBe(true);
    expect(model.encounter?.enemies).toHaveLength(1);
    expect(model.encounter?.enemies[0]?.id).toBe('great-mushroom');
  });
});
