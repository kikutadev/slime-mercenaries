import type { EnemyFormationSlot } from './encounters';
import type { EnemyScaleClass } from './enemies';

export interface EnemyApproachEntryPose {
  zOffset: number;
  yOffset: number;
  scale: number;
  shadowOpacity: number;
  shadowScale: number;
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function easeOutCubic(value: number): number {
  const inverse = 1 - clamp01(value);
  return 1 - inverse * inverse * inverse;
}

function formationDepth(slot: EnemyFormationSlot): number {
  if (slot.startsWith('front-')) return 0;
  if (slot.startsWith('mid-')) return 1;
  if (slot.startsWith('back-')) return 2;
  return 3;
}

export function getEnemyApproachEntryPose(
  elapsed: number,
  instanceIndex: number,
  formationSlot: EnemyFormationSlot,
  scaleClass: EnemyScaleClass,
): EnemyApproachEntryPose {
  const depth = formationDepth(formationSlot);
  const delay = depth * 0.055 + instanceIndex * 0.018;
  const duration = scaleClass === 'boss' ? 0.92 : 0.62;
  const u = clamp01((elapsed - delay) / duration);
  const eased = easeOutCubic(u);
  const startScale = scaleClass === 'boss' ? 0.88 : 0.76;
  const arrivalBounce = Math.sin(Math.PI * u) * (scaleClass === 'boss' ? 0.025 : 0.045);

  return {
    zOffset: (1 - eased) * (scaleClass === 'boss' ? -0.92 : -0.72),
    yOffset: Math.sin(Math.PI * u) * (scaleClass === 'boss' ? 0.055 : 0.09),
    scale: startScale + (1 - startScale) * eased + arrivalBounce,
    shadowOpacity: 0.04 + 0.18 * eased,
    shadowScale: 0.72 + 0.28 * eased,
  };
}

export function getSceneryApproachOffset(elapsed: number): number {
  const u = easeOutCubic(elapsed / 0.78);
  return -0.34 * (1 - u);
}

export function getApproachCameraRetreat(elapsed: number): number {
  const u = easeOutCubic(elapsed / 0.92);
  return 0.22 * (1 - u);
}
