import { describe, expect, it } from 'vitest';
import { getMarshMotionProfile, type MarshBehaviorId } from './marsh';

const IDS: readonly MarshBehaviorId[] = [
  'marsh-frog-hop',
  'marsh-sprout-orb',
  'marsh-bubble-pulse',
  'marsh-lily-skim',
  'marsh-frog-boss',
];

describe('Sunken Marsh production motion profiles', () => {
  for (const id of IDS) {
    it(`${id} keeps every authored state finite`, () => {
      const profile = getMarshMotionProfile(id);
      expect(profile.contactU).toBeGreaterThan(0);
      expect(profile.contactU).toBeLessThan(1);
      for (let i = 0; i <= 32; i += 1) {
        const u = i / 32;
        for (const state of [
          profile.idle(u * 2.4, 0.1),
          profile.move(u * profile.moveDuration, 0.1),
          profile.attack(u),
          profile.hit(u, -1),
          profile.defeat(u, 1),
        ]) {
          for (const value of Object.values(state).filter((candidate) => typeof candidate === 'number')) {
            expect(Number.isFinite(value)).toBe(true);
          }
          if (state.secondary) {
            for (const value of Object.values(state.secondary).filter((candidate) => typeof candidate === 'number')) {
              expect(Number.isFinite(value)).toBe(true);
            }
          }
        }
      }
    });
  }

  it('keeps the five silhouettes tied to different secondary motion channels', () => {
    const frog = getMarshMotionProfile('marsh-frog-hop');
    const sprout = getMarshMotionProfile('marsh-sprout-orb');
    const snail = getMarshMotionProfile('marsh-bubble-pulse');
    const lily = getMarshMotionProfile('marsh-lily-skim');
    const boss = getMarshMotionProfile('marsh-frog-boss');

    expect(Math.abs(frog.idle(0.9).secondary?.inflate ?? 0)).toBeGreaterThan(0.01);
    expect(Math.abs(sprout.idle(0.9).secondary?.open ?? 0)).toBeGreaterThan(0.01);
    expect(Math.abs(snail.idle(0.9).secondary?.secondaryBend ?? 0)).toBeGreaterThan(0.01);
    expect(Math.abs(lily.idle(0.9).secondary?.primaryBend ?? 0)).toBeGreaterThan(0.01);
    expect(Math.abs(boss.idle(0.9).secondary?.inflate ?? 0)).toBeGreaterThan(0.01);
    expect(sprout.projectile?.kind).toBe('water-orb');
  });

  it('makes the lily read as a fast flat skim rather than a hop', () => {
    const lily = getMarshMotionProfile('marsh-lily-skim');
    const attack = lily.attack(0.52);
    expect(attack.travel).toBeGreaterThan(0.5);
    expect(attack.jump).toBeLessThan(0.02);
    expect(Math.abs(attack.wobbleZ)).toBeGreaterThan(0.03);
  });

  it('gives the boss a three-step inflation, still hold, release and delayed throat wobble', () => {
    const boss = getMarshMotionProfile('marsh-frog-boss');
    const one = boss.attack(0.12);
    const oneHalf = boss.attack(0.25);
    const two = boss.attack(0.40);
    const hold = boss.attack(0.51);
    const release = boss.attack(0.62);
    const wobble = boss.attack(0.78);

    expect(one.secondary?.inflate ?? 0).toBeGreaterThan(0.1);
    expect(oneHalf.secondary?.inflate ?? 0).toBeGreaterThan(one.secondary?.inflate ?? 0);
    expect(two.secondary?.inflate ?? 0).toBeGreaterThan(oneHalf.secondary?.inflate ?? 0);
    expect(hold.secondary?.inflate ?? 0).toBeGreaterThan(0.95);
    expect(release.scaleX).toBeGreaterThan(1.05);
    expect(Math.abs(wobble.secondary?.inflate ?? 0)).toBeGreaterThan(0);
  });

  it('authors distinct comic defeat reads', () => {
    const frog = getMarshMotionProfile('marsh-frog-hop').defeat(0.72, 1);
    const sprout = getMarshMotionProfile('marsh-sprout-orb').defeat(0.72, 1);
    const snail = getMarshMotionProfile('marsh-bubble-pulse').defeat(0.72, 1);
    const lily = getMarshMotionProfile('marsh-lily-skim').defeat(0.72, 1);
    const boss = getMarshMotionProfile('marsh-frog-boss').defeat(0.72, 1);

    expect(frog.scaleY).toBeLessThan(0.7);
    expect(sprout.secondary?.open ?? 0).toBeLessThan(-0.2);
    expect(snail.secondary?.inflate ?? 0).toBeLessThan(-0.2);
    expect(Math.abs(lily.rotationZ)).toBeGreaterThan(1);
    expect(boss.secondary?.inflate ?? 0).toBeLessThan(-0.3);
  });

  it('puff-frog contract: throat tell -> hold -> hop -> pancake impact', () => {
    const p = getMarshMotionProfile('marsh-frog-hop');
    const inflate = p.attack(0.22);
    const hold = p.attack(0.36);
    const hop = p.attack(0.56);
    const impact = p.attack(0.78);
    expect(inflate.secondary?.inflate ?? 0).toBeGreaterThan(0.20);
    expect(hold.secondary?.inflate ?? 0).toBeGreaterThan(inflate.secondary?.inflate ?? 0);
    expect(hop.jump).toBeGreaterThan(0.14);
    expect(impact.scaleY).toBeLessThan(0.80);
    expect(p.attackDuration).toBeGreaterThanOrEqual(0.90);
  });

  it('marsh-sprout contract: leaves close -> body gathers -> single water orb release', () => {
    const p = getMarshMotionProfile('marsh-sprout-orb');
    const close = p.attack(0.26);
    const gather = p.attack(0.38);
    const release = p.attack(0.60);
    expect(close.secondary?.open ?? 0).toBeLessThan(-0.30);
    expect(gather.scaleZ).toBeGreaterThan(1.05);
    expect(release.releaseProgress).toBeGreaterThan(0);
    expect(release.secondary?.open ?? 0).toBeGreaterThan(0);
    expect(p.projectile?.kind).toBe('water-orb');
    expect(p.defeat(0.72, 1).secondary?.open ?? 0).toBeLessThan(-0.20);
  });

  it('bubble-snail contract: body compresses before shell pulse and shell settles late', () => {
    const p = getMarshMotionProfile('marsh-bubble-pulse');
    const compress = p.attack(0.26);
    const pulse = p.attack(0.56);
    const settle = p.attack(0.78);
    expect(compress.secondary?.inflate ?? 0).toBeLessThan(-0.18);
    expect(pulse.travel).toBeGreaterThan(0.40);
    expect(pulse.secondary?.inflate ?? 0).toBeGreaterThan(0.08);
    expect(Math.abs(settle.secondary?.secondaryBend ?? 0)).toBeGreaterThan(0.01);
    expect(p.defeat(0.76, 1).secondary?.inflate ?? 0).toBeLessThan(-0.25);
  });

  it('skimming-lily contract: left-right tilt -> flat skim -> trailing wake', () => {
    const p = getMarshMotionProfile('marsh-lily-skim');
    const left = p.attack(0.10);
    const right = p.attack(0.25);
    const skim = p.attack(0.50);
    const wake = p.attack(0.74);
    expect(left.wobbleZ).toBeLessThan(-0.08);
    expect(right.wobbleZ).toBeGreaterThan(0.08);
    expect(skim.travel).toBeGreaterThan(0.60);
    expect(skim.jump).toBeLessThan(0.02);
    expect(Math.abs(wake.secondary?.secondaryBend ?? 0)).toBeGreaterThan(0.04);
    expect(Math.abs(p.defeat(0.72, 1).rotationZ)).toBeGreaterThan(1.5);
  });

  it('great-marsh-frog contract: boss differs from normal frog with stepped inflation and long settle', () => {
    const p = getMarshMotionProfile('marsh-frog-boss');
    const step1 = p.attack(0.12);
    const step2 = p.attack(0.25);
    const step3 = p.attack(0.40);
    const hold = p.attack(0.51);
    const release = p.attack(0.62);
    const wobble = p.attack(0.80);
    expect(step2.secondary?.inflate ?? 0).toBeGreaterThan(step1.secondary?.inflate ?? 0);
    expect(step3.secondary?.inflate ?? 0).toBeGreaterThan(step2.secondary?.inflate ?? 0);
    expect(hold.secondary?.inflate ?? 0).toBeGreaterThan(0.95);
    expect(release.scaleX).toBeGreaterThan(1.05);
    expect(Math.abs(wobble.secondary?.inflate ?? 0)).toBeGreaterThan(0.01);
    expect(p.attackDuration).toBeGreaterThanOrEqual(1.35);
    expect(p.defeatDuration).toBeGreaterThanOrEqual(1.45);
  });

});