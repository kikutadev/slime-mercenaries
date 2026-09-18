import * as THREE from 'three';
import { clampEnemy01, type EnemyAttackVfxPose, type EnemyDefeatPose, type EnemyHitPose, type EnemyMotionProfile, type EnemyPose } from './shared';

export type MushroomBehaviorId = 'mushroom-bump' | 'mushroom-heavy-bump' | 'mushroom-spore' | 'mushroom-boss';

export const ENEMY_MOTION_TIMING = {
  bumpAttack: 0.5,
  heavyAttack: 0.72,
  sporeAttack: 0.78,
  bossAttack: 1.36,
  defeat: 1.05,
} as const;

export const ENEMY_MOTION_THRESHOLDS = {
  bumpContactU: 0.57,
  heavyContactU: 0.6,
  sporeReleaseU: 0.48,
  bossContactU: 0.64,
} as const;

export function getMushroomIdleMotion(now: number, phaseOffset = 0): EnemyPose {
  const breathe = Math.sin(now * 4.6 + phaseOffset);
  const sway = Math.sin(now * 2.5 + phaseOffset * 1.7);
  return { scaleX: 1 + breathe * 0.018, scaleY: 1 - breathe * 0.014, scaleZ: 1 + breathe * 0.018, jump: Math.max(0, Math.sin(now * 2.3 + phaseOffset)) * 0.008, wobbleZ: sway * 0.018, travel: 0, releaseProgress: -1 };
}

export function getMushroomMoveMotion(now: number, phaseOffset = 0): EnemyPose {
  const cycle = (now * 1.75 + phaseOffset) % 1;
  const jump = Math.abs(Math.sin(cycle * Math.PI * 2)) * 0.05;
  const compression = Math.max(0, Math.sin(cycle * Math.PI * 2 + Math.PI * 0.5));
  return { scaleX: 1 + compression * 0.035, scaleY: 1 - compression * 0.07 + jump * 0.5, scaleZ: 1 + compression * 0.035, jump, wobbleZ: Math.sin(cycle * Math.PI * 2) * 0.035, travel: 0, releaseProgress: -1 };
}

function bumpPose(u: number, heavy: boolean): EnemyPose {
  const t = clampEnemy01(u);
  const anticipationEnd = heavy ? 0.34 : 0.25;
  const contact = heavy ? ENEMY_MOTION_THRESHOLDS.heavyContactU : ENEMY_MOTION_THRESHOLDS.bumpContactU;
  let travel = 0;
  if (t >= anticipationEnd && t < contact) travel = Math.sin(((t - anticipationEnd) / (contact - anticipationEnd)) * Math.PI * 0.5);
  else if (t >= contact) travel = 1 - clampEnemy01((t - contact) / (1 - contact));
  const anticipation = t < anticipationEnd ? Math.sin((t / anticipationEnd) * Math.PI) : 0;
  const impact = Math.exp(-Math.pow((t - contact) / (heavy ? 0.12 : 0.09), 2));
  return { scaleX: 1 + anticipation * (heavy ? 0.13 : 0.09) + impact * 0.08, scaleY: 1 - anticipation * (heavy ? 0.2 : 0.14) - impact * 0.11, scaleZ: 1 + anticipation * (heavy ? 0.13 : 0.09), jump: Math.sin(t * Math.PI) * (heavy ? 0.11 : 0.08), wobbleZ: Math.sin(t * Math.PI * 3) * (1 - t) * 0.035, travel, releaseProgress: t >= anticipationEnd ? (t - anticipationEnd) / (1 - anticipationEnd) : -1 };
}

export function getMushroomBumpAttackMotion(u: number): EnemyPose { return bumpPose(u, false); }
export function getMushroomHeavyAttackMotion(u: number): EnemyPose { return bumpPose(u, true); }

export function getMushroomSporeAttackMotion(u: number): EnemyPose {
  const t = clampEnemy01(u);
  const puff = Math.sin(Math.min(1, t / 0.48) * Math.PI * 0.5);
  const recoil = t >= 0.48 ? Math.sin(clampEnemy01((t - 0.48) / 0.28) * Math.PI) : 0;
  return { scaleX: 1 + puff * 0.08 - recoil * 0.04, scaleY: 1 + puff * 0.12 - recoil * 0.08, scaleZ: 1 + puff * 0.08, jump: recoil * 0.025, wobbleZ: Math.sin(t * Math.PI * 2) * 0.025, travel: -recoil * 0.08, releaseProgress: t >= 0.48 ? clampEnemy01((t - 0.48) / 0.52) : -1 };
}

const GREAT_MUSHROOM_CROUCH_END_U = 0.22;
const GREAT_MUSHROOM_LIFT_END_U = 0.48;
const GREAT_MUSHROOM_HANG_END_U = 0.54;
const GREAT_MUSHROOM_CONTACT_U = ENEMY_MOTION_THRESHOLDS.bossContactU;
const GREAT_MUSHROOM_REBOUND_END_U = 0.79;

