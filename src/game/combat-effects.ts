export type TimedMultiplierEffect = Readonly<{
  multiplier: number;
  expiresAtSec: number;
}>;

/**
 * Create/refresh a temporary multiplier. Lower multipliers are stronger for slow/damage-taken
 * effects, so a weaker refresh never overwrites a stronger active effect.
 */
export function applyTimedMultiplier(
  current: TimedMultiplierEffect | null,
  nowSec: number,
  durationSec: number,
  multiplier: number,
): TimedMultiplierEffect {
  if (!Number.isFinite(nowSec) || !Number.isFinite(durationSec) || durationSec <= 0) {
    throw new RangeError('Timed multiplier duration must be positive and finite.');
  }
  if (!Number.isFinite(multiplier) || multiplier <= 0 || multiplier > 1) {
    throw new RangeError('Timed multiplier must be in (0, 1].');
  }
  const active = current !== null && current.expiresAtSec > nowSec;
  return {
    multiplier: active ? Math.min(current.multiplier, multiplier) : multiplier,
    expiresAtSec: Math.max(active ? current.expiresAtSec : nowSec, nowSec + durationSec),
  };
}

export function resolveTimedMultiplier(effect: TimedMultiplierEffect | null, nowSec: number): number {
  return effect !== null && effect.expiresAtSec > nowSec ? effect.multiplier : 1;
}

export function isExecuteThreshold(hp: number, maxHp: number, threshold = 0.3): boolean {
  if (maxHp <= 0) return false;
  return hp > 0 && hp / maxHp <= threshold;
}

/** Squared XZ-plane distance from a point to a finite line segment. */
export function distanceSqToSegment2D(
  pointX: number,
  pointZ: number,
  startX: number,
  startZ: number,
  endX: number,
  endZ: number,
): number {
  const dx = endX - startX;
  const dz = endZ - startZ;
  const lengthSq = dx * dx + dz * dz;
  if (lengthSq <= Number.EPSILON) {
    const px = pointX - startX;
    const pz = pointZ - startZ;
    return px * px + pz * pz;
  }
  const projection = ((pointX - startX) * dx + (pointZ - startZ) * dz) / lengthSq;
  const t = Math.max(0, Math.min(1, projection));
  const nearestX = startX + dx * t;
  const nearestZ = startZ + dz * t;
  const px = pointX - nearestX;
  const pz = pointZ - nearestZ;
  return px * px + pz * pz;
}
