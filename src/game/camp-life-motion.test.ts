import { describe, expect, it } from 'vitest';
import { applyCampLifeWorldReaction, getCampLifePose } from './camp-life-motion';

describe('camp living-world motion', () => {
  it('uses an authored training loop with visible travel and practice impact', () => {
    const home = getCampLifePose(0.4, 0, 'sword');
    const travel = getCampLifePose(2.2, 0, 'sword');
    const practice = Array.from({ length: 40 }, (_, index) =>
      getCampLifePose(3.05 + index * 0.08, 0, 'sword'));

    expect(home.activity).toBe('idle');
    expect(travel.activity).toBe('travel');
    expect(Math.hypot(travel.x - home.x, travel.z - home.z)).toBeGreaterThan(0.12);
    expect(practice.some((pose) => pose.activity === 'practice' && pose.practiceImpact > 0.2)).toBe(true);
  });

  it('yawns before sleep and keeps a soft drowsy pose rather than defeat-style flattening', () => {
    const yawn = getCampLifePose(3.35, 1, 'shield');
    const sleep = getCampLifePose(6.5, 1, 'shield');
    const wake = getCampLifePose(10.3, 1, 'shield');

    expect(yawn.activity).toBe('yawn');
    expect(yawn.mouthOpen).toBeGreaterThan(2.5);
    expect(yawn.eyeOpen).toBeLessThan(0.7);

    expect(sleep.activity).toBe('sleep');
    expect(sleep.eyeOpen).toBeLessThan(0.3);
    expect(sleep.bodySquash).toBeGreaterThan(0.1);
    expect(sleep.bodySquash).toBeLessThan(0.18);
    expect(Math.abs(sleep.roll)).toBeLessThan(0.11);

    expect(wake.activity).toBe('wake');
    expect(wake.bodyStretch).toBeGreaterThan(0.05);
    expect(wake.eyeOpen).toBeGreaterThan(sleep.eyeOpen);
  });

  it('gives the two social residents reciprocal turns while facing one another', () => {
    const leftTalk = getCampLifePose(4.35, 2, 'bow');
    const rightWait = getCampLifePose(4.35, 3, 'wand');
    const leftWait = getCampLifePose(5.15, 2, 'bow');
    const rightTalk = getCampLifePose(5.15, 3, 'wand');

    expect(leftTalk.activity).toBe('chat');
    expect(rightWait.activity).toBe('chat');
    expect(leftTalk.y).toBeGreaterThan(rightWait.y);

    expect(rightTalk.y).toBeGreaterThan(leftWait.y);
    expect(leftTalk.yaw).toBeGreaterThan(0);
    expect(rightTalk.yaw).toBeLessThan(0);
  });

  it('lets the living Camp react to player actions without replacing the resident routine', () => {
    const base = getCampLifePose(0.5, 2, 'bow');
    const cheer = applyCampLifeWorldReaction(base, 0.52, 2, 'level-up');
    const recruitNotice = applyCampLifeWorldReaction(base, 0.62, 2, 'recruit');
    const formationNod = applyCampLifeWorldReaction(base, 0.34, 2, 'formation');

    expect(cheer.y).toBeGreaterThan(base.y + 0.03);
    expect(cheer.eyeOpen).toBe(1);
    expect(Math.abs(recruitNotice.yaw - base.yaw)).toBeGreaterThan(0.15);
    expect(Math.abs(formationNod.lean - base.lean)).toBeGreaterThan(0.01);
  });

  it('rotates life roles between residents instead of pinning one slime to one activity forever', () => {
    const phase0Slot0 = getCampLifePose(4.2, 0, 'sword');
    const phase1Slot0 = getCampLifePose(18 + 4.2, 0, 'sword');
    const phase1Slot2 = getCampLifePose(18 + 4.2, 2, 'bow');
    const phase2Slot0 = getCampLifePose(36 + 6.0, 0, 'sword');

    expect(phase0Slot0.activity).toBe('practice');
    expect(phase1Slot0.activity).toBe('chat');
    expect(phase1Slot2.activity).toBe('practice');
    expect(phase2Slot0.activity).toBe('sleep');
  });

  it('uses the existing rack, nursery and altar as later living-world destinations', () => {
    const rack = getCampLifePose(72 + 4.2, 0, 'sword');
    const nursery = getCampLifePose(72 + 4.2, 1, 'shield');
    const altar = getCampLifePose(72 + 4.2, 2, 'wand');
    const laterRack = getCampLifePose(90 + 4.2, 1, 'shield');

    expect(rack.activity).toBe('inspect-rack');
    expect(nursery.activity).toBe('inspect-nursery');
    expect(altar.activity).toBe('inspect-altar');
    expect(altar.bodyStretch).toBeGreaterThan(0);
    expect(laterRack.activity).toBe('inspect-rack');
  });

  it('moves continuously between authored points instead of teleporting', () => {
    const samples = Array.from({ length: 31 }, (_, index) =>
      getCampLifePose(1.35 + index * 0.05, 0, 'dagger'));

    let maxStep = 0;
    for (let index = 1; index < samples.length; index += 1) {
      const previous = samples[index - 1]!;
      const current = samples[index]!;
      maxStep = Math.max(maxStep, Math.hypot(current.x - previous.x, current.z - previous.z));
    }

    expect(maxStep).toBeLessThan(0.08);
  });
});
