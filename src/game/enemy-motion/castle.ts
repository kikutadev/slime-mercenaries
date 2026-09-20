import * as THREE from 'three';
import {
  clampEnemy01,
  type EnemyDefeatPose,
  type EnemyHitPose,
  type EnemyMotionProfile,
  type EnemyPose,
} from './shared';

export type CastleBehaviorId =
  | 'castle-spear-thrust'
  | 'castle-shield-bash'
  | 'castle-bell-ring'
  | 'castle-windup-burst'
  | 'castle-moon-knight-boss';

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

function phase(t: number, from: number, to: number): number {
  return clampEnemy01((t - from) / (to - from));
}

function easeOut(t: number): number {
  const x = clampEnemy01(t);
  return 1 - (1 - x) ** 3;
}

/* ころ兵 ------------------------------------------------------------------ */

function roundIdle(now: number, offset = 0): EnemyPose {
  const helmet = Math.sin(now * 1.05 + offset);
  return pose({
    scaleX: 1 + helmet * 0.003,
    scaleY: 1 - helmet * 0.004,
    scaleZ: 1 + helmet * 0.003,
    secondary: { headNod: helmet * 0.035, primaryBend: -helmet * 0.025 },
  });
}

function roundMove(now: number, offset = 0): EnemyPose {
  const cycle = (now / 1.02 + offset) % 1;
  const hop = Math.sin(cycle * Math.PI);
  const sway = Math.sin(cycle * tau);
  return pose({
    scaleX: 1 + Math.max(0, hop) * 0.012,
    scaleY: 1 - Math.max(0, hop) * 0.020,
    scaleZ: 1 + Math.max(0, hop) * 0.008,
    jump: Math.max(0, hop) * 0.055,
    wobbleZ: sway * 0.018,
    secondary: { headNod: -sway * 0.055, primaryBend: sway * 0.045 },
  });
}

function roundAttack(u: number): EnemyPose {
  const t = clampEnemy01(u);
  const pull = t < 0.28 ? easeOut(t / 0.28) : t < 0.42 ? 1 : Math.max(0, 1 - phase(t, 0.42, 0.58));
  // 0.28..0.42 is intentionally motionless: the readable stop before the burst.
  const thrust = t < 0.42 ? 0 : t < 0.58 ? easeOut(phase(t, 0.42, 0.58)) : t < 0.70 ? 1 : Math.max(0, 1 - phase(t, 0.70, 0.90));
  const helmetCatch = t < 0.58 ? 0 : t < 0.78 ? Math.sin(phase(t, 0.58, 0.78) * Math.PI) : 0;
  const impact = Math.exp(-Math.pow((t - 0.58) / 0.045, 2));
  return pose({
    scaleX: 1 + impact * 0.040,
    scaleY: 1 - impact * 0.055,
    scaleZ: 1 - pull * 0.018 + impact * 0.020,
    travel: thrust * 0.82,
    wobbleZ: -pull * 0.025 + impact * 0.055,
    secondary: {
      primaryBend: pull * -0.34 + thrust * 0.54,
      headNod: helmetCatch * 0.17,
    },
  });
}

function roundHit(u: number, side: number): EnemyHitPose {
  const p = Math.sin(clampEnemy01(u) * Math.PI);
  return {
    scaleX: 1 - p * 0.035,
    scaleY: 1 + p * 0.025,
    scaleZ: 1 - p * 0.025,
    rotationZ: side * p * 0.055,
    secondary: { headNod: side * p * 0.20, primaryBend: -side * p * 0.10 },
  };
}

