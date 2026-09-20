import * as THREE from 'three';
import {
  clampEnemy01,
  type EnemyDefeatPose,
  type EnemyHitPose,
  type EnemyMotionProfile,
  type EnemyPose,
} from './shared';

export type EmberBehaviorId =
  | 'ember-tail-dash'
  | 'ember-charcoal-burst'
  | 'ember-spark-shell'
  | 'ember-crab-snap'
  | 'ember-furnace-boss';

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

/* ひのこヤモリ ------------------------------------------------------------ */

function geckoIdle(now: number, phase = 0): EnemyPose {
  const breathe = Math.sin(now * 1.35 + phase);
  const tail = Math.sin(now * 1.35 + phase - 0.62);
  return pose({
    scaleX: 1 + breathe * 0.006,
    scaleY: 1 - breathe * 0.009,
    scaleZ: 1 + breathe * 0.006,
    secondary: { wag: tail * 0.11, inflate: 0.05 + Math.max(0, tail) * 0.035, glow: 0.08 + Math.max(0, tail) * 0.08 },
  });
}

function geckoMove(now: number, phase = 0): EnemyPose {
  const cycle = (now / 0.94 + phase) % 1;
  const stride = Math.sin(cycle * tau);
  return pose({
    scaleX: 1 + Math.abs(stride) * 0.018,
    scaleY: 1 - Math.abs(stride) * 0.026,
    scaleZ: 1 + Math.abs(stride) * 0.012,
    jump: Math.max(0, Math.sin(cycle * Math.PI)) * 0.026,
    wobbleZ: stride * 0.028,
    secondary: { wag: -stride * 0.25, inflate: 0.04, glow: 0.08 },
  });
}

function geckoAttack(u: number): EnemyPose {
  const t = clampEnemy01(u);
  const crouch = t < 0.25 ? Math.sin((t / 0.25) * Math.PI * 0.5) : t < 0.37 ? 1 : Math.max(0, 1 - (t - 0.37) / 0.13);
  const flame = t < 0.18 ? 0 : t < 0.40 ? Math.sin(((t - 0.18) / 0.22) * Math.PI * 0.5) : t < 0.64 ? 1 : Math.max(0, 1 - (t - 0.64) / 0.30);
  const dash = t >= 0.34 && t < 0.67 ? Math.sin(((t - 0.34) / 0.33) * Math.PI * 0.5) : t >= 0.67 ? Math.max(0, 1 - (t - 0.67) / 0.22) : 0;
  const impact = Math.exp(-Math.pow((t - 0.65) / 0.055, 2));
  const tailWhip = t >= 0.66 && t < 0.94 ? Math.sin(((t - 0.66) / 0.28) * Math.PI) : 0;
  return pose({
    scaleX: 1 - crouch * 0.025 + impact * 0.065,
    scaleY: 1 - crouch * 0.070 - impact * 0.085,
    scaleZ: 1 + crouch * 0.030,
    jump: dash * 0.020,
    wobbleZ: -crouch * 0.06 + impact * 0.08,
    travel: dash,
    releaseProgress: t >= 0.34 ? (t - 0.34) / 0.66 : -1,
    secondary: { wag: -crouch * 0.30 + tailWhip * 0.78, inflate: flame * 0.42, glow: flame * 0.72, glowHeat: flame * 0.55 },
  });
}

function geckoHit(u: number, side: number): EnemyHitPose {
  const pulse = Math.sin(clampEnemy01(u) * Math.PI);
  return {
    scaleX: 1 - pulse * 0.045,
    scaleY: 1 + pulse * 0.030,
    scaleZ: 1 - pulse * 0.040,
    rotationZ: side * pulse * 0.09,
    secondary: { wag: -side * pulse * 0.48, glow: -pulse * 0.22 },
  };
}

