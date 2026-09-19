import * as THREE from 'three';
import {
  clampEnemy01,
  type EnemyDefeatPose,
  type EnemyHitPose,
  type EnemyMotionProfile,
  type EnemyPose,
} from './shared';

export type MineBehaviorId =
  | 'mine-crystal-tackle'
  | 'mine-burrow-pop'
  | 'mine-crystal-ring'
  | 'mine-golem-tackle'
  | 'mine-amber-boss';

const tau = Math.PI * 2;

function pose(overrides: Partial<EnemyPose> = {}): EnemyPose {
  return {
    scaleX: 1,
    scaleY: 1,
    scaleZ: 1,
    jump: 0,
    wobbleZ: 0,
    travel: 0,
    releaseProgress: -1,
    ...overrides,
  };
}

/* -------------------------------------------------------------------------- */
/* Crystal Beetle — body moves first, oversized back crystal follows late.    */
/* -------------------------------------------------------------------------- */

function beetleIdle(now: number, phase = 0): EnemyPose {
  const body = Math.sin(now * 1.55 + phase);
  const crystalLag = Math.sin(now * 1.55 + phase - 0.36);
  return pose({
    scaleX: 1 + body * 0.008,
    scaleY: 1 - body * 0.010,
    scaleZ: 1 + body * 0.006,
    wobbleZ: body * 0.006,
    secondary: { primaryBend: crystalLag * 0.055 },
  });
}

function beetleMove(now: number, phase = 0): EnemyPose {
  const cycle = (now / 1.34 + phase) % 1;
  const hop = Math.max(0, Math.sin(cycle * Math.PI)) * 0.032;
  const crystalLag = Math.sin(cycle * tau - 0.52);
  return pose({
    scaleX: 1 + hop * 0.10,
    scaleY: 1 - hop * 0.12,
    scaleZ: 1 + hop * 0.035,
    jump: hop,
    wobbleZ: Math.sin(cycle * tau) * 0.012,
    secondary: { primaryBend: crystalLag * 0.085 },
  });
}

function beetleHit(u: number, side: number): EnemyHitPose {
  const t = clampEnemy01(u);
  const bodyHit = Math.sin(t * Math.PI);
  const crystalFollow = Math.sin(clampEnemy01((t - 0.10) / 0.90) * Math.PI);
  return {
    scaleX: 1 + bodyHit * 0.035,
    scaleY: 1 - bodyHit * 0.085,
    scaleZ: 1 + bodyHit * 0.025,
    rotationZ: side * bodyHit * 0.055,
    secondary: { primaryBend: -side * crystalFollow * 0.22 },
  };
}

function beetleDefeat(u: number, side: number): EnemyDefeatPose {
  const t = clampEnemy01(u);
  const roll = Math.sin(Math.min(1, t / 0.76) * Math.PI * 0.5);
  const settle = Math.sin(clampEnemy01((t - 0.28) / 0.72) * Math.PI);
  const fade = clampEnemy01((t - 0.94) / 0.06);
  return {
    scaleX: 1 + roll * 0.08,
    scaleY: 1 - roll * 0.22,
    scaleZ: 1 + roll * 0.025,
    rotationZ: side * roll * 0.62,
    yOffset: -0.018 * roll,
    lateralDrift: side * 0.055 * roll,
    backwardDrift: 0.035 * roll,
    opacity: 1 - fade,
    secondary: { primaryBend: -side * (0.18 * roll + 0.12 * settle) },
  };
}

export function crystalTackle(u: number): EnemyPose {
  const t = clampEnemy01(u);
  const crouch = t < 0.30 ? Math.sin((t / 0.30) * Math.PI * 0.5) : t < 0.40 ? 1 : 0;
  const crystalLean = t < 0.38 ? Math.sin((t / 0.38) * Math.PI * 0.5) : 1 - clampEnemy01((t - 0.38) / 0.34);
  const burst = t >= 0.40 && t < 0.68
    ? Math.sin(((t - 0.40) / 0.28) * Math.PI * 0.5)
    : t >= 0.68 ? 1 - clampEnemy01((t - 0.68) / 0.32) : 0;
  const rebound = t >= 0.68 ? Math.sin(clampEnemy01((t - 0.68) / 0.32) * Math.PI) : 0;
  return pose({
    scaleX: 1 + crouch * 0.075,
    scaleY: 1 - crouch * 0.12,
    scaleZ: 1 + crouch * 0.035,
    jump: burst * 0.028,
    travel: burst,
    releaseProgress: t >= 0.40 ? (t - 0.40) / 0.60 : -1,
    secondary: { primaryBend: crystalLean * 0.30 - burst * 0.42 + rebound * 0.18 },
  });
}