function roundDefeat(u: number, side: number): EnemyDefeatPose {
  const t = clampEnemy01(u);
  const tip = t < 0.18 ? 0 : Math.sin(Math.min(1, phase(t, 0.18, 0.78)) * Math.PI * 0.5);
  const helmet = t < 0.08 ? 0 : Math.sin(Math.min(1, phase(t, 0.08, 0.62)) * Math.PI * 0.5);
  const fade = phase(t, 0.97, 1);
  return {
    scaleX: 1 + tip * 0.08,
    scaleY: 1 - tip * 0.24,
    scaleZ: 1 - tip * 0.13,
    rotationZ: side * tip * 0.62,
    yOffset: -0.05 * tip,
    lateralDrift: side * 0.045 * tip,
    backwardDrift: 0.022 * tip,
    opacity: 1 - fade,
    secondary: { headNod: side * helmet * 0.30, primaryBend: -tip * 0.28 },
  };
}

/* たて兵 ------------------------------------------------------------------ */

function shieldIdle(now: number, offset = 0): EnemyPose {
  const breathe = Math.sin(now * 0.78 + offset);
  return pose({
    scaleX: 1 + breathe * 0.002,
    scaleY: 1 - breathe * 0.003,
    scaleZ: 1 + breathe * 0.002,
    secondary: { shellCurl: breathe * 0.015, headNod: -breathe * 0.018 },
  });
}

function shieldMove(now: number, offset = 0): EnemyPose {
  const cycle = (now / 1.20 + offset) % 1;
  const hop = Math.sin(cycle * Math.PI);
  const brace = Math.sin(cycle * tau);
  return pose({
    jump: Math.max(0, hop) * 0.030,
    wobbleZ: brace * 0.012,
    secondary: { shellRoll: brace * 0.035, shellCurl: Math.abs(brace) * 0.018 },
  });
}

function shieldAttack(u: number): EnemyPose {
  const t = clampEnemy01(u);
  const plant = t < 0.25 ? easeOut(t / 0.25) : t < 0.43 ? 1 : Math.max(0, 1 - phase(t, 0.43, 0.60));
  // The planted shield stays still from 0.25..0.43, then the whole toy bursts once.
  const bash = t < 0.43 ? 0 : t < 0.63 ? easeOut(phase(t, 0.43, 0.63)) : t < 0.72 ? 1 : Math.max(0, 1 - phase(t, 0.72, 0.91));
  const rebound = t < 0.63 ? 0 : t < 0.91 ? Math.sin(phase(t, 0.63, 0.91) * Math.PI) : 0;
  const impact = Math.exp(-Math.pow((t - 0.63) / 0.050, 2));
  return pose({
    scaleX: 1 + plant * 0.025 + impact * 0.045,
    scaleY: 1 - plant * 0.045 - impact * 0.055,
    scaleZ: 1 - plant * 0.020 + impact * 0.018,
    travel: bash * 0.72,
    secondary: {
      shellCurl: plant * 0.12 - rebound * 0.05,
      shellRoll: rebound * -0.16,
      headNod: impact * 0.10,
    },
  });
}

function shieldHit(u: number, side: number): EnemyHitPose {
  const p = Math.sin(clampEnemy01(u) * Math.PI);
  return {
    scaleX: 1 + p * 0.025,
    scaleY: 1 - p * 0.035,
    scaleZ: 1 - p * 0.020,
    rotationZ: side * p * 0.025,
    secondary: { shellRoll: side * p * 0.13, shellCurl: -p * 0.05, headNod: side * p * 0.08 },
  };
}

function shieldDefeat(u: number, side: number): EnemyDefeatPose {
  const t = clampEnemy01(u);
  const shieldFall = Math.sin(Math.min(1, phase(t, 0.10, 0.65)) * Math.PI * 0.5);
  const settle = t < 0.34 ? 0 : Math.sin(Math.min(1, phase(t, 0.34, 0.82)) * Math.PI * 0.5);
  const fade = phase(t, 0.97, 1);
  return {
    scaleX: 1 + settle * 0.12,
    scaleY: 1 - settle * 0.30,
    scaleZ: 1 - settle * 0.13,
    rotationZ: side * settle * 0.10,
    yOffset: -0.060 * settle,
    lateralDrift: side * 0.012 * settle,
    backwardDrift: 0.020 * settle,
    opacity: 1 - fade,
    secondary: { shellRoll: shieldFall * 0.48, shellCurl: -settle * 0.10, headNod: settle * 0.08 },
  };
}