function geckoDefeat(u: number, side: number): EnemyDefeatPose {
  const t = clampEnemy01(u);
  const cool = Math.sin(Math.min(1, t / 0.42) * Math.PI * 0.5);
  const flop = t >= 0.16 ? Math.sin(Math.min(1, (t - 0.16) / 0.64) * Math.PI * 0.5) : 0;
  const tail = t >= 0.48 ? Math.sin(Math.min(1, (t - 0.48) / 0.36) * Math.PI) : 0;
  const fade = clampEnemy01((t - 0.97) / 0.03);
  return {
    scaleX: 1 + flop * 0.08,
    scaleY: 1 - flop * 0.18,
    scaleZ: 1 - flop * 0.10,
    rotationZ: side * flop * 0.92,
    yOffset: -0.035 * flop,
    lateralDrift: side * 0.075 * flop,
    backwardDrift: 0.035 * flop,
    opacity: 1 - fade,
    secondary: { wag: side * tail * 0.28, inflate: -cool * 0.42, glow: -cool * 0.95 },
  };
}

/* すみころ ---------------------------------------------------------------- */

function charcoalIdle(now: number, phase = 0): EnemyPose {
  const tiny = Math.sin(now * 0.78 + phase);
  return pose({
    scaleX: 1 + tiny * 0.002,
    scaleY: 1 - tiny * 0.003,
    scaleZ: 1 + tiny * 0.002,
    secondary: { inflate: 0.01, glow: 0.04 },
  });
}

function charcoalMove(now: number, phase = 0): EnemyPose {
  const cycle = (now / 1.35 + phase) % 1;
  const roll = Math.sin(cycle * tau);
  return pose({
    scaleX: 1 + Math.abs(roll) * 0.012,
    scaleY: 1 - Math.abs(roll) * 0.020,
    scaleZ: 1,
    jump: 0.004,
    wobbleZ: roll * 0.20,
    secondary: { glow: 0.05 },
  });
}

function charcoalAttack(u: number): EnemyPose {
  const t = clampEnemy01(u);
  const c1 = t < 0.18 ? Math.sin((t / 0.18) * Math.PI * 0.5) : 1;
  const c2 = t < 0.22 ? 0 : t < 0.38 ? Math.sin(((t - 0.22) / 0.16) * Math.PI * 0.5) : 1;
  const c3 = t < 0.42 ? 0 : t < 0.54 ? Math.sin(((t - 0.42) / 0.12) * Math.PI * 0.5) : 1;
  const hold = t >= 0.54 && t < 0.66 ? 1 : 0;
  const burst = t >= 0.64 && t < 0.79 ? Math.sin(((t - 0.64) / 0.15) * Math.PI) : 0;
  const recover = t >= 0.72 ? clampEnemy01((t - 0.72) / 0.28) : 0;
  const charge = Math.max(c1 * 0.28, c2 * 0.58, c3);
  return pose({
    scaleX: 1 + charge * 0.035 + burst * 0.080,
    scaleY: 1 - charge * 0.075 - burst * 0.110,
    scaleZ: 1 + charge * 0.040,
    jump: burst * 0.018,
    wobbleZ: burst * 0.14,
    travel: burst * 0.72,
    releaseProgress: t >= 0.64 ? (t - 0.64) / 0.36 : -1,
    secondary: {
      inflate: charge * 0.22 - recover * 0.12,
      glow: charge * 1.25 - recover * 0.90,
      glowHeat: Math.max(c2 * 0.45, c3 * 0.96),
      twist: hold * 0.015,
    },
  });
}

function charcoalHit(u: number, side: number): EnemyHitPose {
  const pulse = Math.sin(clampEnemy01(u) * Math.PI);
  return {
    scaleX: 1 + pulse * 0.055,
    scaleY: 1 - pulse * 0.090,
    scaleZ: 1 - pulse * 0.040,
    rotationZ: side * pulse * 0.10,
    secondary: { glow: -pulse * 0.78, glowHeat: 0 },
  };
}

function charcoalDefeat(u: number, side: number): EnemyDefeatPose {
  const t = clampEnemy01(u);
  const cool = Math.sin(Math.min(1, t / 0.46) * Math.PI * 0.5);
  const settle = t >= 0.28 ? Math.sin(Math.min(1, (t - 0.28) / 0.58) * Math.PI * 0.5) : 0;
  const fade = clampEnemy01((t - 0.97) / 0.03);
  return {
    scaleX: 1 + settle * 0.09,
    scaleY: 1 - settle * 0.26,
    scaleZ: 1 - settle * 0.13,
    rotationZ: side * settle * 0.20,
    yOffset: -0.050 * settle,
    lateralDrift: side * 0.025 * settle,
    backwardDrift: 0.020 * settle,
    opacity: 1 - fade,
    secondary: { inflate: -cool * 0.30, glow: -cool, glowHeat: 0 },
  };
}

