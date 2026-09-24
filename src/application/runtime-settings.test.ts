
import { describe, expect, it } from 'vitest';
import {
  RUNTIME_SETTINGS_STORAGE_KEY,
  readRuntimeSettings,
  writeRuntimeSettings,
} from './runtime-settings';

class MemoryStorage implements Pick<Storage, 'getItem' | 'setItem'> {
  values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
}

describe('runtime settings', () => {
  it('persists explicit economy mode independently from game save data', () => {
    const storage = new MemoryStorage();
    writeRuntimeSettings({ economyMode: 'normal', soundEnabled: true }, storage);
    expect(storage.values.get(RUNTIME_SETTINGS_STORAGE_KEY)).toBe(JSON.stringify({ economyMode: 'normal', soundEnabled: true }));
    expect(readRuntimeSettings(storage)).toEqual({ economyMode: 'normal', soundEnabled: true });

    writeRuntimeSettings({ economyMode: 'development', soundEnabled: false }, storage);
    expect(readRuntimeSettings(storage)).toEqual({ economyMode: 'development', soundEnabled: false });
  });

  it('migrates older settings without a sound preference to enabled', () => {
    const storage = new MemoryStorage();
    storage.setItem(RUNTIME_SETTINGS_STORAGE_KEY, JSON.stringify({ economyMode: 'normal' }));
    expect(readRuntimeSettings(storage)).toEqual({ economyMode: 'normal', soundEnabled: true });
  });

  it('falls back when stored settings are malformed', () => {
    const storage = new MemoryStorage();
    storage.setItem(RUNTIME_SETTINGS_STORAGE_KEY, '{broken');
    expect(['normal', 'development']).toContain(readRuntimeSettings(storage).economyMode);
  });
});