/* -------------------------------------------------------------------------- */
/* Drill-Nose Mole — sniff, sink, underground travel, fast pop.                */
/* -------------------------------------------------------------------------- */

function moleIdle(now: number, phase = 0): EnemyPose {
  const breathe = Math.sin(now * 1.45 + phase);
  const sniff = Math.sin(now * 5.4 + phase) * 0.5 + Math.sin(now * 2.7 + phase) * 0.5;
  return pose({
    scaleX: 1 + breathe * 0.006,
    scaleY: 1 - breathe * 0.009,
    scaleZ: 1 + breathe * 0.006,
    secondary: { primaryBend: sniff * 0.060 },
  });
}

function moleMove(now: number, phase = 0): EnemyPose {
  const cycle = (now / 1.12 + phase) % 1;
  const sink = cycle < 0.38
    ? Math.sin((cycle / 0.38) * Math.PI * 0.5)
    : cycle < 0.66 ? 1 : Math.max(0, 1 - (cycle - 0.66) / 0.22);
  const pop = cycle >= 0.66 && cycle < 0.92
    ? Math.sin(((cycle - 0.66) / 0.26) * Math.PI)
    : 0;
  return pose({
    scaleX: 1 + sink * 0.07 - pop * 0.025,
    scaleY: 1 - sink * 0.15 + pop * 0.10,
    scaleZ: 1 + sink * 0.05,
    jump: -sink * 0.065 + pop * 0.105,
    wobbleZ: pop * 0.018,
    secondary: { primaryBend: sink * 0.12 - pop * 0.24 },
  });
}

function moleHit(u: number, side: number): EnemyHitPose {
  const pulse = Math.sin(clampEnemy01(u) * Math.PI);
  return {
    scaleX: 1 + pulse * 0.085,
    scaleY: 1 - pulse * 0.145,
    scaleZ: 1 + pulse * 0.035,
    rotationZ: side * pulse * 0.035,
    secondary: { primaryBend: side * pulse * 0.13 },
  };
}

function moleDefeat(u: number, side: number): EnemyDefeatPose {
  const t = clampEnemy01(u);
  const bury = Math.sin(Math.min(1, t / 0.70) * Math.PI * 0.5);
  const noseDrop = Math.sin(Math.min(1, t / 0.50) * Math.PI * 0.5);
  const fade = clampEnemy01((t - 0.94) / 0.06);
  return {
    scaleX: 1 + bury * 0.13,
    scaleY: 1 - bury * 0.42,
    scaleZ: 1 + bury * 0.06,
    rotationZ: side * bury * 0.12,
    yOffset: -0.090 * bury,
    lateralDrift: side * 0.018 * bury,
    backwardDrift: 0.025 * bury,
    opacity: 1 - fade,
    secondary: { primaryBend: noseDrop * 0.26 },
  };
}

export function burrowPop(u: number): EnemyPose {
  const t = clampEnemy01(u);
  const dive = t < 0.30 ? Math.sin((t / 0.30) * Math.PI * 0.5) : t < 0.50 ? 1 : 0;
  const buriedTravel = t < 0.50 ? clampEnemy01((t - 0.18) / 0.32) * 0.48 : 0.48;
  const pop = t >= 0.50 && t < 0.70 ? Math.sin(((t - 0.50) / 0.20) * Math.PI) : 0;
  const finishTravel = t >= 0.50 ? clampEnemy01((t - 0.50) / 0.20) * 0.52 : 0;
  const recover = t >= 0.70 ? 1 - clampEnemy01((t - 0.70) / 0.30) : 0;
  return pose({
    scaleX: 1 + dive * 0.10 - pop * 0.04,
    scaleY: 1 - dive * 0.18 + pop * 0.14,
    scaleZ: 1 + dive * 0.07,
    jump: -dive * 0.105 + pop * 0.19,
    wobbleZ: pop * 0.025,
    travel: buriedTravel + finishTravel,
    releaseProgress: t >= 0.50 ? (t - 0.50) / 0.50 : -1,
    secondary: { primaryBend: dive * 0.18 - pop * 0.34 + recover * 0.06 },
  });
}

