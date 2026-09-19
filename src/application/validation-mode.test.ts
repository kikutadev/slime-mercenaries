import { describe, expect, it } from 'vitest';
import {
  NORMAL_JOB_SLIME_IDS,
  assignSlimeToFormation,
  createInitialSlimeMercenariesState,
  createJobSlime,
  firstSlimeIdByType,
  fuseSlime,
  levelUpSlime,
  previewSlimeFusions,
} from '../domain';
import { getSlimePresentation } from '../game/slimes';
import { selectBattleSceneModel } from './selectors/battle-scene';
import { applyValidationSandboxResources, prepareValidationRoster } from './validation-mode';

function createAllFamilies() {
  let state = applyValidationSandboxResources(createInitialSlimeMercenariesState(0, 41));
  for (const [slotIndex, typeId] of NORMAL_JOB_SLIME_IDS.entries()) {
    const created = createJobSlime(state, typeId);
    if (!created.accepted) throw new Error(`create ${typeId} rejected: ${created.reason}`);
    state = applyValidationSandboxResources(created.state);
    const slimeId = firstSlimeIdByType(state, typeId);
    if (slimeId === null) throw new Error(`created ${typeId} missing`);
    const assigned = assignSlimeToFormation(state, slimeId, slotIndex);
    if (!assigned.accepted) throw new Error(`assign ${typeId} rejected: ${assigned.reason}`);
    state = applyValidationSandboxResources(assigned.state);
  }
  return state;
}

describe('public validation sandbox', () => {
  it('prepares the full six-family roster through production creation and formation commands', () => {
    const prepared = prepareValidationRoster(createInitialSlimeMercenariesState(0, 31));
    expect(prepared.accepted).toBe(true);
    if (!prepared.accepted) return;
    const slimes = Object.values(prepared.state.gameData.roster.slimes);
    expect(slimes.map((slime) => slime.typeId).sort()).toEqual([...NORMAL_JOB_SLIME_IDS].sort());
    expect(prepared.state.gameData.roster.formationSlots.every((id) => id !== null)).toBe(true);
    expect(prepared.events.filter((event) => event.type === 'slimeJobDiscovered')).toHaveLength(6);
    expect(prepared.events.filter((event) => event.type === 'formationChanged')).toHaveLength(6);
  });

  it('can create all six normal families and field all six through the production battle projection', () => {
    const state = createAllFamilies();
    const scene = selectBattleSceneModel(state);
    expect(scene.allies).toHaveLength(6);
    expect(scene.allies.map((ally) => state.gameData.roster.slimes[ally.slimeId]!.typeId)).toEqual([...NORMAL_JOB_SLIME_IDS]);
    expect(scene.allies.every((ally) => ally.asset.endsWith('.glb'))).toBe(true);
  });

  it('uses explicit production Fusion commands for Tier-3 branches per instance', () => {
    let state = applyValidationSandboxResources(createInitialSlimeMercenariesState(0, 51));
    const created = createJobSlime(state, 'shield');
    if (!created.accepted) throw new Error('create shield rejected: ' + created.reason);
    state = applyValidationSandboxResources(created.state);
    const shieldId = firstSlimeIdByType(state, 'shield');
    if (shieldId === null) throw new Error('shield missing');

    const leveled = levelUpSlime(state, shieldId, 39);
    if (!leveled.accepted) throw new Error('level shield rejected: ' + leveled.reason);
    state = applyValidationSandboxResources(leveled.state);

    for (const fusionId of ['fusion.shield.01-fortified-guard', 'fusion.shield.02-guardian']) {
      const fused = fuseSlime(state, shieldId, fusionId);
      if (!fused.accepted) throw new Error(fusionId + ' rejected: ' + fused.reason);
      state = applyValidationSandboxResources(fused.state);
    }
    expect(getSlimePresentation(state.gameData.roster.slimes[shieldId]!).asset).toBe('assets/guardian-slime.glb');

    const choices = previewSlimeFusions(state, shieldId);
    expect(choices.map((choice) => choice.step?.id)).toEqual(['fusion.shield.03-paladin', 'fusion.shield.03-fortress']);
    expect(choices.every((choice) => choice.canFuse)).toBe(true);
    expect(fuseSlime(state, shieldId).accepted).toBe(false);

    const tier3 = fuseSlime(state, shieldId, 'fusion.shield.03-fortress');
    if (!tier3.accepted) throw new Error('fortress rejected: ' + tier3.reason);
    state = applyValidationSandboxResources(tier3.state);
    expect(state.gameData.roster.slimes[shieldId]?.jobTier).toBe(3);
    expect(state.gameData.roster.slimes[shieldId]?.fusionFormId).toBe('fortress');
    expect(getSlimePresentation(state.gameData.roster.slimes[shieldId]!).asset).toBe('assets/fortress-slime.glb');
  });

  it('keeps authored Fusion commands real while same-type bodies remain separate', () => {
    let state = applyValidationSandboxResources(createInitialSlimeMercenariesState(0, 61));
    let created = createJobSlime(state, 'sword');
    if (!created.accepted) throw new Error(`create sword rejected: ${created.reason}`);
    state = applyValidationSandboxResources(created.state);
    const swordId = firstSlimeIdByType(state, 'sword');
    if (swordId === null) throw new Error('sword missing');

    created = createJobSlime(state, 'sword');
    if (!created.accepted) throw new Error(`duplicate sword rejected: ${created.reason}`);
    state = applyValidationSandboxResources(created.state);
    expect(Object.values(state.gameData.roster.slimes).filter((slime) => slime.typeId === 'sword')).toHaveLength(2);

    const leveled = levelUpSlime(state, swordId, 9);
    if (!leveled.accepted) throw new Error(`level sword rejected: ${leveled.reason}`);
    state = applyValidationSandboxResources(leveled.state);
    const fused = fuseSlime(state, swordId);
    expect(fused.accepted).toBe(true);
    if (!fused.accepted) return;
    state = applyValidationSandboxResources(fused.state);
    expect(state.gameData.roster.slimes[swordId]?.fusionRank).toBe(2);
    expect(getSlimePresentation(state.gameData.roster.slimes[swordId]!).asset).toBe('assets/greatsword-slime.glb');
  });
});