/* ぱちパチムシ ------------------------------------------------------------ */

function crackleIdle(now: number, phase = 0): EnemyPose {
  const pulse = Math.sin(now * 1.18 + phase);
  return pose({
    scaleX: 1 + pulse * 0.004,
    scaleY: 1 - pulse * 0.006,
    scaleZ: 1 + pulse * 0.004,
    secondary: { shellCurl: pulse * 0.025, inflate: 0.02 + Math.max(0, pulse) * 0.020, glow: 0.08 + Math.max(0, pulse) * 0.10 },
  });
}

function crackleMove(now: number, phase = 0): EnemyPose {
  const cycle = (now / 1.08 + phase) % 1;
  const scuttle = Math.sin(cycle * tau);
  return pose({
    scaleX: 1 + Math.abs(scuttle) * 0.014,
    scaleY: 1 - Math.abs(scuttle) * 0.020,
    scaleZ: 1 + Math.abs(scuttle) * 0.012,
    jump: Math.max(0, Math.sin(cycle * Math.PI)) * 0.020,
    wobbleZ: scuttle * 0.020,
    secondary: { shellRoll: -scuttle * 0.05, glow: 0.08 },
  });
}

function crackleAttack(u: number): EnemyPose {
  const t = clampEnemy01(u);
  const shake1 = t < 0.24 ? Math.sin((t / 0.24) * Math.PI * 2) * (1 - t / 0.30) : 0;
  const shake2 = t >= 0.25 && t < 0.49 ? Math.sin(((t - 0.25) / 0.24) * Math.PI * 2) * (1 - (t - 0.25) / 0.30) : 0;
  const hold = t >= 0.50 && t < 0.62 ? 1 : 0;
  const release = Math.exp(-Math.pow((t - 0.64) / 0.055, 2));
  const recoil = t >= 0.64 && t < 0.88 ? Math.sin(((t - 0.64) / 0.24) * Math.PI) : 0;
  const charge = clampEnemy01(t / 0.56);
  return pose({
    scaleX: 1 - hold * 0.020 + release * 0.035,
    scaleY: 1 + hold * 0.018 - release * 0.045,
    scaleZ: 1 - hold * 0.018 + release * 0.028,
    travel: -recoil * 0.035,
    releaseProgress: t >= 0.64 ? (t - 0.64) / 0.36 : -1,
    secondary: {
      shellRoll: shake1 * 0.15 + shake2 * 0.22 - recoil * 0.10,
      shellCurl: hold * 0.12 - recoil * 0.08,
      inflate: charge * 0.18,
      glow: charge * 0.90,
      glowHeat: charge * 0.70,
    },
  });
}

function crackleHit(u: number, side: number): EnemyHitPose {
  const pulse = Math.sin(clampEnemy01(u) * Math.PI);
  return {
    scaleX: 1 - pulse * 0.040,
    scaleY: 1 + pulse * 0.025,
    scaleZ: 1 - pulse * 0.035,
    rotationZ: side * pulse * 0.08,
    secondary: { shellCurl: -pulse * 0.20, glow: -pulse * 0.45 },
  };
}

function crackleDefeat(u: number, side: number): EnemyDefeatPose {
  const t = clampEnemy01(u);
  const close = Math.sin(Math.min(1, t / 0.50) * Math.PI * 0.5);
  const fizz = t >= 0.26 && t < 0.58 ? Math.sin(((t - 0.26) / 0.32) * Math.PI * 3) * (1 - (t - 0.26) / 0.32) : 0;
  const collapse = t >= 0.40 ? Math.sin(Math.min(1, (t - 0.40) / 0.48) * Math.PI * 0.5) : 0;
  const fade = clampEnemy01((t - 0.97) / 0.03);
  return {
    scaleX: 1 + collapse * 0.12,
    scaleY: 1 - collapse * 0.28,
    scaleZ: 1 - collapse * 0.14,
    rotationZ: side * collapse * 0.15,
    yOffset: -0.050 * collapse,
    lateralDrift: side * 0.020 * collapse,
    backwardDrift: 0.020 * collapse,
    opacity: 1 - fade,
    secondary: { shellCurl: -close * 0.26, inflate: -close * 0.35, glow: -close * 0.95 + Math.abs(fizz) * 0.20 },
  };
}

