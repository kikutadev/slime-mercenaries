import * as THREE from 'three';
import {
  clampEnemy01,
  type EnemyDefeatPose,
  type EnemyHitPose,
  type EnemyMotionProfile,
  type EnemyPose,
} from './shared';

export type MarshBehaviorId =
  | 'marsh-frog-hop'
  | 'marsh-sprout-orb'
  | 'marsh-bubble-pulse'
  | 'marsh-lily-skim'
  | 'marsh-frog-boss';

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
/* ぷくガエル — squat/hop rhythm, throat is the readable anticipation.         */
/* -------------------------------------------------------------------------- */

function frogIdle(now: number, phase = 0): EnemyPose {
  const breathe = Math.sin(now * 1.55 + phase);
  const throat = Math.sin(now * 1.85 + phase - 0.25);
  return pose({
    scaleX: 1 + breathe * 0.006,
    scaleY: 1 - breathe * 0.008,
    scaleZ: 1 + breathe * 0.005,
    secondary: { inflate: 0.035 + throat * 0.018 },
  });
}

function frogMove(now: number, phase = 0): EnemyPose {
  const cycle = (now / 1.14 + phase) % 1;
  const squat = cycle < 0.24 ? Math.sin((cycle / 0.24) * Math.PI) : 0;
  const hop = cycle >= 0.24 && cycle < 0.68
    ? Math.sin(((cycle - 0.24) / 0.44) * Math.PI)
    : 0;
  const settle = cycle >= 0.68 ? Math.sin(((cycle - 0.68) / 0.32) * Math.PI) : 0;
  return pose({
    scaleX: 1 + squat * 0.075 + settle * 0.035,
    scaleY: 1 - squat * 0.10 - settle * 0.050,
    scaleZ: 1 + squat * 0.035 + hop * 0.030,
    jump: hop * 0.115,
    secondary: { inflate: squat * 0.08 - hop * 0.025 + settle * 0.035 },
  });
}

function frogHit(u: number, side: number): EnemyHitPose {
  const pulse = Math.sin(clampEnemy01(u) * Math.PI);
  return {
    scaleX: 1 - pulse * 0.085,
    scaleY: 1 + pulse * 0.055,
    scaleZ: 1 + pulse * 0.025,
    rotationZ: side * pulse * 0.11,
    secondary: { inflate: -pulse * 0.12 },
  };
}

function frogDefeat(u: number, side: number): EnemyDefeatPose {
  const t = clampEnemy01(u);
  const failedHop = t < 0.34 ? Math.sin((t / 0.34) * Math.PI) : 0;
  const flop = t >= 0.28 ? Math.sin(Math.min(1, (t - 0.28) / 0.58) * Math.PI * 0.5) : 0;
  const settle = t >= 0.70 ? Math.sin(clampEnemy01((t - 0.70) / 0.30) * Math.PI) : 0;
  const fade = clampEnemy01((t - 0.96) / 0.04);
  return {
    scaleX: 1 + flop * 0.18,
    scaleY: 1 - flop * 0.46,
    scaleZ: 1 + flop * 0.06,
    rotationZ: side * flop * 0.10,
    yOffset: failedHop * 0.075 - flop * 0.070,
    lateralDrift: side * 0.020 * flop,
    backwardDrift: 0.035 * flop,
    opacity: 1 - fade,
    secondary: { inflate: -0.16 * flop + 0.025 * settle },
  };
}

