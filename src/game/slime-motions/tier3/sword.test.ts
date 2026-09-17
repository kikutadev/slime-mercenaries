import { describe, expect, it } from 'vitest';

import { getBerserkerAttackMotion, getBlademasterAttackMotion } from './sword';

const finitePose = (pose: ReturnType<typeof getBlademasterAttackMotion> | ReturnType<typeof getBerserkerAttackMotion>) => {
  expect(Object.values(pose.deformation).every(Number.isFinite)).toBe(true);
  expect(Object.values(pose.equipment).every(Number.isFinite)).toBe(true);
};

describe('tier3 sword motions', () => {
  it('gives Blademaster a coil, dash, delayed cut, and return', () => {
    const coil = getBlademasterAttackMotion(0.15);
    const dash = getBlademasterAttackMotion(0.45);
    const cut = getBlademasterAttackMotion(0.64);
    const end = getBlademasterAttackMotion(1);
    [coil, dash, cut, end].forEach(finitePose);
    expect(coil.deformation.squash).toBeGreaterThan(0.1);
    expect(dash.bodyOffset).toBeGreaterThan(0.5);
    expect(cut.cutProgress).toBeGreaterThanOrEqual(0);
    expect(end.bodyOffset).toBeCloseTo(0, 5);
    expect(end.equipment.angle).toBeCloseTo(0, 5);
  });

  it('gives Berserker a deep windup, violent impact, and separate follow-through', () => {
    const windup = getBerserkerAttackMotion(0.28);
    const impact = getBerserkerAttackMotion(0.50);
    const follow = getBerserkerAttackMotion(0.70);
    const end = getBerserkerAttackMotion(1);
    [windup, impact, follow, end].forEach(finitePose);
    expect(windup.deformation.squash).toBeGreaterThan(0.3);
    expect(impact.impactProgress).toBeGreaterThan(0);
    expect(follow.followThroughProgress).toBeGreaterThanOrEqual(0);
    expect(end.bodyOffset).toBeCloseTo(0, 5);
  });
});
