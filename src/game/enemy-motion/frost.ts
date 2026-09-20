import * as THREE from 'three';
import {
  clampEnemy01,
  type EnemyDefeatPose,
  type EnemyHitPose,
  type EnemyMotionProfile,
  type EnemyPose,
} from './shared';

export type FrostBehaviorId =
  | 'frost-snow-roll'
  | 'frost-ice-spike-shot'
  | 'frost-scarf-dash'
  | 'frost-lantern-ray'
  | 'frost-guardian-boss';

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
/* ゆきころ — almost no hop: low rolling body with a delayed single ice nub.  */
/* -------------------------------------------------------------------------- */

function rollerIdle(now: number, phase = 0): EnemyPose {
  const breathe = Math.sin(now * 1.45 + phase);
  const nubLag = Math.sin(now * 1.45 + phase - 0.48);
  return pose({
    scaleX: 1 + breathe * 0.012,
    scaleY: 1 - breathe * 0.010,
    scaleZ: 1 + breathe * 0.008,
    secondary: { primaryBend: nubLag * 0.055 },
  });
}

function rollerMove(now: number, phase = 0): EnemyPose {
  const cycle = (now / 1.10 + phase) % 1;
  const roll = Math.sin(cycle * tau);
  const contact = Math.max(0, -Math.sin(cycle * tau));
  return pose({
    scaleX: 1 + contact * 0.035,
    scaleY: 1 - contact * 0.060,
    scaleZ: 1 + contact * 0.020,
    jump: Math.max(0, Math.sin(cycle * Math.PI)) * 0.012,
    wobbleZ: roll * 0.22,
    secondary: { primaryBend: -roll * 0.095 },
  });
}

function rollerAttack(u: number): EnemyPose {
  const t = clampEnemy01(u);
  const wind = t < 0.30 ? Math.sin((t / 0.30) * Math.PI * 0.5) : t < 0.42 ? 1 : Math.max(0, 1 - (t - 0.42) / 0.16);
  const rush = t >= 0.34 && t < 0.68 ? Math.sin(((t - 0.34) / 0.34) * Math.PI * 0.5) : t >= 0.68 ? Math.max(0, 1 - (t - 0.68) / 0.24) : 0;
  const contact = Math.exp(-Math.pow((t - 0.64) / 0.065, 2));
  const overshoot = t >= 0.64 && t < 0.94 ? Math.sin(((t - 0.64) / 0.30) * Math.PI) : 0;
  return pose({
    scaleX: 1 + wind * 0.035 + contact * 0.085,
    scaleY: 1 - wind * 0.070 - contact * 0.120,
    scaleZ: 1 + wind * 0.025,
    wobbleZ: -wind * 0.24 + rush * 0.36,
    travel: rush,
    releaseProgress: t >= 0.34 ? (t - 0.34) / 0.66 : -1,
    secondary: { primaryBend: -wind * 0.16 + contact * 0.14 + overshoot * 0.22 },
  });
}

function rollerHit(u: number, side: number): EnemyHitPose {
  const pulse = Math.sin(clampEnemy01(u) * Math.PI);
  return {
    scaleX: 1 + pulse * 0.075,
    scaleY: 1 - pulse * 0.11,
    scaleZ: 1 - pulse * 0.045,
    rotationZ: side * pulse * 0.10,
    secondary: { primaryBend: -side * pulse * 0.18 },
  };
}

function rollerDefeat(u: number, side: number): EnemyDefeatPose {
  const t = clampEnemy01(u);
  const roll = Math.sin(Math.min(1, t / 0.76) * Math.PI * 0.5);
  const settle = t >= 0.64 ? Math.sin(clampEnemy01((t - 0.64) / 0.30) * Math.PI) : 0;
  const fade = clampEnemy01((t - 0.97) / 0.03);
  return {
    scaleX: 1 + roll * 0.10,
    scaleY: 1 - roll * 0.18,
    scaleZ: 1 - roll * 0.06,
    rotationZ: side * roll * 1.28,
    yOffset: -0.035 * roll,
    lateralDrift: side * 0.055 * roll,
    backwardDrift: 0.035 * roll,
    opacity: 1 - fade,
    secondary: { primaryBend: side * (roll * 0.26 - settle * 0.08) },
  };
}