/* -------------------------------------------------------------------------- */
/* Crystal Bat — hover and wing-open channel, single readable ring shot.       */
/* -------------------------------------------------------------------------- */

function batIdle(now: number, phase = 0): EnemyPose {
  const hover = Math.sin(now * 2.15 + phase);
  const wing = Math.sin(now * 3.1 + phase - 0.3);
  return pose({
    scaleX: 1 + hover * 0.008,
    scaleY: 1 - hover * 0.006,
    scaleZ: 1 + hover * 0.008,
    jump: 0.045 + hover * 0.018,
    wobbleZ: hover * 0.016,
    secondary: { open: wing * 0.12, secondaryBend: -hover * 0.045 },
  });
}

function batMove(now: number, phase = 0): EnemyPose {
  const cycle = (now / 1.18 + phase) % 1;
  const close = cycle < 0.24 ? Math.sin((cycle / 0.24) * Math.PI) : 0;
  const flap = cycle >= 0.24 && cycle < 0.62
    ? Math.sin(((cycle - 0.24) / 0.38) * Math.PI)
    : 0;
  const float = cycle >= 0.62 ? Math.sin(((cycle - 0.62) / 0.38) * Math.PI) : 0;
  return pose({
    scaleX: 1 - close * 0.025 + flap * 0.02,
    scaleY: 1 - flap * 0.025,
    scaleZ: 1 + flap * 0.018,
    jump: 0.035 - close * 0.035 + flap * 0.075 + float * 0.028,
    wobbleZ: Math.sin(cycle * tau) * 0.025,
    secondary: { open: -close * 0.42 + flap * 0.28, secondaryBend: -flap * 0.08 },
  });
}

function batHit(u: number, side: number): EnemyHitPose {
  const pulse = Math.sin(clampEnemy01(u) * Math.PI);
  return {
    scaleX: 1 - pulse * 0.055,
    scaleY: 1 + pulse * 0.025,
    scaleZ: 1 + pulse * 0.02,
    rotationZ: side * pulse * 0.16,
    secondary: {
      open: -pulse * 0.42,
      primaryBend: side * pulse * 0.18,
      secondaryBend: -side * pulse * 0.12,
    },
  };
}

function batDefeat(u: number, side: number): EnemyDefeatPose {
  const t = clampEnemy01(u);
  const fall = Math.sin(Math.min(1, t / 0.82) * Math.PI * 0.5);
  const spiral = Math.sin(t * Math.PI * 1.5);
  const land = Math.sin(clampEnemy01((t - 0.62) / 0.38) * Math.PI * 0.5);
  const fade = clampEnemy01((t - 0.96) / 0.04);
  return {
    scaleX: 1 + land * 0.08,
    scaleY: 1 - land * 0.25,
    scaleZ: 1 + land * 0.035,
    rotationZ: side * (fall * 1.15 + spiral * 0.16),
    yOffset: -0.14 * fall,
    lateralDrift: side * 0.14 * fall,
    backwardDrift: 0.065 * fall,
    opacity: 1 - fade,
    secondary: { open: -0.30 * fall, secondaryBend: side * spiral * 0.10 },
  };
}