function smoothEnemy01(value: number): number {
  const t = clampEnemy01(value);
  return t * t * (3 - 2 * t);
}

export function getGreatMushroomAttackMotion(u: number): EnemyPose {
  const t = clampEnemy01(u);
  const crouch = t < GREAT_MUSHROOM_CROUCH_END_U
    ? Math.sin((t / GREAT_MUSHROOM_CROUCH_END_U) * Math.PI * 0.5)
    : t < 0.34
      ? 1 - smoothEnemy01((t - GREAT_MUSHROOM_CROUCH_END_U) / 0.12)
      : 0;

  let jump = 0;
  if (t >= GREAT_MUSHROOM_CROUCH_END_U && t < GREAT_MUSHROOM_LIFT_END_U) {
    jump = smoothEnemy01((t - GREAT_MUSHROOM_CROUCH_END_U) / (GREAT_MUSHROOM_LIFT_END_U - GREAT_MUSHROOM_CROUCH_END_U)) * 0.30;
  } else if (t >= GREAT_MUSHROOM_LIFT_END_U && t < GREAT_MUSHROOM_HANG_END_U) {
    jump = 0.30;
  } else if (t >= GREAT_MUSHROOM_HANG_END_U && t < GREAT_MUSHROOM_CONTACT_U) {
    const drop = smoothEnemy01((t - GREAT_MUSHROOM_HANG_END_U) / (GREAT_MUSHROOM_CONTACT_U - GREAT_MUSHROOM_HANG_END_U));
    jump = (1 - drop) * 0.30;
  } else if (t >= GREAT_MUSHROOM_CONTACT_U && t < GREAT_MUSHROOM_REBOUND_END_U) {
    jump = Math.sin(((t - GREAT_MUSHROOM_CONTACT_U) / (GREAT_MUSHROOM_REBOUND_END_U - GREAT_MUSHROOM_CONTACT_U)) * Math.PI) * 0.065;
  }

  const air = clampEnemy01(jump / 0.30);
  const impact = Math.exp(-Math.pow((t - GREAT_MUSHROOM_CONTACT_U) / 0.052, 2));
  const rebound = t >= GREAT_MUSHROOM_CONTACT_U && t < GREAT_MUSHROOM_REBOUND_END_U
    ? Math.sin(((t - GREAT_MUSHROOM_CONTACT_U) / (GREAT_MUSHROOM_REBOUND_END_U - GREAT_MUSHROOM_CONTACT_U)) * Math.PI)
    : 0;

  let travel = 0;
  if (t >= 0.46 && t < GREAT_MUSHROOM_CONTACT_U) travel = smoothEnemy01((t - 0.46) / (GREAT_MUSHROOM_CONTACT_U - 0.46));
  else if (t >= GREAT_MUSHROOM_CONTACT_U && t < 0.84) travel = 1 - smoothEnemy01((t - GREAT_MUSHROOM_CONTACT_U) / 0.20);

  const landingShake = t >= GREAT_MUSHROOM_CONTACT_U
    ? Math.sin((t - GREAT_MUSHROOM_CONTACT_U) * Math.PI * 18) * Math.exp(-(t - GREAT_MUSHROOM_CONTACT_U) * 9)
    : 0;

  return {
    scaleX: 1 + crouch * 0.18 - air * 0.035 + impact * 0.26 + rebound * 0.035,
    scaleY: 1 - crouch * 0.27 + air * 0.11 - impact * 0.32 + rebound * 0.07,
    scaleZ: 1 + crouch * 0.18 - air * 0.035 + impact * 0.22 + rebound * 0.035,
    jump,
    wobbleZ: t < GREAT_MUSHROOM_CONTACT_U ? Math.sin(t * Math.PI * 2.2) * 0.018 * (1 - air * 0.5) : landingShake * 0.04,
    travel,
    releaseProgress: t >= 0.16 ? clampEnemy01((t - 0.16) / 0.84) : -1,
  };
}

export function getGreatMushroomSlamVfxPose(u: number): EnemyAttackVfxPose {
  const t = clampEnemy01(u);
  const telegraphStart = 0.14;
  const telegraphU = clampEnemy01((t - telegraphStart) / (GREAT_MUSHROOM_CONTACT_U - telegraphStart));
  const postContactFade = 1 - clampEnemy01((t - GREAT_MUSHROOM_CONTACT_U) / 0.12);
  return {
    telegraphOpacity: t < telegraphStart ? 0 : (0.18 + telegraphU * 0.54) * postContactFade,
    telegraphScale: 0.54 + telegraphU * 0.84,
    impactStrength: Math.exp(-Math.pow((t - GREAT_MUSHROOM_CONTACT_U) / 0.048, 2)),
  };
}

export function getMushroomHitMotion(u: number, side: number): EnemyHitPose {
  const t = clampEnemy01(u); const pulse = Math.sin(t * Math.PI);
  return { scaleX: 1 + pulse * 0.1, scaleY: 1 - pulse * 0.17, scaleZ: 1 + pulse * 0.05, rotationZ: side * pulse * 0.1 };
}

