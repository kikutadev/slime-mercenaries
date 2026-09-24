import { readCurrency, type ProfileRepository, type StoredProfile } from 'idle-game-kit';
import { describe, expect, it } from 'vitest';
import { currentCombatEncounterIdentity, firstSlimeIdByType, ids, type SlimeMercenariesState } from '../domain';
import { SlimeGameController } from './game-controller';
import { battleActivityReportIsMeaningful, buildBattleActivityReport, isBattleActivityEvent } from './presentation-events';
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
  it('persists sound preference independently from save profiles', () => {
    const storage = storageFor('normal');
    const controller = new SlimeGameController('default', {
      repository: new MemoryRepository(),
      settingsStorage: storage,
    });

    expect(controller.soundEnabled).toBe(true);
    controller.setSoundEnabled(false);
    expect(controller.soundEnabled).toBe(false);
    expect(JSON.parse(storage.values.get(RUNTIME_SETTINGS_STORAGE_KEY) ?? '{}')).toEqual({
      economyMode: 'normal',
      soundEnabled: false,
    });
  });

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

  it('defers live encounter resolution while Battle owns combat, then commits the rendered result exactly once', async () => {
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
    expect(controller.assignSlime(swordId, 0).accepted).toBe(true);

    const identity = currentCombatEncounterIdentity(controller.store.getSnapshot());
    if (identity === null) throw new Error('Encounter setup failed.');
    controller.setLiveBattleActive(true);

    const analyticalEvents = controller.advanceToWallClock(31_000);
    expect(controller.liveBattleActive).toBe(true);
    expect(analyticalEvents).toEqual([]);
    expect(controller.store.getSnapshot().gameData.combat.currentWaveIndex).toBe(0);
    expect(currentCombatEncounterIdentity(controller.store.getSnapshot())).toEqual(identity);

    const first = controller.resolveLiveBattleEncounter(identity, 'victory');
    expect(first.accepted).toBe(true);
    expect(controller.store.getSnapshot().gameData.combat.currentWaveIndex).toBe(1);

    const duplicate = controller.resolveLiveBattleEncounter(identity, 'victory');
    expect(duplicate.accepted).toBe(false);
    if (duplicate.accepted) throw new Error('Duplicate rendered result unexpectedly accepted.');
    expect(duplicate.reason).toBe('stale-encounter');
    expect(controller.store.getSnapshot().gameData.combat.currentWaveIndex).toBe(1);
  });

  it('emits meaningful live activity while Battle is not the active authority', async () => {
    const controller = new SlimeGameController('default', {
      repository: new MemoryRepository(),
      settingsStorage: storageFor('normal'),
    });
    await controller.initialize(1_000);
    expect(controller.craftPlainSlime().accepted).toBe(true);
    expect(controller.createJobSlime('sword').accepted).toBe(true);
    const swordId = firstSlimeIdByType(controller.store.getSnapshot(), 'sword');
    if (swordId === null) throw new Error('Sword setup failed.');
    expect(controller.assignSlime(swordId, 0).accepted).toBe(true);

    const reports: ReturnType<typeof buildBattleActivityReport>[] = [];
    const unsubscribe = controller.subscribeEvents((events, context) => {
      if (context.source !== 'live' || context.elapsedSec <= 0) return;
      reports.push(buildBattleActivityReport({
        events: events.filter(isBattleActivityEvent),
        elapsedSec: context.elapsedSec,
        from: {
          areaId: context.fromAreaId,
          stageNumber: context.fromStage,
          waveIndex: context.fromWaveIndex,
        },
        to: {
          areaId: context.toAreaId,
          stageNumber: context.toStage,
          waveIndex: context.toWaveIndex,
        },
      }));
    });

    controller.setLiveBattleActive(false);
    controller.advanceToWallClock(31_000);
    unsubscribe();

    expect(reports.length).toBeGreaterThan(0);
    expect(reports.some(battleActivityReportIsMeaningful)).toBe(true);
    expect(reports.some((report) => report.waveClearCount > 0 || report.stageClearCount > 0)).toBe(true);
  });

  it('uses analytical progression again for background time even if Battle was active before suspension', async () => {
    const controller = new SlimeGameController('default', {
      repository: new MemoryRepository(),
      settingsStorage: storageFor('normal'),
    });
    await controller.initialize(1_000);
    expect(controller.craftPlainSlime().accepted).toBe(true);
    expect(controller.createJobSlime('sword').accepted).toBe(true);
    const swordId = firstSlimeIdByType(controller.store.getSnapshot(), 'sword');
    if (swordId === null) throw new Error('Sword setup failed.');
    expect(controller.assignSlime(swordId, 0).accepted).toBe(true);

    controller.setLiveBattleActive(true);
    const events = controller.advanceToWallClock(31_000, { source: 'background' });

    expect(events.some((event) => event.type === 'combatWaveCleared')).toBe(true);
    expect(controller.store.getSnapshot().gameData.combat.currentWaveIndex).not.toBe(0);
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