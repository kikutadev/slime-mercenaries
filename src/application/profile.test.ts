import { describe, expect, it } from 'vitest';
import type { ProfileRepository, StoredProfile } from 'idle-game-kit';
import { craftPlainSlime, createJobSlime } from '../domain/commands';
import { assignSlimeToFormation } from '../domain/combat';
import { firstSlimeIdByType } from '../domain/roster';
import {
  createInitialSlimeMercenariesState,
  createSlimeWeaponLoadout,
  highestStageClearedForArea,
  withHighestStageClearedForArea,
  type SlimeMercenariesState,
} from '../domain/state';
import { loadOrCreateSlimeProfile, saveSlimeProfile } from './profile';

class MemoryProfileRepository implements ProfileRepository<SlimeMercenariesState> {
  readonly profiles = new Map<string, StoredProfile<SlimeMercenariesState>>();
  async load(profileId: string) { return this.profiles.get(profileId) ?? null; }
  async save(profile: StoredProfile<SlimeMercenariesState>) { this.profiles.set(profile.profileId, profile); }
  async delete(profileId: string) { this.profiles.delete(profileId); }
}

function createSwordParty(nowMs = 1_000): SlimeMercenariesState {
  const initial = createInitialSlimeMercenariesState(nowMs, 44);
  const crafted = craftPlainSlime(initial);
  if (!crafted.accepted) throw new Error('setup craft failed');
  const created = createJobSlime(crafted.state, 'sword');
  if (!created.accepted) throw new Error('setup job failed');
  const swordId = firstSlimeIdByType(created.state, 'sword');
  if (swordId === null) throw new Error('setup sword missing');
  const assigned = assignSlimeToFormation(created.state, swordId, 0);
  if (!assigned.accepted) throw new Error('setup formation failed');
  return assigned.state;
}

describe('profile persistence boundary', () => {
  it('creates and checkpoints a new authoritative profile', async () => {
    const repository = new MemoryProfileRepository();
    const loaded = await loadOrCreateSlimeProfile({ repository, nowMs: 1_000, seed: 7 });
    expect(loaded.created).toBe(true);
    expect(loaded.appliedOfflineSec).toBe(0);
    expect(loaded.state.schemaVersion).toBe(5);
    expect(repository.profiles.get('default')?.state).toEqual(loaded.state);
  });

  it('checkpoints offline resolution so reloading cannot reroll the same drops', async () => {
    const repository = new MemoryProfileRepository();
    const state = createSwordParty(1_000);
    await saveSlimeProfile(repository, 'default', state, 1_000);

    const firstResume = await loadOrCreateSlimeProfile({ repository, nowMs: 601_000 });
    expect(firstResume.appliedOfflineSec).toBe(600);
    expect(repository.profiles.get('default')?.state).toEqual(firstResume.state);

    const secondResume = await loadOrCreateSlimeProfile({ repository, nowMs: 601_000 });
    expect(secondResume.appliedOfflineSec).toBe(0);
    expect(secondResume.state.rngStreams).toEqual(firstResume.state.rngStreams);
    expect(secondResume.state.tokens).toEqual(firstResume.state.tokens);
    expect(secondResume.state.gameData.combat).toEqual(firstResume.state.gameData.combat);
  });
});

