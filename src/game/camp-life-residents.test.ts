import { describe, expect, it } from 'vitest';
import { prepareValidationRoster } from '../application/validation-mode';
import {
  createInitialSlimeMercenariesState,
  removeSlimeFromFormation,
  startDispatch,
} from '../domain';
import { selectCampLifeResidents } from './camp-life-residents';

describe('camp life resident selection', () => {
  it('uses real roster instances while excluding the selected Hero and dispatched slimes', () => {
    const prepared = prepareValidationRoster(createInitialSlimeMercenariesState(0, 31));
    if (!prepared.accepted) throw new Error('validation roster setup failed');
    const selected = prepared.state.gameData.roster.formationSlots[0];
    const dispatchCandidate = prepared.state.gameData.roster.formationSlots[1];
    if (selected === null || dispatchCandidate === null) throw new Error('validation formation incomplete');

    const reserve = removeSlimeFromFormation(prepared.state, 1);
    if (!reserve.accepted) throw new Error('reserve setup failed');
    const dispatched = startDispatch(reserve.state, 'roadEscort', dispatchCandidate);
    if (!dispatched.accepted) throw new Error('dispatch setup failed');

    const residents = selectCampLifeResidents(dispatched.state, selected, 4);
    expect(residents).toHaveLength(4);
    expect(residents.map((resident) => resident.instanceId)).not.toContain(selected);
    expect(residents.map((resident) => resident.instanceId)).not.toContain(dispatchCandidate);
    expect(new Set(residents.map((resident) => resident.instanceId)).size).toBe(residents.length);
  });

  it('keeps serial ordering stable so movement roles do not reshuffle frame-to-frame', () => {
    const prepared = prepareValidationRoster(createInitialSlimeMercenariesState(0, 32));
    if (!prepared.accepted) throw new Error('validation roster setup failed');
    const selected = prepared.state.gameData.roster.formationSlots[0];
    if (selected === null) throw new Error('validation formation incomplete');

    const first = selectCampLifeResidents(prepared.state, selected, 4);
    const second = selectCampLifeResidents(prepared.state, selected, 4);
    expect(second.map((resident) => resident.instanceId)).toEqual(first.map((resident) => resident.instanceId));
  });
});
