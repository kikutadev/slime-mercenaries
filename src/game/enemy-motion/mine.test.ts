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
});
