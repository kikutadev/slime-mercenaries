import { describe, expect, it } from 'vitest';
import { craftPlainSlime, createJobSlime } from './commands';
import { assertSlimeStateInvariants } from './state-invariants';
import { createInitialSlimeMercenariesState } from './state';
import { firstSlimeIdByType } from './roster';
import { assignSlimeToFormation } from './combat';

function swordState() {
  const initial = createInitialSlimeMercenariesState(0, 91);
  const crafted = craftPlainSlime(initial);
  if (!crafted.accepted) throw new Error('setup craft failed');
  const created = createJobSlime(crafted.state, 'sword');
  if (!created.accepted) throw new Error('setup sword failed');
  const swordId = firstSlimeIdByType(created.state, 'sword');
  if (swordId === null) throw new Error('setup sword missing');
  return { state: created.state, swordId };
}

describe('durable state invariants', () => {
  it('accepts clean production states before and after formation assignment', () => {
    const setup = swordState();
    expect(() => assertSlimeStateInvariants(setup.state)).not.toThrow();
    const assigned = assignSlimeToFormation(setup.state, setup.swordId, 0);
    if (!assigned.accepted) throw new Error('setup formation failed');
    expect(() => assertSlimeStateInvariants(assigned.state)).not.toThrow();
  });

  it('rejects stale formation references and assignment mismatches', () => {
    const setup = swordState();
    const corrupted = {
      ...setup.state,
      gameData: {
        ...setup.state.gameData,
        roster: { ...setup.state.gameData.roster, formationSlots: [setup.swordId, null, null, null, null, null] },
      },
    };
    expect(() => assertSlimeStateInvariants(corrupted)).toThrow(/not battle-assigned/);
  });

  it('rejects duplicate serials and orphan loadouts', () => {
    const setup = swordState();
    const slime = setup.state.gameData.roster.slimes[setup.swordId]!;
    const duplicateId = 'slime.999';
    const duplicateSerial = {
      ...setup.state,
      gameData: {
        ...setup.state.gameData,
        roster: {
          ...setup.state.gameData.roster,
          slimes: { ...setup.state.gameData.roster.slimes, [duplicateId]: { ...slime, id: duplicateId } },
        },
        equipment: {
          ...setup.state.gameData.equipment,
          loadouts: { ...setup.state.gameData.equipment.loadouts, [duplicateId]: setup.state.gameData.equipment.loadouts[setup.swordId]! },
        },
      },
    };
    expect(() => assertSlimeStateInvariants(duplicateSerial)).toThrow(/Duplicate slime serial/);

    const orphan = {
      ...setup.state,
      gameData: {
        ...setup.state.gameData,
        equipment: {
          ...setup.state.gameData.equipment,
          loadouts: { ...setup.state.gameData.equipment.loadouts, ghost: setup.state.gameData.equipment.loadouts[setup.swordId]! },
        },
      },
    };
    expect(() => assertSlimeStateInvariants(orphan)).toThrow(/Orphan slime loadout/);
  });

  it('rejects impossible Codex timestamps', () => {
    const setup = swordState();
    const corrupted = {
      ...setup.state,
      gameData: {
        ...setup.state.gameData,
        codex: {
          ...setup.state.gameData.codex,
          slimeForms: {
            ...setup.state.gameData.codex.slimeForms,
            'slime.sword': { discoveredAtSimTimeSec: 10, viewedAtSimTimeSec: 5 },
          },
        },
      },
    };
    expect(() => assertSlimeStateInvariants(corrupted)).toThrow(/Invalid slime form viewed time/);
  });
});
