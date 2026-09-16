import { describe, expect, it } from 'vitest';
import {
  assignSlimeToFormation,
  craftPlainSlime,
  createInitialSlimeMercenariesState,
  createJobSlime,
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

describe('battle scene projection', () => {
  it('projects only authoritative formation members', () => {
    const model = selectBattleSceneModel(createSwordBattleState());
    expect(model.allies).toHaveLength(1);
    expect(model.allies[0]?.slimeId).toBe('sword');
    expect(model.allies[0]?.asset).toContain('sword-slime.glb');
  });

  it('does not change the visual key for unrelated token changes', () => {
    const state = createSwordBattleState();
    const before = selectBattleSceneModel(state);
    const after = selectBattleSceneModel({ ...state, tokens: { ...state.tokens, 'token.unrelated': 99 } });
    expect(after.visualKey).toBe(before.visualKey);
  });
});
