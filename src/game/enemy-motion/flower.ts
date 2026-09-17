import * as THREE from 'three';
import {
  clampEnemy01,
  type EnemyDefeatPose,
  type EnemyHitPose,
  type EnemyMotionProfile,
  type EnemyPose,
} from './shared';

export type FlowerBehaviorId = 'flower-bud-poke' | 'flower-pollen';

const smooth01 = (value: number): number => {
  const t = clampEnemy01(value);
  return t * t * (3 - 2 * t);
};

const lerp = (from: number, to: number, t: number): number => from + (to - from) * t;

function budIdle(now: number, phase = 0): EnemyPose {
  const sway = Math.sin(now * 1.65 + phase);
  const leafLag = Math.sin(now * 1.65 + phase - 0.48);
  const budBreath = Math.sin(now * 1.08 + phase * 0.6);
  return {
    scaleX: 1 + budBreath * 0.006,
    scaleY: 1 - budBreath * 0.004,
    scaleZ: 1 + budBreath * 0.008,
    jump: 0,
    wobbleZ: sway * 0.012,
    travel: 0,
    releaseProgress: -1,
    secondary: {
      primaryBend: sway * 0.026,
      secondaryBend: leafLag * 0.045,
      headNod: sway * 0.045,
      open: budBreath * 0.024,
    },
  };
}

function puffIdle(now: number, phase = 0): EnemyPose {
  const sway = Math.sin(now * 1.45 + phase);
  const breathe = Math.sin(now * 1.22 + phase * 0.7);
  const leafLag = Math.sin(now * 1.45 + phase - 0.42);
  return {
    scaleX: 1 + breathe * 0.004,
    scaleY: 1 - breathe * 0.003,
    scaleZ: 1 + breathe * 0.004,
    jump: 0,
    wobbleZ: sway * 0.010,
    travel: 0,
    releaseProgress: -1,
    secondary: {
      primaryBend: sway * 0.018,
      secondaryBend: leafLag * 0.035,
      headNod: -sway * 0.025,
      open: breathe * 0.055,
    },
  };
}

function budMove(now: number, phase = 0): EnemyPose {
  const cycle = (now * 1.85 + phase) % 1;
  const hop = Math.sin(cycle * Math.PI);
  const airborne = Math.max(0, hop);
  const follow = Math.sin(cycle * Math.PI * 2 - 0.55);
  return {
    scaleX: 1 + airborne * 0.035,
    scaleY: 1 + airborne * 0.018,
    scaleZ: 1 - airborne * 0.065,
    jump: airborne * 0.052,
    wobbleZ: Math.sin(cycle * Math.PI * 2) * 0.020,
    travel: 0,
    releaseProgress: -1,
    secondary: {
      primaryBend: -airborne * 0.080 + follow * 0.018,
      secondaryBend: follow * 0.085,
      headNod: -airborne * 0.090,
      open: -airborne * 0.035,
    },
  };
}

function puffMove(now: number, phase = 0): EnemyPose {
  const cycle = (now * 1.72 + phase) % 1;
  const airborne = Math.max(0, Math.sin(cycle * Math.PI));
  const follow = Math.sin(cycle * Math.PI * 2 - 0.62);
  return {
    scaleX: 1 + airborne * 0.025,
    scaleY: 1 + airborne * 0.012,
    scaleZ: 1 - airborne * 0.050,
    jump: airborne * 0.044,
    wobbleZ: Math.sin(cycle * Math.PI * 2) * 0.018,
    travel: 0,
    releaseProgress: -1,
    secondary: {
      primaryBend: -airborne * 0.055,
      secondaryBend: follow * 0.065,
      headNod: -follow * 0.038,
      open: -airborne * 0.070,
    },
  };
}

function budHit(u: number, side: number): EnemyHitPose {
  const pulse = Math.sin(clampEnemy01(u) * Math.PI);
  return {
    scaleX: 1 + pulse * 0.045,
    scaleY: 1 + pulse * 0.015,
    scaleZ: 1 - pulse * 0.075,
    rotationZ: side * pulse * 0.085,
    secondary: {
      primaryBend: -pulse * 0.10,
      secondaryBend: pulse * 0.18,
      headNod: -pulse * 0.40,
      open: -pulse * 0.12,
    },
  };
}