/* ベル魔導兵 -------------------------------------------------------------- */

function bellIdle(now: number, offset = 0): EnemyPose {
  const swing = Math.sin(now * 0.72 + offset);
  return pose({
    jump: 0.018 + Math.sin(now * 0.48 + offset) * 0.010,
    secondary: { twist: swing * 0.075, secondaryBend: -swing * 0.11 },
  });
}

function bellMove(now: number, offset = 0): EnemyPose {
  const float = Math.sin(now * 1.05 + offset);
  return pose({
    jump: 0.045 + float * 0.030,
    scaleY: 1 - Math.abs(float) * 0.008,
    secondary: { twist: float * 0.045, secondaryBend: -float * 0.08 },
  });
}

function bellAttack(u: number): EnemyPose {
  const t = clampEnemy01(u);
  let swing = 0;
  if (t < 0.24) swing = easeOut(t / 0.24) * 0.32;
  else if (t < 0.48) swing = 0.32 - easeOut(phase(t, 0.24, 0.48)) * 0.64;
  else if (t < 0.60) swing = -0.32 + easeOut(phase(t, 0.48, 0.60)) * 0.32;
  // 0.60..0.70 is an exact center stop before the ring.
  const release = t >= 0.70 ? phase(t, 0.70, 1) : -1;
  const ring = Math.exp(-Math.pow((t - 0.70) / 0.045, 2));
  const after = t < 0.70 ? 0 : t < 0.94 ? Math.sin(phase(t, 0.70, 0.94) * Math.PI * 2) * (1 - phase(t, 0.70, 0.94)) : 0;
  return pose({
    scaleX: 1 + ring * 0.035,
    scaleY: 1 - ring * 0.025,
    scaleZ: 1 + ring * 0.025,
    jump: 0.035,
    releaseProgress: release,
    secondary: { twist: swing, secondaryBend: -swing * 0.72 + after * 0.30 },
  });
}

function bellHit(u: number, side: number): EnemyHitPose {
  const p = Math.sin(clampEnemy01(u) * Math.PI);
  return {
    scaleX: 1 - p * 0.025,
    scaleY: 1 + p * 0.018,
    scaleZ: 1 - p * 0.020,
    rotationZ: side * p * 0.07,
    secondary: { twist: side * p * 0.20, secondaryBend: -side * p * 0.34 },
  };
}

function bellDefeat(u: number, side: number): EnemyDefeatPose {
  const t = clampEnemy01(u);
  const settle = Math.sin(Math.min(1, phase(t, 0.08, 0.82)) * Math.PI * 0.5);
  const lastSwing = t < 0.18 ? 0 : t < 0.72 ? Math.sin(phase(t, 0.18, 0.72) * Math.PI) * 0.18 : 0;
  const fade = phase(t, 0.98, 1);
  return {
    scaleX: 1 + settle * 0.06,
    scaleY: 1 - settle * 0.18,
    scaleZ: 1 - settle * 0.10,
    rotationZ: side * lastSwing,
    yOffset: -0.075 * settle,
    lateralDrift: side * 0.012 * settle,
    backwardDrift: 0.010 * settle,
    opacity: 1 - fade,
    secondary: { twist: side * lastSwing * 0.50, secondaryBend: -side * lastSwing * 0.80 },
  };
}

/* ぜんまいコウモリ -------------------------------------------------------- */

function batIdle(now: number, offset = 0): EnemyPose {
  const flutter = Math.sin(now * 1.28 + offset);
  return pose({
    jump: 0.045 + Math.sin(now * 0.70 + offset) * 0.014,
    secondary: { open: flutter * 0.045, wag: -flutter * 0.040, earDrop: -Math.abs(flutter) * 0.018 },
  });
}