export function getMushroomDefeatMotion(u: number, side: number): EnemyDefeatPose {
  const t = clampEnemy01(u);
  const collapse = Math.sin(Math.min(1, t / 0.62) * Math.PI * 0.5);
  const drift = Math.sin(Math.min(1, t / 0.46) * Math.PI * 0.5);
  const fade = clampEnemy01((t - 0.82) / 0.18);
  return { scaleX: 1 + collapse * 0.28, scaleY: 1 - collapse * 0.58, scaleZ: 1 + collapse * 0.1, rotationZ: side * collapse * 0.3, yOffset: -0.028 * collapse - 0.04 * fade, lateralDrift: side * drift * 0.13, backwardDrift: drift * 0.12, opacity: 1 - fade };
}

export const MUSHROOM_SPORE_FLIGHT_SECONDS = 0.42;

export function createMushroomSporeMesh(): THREE.Group {
  const root = new THREE.Group(); root.name = 'MushroomSporeProjectile';
  const coreMaterial = new THREE.MeshBasicMaterial({ color: '#d9b9ff', transparent: true, opacity: 0.92, depthWrite: false });
  root.add(new THREE.Mesh(new THREE.SphereGeometry(0.045, 12, 8), coreMaterial));
  const moteMaterial = new THREE.MeshBasicMaterial({ color: '#f4e8ff', transparent: true, opacity: 0.82, depthWrite: false });
  for (let index = 0; index < 4; index += 1) { const angle = (index / 4) * Math.PI * 2; const mote = new THREE.Mesh(new THREE.SphereGeometry(0.015, 8, 6), moteMaterial); mote.position.set(Math.cos(angle) * 0.065, Math.sin(angle) * 0.038, Math.sin(angle) * 0.024); root.add(mote); }
  return root;
}

export function getMushroomSporeArcHeight(u: number): number { return Math.sin(clampEnemy01(u) * Math.PI) * 0.16; }

const SPORE_PROJECTILE = { kind: 'spore' as const, flightSeconds: MUSHROOM_SPORE_FLIGHT_SECONDS, createMesh: createMushroomSporeMesh, arcHeight: getMushroomSporeArcHeight };

const PROFILES: Record<MushroomBehaviorId, EnemyMotionProfile> = {
  'mushroom-bump': { familyId: 'mushroom', idle: getMushroomIdleMotion, move: getMushroomMoveMotion, attack: getMushroomBumpAttackMotion, hit: getMushroomHitMotion, defeat: getMushroomDefeatMotion, moveDuration: 1.55, moveDistance: 0.7, attackDuration: ENEMY_MOTION_TIMING.bumpAttack, contactU: ENEMY_MOTION_THRESHOLDS.bumpContactU, attackTravelDistance: 0.4, defeatDuration: ENEMY_MOTION_TIMING.defeat },
  'mushroom-heavy-bump': { familyId: 'mushroom', idle: getMushroomIdleMotion, move: getMushroomMoveMotion, attack: getMushroomHeavyAttackMotion, hit: getMushroomHitMotion, defeat: getMushroomDefeatMotion, moveDuration: 1.55, moveDistance: 0.7, attackDuration: ENEMY_MOTION_TIMING.heavyAttack, contactU: ENEMY_MOTION_THRESHOLDS.heavyContactU, attackTravelDistance: 0.4, defeatDuration: ENEMY_MOTION_TIMING.defeat },
  'mushroom-spore': { familyId: 'mushroom', idle: getMushroomIdleMotion, move: getMushroomMoveMotion, attack: getMushroomSporeAttackMotion, hit: getMushroomHitMotion, defeat: getMushroomDefeatMotion, moveDuration: 1.55, moveDistance: 0.7, attackDuration: ENEMY_MOTION_TIMING.sporeAttack, contactU: ENEMY_MOTION_THRESHOLDS.sporeReleaseU, attackTravelDistance: 0.16, defeatDuration: ENEMY_MOTION_TIMING.defeat, projectile: SPORE_PROJECTILE },
  'mushroom-boss': { familyId: 'mushroom', idle: getMushroomIdleMotion, move: getMushroomMoveMotion, attack: getGreatMushroomAttackMotion, hit: getMushroomHitMotion, defeat: getMushroomDefeatMotion, moveDuration: 1.55, moveDistance: 0.7, attackDuration: ENEMY_MOTION_TIMING.bossAttack, contactU: ENEMY_MOTION_THRESHOLDS.bossContactU, attackTravelDistance: 0.5, defeatDuration: ENEMY_MOTION_TIMING.defeat, attackVfx: { color: '#f3b95f', radius: 0.52, pose: getGreatMushroomSlamVfxPose, impactColor: '#ffd58a', impactSize: 0.28, cameraShakeDuration: 0.20, cameraShakeAmplitude: 0.045 } },
};

export function getMushroomMotionProfile(behaviorId: MushroomBehaviorId): EnemyMotionProfile { return PROFILES[behaviorId]; }