function frogAttack(u: number): EnemyPose {
  const t = clampEnemy01(u);
  const inflate = t < 0.30
    ? Math.sin((t / 0.30) * Math.PI * 0.5)
    : t < 0.42 ? 1 : Math.max(0, 1 - (t - 0.42) / 0.22);
  const hold = t >= 0.30 && t < 0.42 ? 1 : 0;
  const hop = t >= 0.42 && t < 0.72 ? Math.sin(((t - 0.42) / 0.30) * Math.PI) : 0;
  const impact = t >= 0.70 && t < 0.88 ? Math.sin(((t - 0.70) / 0.18) * Math.PI) : 0;
  return pose({
    scaleX: 1 + inflate * 0.055 + impact * 0.15,
    scaleY: 1 - inflate * 0.080 - impact * 0.28,
    scaleZ: 1 + inflate * 0.030 + impact * 0.055,
    jump: hop * 0.18,
    travel: hop,
    releaseProgress: t >= 0.42 ? (t - 0.42) / 0.58 : -1,
    secondary: { inflate: inflate * 0.34 + hold * 0.03 - impact * 0.18 },
  });
}

/* -------------------------------------------------------------------------- */
/* ぬまメ — droplet stretch with broad-leaf lag and one restrained water orb. */
/* -------------------------------------------------------------------------- */

function sproutIdle(now: number, phase = 0): EnemyPose {
  const stretch = Math.sin(now * 1.65 + phase);
  const leafLag = Math.sin(now * 1.65 + phase - 0.42);
  return pose({
    scaleX: 1 - stretch * 0.020,
    scaleY: 1 - stretch * 0.012,
    scaleZ: 1 + stretch * 0.035,
    jump: Math.max(0, stretch) * 0.006,
    secondary: { primaryBend: leafLag * 0.045, open: leafLag * 0.10 },
  });
}

function sproutMove(now: number, phase = 0): EnemyPose {
  const cycle = (now / 1.28 + phase) % 1;
  const stretch = Math.sin(cycle * tau);
  const glide = Math.sin(cycle * Math.PI);
  return pose({
    scaleX: 1 - stretch * 0.050,
    scaleY: 1 - stretch * 0.025,
    scaleZ: 1 + stretch * 0.085,
    jump: Math.max(0, stretch) * 0.015,
    wobbleZ: stretch * 0.018,
    secondary: { primaryBend: -stretch * 0.070, open: -stretch * 0.12, secondaryBend: glide * 0.04 },
  });
}

function sproutHit(u: number, side: number): EnemyHitPose {
  const pulse = Math.sin(clampEnemy01(u) * Math.PI);
  return {
    scaleX: 1 + pulse * 0.055,
    scaleY: 1 - pulse * 0.035,
    scaleZ: 1 - pulse * 0.090,
    rotationZ: side * pulse * 0.060,
    secondary: { open: -pulse * 0.44, primaryBend: side * pulse * 0.10 },
  };
}

function sproutDefeat(u: number, side: number): EnemyDefeatPose {
  const t = clampEnemy01(u);
  const flatten = Math.sin(Math.min(1, t / 0.78) * Math.PI * 0.5);
  const droop = Math.sin(Math.min(1, t / 0.66) * Math.PI * 0.5);
  const fade = clampEnemy01((t - 0.96) / 0.04);
  return {
    scaleX: 1 + flatten * 0.18,
    scaleY: 1 - flatten * 0.30,
    scaleZ: 1 - flatten * 0.38,
    rotationZ: side * flatten * 0.14,
    yOffset: -0.065 * flatten,
    lateralDrift: side * 0.025 * flatten,
    backwardDrift: 0.020 * flatten,
    opacity: 1 - fade,
    secondary: { open: -droop * 0.42, primaryBend: side * droop * 0.24 },
  };
}

function sproutAttack(u: number): EnemyPose {
  const t = clampEnemy01(u);
  const close = t < 0.30 ? Math.sin((t / 0.30) * Math.PI * 0.5) : t < 0.45 ? 1 : Math.max(0, 1 - (t - 0.45) / 0.18);
  const gather = t >= 0.20 && t < 0.50 ? Math.sin(((t - 0.20) / 0.30) * Math.PI) : 0;
  const release = t >= 0.50 ? Math.sin(clampEnemy01((t - 0.50) / 0.24) * Math.PI) : 0;
  return pose({
    scaleX: 1 - gather * 0.045,
    scaleY: 1 - gather * 0.035,
    scaleZ: 1 + gather * 0.080,
    jump: release * 0.025,
    travel: -release * 0.04,
    releaseProgress: t >= 0.50 ? (t - 0.50) / 0.50 : -1,
    secondary: {
      open: -close * 0.46 + release * 0.28,
      primaryBend: close * 0.10 - release * 0.12,
      secondaryBend: gather * 0.15 - release * 0.12,
    },
  });
}

