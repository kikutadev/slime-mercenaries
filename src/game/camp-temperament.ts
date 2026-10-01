import type { SlimeInstanceId } from '../domain';

/** Presentation-only personality. It never changes combat/economy values or save shape. */
export type CampTemperament = 'eager' | 'sleepy' | 'social' | 'curious';

const TEMPERAMENTS: readonly CampTemperament[] = ['eager', 'sleepy', 'social', 'curious'];

function hashInstanceIdentity(instanceId: SlimeInstanceId): number {
  let hash = 2166136261;
  for (let index = 0; index < instanceId.length; index += 1) {
    hash ^= instanceId.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/**
 * Derive a stable temperament from the persistent slime instance identity.
 * Current IDs end in a serial number, but the hash fallback keeps this deterministic
 * even if the display format changes later.
 */
export function campTemperamentForInstance(instanceId: SlimeInstanceId): CampTemperament {
  return TEMPERAMENTS[hashInstanceIdentity(instanceId) % TEMPERAMENTS.length]!;
}

/**
 * Desynchronise otherwise identical authored loops without introducing randomness.
 * Re-entering Camp therefore preserves the resident's rhythm instead of redefining it.
 */
export function campRoutineOffsetSec(instanceId: SlimeInstanceId): number {
  const hash = hashInstanceIdentity(instanceId);
  return ((hash >>> 8) % 800) / 100;
}