it('keeps an uncleared major frontier locked during offline resume while farming continues', async () => {
  const repository = new MemoryProfileRepository();
  const base = createSwordParty(1_000);
  const swordId = firstSlimeIdByType(base, 'sword');
  if (swordId === null) throw new Error('setup sword missing');
  const sword = base.gameData.roster.slimes[swordId]!;
  const state: SlimeMercenariesState = {
    ...base,
    gameData: {
      ...base.gameData,
      progression: {
        ...withHighestStageClearedForArea(base.gameData.progression, 'area.clover-road', 4),
        currentStage: 5,
      },
      combat: { currentWaveIndex: 3, waveWorkRemaining: null, retryFarmClearsRemaining: 0, frontierDefeatTimeRemainingSec: null, contentBoundaryReached: false },
      roster: { ...base.gameData.roster, slimes: { ...base.gameData.roster.slimes, [swordId]: { ...sword, level: 20 } } },
    },
  };
  await saveSlimeProfile(repository, 'default', state, 1_000);
  const loaded = await loadOrCreateSlimeProfile({ repository, nowMs: 121_000 });
  expect(loaded.appliedOfflineSec).toBe(120);
  expect(highestStageClearedForArea(loaded.state.gameData.progression)).toBe(4);
  expect(loaded.offlineEvents.some((event) => event.type === 'bossDefeated')).toBe(false);
  expect(loaded.offlineEvents.some((event) => event.type === 'frontierBreakthroughDeferred')).toBe(true);
  expect(loaded.offlineEvents.some((event) => event.type === 'stageCleared' && event.payload?.farming === true)).toBe(true);
});

it('preserves a partially elapsed frontier defeat across reloads without restarting the countdown', async () => {
  const repository = new MemoryProfileRepository();
  const base = createSwordParty(1_000);
  const state: SlimeMercenariesState = {
    ...base,
    gameData: {
      ...base.gameData,
      progression: {
        ...withHighestStageClearedForArea(base.gameData.progression, 'area.clover-road', 4),
        currentStage: 5,
      },
      combat: { currentWaveIndex: 3, waveWorkRemaining: null, retryFarmClearsRemaining: 0, frontierDefeatTimeRemainingSec: 3, contentBoundaryReached: false },
    },
  };
  await saveSlimeProfile(repository, 'default', state, 1_000);

  const afterOneSecond = await loadOrCreateSlimeProfile({ repository, nowMs: 2_000 });
  expect(afterOneSecond.state.gameData.combat.frontierDefeatTimeRemainingSec).toBe(2);
  const sameClockReload = await loadOrCreateSlimeProfile({ repository, nowMs: 2_000 });
  expect(sameClockReload.appliedOfflineSec).toBe(0);
  expect(sameClockReload.state.gameData.combat.frontierDefeatTimeRemainingSec).toBe(2);
  const resolved = await loadOrCreateSlimeProfile({ repository, nowMs: 4_000 });
  expect(resolved.state.gameData.progression.currentStage).toBe(4);
  expect(resolved.state.gameData.combat.frontierDefeatTimeRemainingSec).toBeNull();
  expect(resolved.state.gameData.combat.retryFarmClearsRemaining).toBe(3);
  expect(resolved.offlineEvents.some((event) => event.type === 'partyDefeated')).toBe(true);
});

it('migrates a schema-v3 canonical roster into stable slime instances without losing formation/loadout', async () => {
  const repository = new MemoryProfileRepository();
  const current = createInitialSlimeMercenariesState(1_000, 7);
  const swordLoadout = createSlimeWeaponLoadout('sword');
  const legacy = {
    ...current,
    schemaVersion: 3,
    definitionVersion: '2026-09-18.2',
    gameData: {
      ...current.gameData,
      progression: { currentAreaId: 'area.clover-road', currentStage: 1, highestStageCleared: 0 },
      roster: {
        slimes: {
          sword: { typeId: 'sword', level: 12, jobTier: 2, promotionPathId: 'fighter', fusionRank: 2, fusionFormId: 'greatsword', assignment: 'battle' },
        },
        formationSlots: ['sword', null, null, null, null, null],
      },
      equipment: { inventory: {}, loadouts: { sword: swordLoadout } },
    },
  } as unknown as SlimeMercenariesState;
  await repository.save({ profileId: 'default', savedAtMs: 1_000, state: legacy });

  const loaded = await loadOrCreateSlimeProfile({ repository, nowMs: 1_000 });
  expect(loaded.state.schemaVersion).toBe(5);
  expect(loaded.state.gameData.roster.nextSlimeSerial).toBe(2);
  expect(loaded.state.gameData.roster.slimes['slime.1']).toMatchObject({
    id: 'slime.1', serial: 1, typeId: 'sword', level: 12, jobTier: 2, promotionPathId: 'fighter', fusionRank: 2,
  });
  expect(loaded.state.gameData.roster.formationSlots[0]).toBe('slime.1');
  expect(loaded.state.gameData.equipment.loadouts['slime.1']).toEqual(swordLoadout);
  expect(repository.profiles.get('default')?.state.schemaVersion).toBe(5);
});