/* -------------------------------------------------------------------------- */
/* あわタニシ — body acts first; oversized bubble shell follows and oscillates.*/
/* -------------------------------------------------------------------------- */

function snailIdle(now: number, phase = 0): EnemyPose {
  const body = Math.sin(now * 1.25 + phase);
  const shellLag = Math.sin(now * 1.25 + phase - 0.48);
  return pose({
    scaleX: 1 + body * 0.005,
    scaleY: 1 - body * 0.005,
    scaleZ: 1 + body * 0.004,
    secondary: { secondaryBend: shellLag * 0.055, inflate: shellLag * 0.025 },
  });
}

function snailMove(now: number, phase = 0): EnemyPose {
  const cycle = (now / 1.52 + phase) % 1;
  const push = Math.sin(cycle * Math.PI);
  const shellLag = Math.sin(cycle * tau - 0.60);
  return pose({
    scaleX: 1 + push * 0.025,
    scaleY: 1 - push * 0.035,
    scaleZ: 1 + push * 0.012,
    wobbleZ: Math.sin(cycle * tau) * 0.010,
    secondary: { secondaryBend: shellLag * 0.095, inflate: shellLag * 0.035 },
  });
}

function snailHit(u: number, side: number): EnemyHitPose {
  const t = clampEnemy01(u);
  const body = Math.sin(t * Math.PI);
  const shell = Math.sin(clampEnemy01((t - 0.10) / 0.90) * Math.PI * 1.25);
  return {
    scaleX: 1 + body * 0.035,
    scaleY: 1 - body * 0.070,
    scaleZ: 1 + body * 0.020,
    rotationZ: side * body * 0.045,
    secondary: { secondaryBend: -side * shell * 0.18, inflate: shell * 0.055 },
  };
}

function snailDefeat(u: number, side: number): EnemyDefeatPose {
  const t = clampEnemy01(u);
  const sit = Math.sin(Math.min(1, t / 0.72) * Math.PI * 0.5);
  const deflate = Math.sin(Math.min(1, t / 0.82) * Math.PI * 0.5);
  const shellWobble = Math.sin(t * Math.PI * 3) * (1 - t);
  const fade = clampEnemy01((t - 0.97) / 0.03);
  return {
    scaleX: 1 + sit * 0.08,
    scaleY: 1 - sit * 0.24,
    scaleZ: 1 - sit * 0.10,
    rotationZ: side * sit * 0.10,
    yOffset: -0.055 * sit,
    lateralDrift: side * 0.018 * sit,
    backwardDrift: 0.020 * sit,
    opacity: 1 - fade,
    secondary: { inflate: -deflate * 0.38, secondaryBend: side * shellWobble * 0.16 },
  };
}

function snailAttack(u: number): EnemyPose {
  const t = clampEnemy01(u);
  const compress = t < 0.34 ? Math.sin((t / 0.34) * Math.PI * 0.5) : t < 0.44 ? 1 : 0;
  const pulse = t >= 0.44 && t < 0.68 ? Math.sin(((t - 0.44) / 0.24) * Math.PI) : 0;
  const settle = t >= 0.62 ? Math.sin(clampEnemy01((t - 0.62) / 0.38) * Math.PI * 2) * (1 - clampEnemy01((t - 0.62) / 0.38)) : 0;
  return pose({
    scaleX: 1 + compress * 0.030 + pulse * 0.055,
    scaleY: 1 - compress * 0.060,
    scaleZ: 1 + compress * 0.020,
    jump: pulse * 0.018,
    travel: pulse * 0.60,
    releaseProgress: t >= 0.44 ? (t - 0.44) / 0.56 : -1,
    secondary: {
      inflate: -compress * 0.28 + pulse * 0.18 + settle * 0.050,
      secondaryBend: -pulse * 0.13 + settle * 0.12,
    },
  });
}