/* -------------------------------------------------------------------------- */
/* こおりムシ — exactly three spikes telegraph and release one compact shard. */
/* -------------------------------------------------------------------------- */

function iceBugIdle(now: number, phase = 0): EnemyPose {
  const breathe = Math.sin(now * 1.35 + phase);
  const spikes = Math.sin(now * 1.35 + phase - 0.35);
  return pose({
    scaleX: 1 + breathe * 0.007,
    scaleY: 1 - breathe * 0.008,
    scaleZ: 1 + breathe * 0.005,
    secondary: { primaryBend: spikes * 0.045 },
  });
}

function iceBugMove(now: number, phase = 0): EnemyPose {
  const cycle = (now / 1.24 + phase) % 1;
  const glide = Math.sin(cycle * tau);
  return pose({
    scaleX: 1 + Math.abs(glide) * 0.018,
    scaleY: 1 - Math.abs(glide) * 0.025,
    scaleZ: 1,
    jump: 0.004,
    wobbleZ: glide * 0.012,
    secondary: { primaryBend: -glide * 0.075 },
  });
}

function iceBugAttack(u: number): EnemyPose {
  const t = clampEnemy01(u);
  const lean = t < 0.28 ? Math.sin((t / 0.28) * Math.PI * 0.5) : t < 0.42 ? 1 : Math.max(0, 1 - (t - 0.42) / 0.14);
  const snap = t >= 0.42 && t < 0.61 ? Math.sin(((t - 0.42) / 0.19) * Math.PI) : 0;
  const recoil = t >= 0.58 && t < 0.88 ? Math.sin(((t - 0.58) / 0.30) * Math.PI) : 0;
  return pose({
    scaleX: 1 - lean * 0.025 + snap * 0.030,
    scaleY: 1 + lean * 0.020 - snap * 0.040,
    scaleZ: 1 - lean * 0.020 + snap * 0.025,
    travel: -recoil * 0.035,
    releaseProgress: t >= 0.56 ? (t - 0.56) / 0.44 : -1,
    secondary: { primaryBend: -lean * 0.34 + snap * 0.62 - recoil * 0.20 },
  });
}

function iceBugHit(u: number, side: number): EnemyHitPose {
  const pulse = Math.sin(clampEnemy01(u) * Math.PI);
  return {
    scaleX: 1 - pulse * 0.045,
    scaleY: 1 + pulse * 0.035,
    scaleZ: 1 - pulse * 0.050,
    rotationZ: side * pulse * 0.08,
    secondary: { primaryBend: -side * pulse * 0.20 },
  };
}

function iceBugDefeat(u: number, side: number): EnemyDefeatPose {
  const t = clampEnemy01(u);
  const sit = Math.sin(Math.min(1, t / 0.70) * Math.PI * 0.5);
  const droop = t >= 0.20 ? Math.sin(Math.min(1, (t - 0.20) / 0.66) * Math.PI * 0.5) : 0;
  const fade = clampEnemy01((t - 0.96) / 0.04);
  return {
    scaleX: 1 + sit * 0.13,
    scaleY: 1 - sit * 0.32,
    scaleZ: 1 - sit * 0.18,
    rotationZ: side * sit * 0.10,
    yOffset: -0.055 * sit,
    lateralDrift: side * 0.018 * sit,
    backwardDrift: 0.018 * sit,
    opacity: 1 - fade,
    secondary: { primaryBend: side * droop * 0.36 },
  };
}

/* -------------------------------------------------------------------------- */
/* マフラー雪だるま — scarf tells first, body dashes second, scarf overshoots. */
/* -------------------------------------------------------------------------- */

function scarfIdle(now: number, phase = 0): EnemyPose {
  const breathe = Math.sin(now * 1.25 + phase);
  const scarf = Math.sin(now * 1.25 + phase - 0.60);
  return pose({
    scaleX: 1 + breathe * 0.006,
    scaleY: 1 - breathe * 0.008,
    scaleZ: 1 + breathe * 0.006,
    secondary: { wag: scarf * 0.11 },
  });
}