it('migrates schema-v0 profiles to the current empty instance roster', async () => {
  const repository = new MemoryProfileRepository();
  const current = createInitialSlimeMercenariesState(1_000, 7);
  const { equipment: _equipment, ...legacyGameData } = current.gameData;
  const legacy = {
    ...current,
    schemaVersion: 0,
    gameData: {
      ...legacyGameData,
      progression: { currentAreaId: 'area.clover-road', currentStage: 1, highestStageCleared: 0 },
    },
  } as unknown as SlimeMercenariesState;
  await repository.save({ profileId: 'default', savedAtMs: 1_000, state: legacy });

  const loaded = await loadOrCreateSlimeProfile({ repository, nowMs: 1_000 });
  expect(loaded.state.schemaVersion).toBe(5);
  expect(loaded.state.gameData.equipment.inventory).toEqual({});
  expect(loaded.state.gameData.equipment.loadouts).toEqual({});
  expect(loaded.state.gameData.roster.slimes).toEqual({});
});

it('migrates schema-v4 per-instance saves into per-area progression without touching roster identity', async () => {
  const repository = new MemoryProfileRepository();
  const current = createSwordParty(1_000);
  const legacy = {
    ...current,
    schemaVersion: 4,
    definitionVersion: '2026-09-18.3',
    gameData: {
      ...current.gameData,
      progression: { currentAreaId: 'area.clover-road', currentStage: 5, highestStageCleared: 4 },
    },
  } as unknown as SlimeMercenariesState;
  await repository.save({ profileId: 'default', savedAtMs: 1_000, state: legacy });

  const loaded = await loadOrCreateSlimeProfile({ repository, nowMs: 1_000 });
  expect(loaded.state.schemaVersion).toBe(5);
  expect(loaded.state.gameData.progression.currentAreaId).toBe('area.clover-road');
  expect(loaded.state.gameData.progression.currentStage).toBe(5);
  expect(highestStageClearedForArea(loaded.state.gameData.progression)).toBe(4);
  expect(loaded.state.gameData.roster).toEqual(current.gameData.roster);
  expect(loaded.state.gameData.equipment).toEqual(current.gameData.equipment);
});

it('migrates schema-v1 boss blocks into an active retreat-farm cycle', async () => {
  const repository = new MemoryProfileRepository();
  const current = createInitialSlimeMercenariesState(1_000, 7);
  const legacy = {
    ...current,
    schemaVersion: 1,
    gameData: {
      ...current.gameData,
      progression: { currentAreaId: 'area.clover-road', currentStage: 5, highestStageCleared: 4 },
      combat: { currentWaveIndex: 3, waveWorkRemaining: null, blockedBossStage: 5, contentBoundaryReached: false },
    },
  } as unknown as SlimeMercenariesState;
  await repository.save({ profileId: 'default', savedAtMs: 1_000, state: legacy });

  const loaded = await loadOrCreateSlimeProfile({ repository, nowMs: 1_000 });
  expect(loaded.state.schemaVersion).toBe(5);
  expect(loaded.state.gameData.progression.currentStage).toBe(4);
  expect(highestStageClearedForArea(loaded.state.gameData.progression)).toBe(4);
  expect(loaded.state.gameData.combat.currentWaveIndex).toBe(0);
  expect(loaded.state.gameData.combat.retryFarmClearsRemaining).toBe(3);
});
