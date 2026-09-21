
import { readCurrency, type ProfileRepository, type StoredProfile } from 'idle-game-kit';
import { describe, expect, it } from 'vitest';
import { firstSlimeIdByType, ids, type SlimeMercenariesState } from '../domain';
import { SlimeGameController } from './game-controller';
import { RUNTIME_SETTINGS_STORAGE_KEY } from './runtime-settings';

class MemoryRepository implements ProfileRepository<SlimeMercenariesState> {
  readonly profiles = new Map<string, StoredProfile<SlimeMercenariesState>>();
  deleteCount = 0;

  async load(profileId: string) {
    const profile = this.profiles.get(profileId);
    return profile === undefined ? null : structuredClone(profile);
  }

  async save(profile: StoredProfile<SlimeMercenariesState>) {
    this.profiles.set(profile.profileId, structuredClone(profile));
  }

  async delete(profileId: string) {
    this.profiles.delete(profileId);
    this.deleteCount += 1;
  }
}

class MemoryStorage implements Pick<Storage, 'getItem' | 'setItem'> {
  readonly values = new Map<string, string>();

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }
}

function storageFor(mode: 'normal' | 'development') {
  const storage = new MemoryStorage();
  storage.setItem(RUNTIME_SETTINGS_STORAGE_KEY, JSON.stringify({ economyMode: mode }));
  return storage;
}

describe('SlimeGameController settings and save management', () => {
  it('keeps development progression isolated from the normal profile', async () => {
    const repository = new MemoryRepository();
    const controller = new SlimeGameController('default', {
      repository,
      settingsStorage: storageFor('normal'),
    });
    await controller.initialize(1_000);

    expect(controller.craftPlainSlime().accepted).toBe(true);
    expect(controller.createJobSlime('sword').accepted).toBe(true);
    const swordId = firstSlimeIdByType(controller.store.getSnapshot(), 'sword');
    if (swordId === null) throw new Error('Sword setup failed.');

    const normalBefore = controller.store.getSnapshot();
    const normalGold = readCurrency(normalBefore.currencies, ids.currency.gold).serialize();
    const normalTokens = structuredClone(normalBefore.tokens);

    await controller.setEconomyMode('development', 2_000);
    expect(controller.validationMode).toBe(true);
    expect(readCurrency(controller.store.getSnapshot().currencies, ids.currency.gold).toNumber()).toBeGreaterThanOrEqual(1_000_000_000_000);

    const leveled = controller.levelUpSlime(swordId, 15);
    expect(leveled.accepted).toBe(true);
    expect(controller.store.getSnapshot().gameData.roster.slimes[swordId]?.level).toBe(16);

    await controller.setEconomyMode('normal', 3_000);
    const restored = controller.store.getSnapshot();
    expect(controller.validationMode).toBe(false);
    expect(restored.currencies[ids.currency.gold]).toEqual(normalGold);
    expect(restored.tokens).toEqual(normalTokens);
    expect(restored.gameData.roster.slimes[swordId]?.level).toBe(1);

    await controller.setEconomyMode('development', 4_000);
    const developmentRestored = controller.store.getSnapshot();
    expect(developmentRestored.gameData.roster.slimes[swordId]?.level).toBe(16);
    expect(repository.profiles.has('default')).toBe(true);
    expect(repository.profiles.has('default.development')).toBe(true);
  });

  it('exports the real resource ledger instead of the development sandbox floor', async () => {
    const repository = new MemoryRepository();
    const controller = new SlimeGameController('default', {
      repository,
      settingsStorage: storageFor('development'),
    });
    await controller.initialize(10_000);

    const exported = JSON.parse(controller.exportSaveData(11_000)) as {
      formatId: string;
      gameId: string;
      state: SlimeMercenariesState;
    };
    expect(exported.formatId).toBe('idle-game-kit-save-v1');
    expect(exported.gameId).toBe('slime-mercenaries');
    expect(readCurrency(exported.state.currencies, ids.currency.gold).toNumber()).toBeLessThan(1_000_000_000_000);
    expect(Math.max(...Object.values(exported.state.tokens))).toBeLessThan(1_000_000);
  });

  it('imports a snapshot and deletes it back to a fresh profile', async () => {
    const source = new SlimeGameController('default', {
      repository: new MemoryRepository(),
      settingsStorage: storageFor('normal'),
    });
    await source.initialize(20_000);
    expect(source.craftPlainSlime().accepted).toBe(true);
    expect(source.createJobSlime('sword').accepted).toBe(true);
    const exported = source.exportSaveData(21_000);

    const targetRepository = new MemoryRepository();
    const target = new SlimeGameController('default', {
      repository: targetRepository,
      settingsStorage: storageFor('normal'),
    });
    await target.initialize(22_000);
    expect(firstSlimeIdByType(target.store.getSnapshot(), 'sword')).toBeNull();

    await target.importSaveData(exported, 23_000);
    expect(firstSlimeIdByType(target.store.getSnapshot(), 'sword')).not.toBeNull();
    expect(target.store.getSnapshot().lastWallClockMs).toBe(23_000);

    await target.deleteSaveData(24_000);
    expect(targetRepository.deleteCount).toBe(1);
    expect(firstSlimeIdByType(target.store.getSnapshot(), 'sword')).toBeNull();
    expect(target.store.getSnapshot().simTimeSec).toBe(0);
  });

  it('deletes only the active mode profile', async () => {
    const repository = new MemoryRepository();
    const controller = new SlimeGameController('default', {
      repository,
      settingsStorage: storageFor('normal'),
    });
    await controller.initialize(40_000);
    expect(controller.craftPlainSlime().accepted).toBe(true);
    expect(controller.createJobSlime('sword').accepted).toBe(true);
    const normalSwordId = firstSlimeIdByType(controller.store.getSnapshot(), 'sword');
    expect(normalSwordId).not.toBeNull();

    await controller.setEconomyMode('development', 41_000);
    await controller.deleteSaveData(42_000);
    expect(firstSlimeIdByType(controller.store.getSnapshot(), 'sword')).toBeNull();

    await controller.setEconomyMode('normal', 43_000);
    expect(firstSlimeIdByType(controller.store.getSnapshot(), 'sword')).toBe(normalSwordId);
  });

  it('rejects invalid import data without replacing the current save', async () => {
    const repository = new MemoryRepository();
    const controller = new SlimeGameController('default', {
      repository,
      settingsStorage: storageFor('normal'),
    });
    await controller.initialize(30_000);
    expect(controller.craftPlainSlime().accepted).toBe(true);
    expect(controller.createJobSlime('sword').accepted).toBe(true);
    const before = controller.store.getSnapshot();

    await expect(controller.importSaveData('{"bad":true}', 31_000)).rejects.toThrow();
    expect(controller.store.getSnapshot()).toEqual(before);
  });
});
