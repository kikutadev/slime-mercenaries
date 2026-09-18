import * as THREE from 'three';
import { clampEnemy01, type EnemyAttackVfxPose, type EnemyDefeatPose, type EnemyHitPose, type EnemyMotionProfile, type EnemyPose } from './shared';

export type MushroomBehaviorId = 'mushroom-bump' | 'mushroom-heavy-bump' | 'mushroom-spore' | 'mushroom-boss';

export const ENEMY_MOTION_TIMING = {
  bumpAttack: 0.50,
  heavyAttack: 0.82,
  sporeAttack: 0.82,
  bossAttack: 1.36,
  defeat: 1.05,
  bossDefeat: 1.72,
} as const;

export const ENEMY_MOTION_THRESHOLDS = {
  bumpContactU: 0.57,
  heavyContactU: 0.60,
  sporeReleaseU: 0.48,
  bossContactU: 0.64,
} as const;

const TAU = Math.PI * 2;
const lerp = (from: number, to: number, t: number): number => from + (to - from) * clampEnemy01(t);
const smooth01 = (value: number): number => {
  const t = clampEnemy01(value);
  return t * t * (3 - 2 * t);
};

export function getTinyMushroomIdleMotion(now: number, phaseOffset = 0): EnemyPose {
  const breathe = Math.sin(now * 1.55 + phaseOffset);
  const sway = Math.sin(now * 1.08 + phaseOffset - 0.35);
  return {
    scaleX: 1 + breathe * 0.008,
    scaleY: 1 - breathe * 0.006,
    scaleZ: 1 + breathe * 0.008,
    jump: Math.max(0, sway) * 0.004,
    wobbleZ: sway * 0.009,
    travel: 0,
    releaseProgress: -1,
  };
}

export function getTinyMushroomMoveMotion(now: number, phaseOffset = 0): EnemyPose {
  const cycle = ((now * 1.82 + phaseOffset) % 1 + 1) % 1;
  const lift = Math.sin(cycle * Math.PI) ** 2;
  const follow = Math.sin(cycle * TAU);
  return {
    scaleX: 1 + lift * 0.020,
    scaleY: 1 - lift * 0.030,
    scaleZ: 1 + lift * 0.016,
    jump: lift * 0.052,
    wobbleZ: follow * 0.020,
    travel: 0,
    releaseProgress: -1,
  };
}

export function getPlumpMushroomIdleMotion(now: number, phaseOffset = 0): EnemyPose {
  const breathe = Math.sin(now * 0.82 + phaseOffset);
  return {
    scaleX: 1 + breathe * 0.006,
    scaleY: 1 - breathe * 0.003,
    scaleZ: 1 + breathe * 0.005,
    jump: 0,
    wobbleZ: Math.sin(now * 0.62 + phaseOffset) * 0.003,
    travel: 0,
    releaseProgress: -1,
  };
}

export function getPlumpMushroomMoveMotion(now: number, phaseOffset = 0): EnemyPose {
  const cycle = ((now * 1.08 + phaseOffset) % 1 + 1) % 1;
  const step = Math.sin(cycle * Math.PI) ** 2;
  const weight = Math.sin(cycle * TAU);
  return {
    scaleX: 1 + step * 0.024,
    scaleY: 1 - step * 0.040,
    scaleZ: 1 + step * 0.018,
    jump: step * 0.018,
    wobbleZ: weight * 0.010,
    travel: 0,
    releaseProgress: -1,
  };
}

export function getSporeMushroomIdleMotion(now: number, phaseOffset = 0): EnemyPose {
  const pulse = Math.sin(now * 0.92 + phaseOffset);
  return {
    scaleX: 1 + pulse * 0.002,
    scaleY: 1 - pulse * 0.002,
    scaleZ: 1 + pulse * 0.003,
    jump: 0,
    wobbleZ: 0,
    travel: 0,
    releaseProgress: -1,
    secondary: { open: pulse * 0.030 },
  };
}