function scarfMove(now: number, phase = 0): EnemyPose {
  const cycle = (now / 1.12 + phase) % 1;
  const hop = Math.max(0, Math.sin(cycle * Math.PI));
  const scarf = Math.sin(cycle * tau - 0.70);
  return pose({
    scaleX: 1 + hop * 0.020,
    scaleY: 1 - hop * 0.030,
    scaleZ: 1 + hop * 0.035,
    jump: hop * 0.055,
    wobbleZ: Math.sin(cycle * tau) * 0.025,
    secondary: { wag: -scarf * 0.20 },
  });
}

function scarfAttack(u: number): EnemyPose {
  const t = clampEnemy01(u);
  const backSweep = t < 0.30 ? Math.sin((t / 0.30) * Math.PI * 0.5) : t < 0.40 ? 1 : Math.max(0, 1 - (t - 0.40) / 0.15);
  const dash = t >= 0.38 && t < 0.67 ? Math.sin(((t - 0.38) / 0.29) * Math.PI * 0.5) : t >= 0.67 ? Math.max(0, 1 - (t - 0.67) / 0.23) : 0;
  const impact = Math.exp(-Math.pow((t - 0.64) / 0.065, 2));
  const overshoot = t >= 0.62 && t < 0.93 ? Math.sin(((t - 0.62) / 0.31) * Math.PI) : 0;
  return pose({
    scaleX: 1 - backSweep * 0.025 + impact * 0.075,
    scaleY: 1 - impact * 0.095,
    scaleZ: 1 + backSweep * 0.020,
    jump: dash * 0.025,
    travel: dash,
    releaseProgress: t >= 0.38 ? (t - 0.38) / 0.62 : -1,
    secondary: { wag: -backSweep * 0.68 + impact * 0.30 + overshoot * 0.82 },
  });
}

function scarfHit(u: number, side: number): EnemyHitPose {
  const pulse = Math.sin(clampEnemy01(u) * Math.PI);
  return {
    scaleX: 1 + pulse * 0.055,
    scaleY: 1 - pulse * 0.080,
    scaleZ: 1 - pulse * 0.035,
    rotationZ: side * pulse * 0.11,
    secondary: { wag: side * pulse * 0.62 },
  };
}

function scarfDefeat(u: number, side: number): EnemyDefeatPose {
  const t = clampEnemy01(u);
  const sink = Math.sin(Math.min(1, t / 0.72) * Math.PI * 0.5);
  const scarfFall = t >= 0.38 ? Math.sin(Math.min(1, (t - 0.38) / 0.52) * Math.PI * 0.5) : 0;
  const fade = clampEnemy01((t - 0.97) / 0.03);
  return {
    scaleX: 1 + sink * 0.16,
    scaleY: 1 - sink * 0.32,
    scaleZ: 1 - sink * 0.28,
    rotationZ: side * sink * 0.08,
    yOffset: -0.080 * sink,
    lateralDrift: side * 0.018 * sink,
    backwardDrift: 0.018 * sink,
    opacity: 1 - fade,
    secondary: { wag: side * scarfFall * 1.02 },
  };
}

/* -------------------------------------------------------------------------- */
/* つららランタン — hover, bounded core glow, one thin ray, then flicker.      */
/* -------------------------------------------------------------------------- */

function lanternIdle(now: number, phase = 0): EnemyPose {
  const hover = Math.sin(now * 1.55 + phase);
  const light = Math.sin(now * 1.10 + phase - 0.25);
  return pose({
    scaleX: 1,
    scaleY: 1,
    scaleZ: 1,
    jump: 0.025 + hover * 0.018,
    wobbleZ: hover * 0.018,
    secondary: { inflate: 0.04 + light * 0.025 },
  });
}

function lanternMove(now: number, phase = 0): EnemyPose {
  const cycle = (now / 1.30 + phase) % 1;
  const glide = Math.sin(cycle * tau);
  return pose({
    jump: 0.025 + Math.sin(cycle * Math.PI) * 0.018,
    wobbleZ: glide * 0.035,
    secondary: { inflate: 0.03 + Math.sin(cycle * tau - 0.40) * 0.020 },
  });
}

