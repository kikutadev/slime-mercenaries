
import { readCurrency, type ProfileRepository, type StoredProfile } from 'idle-game-kit';
import { describe, expect, it } from 'vitest';
import { firstSlimeIdByType, ids, type SlimeMercenariesState } from '../domain';
import { SlimeGameController } from './game-controller';
import { RUNTIME_SETTINGS_STORAGE_KEY } from './runtime-settings';

class MemoryRepository implements ProfileRepository<SlimeMercenariesState> {
  profile: StoredProfile<SlimeMercenariesState> | null = null;
  deleteCount = 0;

  async load(profileId: string) {
    return this.profile?.profileId === profileId ? this.profile : null;
  }

  async save(profile: StoredProfile<SlimeMercenariesState>) {
    this.profile = structuredClone(profile);
  }

  async delete(profileId: string) {
    if (this.profile?.profileId === profileId) this.profile = null;
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
  it('keeps development resources virtual when switching back to normal mode', async () => {
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

    controller.setEconomyMode('development', 2_000);
    expect(controller.validationMode).toBe(true);
    expect(readCurrency(controller.store.getSnapshot().currencies, ids.currency.gold).toNumber()).toBeGreaterThanOrEqual(1_000_000_000_000);

    const leveled = controller.levelUpSlime(swordId, 15);
    expect(leveled.accepted).toBe(true);
    expect(controller.store.getSnapshot().gameData.roster.slimes[swordId]?.level).toBe(16);

    controller.setEconomyMode('normal', 3_000);
    const restored = controller.store.getSnapshot();
    expect(controller.validationMode).toBe(false);
    expect(restored.currencies[ids.currency.gold]).toEqual(normalGold);
    expect(restored.tokens).toEqual(normalTokens);
    expect(restored.gameData.roster.slimes[swordId]?.level).toBe(16);
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
