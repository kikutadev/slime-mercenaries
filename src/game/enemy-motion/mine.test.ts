import { describe, expect, it } from 'vitest';
import { getMineMotionProfile, type MineBehaviorId } from './mine';

const IDS: readonly MineBehaviorId[] = [
  'mine-crystal-tackle',
  'mine-burrow-pop',
  'mine-crystal-ring',
  'mine-golem-tackle',
  'mine-amber-boss',
];

describe('Amber Mine production motion profiles', () => {
  for (const id of IDS) {
    it(`${id} keeps every authored state finite`, () => {
      const profile = getMineMotionProfile(id);
      expect(profile.attackDuration).toBeGreaterThan(0);
      expect(profile.contactU).toBeGreaterThan(0);
      expect(profile.contactU).toBeLessThan(1);
      for (let i = 0; i <= 32; i += 1) {
        const u = i / 32;
        const states = [
          profile.idle(u * 2.4, 0.1),
          profile.move(u * profile.moveDuration, 0.1),
          profile.attack(u),
          profile.hit(u, -1),
          profile.defeat(u, 1),
        ];
        for (const state of states) {
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

  it('keeps the five enemies mechanically distinct outside Attack', () => {
    const beetle = getMineMotionProfile('mine-crystal-tackle');
    const mole = getMineMotionProfile('mine-burrow-pop');
    const bat = getMineMotionProfile('mine-crystal-ring');
    const golem = getMineMotionProfile('mine-golem-tackle');
    const turtle = getMineMotionProfile('mine-amber-boss');

    expect(Math.abs(beetle.idle(0.9).secondary?.primaryBend ?? 0)).toBeGreaterThan(0.01);
    expect(mole.move(0.46).jump).toBeLessThan(0);
    expect(Math.abs(bat.idle(0.9).secondary?.open ?? 0)).toBeGreaterThan(0.01);
    expect(Math.abs(golem.idle(0.9).secondary?.open ?? 0)).toBeGreaterThan(0.01);
    expect(Math.abs(turtle.idle(2.5).secondary?.headRetract ?? 0)).toBeGreaterThan(0);

    expect(bat.projectile?.kind).toBe('crystal-ring');
    expect(beetle.projectile).toBeUndefined();
    expect(mole.projectile).toBeUndefined();
    expect(golem.projectile).toBeUndefined();
    expect(turtle.projectile).toBeUndefined();
  });

  it('authors distinct defeat silhouettes instead of one shared collapse', () => {
    const sample = (id: MineBehaviorId) => getMineMotionProfile(id).defeat(0.72, 1);
    const beetle = sample('mine-crystal-tackle');
    const mole = sample('mine-burrow-pop');
    const bat = sample('mine-crystal-ring');
    const golem = sample('mine-golem-tackle');
    const turtle = sample('mine-amber-boss');

    expect(mole.yOffset).toBeLessThan(beetle.yOffset);
    expect(Math.abs(bat.rotationZ)).toBeGreaterThan(Math.abs(beetle.rotationZ));
    expect(golem.secondary?.open ?? 0).toBeGreaterThan(0.1);
    expect(Math.abs(turtle.secondary?.shellRoll ?? 0)).toBeGreaterThan(0.5);
  });

  it('gives the boss a readable retract-hold-roll-secondary-settle sequence', () => {
    const boss = getMineMotionProfile('mine-amber-boss');
    const retract = boss.attack(0.20);
    const hold = boss.attack(0.34);
    const roll = boss.attack(0.58);
    const settle = boss.attack(0.86);

    expect(retract.secondary?.headRetract ?? 0).toBeGreaterThan(0.08);
    expect(hold.secondary?.shellCurl ?? 0).toBeGreaterThan(0.1);
    expect(roll.travel).toBeGreaterThan(0.5);
    expect(Math.abs(roll.secondary?.shellRoll ?? 0)).toBeGreaterThan(0.5);
    expect(Math.abs(settle.secondary?.shellRoll ?? 0)).toBeGreaterThan(0);
  });

  it('crystal-beetle contract: crouch -> crystal lean -> tackle -> delayed rebound', () => {
    const p = getMineMotionProfile('mine-crystal-tackle');
    const crouch = p.attack(0.24);
    const burst = p.attack(0.54);
    const rebound = p.attack(0.82);
    expect(crouch.scaleY).toBeLessThan(0.92);
    expect(crouch.secondary?.primaryBend ?? 0).toBeGreaterThan(0.20);
    expect(burst.travel).toBeGreaterThan(0.60);
    expect(burst.secondary?.primaryBend ?? 0).toBeLessThan(0);
    expect(Math.abs(rebound.secondary?.primaryBend ?? 0)).toBeGreaterThan(0.03);
    expect(p.attackDuration).toBeGreaterThanOrEqual(0.74);
  });

  it('drill-nose-mole contract: visible dive -> underground travel -> fast pop', () => {
    const p = getMineMotionProfile('mine-burrow-pop');
    const dive = p.attack(0.24);
    const underground = p.attack(0.44);
    const pop = p.attack(0.60);
    expect(dive.jump).toBeLessThan(-0.07);
    expect(underground.jump).toBeLessThan(-0.08);
    expect(underground.travel).toBeGreaterThan(0.30);
    expect(pop.jump).toBeGreaterThan(0.12);
    expect(pop.secondary?.primaryBend ?? 0).toBeLessThan(-0.15);
    expect(p.projectile).toBeUndefined();
  });

  it('crystal-bat contract: wing close -> charge pulse -> one ring -> recoil', () => {
    const p = getMineMotionProfile('mine-crystal-ring');
    const close = p.attack(0.28);
    const pulse = p.attack(0.43);
    const recoil = p.attack(0.62);
    expect(close.secondary?.open ?? 0).toBeLessThan(-0.30);
    expect(pulse.scaleX).toBeGreaterThan(1.02);
    expect(recoil.releaseProgress).toBeGreaterThan(0);
    expect(recoil.travel).toBeLessThan(0);
    expect(p.projectile?.kind).toBe('crystal-ring');
    expect(p.projectile?.flightSeconds).toBeGreaterThanOrEqual(0.4);
  });

  it('pebble-golem contract: three-rock gather -> hold -> heavy burst -> separate settle', () => {
    const p = getMineMotionProfile('mine-golem-tackle');
    const gather = p.attack(0.30);
    const hold = p.attack(0.40);
    const burst = p.attack(0.60);
    const settle = p.attack(0.82);
    expect(gather.secondary?.open ?? 0).toBeLessThan(-0.30);
    expect(hold.secondary?.secondaryBend ?? 0).toBeLessThan(-0.05);
    expect(burst.travel).toBeGreaterThan(0.60);
    expect(settle.secondary?.open ?? 0).toBeGreaterThan(0);
    expect(p.defeat(0.72, 1).secondary?.open ?? 0).toBeGreaterThan(0.1);
  });

  it('amber-turtle contract: boss keeps five readable beats and a longer comic defeat', () => {
    const p = getMineMotionProfile('mine-amber-boss');
    const retract = p.attack(0.18);
    const hold = p.attack(0.34);
    const roll = p.attack(0.56);
    const impact = p.attack(0.70);
    const wobble = p.attack(0.86);
    expect(retract.secondary?.headRetract ?? 0).toBeGreaterThan(0.10);
    expect(hold.secondary?.shellCurl ?? 0).toBeGreaterThan(0.15);
    expect(roll.travel).toBeGreaterThan(0.50);
    expect(impact.scaleX).toBeGreaterThan(1.02);
    expect(Math.abs(wobble.secondary?.shellRoll ?? 0)).toBeGreaterThan(0.02);
    expect(p.attackDuration).toBeGreaterThanOrEqual(1.20);
    expect(p.defeatDuration).toBeGreaterThanOrEqual(1.35);
  });

});