function lanternAttack(u: number): EnemyPose {
  const t = clampEnemy01(u);
  const compress = t < 0.22 ? Math.sin((t / 0.22) * Math.PI * 0.5) : t < 0.34 ? 1 : Math.max(0, 1 - (t - 0.34) / 0.14);
  const glow = t >= 0.16 && t < 0.52 ? Math.sin(((t - 0.16) / 0.36) * Math.PI * 0.5) : t >= 0.52 && t < 0.68 ? 1 - ((t - 0.52) / 0.16) : 0;
  const flash = Math.exp(-Math.pow((t - 0.56) / 0.060, 2));
  const recoil = t >= 0.56 && t < 0.84 ? Math.sin(((t - 0.56) / 0.28) * Math.PI) : 0;
  const flicker = t >= 0.62 ? Math.sin((t - 0.62) * 42) * (1 - clampEnemy01((t - 0.62) / 0.36)) : 0;
  return pose({
    scaleX: 1 + compress * 0.040 - flash * 0.025,
    scaleY: 1 - compress * 0.065,
    scaleZ: 1 - compress * 0.055 + flash * 0.035,
    jump: 0.022 - compress * 0.018 + recoil * 0.040,
    travel: -recoil * 0.055,
    releaseProgress: t >= 0.56 ? (t - 0.56) / 0.44 : -1,
    secondary: { inflate: glow * 0.62 + flash * 0.20 + flicker * 0.06, secondaryBend: recoil * 0.08 },
  });
}

function lanternHit(u: number, side: number): EnemyHitPose {
  const t = clampEnemy01(u);
  const pulse = Math.sin(t * Math.PI);
  const flicker = Math.sin(t * Math.PI * 5) * pulse;
  return {
    scaleX: 1 - pulse * 0.035,
    scaleY: 1 + pulse * 0.025,
    scaleZ: 1 - pulse * 0.055,
    rotationZ: side * pulse * 0.20,
    secondary: { inflate: -pulse * 0.30 + flicker * 0.06 },
  };
}

function lanternDefeat(u: number, side: number): EnemyDefeatPose {
  const t = clampEnemy01(u);
  const dim = Math.sin(Math.min(1, t / 0.46) * Math.PI * 0.5);
  const land = t >= 0.28 ? Math.sin(Math.min(1, (t - 0.28) / 0.62) * Math.PI * 0.5) : 0;
  const fade = clampEnemy01((t - 0.97) / 0.03);
  return {
    scaleX: 1 + land * 0.035,
    scaleY: 1 - land * 0.08,
    scaleZ: 1 - land * 0.10,
    rotationZ: side * land * 0.36,
    yOffset: -0.145 * land,
    lateralDrift: side * 0.025 * land,
    backwardDrift: 0.020 * land,
    opacity: 1 - fade,
    secondary: { inflate: -dim * 0.44 },
  };
}

/* -------------------------------------------------------------------------- */
/* 雪像の番人 — upper mass leads, whole statue follows, crest settles last.    */
/* -------------------------------------------------------------------------- */

function guardianIdle(now: number, phase = 0): EnemyPose {
  const body = Math.sin(now * 0.92 + phase);
  const upper = Math.sin(now * 0.92 + phase - 0.35);
  const crest = Math.sin(now * 0.92 + phase - 0.62);
  return pose({
    scaleX: 1 + body * 0.005,
    scaleY: 1 - body * 0.006,
    scaleZ: 1 + body * 0.004,
    secondary: { twist: upper * 0.035, secondaryBend: crest * 0.040, inflate: 0.025 + crest * 0.012 },
  });
}

function guardianMove(now: number, phase = 0): EnemyPose {
  const cycle = (now / 1.74 + phase) % 1;
  const slide = Math.sin(cycle * tau);
  return pose({
    scaleX: 1 + Math.abs(slide) * 0.010,
    scaleY: 1 - Math.abs(slide) * 0.014,
    scaleZ: 1,
    jump: 0.004,
    wobbleZ: slide * 0.022,
    secondary: { twist: -slide * 0.075, secondaryBend: slide * 0.055 },
  });
}