function batMove(now: number, offset = 0): EnemyPose {
  const cycle = (now / 0.96 + offset) % 1;
  const flap = Math.sin(cycle * tau);
  return pose({
    jump: 0.055 + Math.sin(cycle * Math.PI) * 0.035,
    wobbleZ: flap * 0.020,
    secondary: { open: flap * 0.12, wag: -flap * 0.07, earDrop: -Math.abs(flap) * 0.025 },
  });
}

function batAttack(u: number): EnemyPose {
  const t = clampEnemy01(u);
  const wind = t < 0.15 ? 0 : t < 0.46 ? easeOut(phase(t, 0.15, 0.46)) : t < 0.58 ? 1 : Math.max(0, 1 - phase(t, 0.58, 0.72));
  // Body/wing remain nearly still through wind + 0.46..0.58 hold; only the key moves.
  const burst = t < 0.58 ? 0 : t < 0.72 ? easeOut(phase(t, 0.58, 0.72)) : t < 0.80 ? 1 : Math.max(0, 1 - phase(t, 0.80, 0.94));
  const wingCatch = t < 0.68 ? 0 : t < 0.94 ? Math.sin(phase(t, 0.68, 0.94) * Math.PI) : 0;
  return pose({
    scaleX: 1 + burst * 0.022,
    scaleY: 1 - burst * 0.035,
    scaleZ: 1 + burst * 0.015,
    jump: 0.045 + burst * 0.025,
    travel: burst * 0.34,
    releaseProgress: t >= 0.62 ? phase(t, 0.62, 1) : -1,
    secondary: { wag: -wind * 0.62 + burst * 0.18, open: wingCatch * 0.34, earDrop: -burst * 0.045 },
  });
}

function batHit(u: number, side: number): EnemyHitPose {
  const p = Math.sin(clampEnemy01(u) * Math.PI);
  return {
    scaleX: 1 - p * 0.040,
    scaleY: 1 + p * 0.020,
    scaleZ: 1 - p * 0.035,
    rotationZ: side * p * 0.08,
    secondary: { wag: side * p * 0.72, open: -p * 0.18 },
  };
}

function batDefeat(u: number, side: number): EnemyDefeatPose {
  const t = clampEnemy01(u);
  const stopKey = Math.sin(Math.min(1, phase(t, 0.05, 0.36)) * Math.PI * 0.5);
  const fold = t < 0.20 ? 0 : Math.sin(Math.min(1, phase(t, 0.20, 0.62)) * Math.PI * 0.5);
  const drop = t < 0.34 ? 0 : Math.sin(Math.min(1, phase(t, 0.34, 0.84)) * Math.PI * 0.5);
  const fade = phase(t, 0.98, 1);
  return {
    scaleX: 1 - fold * 0.16 + drop * 0.06,
    scaleY: 1 - drop * 0.18,
    scaleZ: 1 - drop * 0.12,
    rotationZ: side * drop * 0.16,
    yOffset: -0.12 * drop,
    lateralDrift: side * 0.020 * drop,
    backwardDrift: 0.010 * drop,
    opacity: 1 - fade,
    secondary: { wag: side * (1 - stopKey) * 0.16, open: -fold * 0.46, earDrop: fold * 0.08 },
  };
}

/* 月冠の騎士 -------------------------------------------------------------- */

function knightIdle(now: number, offset = 0): EnemyPose {
  const cape = Math.sin(now * 0.62 + offset);
  return pose({
    scaleX: 1 + cape * 0.002,
    scaleY: 1 - cape * 0.003,
    scaleZ: 1 + cape * 0.002,
    secondary: { wag: cape * 0.025, headNod: -cape * 0.012, primaryBend: cape * 0.018 },
  });
}

