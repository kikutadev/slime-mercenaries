import type { UnitState } from './types';

/**
 * Result presentation begins only after every unit on the defeated side has completed
 * its authored collapse animation.
 */
export function areAllUnitsVisiblyDefeated(
  units: readonly Readonly<{ state: UnitState }>[],
): boolean {
  return units.length > 0 && units.every((unit) => unit.state === 'dead');
}