/* -------------------------------------------------------------------------- */
/* すいすいハス — almost no vertical hop; identity is flat slide and tilt.    */
/* -------------------------------------------------------------------------- */

function lilyIdle(now: number, phase = 0): EnemyPose {
  const ripple = Math.sin(now * 1.35 + phase);
  return pose({
    wobbleZ: ripple * 0.025,
    jump: Math.sin(now * 0.90 + phase) * 0.005,
    secondary: { primaryBend: ripple * 0.045, secondaryBend: -ripple * 0.045 },
  });
}

function lilyMove(now: number, phase = 0): EnemyPose {
  const cycle = (now / 0.92 + phase) % 1;
  const glide = Math.sin(cycle * tau);
  return pose({
    scaleX: 1 + glide * 0.012,
    scaleY: 1 - glide * 0.010,
    scaleZ: 1,
    jump: 0.004 + Math.sin(cycle * Math.PI) * 0.006,
    wobbleZ: glide * 0.035,
    secondary: { primaryBend: -glide * 0.060, secondaryBend: glide * 0.075 },
  });
}

function lilyHit(u: number, side: number): EnemyHitPose {
  const pulse = Math.sin(clampEnemy01(u) * Math.PI);
  return {
    scaleX: 1 - pulse * 0.060,
    scaleY: 1 + pulse * 0.030,
    scaleZ: 1 - pulse * 0.070,
    rotationZ: side * pulse * 0.18,
    secondary: { primaryBend: side * pulse * 0.24, open: -pulse * 0.18 },
  };
}

function lilyDefeat(u: number, side: number): EnemyDefeatPose {
  const t = clampEnemy01(u);
  const spin = Math.sin(Math.min(1, t / 0.86) * Math.PI * 0.5);
  const settle = Math.sin(clampEnemy01((t - 0.62) / 0.38) * Math.PI * 0.5);
  const fade = clampEnemy01((t - 0.97) / 0.03);
  return {
    scaleX: 1 + settle * 0.06,
    scaleY: 1 - settle * 0.10,
    scaleZ: 1 - settle * 0.14,
    rotationZ: side * spin * 2.45,
    yOffset: -0.018 * settle,
    lateralDrift: side * 0.10 * spin,
    backwardDrift: 0.045 * spin,
    opacity: 1 - fade,
    secondary: { primaryBend: side * (1 - t) * 0.12, secondaryBend: -side * (1 - t) * 0.10 },
  };
}

function lilyAttack(u: number): EnemyPose {
  const t = clampEnemy01(u);
  const left = t < 0.18 ? Math.sin((t / 0.18) * Math.PI) : 0;
  const right = t >= 0.18 && t < 0.34 ? Math.sin(((t - 0.18) / 0.16) * Math.PI) : 0;
  const skim = t >= 0.34 && t < 0.64
    ? Math.sin(((t - 0.34) / 0.30) * Math.PI * 0.5)
    : t >= 0.64 ? 1 - clampEnemy01((t - 0.64) / 0.36) : 0;
  const wake = t >= 0.58 ? Math.sin(clampEnemy01((t - 0.58) / 0.42) * Math.PI) : 0;
  return pose({
    scaleX: 1 + skim * 0.035,
    scaleY: 1 - skim * 0.025,
    scaleZ: 1 - skim * 0.020,
    jump: skim * 0.012,
    wobbleZ: -left * 0.16 + right * 0.18 + skim * 0.08,
    travel: skim,
    releaseProgress: t >= 0.34 ? (t - 0.34) / 0.66 : -1,
    secondary: { primaryBend: -left * 0.14 + right * 0.14, secondaryBend: wake * 0.10 },
  });
}