function puffHit(u: number, side: number): EnemyHitPose {
  const pulse = Math.sin(clampEnemy01(u) * Math.PI);
  return {
    scaleX: 1 + pulse * 0.060,
    scaleY: 1 + pulse * 0.020,
    scaleZ: 1 - pulse * 0.095,
    rotationZ: side * pulse * 0.065,
    secondary: {
      primaryBend: side * pulse * 0.055,
      secondaryBend: -side * pulse * 0.10,
      headNod: pulse * 0.13,
      open: -pulse * 0.34,
    },
  };
}

function budDefeat(u: number, side: number): EnemyDefeatPose {
  const t = clampEnemy01(u);
  const fall = Math.sin(Math.min(1, t / 0.76) * Math.PI * 0.5);
  const fade = clampEnemy01((t - 0.90) / 0.10);
  const flutter = Math.sin(clampEnemy01(t / 0.76) * Math.PI * 2) * (1 - fall) * 0.08;
  return {
    scaleX: 1 + fall * 0.10,
    scaleY: 1 + fall * 0.015,
    scaleZ: 1 - fall * 0.30,
    rotationZ: side * fall * 0.58,
    yOffset: -0.018 * fall,
    lateralDrift: side * 0.085 * fall,
    backwardDrift: 0.055 * fall,
    opacity: 1 - fade,
    secondary: {
      primaryBend: -0.20 * fall,
      secondaryBend: 0.10 * fall + flutter,
      headNod: -0.58 * fall,
      open: 0.17 * fall,
    },
  };
}

function puffDefeat(u: number, side: number): EnemyDefeatPose {
  const t = clampEnemy01(u);
  const fall = Math.sin(Math.min(1, t / 0.78) * Math.PI * 0.5);
  const fade = clampEnemy01((t - 0.90) / 0.10);
  return {
    scaleX: 1 + fall * 0.10,
    scaleY: 1 + fall * 0.020,
    scaleZ: 1 - fall * 0.24,
    rotationZ: side * fall * 0.46,
    yOffset: -0.015 * fall,
    lateralDrift: side * 0.070 * fall,
    backwardDrift: 0.050 * fall,
    opacity: 1 - fade,
    secondary: {
      primaryBend: -0.12 * fall,
      secondaryBend: side * 0.08 * fall,
      headNod: -0.30 * fall,
      open: -0.34 * fall,
    },
  };
}

/** Closed-bud melee: visible compression, fast spring release, then soft rebound. */
export function budPoke(u: number): EnemyPose {
  const t = clampEnemy01(u);

  let squash = 0;
  let stretch = 0;
  let travel = 0;
  let jump = 0;
  let primaryBend = 0;
  let leafLag = 0;
  let headNod = 0;
  let open = 0;

  if (t < 0.30) {
    const p = smooth01(t / 0.30);
    squash = p;
    primaryBend = lerp(0, -0.12, p);
    leafLag = lerp(0, 0.09, p);
    headNod = lerp(0, -0.22, p);
    open = lerp(0, -0.44, p);
  } else if (t < 0.56) {
    const p = smooth01((t - 0.30) / 0.26);
    stretch = Math.sin(p * Math.PI * 0.5);
    travel = p;
    jump = Math.sin(p * Math.PI) * 0.060;
    primaryBend = lerp(-0.12, 0.34, p);
    leafLag = lerp(0.09, -0.08, p);
    headNod = lerp(-0.22, 0.52, p);
    open = lerp(-0.44, 0.06, p);
  } else if (t < 0.68) {
    const p = smooth01((t - 0.56) / 0.12);
    stretch = 1 - p * 0.35;
    travel = 1;
    primaryBend = lerp(0.34, 0.44, p);
    leafLag = lerp(-0.08, -0.16, p);
    headNod = lerp(0.52, 0.66, p);
    open = lerp(0.06, 0.28, p);
  } else {
    const p = smooth01((t - 0.68) / 0.32);
    const settle = Math.sin(p * Math.PI * 2) * (1 - p);
    travel = 1 - p;
    primaryBend = lerp(0.44, 0, p) + settle * 0.035;
    leafLag = lerp(-0.16, 0, p) - settle * 0.065;
    headNod = lerp(0.66, 0, p) + settle * 0.055;
    open = lerp(0.28, 0, p);
  }

  return {
    scaleX: 1 + squash * 0.075 - stretch * 0.035,
    scaleY: 1 + squash * 0.025 - stretch * 0.012,
    scaleZ: 1 - squash * 0.120 + stretch * 0.090,
    jump,
    wobbleZ: 0,
    travel,
    releaseProgress: t >= 0.30 ? (t - 0.30) / 0.70 : -1,
    secondary: {
      primaryBend,
      secondaryBend: leafLag,
      headNod,
      open,
    },
  };
}