function knightMove(now: number, offset = 0): EnemyPose {
  const cycle = (now / 1.72 + offset) % 1;
  const glide = Math.sin(cycle * tau);
  return pose({
    jump: 0.010 + Math.max(0, Math.sin(cycle * Math.PI)) * 0.012,
    wobbleZ: glide * 0.008,
    secondary: { wag: -glide * 0.075, headNod: -glide * 0.018, primaryBend: glide * 0.028 },
  });
}

function knightAttack(u: number): EnemyPose {
  const t = clampEnemy01(u);
  const stance = t < 0.24 ? easeOut(t / 0.24) : t < 0.36 ? 1 : Math.max(0, 1 - phase(t, 0.36, 0.48));
  const dash = t < 0.36 ? 0 : t < 0.54 ? easeOut(phase(t, 0.36, 0.54)) : 1;
  const stop = t >= 0.54;
  // With a 1.72 s attack, 0.54 -> 0.61 is ~120 ms: slash line appears only after the stop.
  const slashRelease = t >= 0.61 ? phase(t, 0.61, 1) : -1;
  const slash = Math.exp(-Math.pow((t - 0.61) / 0.038, 2));
  const capeCatch = t < 0.66 ? 0 : t < 0.94 ? Math.sin(phase(t, 0.66, 0.94) * Math.PI) : 0;
  const recover = t < 0.78 ? 0 : phase(t, 0.78, 1);
  return pose({
    scaleX: 1 + slash * 0.050,
    scaleY: 1 - stance * 0.060 - slash * 0.060,
    scaleZ: 1 - stance * 0.055 + slash * 0.025,
    jump: dash > 0 && !stop ? 0.018 : 0,
    travel: dash * (1 - recover * 0.18),
    wobbleZ: -stance * 0.035 + slash * 0.040,
    releaseProgress: slashRelease,
    secondary: {
      primaryBend: -stance * 0.28 + slash * 0.82 - recover * 0.20,
      // Cape is deliberately nearly frozen through the dash, then catches up after the delayed slash.
      wag: capeCatch * -0.52,
      headNod: stance * 0.035,
    },
  });
}

function knightHit(u: number, side: number): EnemyHitPose {
  const p = Math.sin(clampEnemy01(u) * Math.PI);
  return {
    scaleX: 1 - p * 0.025,
    scaleY: 1 + p * 0.015,
    scaleZ: 1 - p * 0.018,
    rotationZ: side * p * 0.035,
    secondary: { wag: -side * p * 0.18, primaryBend: side * p * 0.12, headNod: side * p * 0.05 },
  };
}

function knightDefeat(u: number, side: number): EnemyDefeatPose {
  const t = clampEnemy01(u);
  const lowerBlade = Math.sin(Math.min(1, phase(t, 0.04, 0.38)) * Math.PI * 0.5);
  const capeLoss = t < 0.20 ? 0 : Math.sin(Math.min(1, phase(t, 0.20, 0.66)) * Math.PI * 0.5);
  const sit = t < 0.42 ? 0 : Math.sin(Math.min(1, phase(t, 0.42, 0.86)) * Math.PI * 0.5);
  const final = t < 0.78 ? 0 : Math.sin(phase(t, 0.78, 0.96) * Math.PI);
  const fade = phase(t, 0.985, 1);
  return {
    scaleX: 1 + sit * 0.10,
    scaleY: 1 - sit * 0.27,
    scaleZ: 1 - sit * 0.14,
    rotationZ: side * final * 0.035,
    yOffset: -0.085 * sit,
    lateralDrift: side * 0.010 * sit,
    backwardDrift: 0.018 * sit,
    opacity: 1 - fade,
    secondary: {
      primaryBend: lowerBlade * 0.55,
      wag: side * capeLoss * 0.22,
      headNod: sit * 0.08,
    },
  };
}

function soundRingMesh(): THREE.Object3D {
  const group = new THREE.Group();
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.14, 0.018, 8, 28),
    new THREE.MeshStandardMaterial({
      color: '#c8bbff',
      emissive: '#7d6fd1',
      emissiveIntensity: 0.48,
      roughness: 0.38,
    }),
  );
  ring.rotation.x = Math.PI / 2;
  group.add(ring);
  return group;
}