export function getSporeMushroomMoveMotion(now: number, phaseOffset = 0): EnemyPose {
  const cycle = ((now * 1.34 + phaseOffset) % 1 + 1) % 1;
  const lift = Math.sin(cycle * Math.PI) ** 2;
  return {
    scaleX: 1 - lift * 0.010,
    scaleY: 1 + lift * 0.014,
    scaleZ: 1 - lift * 0.008,
    jump: lift * 0.026,
    wobbleZ: Math.sin(cycle * TAU) * 0.009,
    travel: 0,
    releaseProgress: -1,
    secondary: { open: lift * 0.025 },
  };
}

export function getGreatMushroomIdleMotion(now: number, phaseOffset = 0): EnemyPose {
  const breathe = Math.sin(now * 0.62 + phaseOffset);
  return {
    scaleX: 1 + breathe * 0.005,
    scaleY: 1 - breathe * 0.003,
    scaleZ: 1 + breathe * 0.004,
    jump: 0,
    wobbleZ: Math.sin(now * 0.44 + phaseOffset) * 0.003,
    travel: 0,
    releaseProgress: -1,
  };
}

export function getGreatMushroomMoveMotion(now: number, phaseOffset = 0): EnemyPose {
  const cycle = ((now * 0.86 + phaseOffset) % 1 + 1) % 1;
  const step = Math.sin(cycle * Math.PI) ** 2;
  const weightShift = Math.sin(cycle * TAU);
  return {
    scaleX: 1 + step * 0.018,
    scaleY: 1 - step * 0.026,
    scaleZ: 1 + step * 0.012,
    jump: step * 0.012,
    wobbleZ: weightShift * 0.010,
    travel: 0,
    releaseProgress: -1,
  };
}

/** Backwards-compatible baseline exports used by generic tests/tools. */
export function getMushroomIdleMotion(now: number, phaseOffset = 0): EnemyPose {
  return getTinyMushroomIdleMotion(now, phaseOffset);
}
export function getMushroomMoveMotion(now: number, phaseOffset = 0): EnemyPose {
  return getTinyMushroomMoveMotion(now, phaseOffset);
}

/** Tiny: light hop-bump with one anticipation and one clean release. */
export function getMushroomBumpAttackMotion(u: number): EnemyPose {
  const t = clampEnemy01(u);
  let compression = 0;
  let travel = 0;
  let jump = 0;
  let wobbleZ = 0;

  if (t < 0.28) {
    const p = smooth01(t / 0.28);
    compression = p;
    wobbleZ = -0.025 * p;
  } else if (t < ENEMY_MOTION_THRESHOLDS.bumpContactU) {
    const p = smooth01((t - 0.28) / (ENEMY_MOTION_THRESHOLDS.bumpContactU - 0.28));
    compression = 1 - p;
    travel = p;
    jump = Math.sin(p * Math.PI) * 0.055;
    wobbleZ = lerp(-0.025, 0.018, p);
  } else {
    const p = smooth01((t - ENEMY_MOTION_THRESHOLDS.bumpContactU) / (1 - ENEMY_MOTION_THRESHOLDS.bumpContactU));
    travel = 1 - p;
    wobbleZ = 0.018 * (1 - p);
  }

  return {
    scaleX: 1 + compression * 0.065,
    scaleY: 1 - compression * 0.105,
    scaleZ: 1 + compression * 0.050,
    jump,
    wobbleZ,
    travel,
    releaseProgress: t >= 0.28 ? clampEnemy01((t - 0.28) / 0.72) : -1,
  };
}

/** Plump: low heavy body-check. Weight comes from stillness, not a bigger jump. */
export function getMushroomHeavyAttackMotion(u: number): EnemyPose {
  const t = clampEnemy01(u);
  let squat = 0;
  let drive = 0;
  let impact = 0;
  let travel = 0;
  let jump = 0;

  if (t < 0.42) {
    squat = smooth01(t / 0.42);
  } else if (t < ENEMY_MOTION_THRESHOLDS.heavyContactU) {
    const p = smooth01((t - 0.42) / (ENEMY_MOTION_THRESHOLDS.heavyContactU - 0.42));
    squat = 1 - p;
    drive = p;
    travel = p;
    jump = Math.sin(p * Math.PI) * 0.014;
  } else if (t < 0.72) {
    const p = smooth01((t - ENEMY_MOTION_THRESHOLDS.heavyContactU) / 0.12);
    impact = 1 - p;
    travel = 1;
  } else {
    const p = smooth01((t - 0.72) / 0.28);
    travel = 1 - p;
  }

  return {
    scaleX: 1 + squat * 0.105 + impact * 0.120,
    scaleY: 1 - squat * 0.155 - impact * 0.100 + drive * 0.025,
    scaleZ: 1 + squat * 0.075 + impact * 0.085,
    jump,
    wobbleZ: 0,
    travel,
    releaseProgress: t >= 0.42 ? clampEnemy01((t - 0.42) / 0.58) : -1,
  };
}

