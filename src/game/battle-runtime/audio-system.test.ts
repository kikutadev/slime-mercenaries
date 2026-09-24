import { describe, expect, it } from 'vitest';
import {
  BattleAudioSystem,
  type BattleAudioBackend,
  type BattleSoundCue,
} from './audio-system';

class FakeBackend implements BattleAudioBackend {
  readonly cues: BattleSoundCue[] = [];
  unlockCount = 0;

  async unlock(): Promise<void> {
    this.unlockCount += 1;
  }

  play(cue: BattleSoundCue): void {
    this.cues.push(cue);
  }
}

describe('BattleAudioSystem', () => {
  it('suppresses all cues while sound is disabled', () => {
    const backend = new FakeBackend();
    const audio = new BattleAudioSystem({
      isEnabled: () => false,
      backend,
      nowMs: () => 1_000,
    });

    audio.play('gun-shot');
    audio.play('victory');

    expect(backend.cues).toEqual([]);
  });

  it('debounces same-cue spam without suppressing different combat cues', () => {
    const backend = new FakeBackend();
    let nowMs = 1_000;
    const audio = new BattleAudioSystem({
      isEnabled: () => true,
      backend,
      nowMs: () => nowMs,
    });

    audio.play('melee-hit');
    nowMs += 10;
    audio.play('melee-hit');
    audio.play('projectile-hit');
    nowMs += 50;
    audio.play('melee-hit');

    expect(backend.cues).toEqual(['melee-hit', 'projectile-hit', 'melee-hit']);
  });

  it('reads the enabled callback live so Settings changes apply without rebuilding Battle', () => {
    const backend = new FakeBackend();
    let enabled = true;
    let nowMs = 1_000;
    const audio = new BattleAudioSystem({
      isEnabled: () => enabled,
      backend,
      nowMs: () => nowMs,
    });

    audio.play('arrow-release');
    enabled = false;
    nowMs += 100;
    audio.play('arrow-release');
    enabled = true;
    nowMs += 100;
    audio.play('arrow-release');

    expect(backend.cues).toEqual(['arrow-release', 'arrow-release']);
  });
});