/* マグマガニ --------------------------------------------------------------- */

function crabIdle(now: number, phase = 0): EnemyPose {
  const side = Math.sin(now * 1.05 + phase);
  return pose({
    scaleX: 1 + Math.abs(side) * 0.004,
    scaleY: 1 - Math.abs(side) * 0.005,
    scaleZ: 1,
    wobbleZ: side * 0.010,
    secondary: { primaryBend: side * 0.08, secondaryBend: -side * 0.08, glow: 0.08 },
  });
}

function crabMove(now: number, phase = 0): EnemyPose {
  const cycle = (now / 1.18 + phase) % 1;
  const slide = Math.sin(cycle * tau);
  return pose({
    scaleX: 1 + Math.abs(slide) * 0.010,
    scaleY: 1 - Math.abs(slide) * 0.014,
    scaleZ: 1,
    jump: 0.003,
    wobbleZ: slide * 0.018,
    secondary: { primaryBend: slide * 0.10, secondaryBend: -slide * 0.10, glow: 0.08 },
  });
}

function crabAttack(u: number): EnemyPose {
  const t = clampEnemy01(u);
  const weight = t < 0.30 ? Math.sin((t / 0.30) * Math.PI * 0.5) : t < 0.40 ? 1 : Math.max(0, 1 - (t - 0.40) / 0.16);
  const snap = t >= 0.38 && t < 0.65 ? Math.sin(((t - 0.38) / 0.27) * Math.PI * 0.5) : t >= 0.65 ? Math.max(0, 1 - (t - 0.65) / 0.20) : 0;
  const impact = Math.exp(-Math.pow((t - 0.63) / 0.055, 2));
  const oppositeSettle = t >= 0.64 && t < 0.94 ? Math.sin(((t - 0.64) / 0.30) * Math.PI) : 0;
  return pose({
    scaleX: 1 + impact * 0.055,
    scaleY: 1 - impact * 0.075,
    scaleZ: 1 + weight * 0.020,
    wobbleZ: -weight * 0.08 + snap * 0.11,
    travel: snap * 0.80,
    releaseProgress: t >= 0.38 ? (t - 0.38) / 0.62 : -1,
    secondary: {
      primaryBend: weight * 0.42 - impact * 0.16,
      secondaryBend: -snap * 0.38 + oppositeSettle * 0.30,
      glow: impact * 0.42,
      glowHeat: impact * 0.50,
    },
  });
}

function crabHit(u: number, side: number): EnemyHitPose {
  const pulse = Math.sin(clampEnemy01(u) * Math.PI);
  return {
    scaleX: 1 - pulse * 0.045,
    scaleY: 1 + pulse * 0.025,
    scaleZ: 1 - pulse * 0.030,
    rotationZ: side * pulse * 0.055,
    secondary: {
      primaryBend: side < 0 ? pulse * 0.30 : 0,
      secondaryBend: side > 0 ? -pulse * 0.30 : 0,
      glow: -pulse * 0.18,
    },
  };
}

function crabDefeat(u: number, side: number): EnemyDefeatPose {
  const t = clampEnemy01(u);
  const lower = Math.sin(Math.min(1, t / 0.72) * Math.PI * 0.5);
  const claws = t >= 0.28 ? Math.sin(Math.min(1, (t - 0.28) / 0.58) * Math.PI * 0.5) : 0;
  const fade = clampEnemy01((t - 0.97) / 0.03);
  return {
    scaleX: 1 + lower * 0.12,
    scaleY: 1 - lower * 0.30,
    scaleZ: 1 - lower * 0.16,
    rotationZ: side * lower * 0.05,
    yOffset: -0.055 * lower,
    lateralDrift: side * 0.018 * lower,
    backwardDrift: 0.022 * lower,
    opacity: 1 - fade,
    secondary: { primaryBend: claws * 0.42, secondaryBend: -claws * 0.42, glow: -lower * 0.78 },
  };
}

/* 炉心ガメ ---------------------------------------------------------------- */

