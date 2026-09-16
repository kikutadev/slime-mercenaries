import { describe, expect, it } from 'vitest';
import type { ProfileRepository, StoredProfile } from 'idle-game-kit';
import { craftPlainSlime, createJobSlime } from '../domain/commands';
import { assignSlimeToFormation } from '../domain/combat';
import { createInitialSlimeMercenariesState, type SlimeMercenariesState } from '../domain/state';
import { loadOrCreateSlimeProfile, saveSlimeProfile } from './profile';

class MemoryProfileRepository implements ProfileRepository<SlimeMercenariesState> {
  readonly profiles = new Map<string, StoredProfile<SlimeMercenariesState>>();

  async load(profileId: string): Promise<StoredProfile<SlimeMercenariesState> | null> {
    return this.profiles.get(profileId) ?? null;
  }

  async save(profile: StoredProfile<SlimeMercenariesState>): Promise<void> {
    this.profiles.set(profile.profileId, profile);
  }

  async delete(profileId: string): Promise<void> {
    this.profiles.delete(profileId);
  }
}

function createSwordParty(nowMs = 1_000): SlimeMercenariesState {
  const initial = createInitialSlimeMercenariesState(nowMs, 44);
  const crafted = craftPlainSlime(initial);
  if (!crafted.accepted) throw new Error('setup craft failed');
  const created = createJobSlime(crafted.state, 'sword');
  if (!created.accepted) throw new Error('setup job failed');
  const assigned = assignSlimeToFormation(created.state, 'sword', 0);
  if (!assigned.accepted) throw new Error('setup formation failed');
  return assigned.state;
}

describe('profile persistence boundary', () => {
  it('creates and checkpoints a new authoritative profile', async () => {
    const repository = new MemoryProfileRepository();
    const loaded = await loadOrCreateSlimeProfile({ repository, nowMs: 1_000, seed: 7 });

    expect(loaded.created).toBe(true);
    expect(loaded.appliedOfflineSec).toBe(0);
    expect(repository.profiles.get('default')?.state).toEqual(loaded.state);
  });

  it('checkpoints offline resolution so reloading cannot reroll the same drops', async () => {
    const repository = new MemoryProfileRepository();
    const state = createSwordParty(1_000);
    await saveSlimeProfile(repository, 'default', state, 1_000);

    const firstResume = await loadOrCreateSlimeProfile({ repository, nowMs: 61_000 });
    expect(firstResume.appliedOfflineSec).toBe(60);
    expect(repository.profiles.get('default')?.state).toEqual(firstResume.state);

    const rngAfterFirstResume = firstResume.state.rngStreams;
    const tokensAfterFirstResume = firstResume.state.tokens;
    const secondResume = await loadOrCreateSlimeProfile({ repository, nowMs: 61_000 });

    expect(secondResume.appliedOfflineSec).toBe(0);
    expect(secondResume.state.rngStreams).toEqual(rngAfterFirstResume);
    expect(secondResume.state.tokens).toEqual(tokensAfterFirstResume);
  });
});
