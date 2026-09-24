import { PUBLIC_VALIDATION_MODE } from './validation-mode';

export type EconomyMode = 'normal' | 'development';

export type SlimeRuntimeSettings = Readonly<{
  economyMode: EconomyMode;
  soundEnabled: boolean;
}>;

export const RUNTIME_SETTINGS_STORAGE_KEY = 'slime-mercenaries.runtime-settings.v1';

export function defaultRuntimeSettings(): SlimeRuntimeSettings {
  return {
    // Keep the currently published validation build convenient for existing QA sessions.
    // A production build defaults new browsers to the real economy.
    economyMode: PUBLIC_VALIDATION_MODE ? 'development' : 'normal',
    soundEnabled: true,
  };
}

export function readRuntimeSettings(storage: Pick<Storage, 'getItem'> | null = browserStorage()): SlimeRuntimeSettings {
  const defaults = defaultRuntimeSettings();
  if (storage === null) return defaults;

  try {
    const raw = storage.getItem(RUNTIME_SETTINGS_STORAGE_KEY);
    if (raw === null) return defaults;
    const parsed = JSON.parse(raw) as { economyMode?: unknown; soundEnabled?: unknown };
    return {
      economyMode: parsed.economyMode === 'development' || parsed.economyMode === 'normal'
        ? parsed.economyMode
        : defaults.economyMode,
      soundEnabled: typeof parsed.soundEnabled === 'boolean' ? parsed.soundEnabled : defaults.soundEnabled,
    };
  } catch {
    return defaults;
  }
}

export function writeRuntimeSettings(
  settings: SlimeRuntimeSettings,
  storage: Pick<Storage, 'setItem'> | null = browserStorage(),
): void {
  if (storage === null) return;
  try {
    storage.setItem(RUNTIME_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Settings persistence must never block gameplay.
  }
}

function browserStorage(): Storage | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}
