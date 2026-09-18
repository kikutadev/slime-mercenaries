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
  const sway = Math.sin(now * 1.12 + phase);
  const leafFollow = Math.sin(now * 1.12 + phase - 0.42);
  return {
    scaleX: 1 + sway * 0.002,
    scaleY: 1 - sway * 0.002,
    scaleZ: 1 + sway * 0.003,
    jump: 0,
    wobbleZ: sway * 0.006,
    travel: 0,
    releaseProgress: -1,
    secondary: {
      primaryBend: sway * 0.015,
      secondaryBend: leafFollow * 0.026,
      headNod: 0,
      open: 0,
    },
  };
}

function puffIdle(now: number, phase = 0): EnemyPose {
  const breathe = Math.sin(now * 1.05 + phase);
  const leafFollow = Math.sin(now * 1.05 + phase - 0.44);
  return {
    scaleX: 1 + breathe * 0.003,
    scaleY: 1 - breathe * 0.002,
    scaleZ: 1 + breathe * 0.003,
    jump: 0,
    wobbleZ: breathe * 0.004,
    travel: 0,
    releaseProgress: -1,
    secondary: {
      primaryBend: 0,
      secondaryBend: leafFollow * 0.018,
      headNod: 0,
      open: breathe * 0.015,
    },
  };
}

function budMove(now: number, phase = 0): EnemyPose {
  const cycle = (now * 1.55 + phase) % 1;
  const airborne = Math.max(0, Math.sin(cycle * Math.PI));
  const follow = Math.sin(cycle * Math.PI * 2 - 0.50);
  return {
    scaleX: 1 + airborne * 0.016,
    scaleY: 1 + airborne * 0.008,
    scaleZ: 1 - airborne * 0.032,
    jump: airborne * 0.040,
    wobbleZ: Math.sin(cycle * Math.PI * 2) * 0.010,
    travel: 0,
    releaseProgress: -1,
    secondary: {
      primaryBend: -airborne * 0.040,
      secondaryBend: follow * 0.040,
      headNod: -airborne * 0.025,
      open: 0,
    },
  };
}

function puffMove(now: number, phase = 0): EnemyPose {
  const cycle = (now * 1.52 + phase) % 1;
  const airborne = Math.max(0, Math.sin(cycle * Math.PI));
  const follow = Math.sin(cycle * Math.PI * 2 - 0.58);
  return {
    scaleX: 1 + airborne * 0.014,
    scaleY: 1 + airborne * 0.008,
    scaleZ: 1 - airborne * 0.030,
    jump: airborne * 0.036,
    wobbleZ: Math.sin(cycle * Math.PI * 2) * 0.010,
    travel: 0,
    releaseProgress: -1,
    secondary: {
      primaryBend: 0,
      secondaryBend: follow * 0.035,
      headNod: 0,
      open: -airborne * 0.022,
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

  if (t < 0.32) {
    const p = smooth01(t / 0.32);
    squash = p;
    primaryBend = lerp(0, -0.07, p);
    leafLag = lerp(0, 0.05, p);
    headNod = lerp(0, -0.12, p);
    open = lerp(0, -0.28, p);
  } else if (t < 0.52) {
    const p = smooth01((t - 0.32) / 0.20);
    stretch = p;
    travel = p;
    jump = Math.sin(p * Math.PI) * 0.035;
    primaryBend = lerp(-0.07, 0.16, p);
    leafLag = lerp(0.05, -0.04, p);
    headNod = lerp(-0.12, 0.28, p);
    open = lerp(-0.28, 0.04, p);
  } else if (t < 0.64) {
    const p = smooth01((t - 0.52) / 0.12);
    stretch = lerp(1, 0.72, p);
    travel = 1;
    primaryBend = lerp(0.16, 0.20, p);
    leafLag = lerp(-0.04, -0.08, p);
    headNod = lerp(0.28, 0.34, p);
    open = lerp(0.04, 0.12, p);
  } else {
    const p = smooth01((t - 0.64) / 0.36);
    travel = 1 - p;
    primaryBend = lerp(0.20, 0, p);
    leafLag = lerp(-0.08, 0, p);
    headNod = lerp(0.34, 0, p);
    open = lerp(0.12, 0, p);
  }

  return {
    scaleX: 1 + squash * 0.050 - stretch * 0.020,
    scaleY: 1 + squash * 0.015 + stretch * 0.030,
    scaleZ: 1 - squash * 0.080 + stretch * 0.050,
    jump,
    wobbleZ: 0,
    travel,
    releaseProgress: t >= 0.32 ? clampEnemy01((t - 0.32) / 0.68) : -1,
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
    open = 0.34 * p;
    leafLag = 0.025 * p;
  } else if (t < 0.50) {
    // Hold the inflated silhouette completely still so the shot is easy to read.
    inflate = 1;
    open = 0.34;
    leafLag = 0.025;
  } else if (t < 0.58) {
    const p = smooth01((t - 0.50) / 0.08);
    recoil = Math.sin(p * Math.PI);
    inflate = lerp(1, 0.16, p);
    // Release without reversing the flower head or petals.
    open = lerp(0.34, 0.08, p);
    headNod = 0.060 * p;
    leafLag = lerp(0.025, -0.055, p);
    travel = -0.16 * p;
  } else {
    const p = smooth01((t - 0.58) / 0.42);
    inflate = lerp(0.16, 0, p);
    open = lerp(0.08, 0, p);
    headNod = lerp(0.060, 0, p);
    // One delayed leaf return; no repeated body/head oscillation.
    leafLag = lerp(-0.055, 0, p);
    travel = lerp(-0.16, 0, p);
  }

  return {
    scaleX: 1 + inflate * 0.050,
    scaleY: 1 + inflate * 0.028 - recoil * 0.018,
    scaleZ: 1 + inflate * 0.038 - recoil * 0.016,
    jump: recoil * 0.010,
    wobbleZ: 0,
    travel,
    releaseProgress: t >= 0.50 ? clampEnemy01((t - 0.50) / 0.50) : -1,
    secondary: {
      primaryBend: 0,
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
