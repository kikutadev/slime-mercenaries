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
});
