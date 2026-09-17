import { describe, expect, it } from 'vitest';

import { getSniperAttackMotion, getStormArcherAttackMotion, getStormShotReleaseU } from './bow';

const finite = (pose: ReturnType<typeof getSniperAttackMotion> | ReturnType<typeof getStormArcherAttackMotion>) => {
  expect(Object.values(pose.deformation).every(Number.isFinite)).toBe(true);
  expect(Object.values(pose.equipment).every(Number.isFinite)).toBe(true);
};

describe('tier3 bow motions', () => {
  it('gives Sniper a long still aim, crisp release, recoil, and stable return', () => {
    const aim = getSniperAttackMotion(0.38);
    const release = getSniperAttackMotion(0.58);
    const end = getSniperAttackMotion(1);
    [aim, release, end].forEach(finite);
    expect(aim.tension).toBeGreaterThan(0.5);
    expect(aim.focusPulse).toBeGreaterThan(0.5);
    expect(release.release).toBeGreaterThan(0);
    expect(end.recoil).toBeCloseTo(0, 5);
  });

  it('gives Storm Archer three ordered releases with a jumping charged volley', () => {
    expect(getStormShotReleaseU(0)).toBeLessThan(getStormShotReleaseU(1));
    expect(getStormShotReleaseU(1)).toBeLessThan(getStormShotReleaseU(2));
    const charge = getStormArcherAttackMotion(0.20);
    const first = getStormArcherAttackMotion(0.42);
    const second = getStormArcherAttackMotion(0.54);
    const third = getStormArcherAttackMotion(0.66);
    [charge, first, second, third].forEach(finite);
    expect(charge.deformation.squash).toBeGreaterThan(0.2);
    expect(first.shotIndex).toBe(0);
    expect(second.shotIndex).toBe(1);
    expect(third.shotIndex).toBe(2);
    expect(second.electricPulse).toBeGreaterThan(0.5);
  });
});