export function crystalRingAttack(u: number): EnemyPose {
  const t = clampEnemy01(u);
  const close = t < 0.34 ? Math.sin((t / 0.34) * Math.PI * 0.5) : t < 0.48 ? 1 : 1 - clampEnemy01((t - 0.48) / 0.24);
  const pulse = t >= 0.34 && t < 0.52 ? Math.sin(((t - 0.34) / 0.18) * Math.PI) : 0;
  const recoil = t >= 0.52 ? Math.sin(clampEnemy01((t - 0.52) / 0.26) * Math.PI) : 0;
  return pose({
    scaleX: 1 + pulse * 0.045,
    scaleY: 1 - close * 0.055 - recoil * 0.035,
    scaleZ: 1 + pulse * 0.035,
    jump: 0.045 + recoil * 0.025,
    wobbleZ: recoil * 0.035,
    travel: -recoil * 0.05,
    releaseProgress: t >= 0.52 ? (t - 0.52) / 0.48 : -1,
    secondary: {
      open: -close * 0.46 + recoil * 0.22,
      primaryBend: close * 0.16 - recoil * 0.13,
      secondaryBend: -pulse * 0.16,
    },
  });
}

/* -------------------------------------------------------------------------- */
/* Pebble Golem — tight three-rock cluster expands, compresses, then settles.  */
/* -------------------------------------------------------------------------- */

function golemIdle(now: number, phase = 0): EnemyPose {
  const drift = Math.sin(now * 1.25 + phase);
  const crystal = Math.sin(now * 1.25 + phase - 0.42);
  return pose({
    scaleX: 1 + drift * 0.004,
    scaleY: 1 - drift * 0.004,
    scaleZ: 1 + drift * 0.004,
    jump: Math.max(0, drift) * 0.006,
    wobbleZ: drift * 0.004,
    secondary: { open: drift * 0.10, secondaryBend: -crystal * 0.045 },
  });
}

function golemMove(now: number, phase = 0): EnemyPose {
  const cycle = (now / 1.55 + phase) % 1;
  const step = Math.sin(cycle * Math.PI);
  const heavy = Math.max(0, step);
  return pose({
    scaleX: 1 + heavy * 0.025,
    scaleY: 1 - heavy * 0.055,
    scaleZ: 1 + heavy * 0.020,
    jump: heavy * 0.018,
    wobbleZ: Math.sin(cycle * tau) * 0.022,
    secondary: {
      open: Math.sin(cycle * tau - 0.50) * 0.10,
      primaryBend: Math.sin(cycle * tau) * 0.08,
      secondaryBend: -Math.sin(cycle * tau - 0.35) * 0.055,
    },
  });
}

function golemHit(u: number, side: number): EnemyHitPose {
  const pulse = Math.sin(clampEnemy01(u) * Math.PI);
  return {
    scaleX: 1 + pulse * 0.025,
    scaleY: 1 - pulse * 0.055,
    scaleZ: 1 + pulse * 0.025,
    rotationZ: side * pulse * 0.035,
    secondary: { open: pulse * 0.48, secondaryBend: -side * pulse * 0.12 },
  };
}

function golemDefeat(u: number, side: number): EnemyDefeatPose {
  const t = clampEnemy01(u);
  const settle = Math.sin(Math.min(1, t / 0.78) * Math.PI * 0.5);
  const parts = Math.sin(clampEnemy01(t / 0.62) * Math.PI);
  const fade = clampEnemy01((t - 0.96) / 0.04);
  return {
    scaleX: 1 + settle * 0.13,
    scaleY: 1 - settle * 0.46,
    scaleZ: 1 + settle * 0.05,
    rotationZ: side * settle * 0.10,
    yOffset: -0.070 * settle,
    lateralDrift: side * 0.025 * settle,
    backwardDrift: 0.018 * settle,
    opacity: 1 - fade,
    secondary: { open: parts * 0.42 + settle * 0.16, secondaryBend: side * parts * 0.12 },
  };
}

export function golemTackle(u: number): EnemyPose {
  const t = clampEnemy01(u);
  const gather = t < 0.38 ? Math.sin((t / 0.38) * Math.PI * 0.5) : t < 0.46 ? 1 : 0;
  const hold = t >= 0.32 && t < 0.46 ? 1 : 0;
  const burst = t >= 0.46 && t < 0.72
    ? Math.sin(((t - 0.46) / 0.26) * Math.PI * 0.5)
    : t >= 0.72 ? 1 - clampEnemy01((t - 0.72) / 0.28) : 0;
  const settle = t >= 0.72 ? Math.sin(clampEnemy01((t - 0.72) / 0.28) * Math.PI) : 0;
  return pose({
    scaleX: 1 - gather * 0.08 + burst * 0.065,
    scaleY: 1 - gather * 0.09,
    scaleZ: 1 + gather * 0.075,
    jump: burst * 0.022,
    travel: burst,
    releaseProgress: t >= 0.46 ? (t - 0.46) / 0.54 : -1,
    secondary: {
      open: -gather * 0.46 + settle * 0.18,
      primaryBend: gather * 0.12 - burst * 0.14,
      secondaryBend: -hold * 0.10 + settle * 0.12,
    },
  });
}