/* -------------------------------------------------------------------------- */
/* おおぬまガエル — 1.0x -> 1.5x -> 2.0x throat, still hold, release, wobble. */
/* -------------------------------------------------------------------------- */

function bossFrogIdle(now: number, phase = 0): EnemyPose {
  const breathe = Math.sin(now * 1.05 + phase);
  const throat = Math.sin(now * 1.35 + phase - 0.28);
  return pose({
    scaleX: 1 + breathe * 0.004,
    scaleY: 1 - breathe * 0.005,
    scaleZ: 1 + breathe * 0.004,
    secondary: { inflate: 0.055 + throat * 0.025, secondaryBend: -throat * 0.025 },
  });
}

function bossFrogMove(now: number, phase = 0): EnemyPose {
  const cycle = (now / 1.72 + phase) % 1;
  const squat = cycle < 0.28 ? Math.sin((cycle / 0.28) * Math.PI) : 0;
  const hop = cycle >= 0.28 && cycle < 0.72 ? Math.sin(((cycle - 0.28) / 0.44) * Math.PI) : 0;
  return pose({
    scaleX: 1 + squat * 0.060,
    scaleY: 1 - squat * 0.085,
    scaleZ: 1 + squat * 0.030,
    jump: hop * 0.080,
    secondary: { inflate: squat * 0.10 - hop * 0.035, secondaryBend: -hop * 0.045 },
  });
}

function bossFrogHit(u: number, side: number): EnemyHitPose {
  const pulse = Math.sin(clampEnemy01(u) * Math.PI);
  return {
    scaleX: 1 - pulse * 0.065,
    scaleY: 1 + pulse * 0.035,
    scaleZ: 1 + pulse * 0.025,
    rotationZ: side * pulse * 0.055,
    secondary: { inflate: -pulse * 0.16, secondaryBend: side * pulse * 0.08 },
  };
}

function bossFrogDefeat(u: number, side: number): EnemyDefeatPose {
  const t = clampEnemy01(u);
  const deflate = Math.sin(Math.min(1, t / 0.60) * Math.PI * 0.5);
  const sit = t >= 0.36 ? Math.sin(Math.min(1, (t - 0.36) / 0.52) * Math.PI * 0.5) : 0;
  const settle = t >= 0.74 ? Math.sin(clampEnemy01((t - 0.74) / 0.26) * Math.PI) : 0;
  const fade = clampEnemy01((t - 0.98) / 0.02);
  return {
    scaleX: 1 + sit * 0.14,
    scaleY: 1 - sit * 0.34,
    scaleZ: 1 + sit * 0.035,
    rotationZ: side * sit * 0.12,
    yOffset: -0.060 * sit,
    lateralDrift: side * 0.030 * sit,
    backwardDrift: 0.095 * sit,
    opacity: 1 - fade,
    secondary: { inflate: -deflate * 0.42 + settle * 0.018, secondaryBend: side * settle * 0.06 },
  };
}

function bossFrogAttack(u: number): EnemyPose {
  const t = clampEnemy01(u);
  const first = t < 0.18 ? Math.sin((t / 0.18) * Math.PI * 0.5) : 1;
  const second = t < 0.18 ? 0 : t < 0.32 ? Math.sin(((t - 0.18) / 0.14) * Math.PI * 0.5) : 1;
  const third = t < 0.32 ? 0 : t < 0.46 ? Math.sin(((t - 0.32) / 0.14) * Math.PI * 0.5) : 1;
  const hold = t >= 0.46 && t < 0.56 ? 1 : 0;
  const charge = t < 0.56 ? 0.28 * first + 0.25 * second + 0.47 * third : 0;
  const release = t >= 0.56 && t < 0.70 ? Math.sin(((t - 0.56) / 0.14) * Math.PI) : 0;
  const bodySettle = t >= 0.66 ? Math.sin(clampEnemy01((t - 0.66) / 0.34) * Math.PI) : 0;
  const throatWobble = t >= 0.62
    ? Math.sin(clampEnemy01((t - 0.62) / 0.38) * Math.PI * 3) * (1 - clampEnemy01((t - 0.62) / 0.38))
    : 0;
  return pose({
    scaleX: 1 + charge * 0.035 + release * 0.16 + bodySettle * 0.025,
    scaleY: 1 - charge * 0.070 - release * 0.22,
    scaleZ: 1 + charge * 0.025 + release * 0.055,
    jump: release * 0.030,
    travel: release * 0.10,
    releaseProgress: t >= 0.56 ? (t - 0.56) / 0.44 : -1,
    secondary: {
      inflate: charge + hold * 0.02 - release * 0.38 + throatWobble * 0.10,
      secondaryBend: -release * 0.10 + throatWobble * 0.08,
    },
  });
}

