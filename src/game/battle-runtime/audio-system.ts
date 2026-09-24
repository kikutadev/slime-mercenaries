export type BattleSoundCue =
  | 'melee-hit'
  | 'projectile-hit'
  | 'ally-hit'
  | 'arrow-release'
  | 'magic-release'
  | 'gun-shot'
  | 'ally-defeat'
  | 'enemy-defeat'
  | 'victory'
  | 'defeat'
  | 'boss-land';

export interface BattleAudioBackend {
  unlock(): Promise<void>;
  play(cue: BattleSoundCue): void;
}

const CUE_COOLDOWN_MS: Readonly<Record<BattleSoundCue, number>> = {
  'melee-hit': 42,
  'projectile-hit': 36,
  'ally-hit': 60,
  'arrow-release': 48,
  'magic-release': 70,
  'gun-shot': 55,
  'ally-defeat': 140,
  'enemy-defeat': 90,
  victory: 500,
  defeat: 500,
  'boss-land': 500,
};

class WebAudioBattleBackend implements BattleAudioBackend {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private noiseSeed = 0x5eed1234;

  async unlock(): Promise<void> {
    const context = this.ensureContext();
    if (context === null) return;
    if (context.state === 'suspended') {
      try {
        await context.resume();
      } catch {
        // Browser autoplay policy can reject until a later user gesture.
      }
    }
  }

  play(cue: BattleSoundCue): void {
    const context = this.context;
    const master = this.master;
    if (context === null || master === null || context.state !== 'running') return;

    const now = context.currentTime;
    switch (cue) {
      case 'melee-hit':
        this.noise(now, 0.055, 0.065, 1_900);
        this.tone(now, 0.07, 250, 105, 0.055, 'triangle');
        break;
      case 'projectile-hit':
        this.noise(now, 0.045, 0.048, 2_700);
        this.tone(now, 0.055, 520, 250, 0.032, 'sine');
        break;
      case 'ally-hit':
        this.noise(now, 0.06, 0.045, 1_150);
        this.tone(now, 0.09, 180, 82, 0.042, 'triangle');
        break;
      case 'arrow-release':
        this.noise(now, 0.052, 0.026, 4_400);
        this.tone(now, 0.10, 880, 390, 0.027, 'triangle');
        break;
      case 'magic-release':
        this.tone(now, 0.13, 430, 760, 0.034, 'sine');
        this.tone(now + 0.018, 0.12, 650, 1_020, 0.021, 'sine');
        break;
      case 'gun-shot':
        this.noise(now, 0.075, 0.085, 1_650);
        this.tone(now, 0.09, 125, 52, 0.065, 'square');
        break;
      case 'ally-defeat':
        this.tone(now, 0.22, 230, 92, 0.048, 'triangle');
        this.tone(now + 0.035, 0.18, 165, 72, 0.027, 'sine');
        break;
      case 'enemy-defeat':
        this.noise(now, 0.075, 0.032, 900);
        this.tone(now, 0.13, 300, 132, 0.034, 'triangle');
        break;
      case 'victory':
        this.tone(now, 0.18, 523.25, 587.33, 0.034, 'triangle');
        this.tone(now + 0.09, 0.20, 659.25, 698.46, 0.038, 'triangle');
        this.tone(now + 0.18, 0.26, 783.99, 880, 0.045, 'triangle');
        break;
      case 'defeat':
        this.tone(now, 0.22, 246.94, 185, 0.038, 'triangle');
        this.tone(now + 0.11, 0.26, 196, 123.47, 0.043, 'triangle');
        break;
      case 'boss-land':
        this.noise(now, 0.12, 0.08, 420);
        this.tone(now, 0.20, 95, 48, 0.06, 'sine');
        break;
    }
  }

  private ensureContext(): AudioContext | null {
    if (this.context !== null) return this.context;
    if (typeof window === 'undefined') return null;

    const audioGlobal = window as typeof window & {
      webkitAudioContext?: typeof AudioContext;
    };
    const AudioContextCtor = window.AudioContext ?? audioGlobal.webkitAudioContext;
    if (AudioContextCtor === undefined) return null;

    try {
      const context = new AudioContextCtor();
      const master = context.createGain();
      master.gain.value = 0.14;
      master.connect(context.destination);
      this.context = context;
      this.master = master;
      return context;
    } catch {
      return null;
    }
  }

  private tone(
    startAt: number,
    duration: number,
    startHz: number,
    endHz: number,
    peakGain: number,
    type: OscillatorType,
  ): void {
    const context = this.context;
    const master = this.master;
    if (context === null || master === null) return;

    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(Math.max(20, startHz), startAt);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, endHz), startAt + duration);
    gain.gain.setValueAtTime(0.0001, startAt);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, peakGain), startAt + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
    oscillator.connect(gain);
    gain.connect(master);
    oscillator.start(startAt);
    oscillator.stop(startAt + duration + 0.015);
  }

  private noise(
    startAt: number,
    duration: number,
    peakGain: number,
    lowpassHz: number,
  ): void {
    const context = this.context;
    const master = this.master;
    if (context === null || master === null) return;

    const frameCount = Math.max(1, Math.ceil(context.sampleRate * duration));
    const buffer = context.createBuffer(1, frameCount, context.sampleRate);
    const samples = buffer.getChannelData(0);
    for (let index = 0; index < samples.length; index += 1) {
      // Deterministic LCG keeps the texture stable between repeated attacks.
      this.noiseSeed = (Math.imul(this.noiseSeed, 1_664_525) + 1_013_904_223) >>> 0;
      samples[index] = (this.noiseSeed / 0xffff_ffff) * 2 - 1;
    }

    const source = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const gain = context.createGain();
    source.buffer = buffer;
    filter.type = 'lowpass';
    filter.frequency.value = lowpassHz;
    gain.gain.setValueAtTime(Math.max(0.0002, peakGain), startAt);
    gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    source.start(startAt);
    source.stop(startAt + duration + 0.01);
  }
}

const sharedBackend = new WebAudioBattleBackend();

export class BattleAudioSystem {
  private readonly lastPlayedAt = new Map<BattleSoundCue, number>();

  constructor(
    private readonly options: Readonly<{
      isEnabled: () => boolean;
      backend?: BattleAudioBackend;
      nowMs?: () => number;
    }>,
  ) {}

  play(cue: BattleSoundCue): void {
    if (!this.options.isEnabled()) return;
    const nowMs = (this.options.nowMs ?? Date.now)();
    const last = this.lastPlayedAt.get(cue) ?? -Infinity;
    if (nowMs - last < CUE_COOLDOWN_MS[cue]) return;
    this.lastPlayedAt.set(cue, nowMs);
    (this.options.backend ?? sharedBackend).play(cue);
  }
}

/**
 * Installs the browser-policy unlock hook before Battle mounts.
 * The first pointer/key gesture resumes the shared AudioContext; repeated gestures are harmless.
 */
export function installBattleAudioUnlock(
  target: Pick<Document, 'addEventListener' | 'removeEventListener'> | null =
    typeof document === 'undefined' ? null : document,
): () => void {
  if (target === null) return () => undefined;

  const unlock = () => {
    void sharedBackend.unlock();
  };
  target.addEventListener('pointerdown', unlock, true);
  target.addEventListener('keydown', unlock, true);

  return () => {
    target.removeEventListener('pointerdown', unlock, true);
    target.removeEventListener('keydown', unlock, true);
  };
}