/* -------------------------------------------------------------------------- */
/* Amber Turtle boss — retract -> hold -> shell-led roll -> delayed wobble.    */
/* -------------------------------------------------------------------------- */

function turtleIdle(now: number, phase = 0): EnemyPose {
  const breathe = Math.sin(now * 1.05 + phase);
  const head = Math.sin(now * 1.55 + phase - 0.35);
  return pose({
    scaleX: 1 + breathe * 0.005,
    scaleY: 1 - breathe * 0.006,
    scaleZ: 1 + breathe * 0.005,
    secondary: {
      headNod: head * 0.025,
      headRetract: Math.max(0, -head) * 0.010,
      shellCurl: breathe * 0.025,
    },
  });
}

function turtleMove(now: number, phase = 0): EnemyPose {
  const cycle = (now / 1.68 + phase) % 1;
  const step = Math.abs(Math.sin(cycle * Math.PI));
  return pose({
    scaleX: 1 + step * 0.018,
    scaleY: 1 - step * 0.035,
    scaleZ: 1 + step * 0.012,
    jump: step * 0.010,
    wobbleZ: Math.sin(cycle * tau) * 0.012,
    secondary: {
      headNod: Math.sin(cycle * tau) * 0.045,
      headRetract: Math.max(0, Math.sin(cycle * tau + Math.PI)) * 0.018,
      shellRoll: Math.sin(cycle * tau) * 0.08,
    },
  });
}

function turtleHit(u: number, side: number): EnemyHitPose {
  const pulse = Math.sin(clampEnemy01(u) * Math.PI);
  return {
    scaleX: 1 + pulse * 0.035,
    scaleY: 1 - pulse * 0.065,
    scaleZ: 1 + pulse * 0.028,
    rotationZ: side * pulse * 0.025,
    secondary: {
      headRetract: pulse * 0.145,
      headNod: pulse * 0.10,
      shellCurl: pulse * 0.12,
      shellRoll: -side * pulse * 0.08,
    },
  };
}

function turtleDefeat(u: number, side: number): EnemyDefeatPose {
  const t = clampEnemy01(u);
  const roll = Math.sin(Math.min(1, t / 0.82) * Math.PI * 0.5);
  const wobble = t >= 0.68 ? Math.sin(clampEnemy01((t - 0.68) / 0.32) * Math.PI * 2) * (1 - clampEnemy01((t - 0.68) / 0.32)) : 0;
  const fade = clampEnemy01((t - 0.97) / 0.03);
  return {
    scaleX: 1 + roll * 0.045,
    scaleY: 1 - roll * 0.15,
    scaleZ: 1 + roll * 0.025,
    rotationZ: side * (roll * 1.92 + wobble * 0.10),
    yOffset: -0.045 * roll,
    lateralDrift: side * 0.12 * roll,
    backwardDrift: 0.075 * roll,
    opacity: 1 - fade,
    secondary: {
      headRetract: roll * 0.16,
      headNod: roll * 0.10,
      shellCurl: roll * 0.13,
      shellRoll: side * roll * 1.35,
    },
  };
}

