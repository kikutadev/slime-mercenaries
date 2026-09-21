
import { describe, expect, it } from 'vitest';
import { createInitialSlimeMercenariesState } from '../domain';
import {
  parseSlimeSave,
  serializeSlimeSave,
  slimeSaveFilename,
} from './save-transfer';

describe('save transfer', () => {
  it('round-trips a validated snapshot and treats import time as the new wall-clock origin', () => {
    const state = createInitialSlimeMercenariesState(1_000, 13);
    const serialized = serializeSlimeSave(state, 2_000);
    const envelope = JSON.parse(serialized) as { formatId: string; gameId: string; exportedAtMs: number };

    expect(envelope).toMatchObject({
      formatId: 'idle-game-kit-save-v1',
      gameId: 'slime-mercenaries',
      exportedAtMs: 2_000,
    });

    const imported = parseSlimeSave(serialized, 9_000);
    expect(imported).toEqual({ ...state, lastWallClockMs: 9_000 });
  });

  it('rejects malformed or foreign data before it reaches persistence', () => {
    expect(() => parseSlimeSave('not-json')).toThrow('ファイルを読み込めません');
    expect(() => parseSlimeSave(JSON.stringify({ formatId: 'idle-game-kit-save-v1', gameId: 'other', exportedAtMs: 1, state: {} }))).toThrow('別のゲーム');
  });

  it('uses a readable JSON filename', () => {
    expect(slimeSaveFilename(new Date(2026, 8, 21, 10, 7))).toBe('slime-mercenaries-save-20260921-1007.json');
  });
});