function moonBoltMesh(): THREE.Object3D {
  const group = new THREE.Group();
  const bolt = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.065, 0),
    new THREE.MeshStandardMaterial({
      color: '#d8d2ff',
      emissive: '#766bd3',
      emissiveIntensity: 0.55,
      roughness: 0.34,
    }),
  );
  bolt.scale.set(0.55, 0.55, 1.8);
  group.add(bolt);
  return group;
}

function slashLineMesh(): THREE.Object3D {
  const group = new THREE.Group();
  const line = new THREE.Mesh(
    new THREE.BoxGeometry(0.38, 0.018, 0.030),
    new THREE.MeshStandardMaterial({
      color: '#eeeaff',
      emissive: '#8b7ee0',
      emissiveIntensity: 0.72,
      roughness: 0.24,
    }),
  );
  line.rotation.z = -0.28;
  group.add(line);
  return group;
}

const profiles: Record<CastleBehaviorId, EnemyMotionProfile> = {
  'castle-spear-thrust': {
    familyId: 'castle',
    idle: roundIdle,
    move: roundMove,
    attack: roundAttack,
    hit: roundHit,
    defeat: roundDefeat,
    moveDuration: 1.02,
    moveDistance: 0.70,
    attackDuration: 1.00,
    attackTravelDistance: 0.46,
    contactU: 0.58,
    defeatDuration: 1.30,
  },
  'castle-shield-bash': {
    familyId: 'castle',
    idle: shieldIdle,
    move: shieldMove,
    attack: shieldAttack,
    hit: shieldHit,
    defeat: shieldDefeat,
    moveDuration: 1.20,
    moveDistance: 0.58,
    attackDuration: 1.10,
    attackTravelDistance: 0.34,
    contactU: 0.63,
    defeatDuration: 1.36,
  },
  'castle-bell-ring': {
    familyId: 'castle',
    idle: bellIdle,
    move: bellMove,
    attack: bellAttack,
    hit: bellHit,
    defeat: bellDefeat,
    moveDuration: 1.28,
    moveDistance: 0.60,
    attackDuration: 1.28,
    attackTravelDistance: 0.03,
    contactU: 0.70,
    defeatDuration: 1.42,
    projectile: {
      kind: 'castle-sound-ring',
      flightSeconds: 0.36,
      createMesh: soundRingMesh,
      arcHeight: () => 0,
    },
  },
  'castle-windup-burst': {
    familyId: 'castle',
    idle: batIdle,
    move: batMove,
    attack: batAttack,
    hit: batHit,
    defeat: batDefeat,
    moveDuration: 0.96,
    moveDistance: 0.78,
    attackDuration: 1.08,
    attackTravelDistance: 0.05,
    contactU: 0.62,
    defeatDuration: 1.38,
    projectile: {
      kind: 'castle-moon-bolt',
      flightSeconds: 0.32,
      createMesh: moonBoltMesh,
      arcHeight: (u) => Math.sin(clampEnemy01(u) * Math.PI) * 0.04,
    },
  },
  'castle-moon-knight-boss': {
    familyId: 'castle',
    idle: knightIdle,
    move: knightMove,
    attack: knightAttack,
    hit: knightHit,
    defeat: knightDefeat,
    moveDuration: 1.72,
    moveDistance: 0.46,
    attackDuration: 1.72,
    attackTravelDistance: 0.70,
    contactU: 0.61,
    defeatDuration: 1.84,
    projectile: {
      kind: 'castle-slash-line',
      flightSeconds: 0.20,
      createMesh: slashLineMesh,
      arcHeight: () => 0,
    },
  },
};

export const getCastleMotionProfile = (id: CastleBehaviorId): EnemyMotionProfile => profiles[id];