export function amberBossAttack(u: number): EnemyPose {
  const t = clampEnemy01(u);
  const retract = t < 0.25 ? Math.sin((t / 0.25) * Math.PI * 0.5) : t < 0.42 ? 1 : 0;
  const hold = t >= 0.25 && t < 0.42 ? 1 : 0;
  const roll = t >= 0.42 && t < 0.70
    ? Math.sin(((t - 0.42) / 0.28) * Math.PI * 0.5)
    : t >= 0.70 ? 1 - clampEnemy01((t - 0.70) / 0.30) : 0;
  const impact = t >= 0.64 && t < 0.78 ? Math.sin(((t - 0.64) / 0.14) * Math.PI) : 0;
  const delayedWobble = t >= 0.72
    ? Math.sin(clampEnemy01((t - 0.72) / 0.28) * Math.PI * 2.5) * (1 - clampEnemy01((t - 0.72) / 0.28))
    : 0;
  return pose({
    scaleX: 1 + retract * 0.06 + impact * 0.045,
    scaleY: 1 - retract * 0.095 - impact * 0.05,
    scaleZ: 1 + retract * 0.035,
    jump: roll * 0.040 + impact * 0.025,
    wobbleZ: roll * 0.56 + delayedWobble * 0.10,
    travel: roll,
    releaseProgress: t >= 0.42 ? (t - 0.42) / 0.58 : -1,
    secondary: {
      headRetract: retract * 0.17 + hold * 0.02,
      headNod: retract * 0.10,
      shellCurl: retract * 0.22 + impact * 0.12,
      shellRoll: roll * 1.65 + delayedWobble * 0.18,
    },
  });
}

function crystalRingMesh(): THREE.Object3D {
  const group = new THREE.Group();
  group.name = 'CrystalRingProjectile';
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.075, 0.018, 8, 20),
    new THREE.MeshStandardMaterial({
      color: '#f2a33c',
      roughness: 0.34,
      emissive: '#6d2f08',
      emissiveIntensity: 0.42,
    }),
  );
  ring.rotation.x = Math.PI / 2;
  group.add(ring);
  return group;
}

const profiles: Record<MineBehaviorId, EnemyMotionProfile> = {
  'mine-crystal-tackle': {
    familyId: 'mine',
    idle: beetleIdle,
    move: beetleMove,
    attack: crystalTackle,
    hit: beetleHit,
    defeat: beetleDefeat,
    moveDuration: 1.34,
    moveDistance: 0.70,
    attackDuration: 0.76,
    attackTravelDistance: 0.40,
    contactU: 0.63,
    defeatDuration: 1.08,
  },
  'mine-burrow-pop': {
    familyId: 'mine',
    idle: moleIdle,
    move: moleMove,
    attack: burrowPop,
    hit: moleHit,
    defeat: moleDefeat,
    moveDuration: 1.12,
    moveDistance: 0.82,
    attackDuration: 0.88,
    attackTravelDistance: 0.46,
    contactU: 0.66,
    defeatDuration: 1.06,
  },
  'mine-crystal-ring': {
    familyId: 'mine',
    idle: batIdle,
    move: batMove,
    attack: crystalRingAttack,
    hit: batHit,
    defeat: batDefeat,
    moveDuration: 1.18,
    moveDistance: 0.78,
    attackDuration: 0.84,
    attackTravelDistance: 0.07,
    contactU: 0.52,
    defeatDuration: 1.16,
    projectile: {
      kind: 'crystal-ring',
      flightSeconds: 0.42,
      createMesh: crystalRingMesh,
      arcHeight: (u) => Math.sin(clampEnemy01(u) * Math.PI) * 0.10,
    },
  },
  'mine-golem-tackle': {
    familyId: 'mine',
    idle: golemIdle,
    move: golemMove,
    attack: golemTackle,
    hit: golemHit,
    defeat: golemDefeat,
    moveDuration: 1.55,
    moveDistance: 0.58,
    attackDuration: 0.94,
    attackTravelDistance: 0.34,
    contactU: 0.69,
    defeatDuration: 1.18,
  },
  'mine-amber-boss': {
    familyId: 'mine',
    idle: turtleIdle,
    move: turtleMove,
    attack: amberBossAttack,
    hit: turtleHit,
    defeat: turtleDefeat,
    moveDuration: 1.68,
    moveDistance: 0.50,
    attackDuration: 1.28,
    attackTravelDistance: 0.62,
    contactU: 0.67,
    defeatDuration: 1.42,
  },
};

export const getMineMotionProfile = (id: MineBehaviorId): EnemyMotionProfile => profiles[id];
