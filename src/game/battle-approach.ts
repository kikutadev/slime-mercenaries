import type { EnemyFormationSlot } from './encounters';
import type { EnemyScaleClass } from './enemies';

export const NORMAL_APPROACH_SECONDS = 1.55;
export const BOSS_APPROACH_SECONDS = 1.90;
export const BOSS_LANDING_SECONDS = 1.02;
export const NORMAL_MIN_COMBAT_PREVIEW_SECONDS = 0.22;
export const BOSS_MIN_COMBAT_PREVIEW_SECONDS = 0.28;

export function minimumCombatPreviewSeconds(bossEncounter: boolean): number {
  return bossEncounter ? BOSS_MIN_COMBAT_PREVIEW_SECONDS : NORMAL_MIN_COMBAT_PREVIEW_SECONDS;
}

export function approachDurationSeconds(bossEncounter: boolean): number {
  return bossEncounter ? BOSS_APPROACH_SECONDS : NORMAL_APPROACH_SECONDS;
}

export interface BossApproachPresentation {
  cameraRetreat: number;
  squash: number;
}

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
  const duration = scaleClass === 'boss' ? 1.08 : 0.62;
  const u = clamp01((elapsed - delay) / duration);
  const eased = easeOutCubic(u);
  const startScale = scaleClass === 'boss' ? 0.78 : 0.76;
  const arrivalBounce = Math.sin(Math.PI * u) * (scaleClass === 'boss' ? 0.025 : 0.045);

  return {
    zOffset: (1 - eased) * (scaleClass === 'boss' ? -1.36 : -0.72),
    yOffset: Math.sin(Math.PI * u) * (scaleClass === 'boss' ? 0.04 : 0.09),
    scale: startScale + (1 - startScale) * eased + arrivalBounce,
    shadowOpacity: 0.04 + 0.18 * eased,
    shadowScale: 0.72 + 0.28 * eased,
  };
}

export function getBossApproachPresentation(elapsed: number): BossApproachPresentation {
  const safeElapsed = Math.max(0, elapsed);
  const cameraU = easeOutCubic(safeElapsed / 1.25);
  const landingDistance = Math.abs(safeElapsed - BOSS_LANDING_SECONDS);
  const squash = clamp01(1 - landingDistance / 0.18);
  return {
    cameraRetreat: 0.48 * (1 - cameraU),
    squash,
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