/** Spore: charge only the paired pouches, hold, then deflate them into the shot. */
export function getMushroomSporeAttackMotion(u: number): EnemyPose {
  const t = clampEnemy01(u);
  let charge = 0;
  let open = 0;
  let recoil = 0;
  let travel = 0;

  if (t < 0.36) {
    const p = smooth01(t / 0.36);
    charge = p;
    open = 0.44 * p;
  } else if (t < ENEMY_MOTION_THRESHOLDS.sporeReleaseU) {
    charge = 1;
    open = 0.44;
  } else if (t < 0.58) {
    const p = smooth01((t - ENEMY_MOTION_THRESHOLDS.sporeReleaseU) / 0.10);
    charge = 1 - p;
    open = lerp(0.44, -0.16, p);
    recoil = Math.sin(p * Math.PI);
    travel = -0.10 * p;
  } else {
    const p = smooth01((t - 0.58) / 0.42);
    open = lerp(-0.16, 0, p);
    travel = lerp(-0.10, 0, p);
  }

  return {
    scaleX: 1 + charge * 0.008 - recoil * 0.012,
    scaleY: 1 + charge * 0.010 - recoil * 0.016,
    scaleZ: 1 + charge * 0.008,
    jump: recoil * 0.008,
    wobbleZ: 0,
    travel,
    releaseProgress: t >= ENEMY_MOTION_THRESHOLDS.sporeReleaseU
      ? clampEnemy01((t - ENEMY_MOTION_THRESHOLDS.sporeReleaseU) / (1 - ENEMY_MOTION_THRESHOLDS.sporeReleaseU))
      : -1,
    secondary: { open },
  };
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

export function getTinyMushroomHitMotion(u: number, side: number): EnemyHitPose {
  const p = Math.sin(clampEnemy01(u) * Math.PI);
  return {
    scaleX: 1 + p * 0.085,
    scaleY: 1 - p * 0.135,
    scaleZ: 1 + p * 0.050,
    rotationZ: side * p * 0.125,
  };
}

export function getPlumpMushroomHitMotion(u: number, side: number): EnemyHitPose {
  const p = Math.sin(clampEnemy01(u) * Math.PI);
  return {
    // A heavy body absorbs the hit instead of snapping sideways like Tiny.
    scaleX: 1 + p * 0.115,
    scaleY: 1 - p * 0.105,
    scaleZ: 1 + p * 0.075,
    rotationZ: side * p * 0.038,
  };
}

export function getSporeMushroomHitMotion(u: number, side: number): EnemyHitPose {
  const p = Math.sin(clampEnemy01(u) * Math.PI);
  return {
    scaleX: 1 + p * 0.035,
    scaleY: 1 - p * 0.065,
    scaleZ: 1 + p * 0.025,
    rotationZ: side * p * 0.060,
    // The vulnerable pouches visibly compress while the body stays composed.
    secondary: { open: -p * 0.32 },
  };
}

export function getGreatMushroomHitMotion(u: number, side: number): EnemyHitPose {
  const p = Math.sin(clampEnemy01(u) * Math.PI);
  return {
    // Boss hit reaction is readable but does not look lightweight.
    scaleX: 1 + p * 0.075,
    scaleY: 1 - p * 0.080,
    scaleZ: 1 + p * 0.050,
    rotationZ: side * p * 0.028,
  };
}

/** Backwards-compatible generic mushroom hit maps to Tiny. */
export function getMushroomHitMotion(u: number, side: number): EnemyHitPose {
  return getTinyMushroomHitMotion(u, side);
}

function tinyMushroomDefeat(u: number, side: number): EnemyDefeatPose {
  const t = clampEnemy01(u);
  const pancake = smooth01(Math.min(1, t / 0.62));
  const fade = clampEnemy01((t - 0.92) / 0.08);
  return {
    scaleX: 1 + pancake * 0.30,
    scaleY: 1 - pancake * 0.60,
    scaleZ: 1 + pancake * 0.12,
    rotationZ: side * pancake * 0.18,
    yOffset: -0.030 * pancake,
    lateralDrift: side * 0.055 * pancake,
    backwardDrift: 0.035 * pancake,
    opacity: t >= 1 ? 0 : 1 - fade,
  };
}

function plumpMushroomDefeat(u: number, side: number): EnemyDefeatPose {
  const t = clampEnemy01(u);
  const sink = smooth01(Math.min(1, t / 0.72));
  const settle = smooth01(clampEnemy01((t - 0.48) / 0.34));
  const fade = clampEnemy01((t - 0.94) / 0.06);
  return {
    // Weight goes straight down: broad squash, almost no sideways cartwheel.
    scaleX: 1 + sink * 0.38 - settle * 0.035,
    scaleY: 1 - sink * 0.54,
    scaleZ: 1 + sink * 0.16,
    rotationZ: side * sink * 0.075,
    yOffset: -0.042 * sink,
    lateralDrift: side * 0.025 * sink,
    backwardDrift: 0.018 * sink,
    opacity: t >= 1 ? 0 : 1 - fade,
  };
}

function sporeMushroomDefeat(u: number, side: number): EnemyDefeatPose {
  const t = clampEnemy01(u);
  const wilt = smooth01(Math.min(1, t / 0.72));
  const fade = clampEnemy01((t - 0.92) / 0.08);
  return {
    scaleX: 1 + wilt * 0.14,
    scaleY: 1 - wilt * 0.36,
    scaleZ: 1 + wilt * 0.055,
    rotationZ: side * wilt * 0.30,
    yOffset: -0.026 * wilt,
    lateralDrift: side * 0.050 * wilt,
    backwardDrift: 0.045 * wilt,
    opacity: t >= 1 ? 0 : 1 - fade,
    // Empty the pouches before the body settles to make the ranged identity survive defeat.
    secondary: { open: -0.42 * wilt },
  };
}

export function getGreatMushroomDefeatMotion(u: number, side: number): EnemyDefeatPose {
  const t = clampEnemy01(u);
  const stagger = Math.sin(clampEnemy01(t / 0.24) * Math.PI);
  const collapse = t < 0.20 ? 0 : smoothEnemy01((t - 0.20) / 0.46);
  const rebound = t >= 0.60 && t < 0.79
    ? Math.sin(((t - 0.60) / 0.19) * Math.PI)
    : 0;
  const settle = smoothEnemy01((t - 0.73) / 0.17);
  const fade = smoothEnemy01((t - 0.87) / 0.13);
  const heave = Math.sin(clampEnemy01(t / 0.31) * Math.PI) * 0.055;

  return {
    scaleX: 1 + stagger * 0.06 + collapse * 0.34 - rebound * 0.05,
    scaleY: 1 + stagger * 0.07 - collapse * 0.50 + rebound * 0.12 - settle * 0.06,
    scaleZ: 1 + collapse * 0.14,
    rotationZ: side * (stagger * 0.11 + collapse * 0.47 - rebound * 0.07),
    yOffset: heave - collapse * 0.052 - settle * 0.025 - fade * 0.035,
    lateralDrift: side * collapse * 0.20,
    backwardDrift: collapse * 0.16,
    opacity: 1 - fade,
  };
}

/** Backwards-compatible generic mushroom defeat maps to Tiny. */
export function getMushroomDefeatMotion(u: number, side: number): EnemyDefeatPose {
  return tinyMushroomDefeat(u, side);
}

export const MUSHROOM_SPORE_FLIGHT_SECONDS = 0.42;

export function createMushroomSporeMesh(): THREE.Group {
  const root = new THREE.Group();
  root.name = 'MushroomSporeProjectile';
  const coreMaterial = new THREE.MeshBasicMaterial({
    color: '#d9b9ff',
    transparent: true,
    opacity: 0.92,
    depthWrite: false,
  });
  root.add(new THREE.Mesh(new THREE.SphereGeometry(0.045, 12, 8), coreMaterial));
  const moteMaterial = new THREE.MeshBasicMaterial({
    color: '#f4e8ff',
    transparent: true,
    opacity: 0.82,
    depthWrite: false,
  });
  for (let index = 0; index < 4; index += 1) {
    const angle = (index / 4) * Math.PI * 2;
    const mote = new THREE.Mesh(new THREE.SphereGeometry(0.015, 8, 6), moteMaterial);
    mote.position.set(Math.cos(angle) * 0.065, Math.sin(angle) * 0.038, Math.sin(angle) * 0.024);
    root.add(mote);
  }
  return root;
}

export function getMushroomSporeArcHeight(u: number): number {
  return Math.sin(clampEnemy01(u) * Math.PI) * 0.16;
}

const SPORE_PROJECTILE = {
  kind: 'spore' as const,
  flightSeconds: MUSHROOM_SPORE_FLIGHT_SECONDS,
  createMesh: createMushroomSporeMesh,
  arcHeight: getMushroomSporeArcHeight,
};

const PROFILES: Record<MushroomBehaviorId, EnemyMotionProfile> = {
  'mushroom-bump': {
    familyId: 'mushroom',
    idle: getTinyMushroomIdleMotion,
    move: getTinyMushroomMoveMotion,
    attack: getMushroomBumpAttackMotion,
    hit: getTinyMushroomHitMotion,
    defeat: tinyMushroomDefeat,
    moveDuration: 1.25,
    moveDistance: 0.82,
    attackDuration: ENEMY_MOTION_TIMING.bumpAttack,
    contactU: ENEMY_MOTION_THRESHOLDS.bumpContactU,
    attackTravelDistance: 0.42,
    defeatDuration: ENEMY_MOTION_TIMING.defeat,
  },
  'mushroom-heavy-bump': {
    familyId: 'mushroom',
    idle: getPlumpMushroomIdleMotion,
    move: getPlumpMushroomMoveMotion,
    attack: getMushroomHeavyAttackMotion,
    hit: getPlumpMushroomHitMotion,
    defeat: plumpMushroomDefeat,
    moveDuration: 1.85,
    moveDistance: 0.60,
    attackDuration: ENEMY_MOTION_TIMING.heavyAttack,
    contactU: ENEMY_MOTION_THRESHOLDS.heavyContactU,
    attackTravelDistance: 0.34,
    defeatDuration: ENEMY_MOTION_TIMING.defeat,
  },
  'mushroom-spore': {
    familyId: 'mushroom',
    idle: getSporeMushroomIdleMotion,
    move: getSporeMushroomMoveMotion,
    attack: getMushroomSporeAttackMotion,
    hit: getSporeMushroomHitMotion,
    defeat: sporeMushroomDefeat,
    moveDuration: 1.65,
    moveDistance: 0.64,
    attackDuration: ENEMY_MOTION_TIMING.sporeAttack,
    contactU: ENEMY_MOTION_THRESHOLDS.sporeReleaseU,
    attackTravelDistance: 0.10,
    defeatDuration: ENEMY_MOTION_TIMING.defeat,
    projectile: SPORE_PROJECTILE,
  },
  'mushroom-boss': {
    familyId: 'mushroom',
    idle: getGreatMushroomIdleMotion,
    move: getGreatMushroomMoveMotion,
    attack: getGreatMushroomAttackMotion,
    hit: getGreatMushroomHitMotion,
    defeat: getGreatMushroomDefeatMotion,
    moveDuration: 2.05,
    moveDistance: 0.52,
    attackDuration: ENEMY_MOTION_TIMING.bossAttack,
    contactU: ENEMY_MOTION_THRESHOLDS.bossContactU,
    attackTravelDistance: 0.50,
    defeatDuration: ENEMY_MOTION_TIMING.bossDefeat,
    attackVfx: {
      color: '#f3b95f',
      radius: 0.52,
      pose: getGreatMushroomSlamVfxPose,
      impactColor: '#ffd58a',
      impactSize: 0.28,
      cameraShakeDuration: 0.20,
      cameraShakeAmplitude: 0.045,
    },
  }
};

export function getMushroomMotionProfile(behaviorId: MushroomBehaviorId): EnemyMotionProfile {
  return PROFILES[behaviorId];
}