/** Puff ranged attack: inflate and hold before a compact pollen release. */
export function pollenAttack(u: number): EnemyPose {
  const t = clampEnemy01(u);

  let inflate = 0;
  let recoil = 0;
  let travel = 0;
  let headNod = 0;
  let leafLag = 0;
  let open = 0;

  if (t < 0.38) {
    const p = smooth01(t / 0.38);
    inflate = p;
    open = 0.50 * p;
    headNod = -0.09 * p;
    leafLag = 0.06 * p;
  } else if (t < 0.50) {
    inflate = 1;
    open = 0.50;
    headNod = -0.09;
    leafLag = 0.06;
  } else if (t < 0.64) {
    const p = smooth01((t - 0.50) / 0.14);
    recoil = Math.sin(p * Math.PI);
    inflate = 1 - p * 0.62;
    open = lerp(0.50, -0.30, p);
    headNod = lerp(-0.09, 0.26, p);
    leafLag = lerp(0.06, -0.11, p);
    travel = -0.46 * p;
  } else {
    const p = smooth01((t - 0.64) / 0.36);
    const settle = Math.sin(p * Math.PI * 2) * (1 - p);
    inflate = lerp(0.38, 0, p);
    open = lerp(-0.30, 0, p) + settle * 0.035;
    headNod = lerp(0.26, 0, p) + settle * 0.035;
    leafLag = lerp(-0.11, 0, p) - settle * 0.045;
    travel = lerp(-0.46, 0, p);
  }

  return {
    scaleX: 1 + inflate * 0.060,
    scaleY: 1 + inflate * 0.035 - recoil * 0.030,
    scaleZ: 1 + inflate * 0.045 - recoil * 0.025,
    jump: recoil * 0.018,
    wobbleZ: 0,
    travel,
    releaseProgress: t >= 0.50 ? (t - 0.50) / 0.50 : -1,
    secondary: {
      primaryBend: -inflate * 0.035 + recoil * 0.080,
      secondaryBend: leafLag,
      headNod,
      open,
    },
  };
}

function createPollenProjectile(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'FlowerPollenProjectile';

  const coreMaterial = new THREE.MeshBasicMaterial({
    color: '#f3d98b',
    transparent: true,
    opacity: 0.60,
    depthWrite: false,
  });
  const moteMaterial = new THREE.MeshBasicMaterial({
    color: '#f7e8b3',
    transparent: true,
    opacity: 0.42,
    depthWrite: false,
  });

  const core = new THREE.Mesh(new THREE.SphereGeometry(0.038, 10, 8), coreMaterial);
  group.add(core);

  for (let index = 0; index < 3; index += 1) {
    const angle = index / 3 * Math.PI * 2 + 0.25;
    const mote = new THREE.Mesh(new THREE.SphereGeometry(0.008, 8, 6), moteMaterial);
    mote.position.set(
      Math.cos(angle) * 0.048,
      Math.sin(angle) * 0.022,
      Math.sin(angle + 0.7) * 0.017,
    );
    group.add(mote);
  }
  return group;
}

const profiles: Record<FlowerBehaviorId, EnemyMotionProfile> = {
  'flower-bud-poke': {
    familyId: 'flower',
    idle: budIdle,
    move: budMove,
    attack: budPoke,
    hit: budHit,
    defeat: budDefeat,
    moveDuration: 1.42,
    moveDistance: 0.68,
    attackDuration: 0.64,
    attackTravelDistance: 0.34,
    contactU: 0.58,
    defeatDuration: 1.02,
  },
  'flower-pollen': {
    familyId: 'flower',
    idle: puffIdle,
    move: puffMove,
    attack: pollenAttack,
    hit: puffHit,
    defeat: puffDefeat,
    moveDuration: 1.50,
    moveDistance: 0.62,
    attackDuration: 0.78,
    attackTravelDistance: 0.08,
    contactU: 0.50,
    defeatDuration: 1.02,
    projectile: {
      kind: 'pollen',
      flightSeconds: 0.48,
      createMesh: createPollenProjectile,
      arcHeight: (u) => Math.sin(clampEnemy01(u) * Math.PI) * 0.10,
    },
  },
};

export const getFlowerMotionProfile = (id: FlowerBehaviorId): EnemyMotionProfile => profiles[id];