function waterOrbMesh(): THREE.Object3D {
  const group = new THREE.Group();
  group.name = 'WaterOrbProjectile';
  const orb = new THREE.Mesh(
    new THREE.SphereGeometry(0.070, 18, 12),
    new THREE.MeshStandardMaterial({
      color: '#79d4d2',
      roughness: 0.22,
      transparent: true,
      opacity: 0.82,
      emissive: '#214e59',
      emissiveIntensity: 0.16,
    }),
  );
  group.add(orb);
  return group;
}

const profiles: Record<MarshBehaviorId, EnemyMotionProfile> = {
  'marsh-frog-hop': {
    familyId: 'marsh',
    idle: frogIdle,
    move: frogMove,
    attack: frogAttack,
    hit: frogHit,
    defeat: frogDefeat,
    moveDuration: 1.14,
    moveDistance: 0.68,
    attackDuration: 0.94,
    attackTravelDistance: 0.48,
    contactU: 0.74,
    defeatDuration: 1.10,
  },
  'marsh-sprout-orb': {
    familyId: 'marsh',
    idle: sproutIdle,
    move: sproutMove,
    attack: sproutAttack,
    hit: sproutHit,
    defeat: sproutDefeat,
    moveDuration: 1.28,
    moveDistance: 0.64,
    attackDuration: 0.88,
    attackTravelDistance: 0.05,
    contactU: 0.50,
    defeatDuration: 1.12,
    projectile: {
      kind: 'water-orb',
      flightSeconds: 0.46,
      createMesh: waterOrbMesh,
      arcHeight: (u) => Math.sin(clampEnemy01(u) * Math.PI) * 0.13,
    },
  },
  'marsh-bubble-pulse': {
    familyId: 'marsh',
    idle: snailIdle,
    move: snailMove,
    attack: snailAttack,
    hit: snailHit,
    defeat: snailDefeat,
    moveDuration: 1.52,
    moveDistance: 0.48,
    attackDuration: 0.96,
    attackTravelDistance: 0.24,
    contactU: 0.62,
    defeatDuration: 1.22,
  },
  'marsh-lily-skim': {
    familyId: 'marsh',
    idle: lilyIdle,
    move: lilyMove,
    attack: lilyAttack,
    hit: lilyHit,
    defeat: lilyDefeat,
    moveDuration: 0.92,
    moveDistance: 0.92,
    attackDuration: 0.78,
    attackTravelDistance: 0.62,
    contactU: 0.62,
    defeatDuration: 1.16,
  },
  'marsh-frog-boss': {
    familyId: 'marsh',
    idle: bossFrogIdle,
    move: bossFrogMove,
    attack: bossFrogAttack,
    hit: bossFrogHit,
    defeat: bossFrogDefeat,
    moveDuration: 1.72,
    moveDistance: 0.50,
    attackDuration: 1.42,
    attackTravelDistance: 0.08,
    contactU: 0.61,
    defeatDuration: 1.52,
  },
};

export const getMarshMotionProfile = (id: MarshBehaviorId): EnemyMotionProfile => profiles[id];
