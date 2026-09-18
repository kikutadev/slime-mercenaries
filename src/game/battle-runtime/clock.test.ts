import { describe, expect, it } from 'vitest';
import { BattleClock } from './clock';

describe('BattleClock', () => {
  it('freezes simulation time during hit stop and resumes without advancing through the pause', () => {
    const clock = new BattleClock();
    expect(clock.advance(10).simulationNow).toBe(10);

    clock.startHitStop(0.2);
    expect(clock.advance(10.1)).toMatchObject({ hitStopActive: true, simulationNow: 10 });
    expect(clock.advance(10.2)).toMatchObject({ hitStopActive: false, simulationNow: 10 });
    expect(clock.advance(10.5).simulationNow).toBeCloseTo(10.3);
  });

  it('extends an active hit stop instead of starting a second pause', () => {
    const clock = new BattleClock();
    clock.advance(5);
    clock.startHitStop(0.2);
    clock.advance(5.1);
    clock.startHitStop(0.3);

    expect(clock.advance(5.3).hitStopActive).toBe(true);
    expect(clock.advance(5.4).simulationNow).toBeCloseTo(5);
    expect(clock.advance(5.6).simulationNow).toBeCloseTo(5.2);
  });
});