function furnaceIdle(now: number, phase = 0): EnemyPose {
  const breathe = Math.sin(now * 0.88 + phase);
  const core = Math.sin(now * 0.68 + phase - 0.35);
  return pose({
    scaleX: 1 + breathe * 0.004,
    scaleY: 1 - breathe * 0.006,
    scaleZ: 1 + breathe * 0.004,
    secondary: { shellCurl: breathe * 0.018, inflate: 0.03 + core * 0.015, glow: 0.10 + Math.max(0, core) * 0.08 },
  });
}

function furnaceMove(now: number, phase = 0): EnemyPose {
  const cycle = (now / 1.72 + phase) % 1;
  const step = Math.sin(cycle * tau);
  return pose({
    scaleX: 1 + Math.abs(step) * 0.008,
    scaleY: 1 - Math.abs(step) * 0.012,
    scaleZ: 1,
    jump: Math.max(0, Math.sin(cycle * Math.PI)) * 0.012,
    wobbleZ: step * 0.018,
    secondary: { headNod: -step * 0.045, shellRoll: step * 0.025, glow: 0.10 },
  });
}

function furnaceAttack(u: number): EnemyPose {
  const t = clampEnemy01(u);
  const open = t < 0.18 ? Math.sin((t / 0.18) * Math.PI * 0.5) : t < 0.62 ? 1 : Math.max(0, 1 - (t - 0.62) / 0.22);
  const red = t < 0.18 ? 0 : t < 0.32 ? Math.sin(((t - 0.18) / 0.14) * Math.PI * 0.5) : 1;
  const orange = t < 0.32 ? 0 : t < 0.46 ? Math.sin(((t - 0.32) / 0.14) * Math.PI * 0.5) : 1;
  const white = t < 0.46 ? 0 : t < 0.56 ? Math.sin(((t - 0.46) / 0.10) * Math.PI * 0.5) : 1;
  const charge = Math.max(red * 0.28, orange * 0.62, white);
  const compress = t >= 0.48 && t < 0.62 ? Math.sin(((t - 0.48) / 0.14) * Math.PI * 0.5) : t < 0.68 ? 1 : Math.max(0, 1 - (t - 0.68) / 0.10);
  const jump = t >= 0.59 && t < 0.70 ? Math.sin(((t - 0.59) / 0.11) * Math.PI) : 0;
  const impact = Math.exp(-Math.pow((t - 0.70) / 0.048, 2));
  const delayedRing = Math.exp(-Math.pow((t - 0.79) / 0.050, 2));
  const ventRecoil = t >= 0.82 && t < 0.97 ? Math.sin(((t - 0.82) / 0.15) * Math.PI) : 0;
  return pose({
    scaleX: 1 + compress * 0.055 + impact * 0.075,
    scaleY: 1 - compress * 0.105 - impact * 0.100,
    scaleZ: 1 + compress * 0.060,
    jump: jump * 0.18,
    wobbleZ: impact * 0.045 - ventRecoil * 0.025,
    travel: impact * 0.20,
    releaseProgress: t >= 0.79 ? (t - 0.79) / 0.21 : -1,
    secondary: {
      shellCurl: open * 0.22 - ventRecoil * 0.10,
      headRetract: -compress * 0.08 + impact * 0.04,
      inflate: charge * 0.46 + delayedRing * 0.16,
      glow: charge * 1.55 + delayedRing * 0.75 - ventRecoil * 0.20,
      glowHeat: Math.max(orange * 0.58, white),
    },
  });
}

function furnaceHit(u: number, side: number): EnemyHitPose {
  const pulse = Math.sin(clampEnemy01(u) * Math.PI);
  return {
    scaleX: 1 + pulse * 0.035,
    scaleY: 1 - pulse * 0.060,
    scaleZ: 1 - pulse * 0.025,
    rotationZ: side * pulse * 0.050,
    secondary: { shellCurl: -pulse * 0.10, headRetract: -pulse * 0.04, glow: -pulse * 0.20 },
  };
}