function guardianAttack(u: number): EnemyPose {
  const t = clampEnemy01(u);
  const upperTurn = t < 0.20 ? Math.sin((t / 0.20) * Math.PI * 0.5) : t < 0.32 ? 1 : Math.max(0, 1 - (t - 0.32) / 0.16);
  const lowerFollow = t >= 0.22 && t < 0.42 ? Math.sin(((t - 0.22) / 0.20) * Math.PI * 0.5) : t >= 0.42 && t < 0.58 ? 1 - ((t - 0.42) / 0.16) : 0;
  const spinProgress = t < 0.34 ? 0 : t < 0.66 ? clampEnemy01((t - 0.34) / 0.32) : 1;
  const spinAngle = spinProgress * tau;
  const pulse = Math.exp(-Math.pow((t - 0.66) / 0.075, 2));
  const crestLag = t >= 0.66 && t < 0.94 ? Math.sin(((t - 0.66) / 0.28) * Math.PI) : 0;
  const glow = t >= 0.44 && t < 0.70 ? Math.sin(((t - 0.44) / 0.26) * Math.PI * 0.5) : t >= 0.70 ? Math.max(0, 1 - (t - 0.70) / 0.22) : 0;
  return pose({
    scaleX: 1 + pulse * 0.08,
    scaleY: 1 - pulse * 0.10,
    scaleZ: 1 + pulse * 0.04,
    jump: pulse * 0.025,
    wobbleZ: spinAngle + lowerFollow * 0.14,
    travel: pulse * 0.18,
    releaseProgress: t >= 0.66 ? (t - 0.66) / 0.34 : -1,
    secondary: {
      twist: -upperTurn * 0.50 + spinAngle,
      secondaryBend: -pulse * 0.18 + crestLag * 0.32,
      inflate: glow * 0.58 + pulse * 0.18,
    },
  });
}

function guardianHit(u: number, side: number): EnemyHitPose {
  const pulse = Math.sin(clampEnemy01(u) * Math.PI);
  return {
    scaleX: 1 + pulse * 0.045,
    scaleY: 1 - pulse * 0.075,
    scaleZ: 1 - pulse * 0.035,
    rotationZ: side * pulse * 0.08,
    secondary: { twist: side * pulse * 0.15, secondaryBend: -side * pulse * 0.22, inflate: -pulse * 0.12 },
  };
}

function guardianDefeat(u: number, side: number): EnemyDefeatPose {
  const t = clampEnemy01(u);
  const dim = Math.sin(Math.min(1, t / 0.34) * Math.PI * 0.5);
  const drop = t >= 0.18 ? Math.sin(Math.min(1, (t - 0.18) / 0.56) * Math.PI * 0.5) : 0;
  const bodySit = t >= 0.34 ? Math.sin(Math.min(1, (t - 0.34) / 0.52) * Math.PI * 0.5) : 0;
  const crestFall = t >= 0.48 ? Math.sin(Math.min(1, (t - 0.48) / 0.45) * Math.PI * 0.5) : 0;
  const finalWobble = t >= 0.78 ? Math.sin(clampEnemy01((t - 0.78) / 0.20) * Math.PI) : 0;
  const fade = clampEnemy01((t - 0.975) / 0.025);
  return {
    scaleX: 1 + bodySit * 0.12,
    scaleY: 1 - bodySit * 0.28,
    scaleZ: 1 - bodySit * 0.12,
    rotationZ: side * bodySit * 0.12,
    yOffset: -0.070 * bodySit,
    lateralDrift: side * 0.025 * bodySit,
    backwardDrift: 0.025 * bodySit,
    opacity: 1 - fade,
    secondary: {
      primaryLift: -drop * 0.23,
      twist: side * drop * 0.12,
      secondaryBend: side * crestFall * 0.42 - side * finalWobble * 0.10,
      inflate: -dim * 0.42,
    },
  };
}

function iceShardMesh(): THREE.Object3D {
  const group = new THREE.Group();
  const shard = new THREE.Mesh(
    new THREE.ConeGeometry(0.065, 0.26, 5),
    new THREE.MeshStandardMaterial({
      color: '#bfefff',
      emissive: '#5fc8ee',
      emissiveIntensity: 0.22,
      roughness: 0.28,
    }),
  );
  shard.rotation.x = Math.PI / 2;
  group.add(shard);
  return group;
}

