
import { parseSaveEnvelope, serializeSave } from 'idle-game-kit';
import type { SlimeMercenariesState } from '../domain';
import { migrateStoredSlimeState, validateStoredSlimeState } from './profile';

export function serializeSlimeSave(state: SlimeMercenariesState, exportedAtMs = Date.now()): string {
  validateStoredSlimeState(state);
  return serializeSave(state, exportedAtMs);
}

export function parseSlimeSave(serialized: string, importedAtMs = Date.now()): SlimeMercenariesState {
  const parsed = parseSaveEnvelope(serialized, 'slime-mercenaries');
  if (!parsed.accepted) {
    if (parsed.reason === 'invalid-json') throw new Error('ファイルを読み込めません。');
    if (parsed.reason === 'wrong-game') throw new Error('別のゲームのセーブデータです。');
    throw new Error('セーブデータの形式が正しくありません。');
  }

  const candidate = parsed.envelope.state;
  if (!isRecord(candidate)
    || candidate.gameId !== 'slime-mercenaries'
    || !Number.isSafeInteger(candidate.schemaVersion)) {
    throw new Error('セーブデータの状態が正しくありません。');
  }

  const migrated = migrateStoredSlimeState(candidate as unknown as SlimeMercenariesState);
  const imported: SlimeMercenariesState = {
    ...migrated,
    // Import is a snapshot restore, not an offline-time claim from the export date.
    lastWallClockMs: importedAtMs,
  };
  validateStoredSlimeState(imported);
  return imported;
}

export function slimeSaveFilename(now = new Date()): string {
  const stamp = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
    '-',
    String(now.getHours()).padStart(2, '0'),
    String(now.getMinutes()).padStart(2, '0'),
  ].join('');
  return `slime-mercenaries-save-${stamp}.json`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