function furnaceDefeat(u: number, side: number): EnemyDefeatPose {
  const t = clampEnemy01(u);
  const close = Math.sin(Math.min(1, t / 0.40) * Math.PI * 0.5);
  const cool = t >= 0.08 ? Math.sin(Math.min(1, (t - 0.08) / 0.48) * Math.PI * 0.5) : 0;
  const sit = t >= 0.34 ? Math.sin(Math.min(1, (t - 0.34) / 0.52) * Math.PI * 0.5) : 0;
  const final = t >= 0.78 ? Math.sin(clampEnemy01((t - 0.78) / 0.18) * Math.PI) : 0;
  const fade = clampEnemy01((t - 0.98) / 0.02);
  return {
    scaleX: 1 + sit * 0.11,
    scaleY: 1 - sit * 0.30,
    scaleZ: 1 - sit * 0.14,
    rotationZ: side * final * 0.035,
    yOffset: -0.075 * sit,
    lateralDrift: side * 0.015 * sit,
    backwardDrift: 0.018 * sit,
    opacity: 1 - fade,
    secondary: { shellCurl: -close * 0.20, headRetract: -sit * 0.08, inflate: -cool * 0.40, glow: -cool },
  };
}

function emberSparkMesh(): THREE.Object3D {
  const group = new THREE.Group();
  const core = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.075, 1),
    new THREE.MeshStandardMaterial({
      color: '#ff8b22',
      emissive: '#ff4c08',
      emissiveIntensity: 0.85,
      roughness: 0.28,
    }),
  );
  group.add(core);
  return group;
}

function fireRingMesh(): THREE.Object3D {
  const group = new THREE.Group();
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.16, 0.022, 8, 28),
    new THREE.MeshStandardMaterial({
      color: '#ffb02f',
      emissive: '#ff4c08',
      emissiveIntensity: 0.72,
      roughness: 0.30,
    }),
  );
  ring.rotation.x = Math.PI / 2;
  group.add(ring);
  return group;
}

const profiles: Record<EmberBehaviorId, EnemyMotionProfile> = {
  'ember-tail-dash': {
    familyId: 'ember',
    idle: geckoIdle,
    move: geckoMove,
    attack: geckoAttack,
    hit: geckoHit,
    defeat: geckoDefeat,
    moveDuration: 0.94,
    moveDistance: 0.92,
    attackDuration: 0.92,
    attackTravelDistance: 0.52,
    contactU: 0.65,
    defeatDuration: 1.22,
  },
  'ember-charcoal-burst': {
    familyId: 'ember',
    idle: charcoalIdle,
    move: charcoalMove,
    attack: charcoalAttack,
    hit: charcoalHit,
    defeat: charcoalDefeat,
    moveDuration: 1.35,
    moveDistance: 0.62,
    attackDuration: 1.10,
    attackTravelDistance: 0.34,
    contactU: 0.72,
    defeatDuration: 1.28,
  },
  'ember-spark-shell': {
    familyId: 'ember',
    idle: crackleIdle,
    move: crackleMove,
    attack: crackleAttack,
    hit: crackleHit,
    defeat: crackleDefeat,
    moveDuration: 1.08,
    moveDistance: 0.76,
    attackDuration: 1.12,
    attackTravelDistance: 0.04,
    contactU: 0.64,
    defeatDuration: 1.26,
    projectile: {
      kind: 'ember-spark',
      flightSeconds: 0.34,
      createMesh: emberSparkMesh,
      arcHeight: (u) => Math.sin(clampEnemy01(u) * Math.PI) * 0.05,
    },
  },
  'ember-crab-snap': {
    familyId: 'ember',
    idle: crabIdle,
    move: crabMove,
    attack: crabAttack,
    hit: crabHit,
    defeat: crabDefeat,
    moveDuration: 1.18,
    moveDistance: 0.70,
    attackDuration: 1.02,
    attackTravelDistance: 0.36,
    contactU: 0.63,
    defeatDuration: 1.30,
  },
  'ember-furnace-boss': {
    familyId: 'ember',
    idle: furnaceIdle,
    move: furnaceMove,
    attack: furnaceAttack,
    hit: furnaceHit,
    defeat: furnaceDefeat,
    moveDuration: 1.72,
    moveDistance: 0.48,
    attackDuration: 1.68,
    attackTravelDistance: 0.12,
    contactU: 0.79,
    defeatDuration: 1.78,
    projectile: {
      kind: 'fire-ring',
      flightSeconds: 0.30,
      createMesh: fireRingMesh,
      arcHeight: (u) => Math.sin(clampEnemy01(u) * Math.PI) * 0.025,
    },
  },
};

export const getEmberMotionProfile = (id: EmberBehaviorId): EnemyMotionProfile => profiles[id];