function iceRayMesh(): THREE.Object3D {
  const group = new THREE.Group();
  const ray = new THREE.Mesh(
    new THREE.BoxGeometry(0.045, 0.045, 0.34),
    new THREE.MeshStandardMaterial({
      color: '#e7fbff',
      emissive: '#8eeaff',
      emissiveIntensity: 0.55,
      roughness: 0.20,
    }),
  );
  group.add(ray);
  return group;
}

function frostIcicleMesh(): THREE.Object3D {
  const group = new THREE.Group();
  const icicle = new THREE.Mesh(
    new THREE.ConeGeometry(0.085, 0.34, 6),
    new THREE.MeshStandardMaterial({
      color: '#d8f5ff',
      emissive: '#74d4f5',
      emissiveIntensity: 0.34,
      roughness: 0.24,
    }),
  );
  icicle.rotation.x = Math.PI / 2;
  const pulse = new THREE.Mesh(
    new THREE.TorusGeometry(0.13, 0.015, 8, 24),
    new THREE.MeshStandardMaterial({
      color: '#e8fbff',
      emissive: '#8ee7ff',
      emissiveIntensity: 0.26,
      roughness: 0.30,
    }),
  );
  pulse.rotation.x = Math.PI / 2;
  group.add(icicle, pulse);
  return group;
}

const profiles: Record<FrostBehaviorId, EnemyMotionProfile> = {
  'frost-snow-roll': {
    familyId: 'frost',
    idle: rollerIdle,
    move: rollerMove,
    attack: rollerAttack,
    hit: rollerHit,
    defeat: rollerDefeat,
    moveDuration: 1.10,
    moveDistance: 0.76,
    attackDuration: 0.86,
    attackTravelDistance: 0.42,
    contactU: 0.64,
    defeatDuration: 1.10,
  },
  'frost-ice-spike-shot': {
    familyId: 'frost',
    idle: iceBugIdle,
    move: iceBugMove,
    attack: iceBugAttack,
    hit: iceBugHit,
    defeat: iceBugDefeat,
    moveDuration: 1.24,
    moveDistance: 0.70,
    attackDuration: 0.98,
    attackTravelDistance: 0.04,
    contactU: 0.56,
    defeatDuration: 1.16,
    projectile: {
      kind: 'ice-shard',
      flightSeconds: 0.40,
      createMesh: iceShardMesh,
      arcHeight: (u) => Math.sin(clampEnemy01(u) * Math.PI) * 0.07,
    },
  },
  'frost-scarf-dash': {
    familyId: 'frost',
    idle: scarfIdle,
    move: scarfMove,
    attack: scarfAttack,
    hit: scarfHit,
    defeat: scarfDefeat,
    moveDuration: 1.12,
    moveDistance: 0.82,
    attackDuration: 0.90,
    attackTravelDistance: 0.48,
    contactU: 0.64,
    defeatDuration: 1.16,
  },
  'frost-lantern-ray': {
    familyId: 'frost',
    idle: lanternIdle,
    move: lanternMove,
    attack: lanternAttack,
    hit: lanternHit,
    defeat: lanternDefeat,
    moveDuration: 1.30,
    moveDistance: 0.66,
    attackDuration: 1.06,
    attackTravelDistance: 0.04,
    contactU: 0.56,
    defeatDuration: 1.22,
    projectile: {
      kind: 'ice-ray',
      flightSeconds: 0.30,
      createMesh: iceRayMesh,
      arcHeight: () => 0,
    },
  },
  'frost-guardian-boss': {
    familyId: 'frost',
    idle: guardianIdle,
    move: guardianMove,
    attack: guardianAttack,
    hit: guardianHit,
    defeat: guardianDefeat,
    moveDuration: 1.74,
    moveDistance: 0.52,
    attackDuration: 1.62,
    attackTravelDistance: 0.14,
    contactU: 0.66,
    defeatDuration: 1.68,
    projectile: {
      kind: 'frost-icicle',
      flightSeconds: 0.48,
      createMesh: frostIcicleMesh,
      arcHeight: (u) => Math.sin(clampEnemy01(u) * Math.PI) * 0.16,
    },
  },
};

export const getFrostMotionProfile = (id: FrostBehaviorId): EnemyMotionProfile => profiles[id];
