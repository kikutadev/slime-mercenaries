import * as THREE from 'three';
import {
  clampEnemy01,
  type EnemyDefeatPose,
  type EnemyHitPose,
  type EnemyMotionProfile,
  type EnemyPose,
} from './shared';

export type LeafBehaviorId = 'leaf-hop-slap' | 'leaf-whirl';

function easeOutCubic(value: number): number {
  const t = clampEnemy01(value);
  return 1 - (1 - t) ** 3;
}

function easeInOutCubic(value: number): number {
  const t = clampEnemy01(value);
  return t < 0.5 ? 4 * t ** 3 : 1 - ((-2 * t + 2) ** 3) / 2;
}

function lerp(a: number, b: number, t: number): number {
  return THREE.MathUtils.lerp(a, b, clampEnemy01(t));
}

function leafHit(u: number, side: number): EnemyHitPose {
  const pulse = Math.sin(clampEnemy01(u) * Math.PI);
  return {
    scaleX: 1 + pulse * 0.07,
    scaleY: 1 - pulse * 0.14,
    scaleZ: 1 + pulse * 0.04,
    rotationZ: side * pulse * 0.15,
    secondary: {
      primaryBend: pulse * 0.30,
      secondaryBend: -pulse * 0.24,
      twist: side * pulse * 0.16,
    },
  };
}

function leafDefeat(u: number, side: number): EnemyDefeatPose {
  const t = clampEnemy01(u);
  const fall = easeOutCubic(t / 0.62);
  const flutterEnvelope = 1 - easeOutCubic(t / 0.86);
  const flutter = Math.sin(t * Math.PI * 2.35) * flutterEnvelope;
  return {
    scaleX: 1 + fall * 0.13,
    scaleY: 1 - fall * 0.22,
    scaleZ: 1 + fall * 0.045,
    // Keep the face close to the body: most of the flop belongs to the leaf itself,
    // not to a large root roll that would separate the shared defeat-expression overlay.
    rotationZ: side * (fall * 0.34 + flutter * 0.055),
    yOffset: -0.022 * fall,
    lateralDrift: side * 0.060 * fall,
    backwardDrift: 0.030 * fall,
    // Keep the fallen enemy readable instead of shrinking it to zero at clip end.
    opacity: 1,
    secondary: {
      primaryBend: 0.86 * fall + flutter * 0.20,
      secondaryBend: -0.48 * fall - flutter * 0.16,
      twist: side * flutter * 0.08,
    },
  };
}

export function leafIdle(now: number, phase = 0): EnemyPose {
  const sway = Math.sin(now * 1.95 + phase);
  const delayedTip = Math.sin(now * 1.95 + phase - 0.52);
  const breathe = Math.sin(now * 1.55 + phase * 0.7);
  return {
    scaleX: 1 + breathe * 0.010,
    scaleY: 1 - breathe * 0.008,
    scaleZ: 1 + breathe * 0.009,
    jump: Math.max(0, Math.sin(now * 1.7 + phase)) * 0.006,
    wobbleZ: sway * 0.018,
    travel: 0,
    releaseProgress: -1,
    secondary: {
      primaryBend: sway * 0.050,
      secondaryBend: delayedTip * 0.085,
      twist: sway * 0.018,
    },
  };
}

export function leafMove(now: number, phase = 0): EnemyPose {
  const cycle = (now * 1.72 + phase) % 1;
  const lift = Math.sin(cycle * Math.PI) ** 2;
  const follow = Math.sin(cycle * Math.PI * 2);
  const jump = lift * 0.060;
  return {
    scaleX: 1 - lift * 0.055,
    scaleY: 1 + lift * 0.090,
    scaleZ: 1 - lift * 0.030,
    jump,
    wobbleZ: follow * 0.034,
    travel: 0,
    releaseProgress: -1,
    secondary: {
      primaryBend: -lift * 0.22 + follow * 0.045,
      secondaryBend: lift * 0.28 - follow * 0.075,
      twist: follow * 0.028,
    },
  };
}

/** Single-leaf slap with a long readable wind-up and a much shorter release. */
export function leafSlap(u: number): EnemyPose {
  const t = clampEnemy01(u);
  let primaryBend = 0;
  let secondaryBend = 0;
  let travel = 0;
  let jump = 0;
  let compression = 0;
  let stretch = 0;

  if (t < 0.30) {
    const p = easeInOutCubic(t / 0.30);
    primaryBend = lerp(0, -0.74, p);
    secondaryBend = lerp(0, -0.40, p);
    compression = p;
  } else if (t < 0.50) {
    const p = easeOutCubic((t - 0.30) / 0.20);
    primaryBend = lerp(-0.74, 0.98, p);
    // Tip remains behind the main leaf until late in the release.
    secondaryBend = lerp(-0.40, 0.28, p ** 1.45);
    travel = easeInOutCubic(p);
    jump = Math.sin(p * Math.PI) * 0.060;
    compression = 1 - p;
    stretch = p;
  } else if (t < 0.60) {
    const p = easeOutCubic((t - 0.50) / 0.10);
    primaryBend = lerp(0.98, 1.16, p);
    secondaryBend = lerp(0.28, 0.88, p);
    travel = 1;
    jump = (1 - p) * 0.015;
    stretch = 1 - p * 0.25;
  } else if (t < 0.76) {
    const p = easeOutCubic((t - 0.60) / 0.16);
    primaryBend = lerp(1.16, 0.25, p);
    secondaryBend = lerp(0.88, 0.46, p);
    travel = lerp(1, 0.52, p);
    stretch = 0.75 * (1 - p);
  } else {
    const p = easeInOutCubic((t - 0.76) / 0.24);
    primaryBend = lerp(0.25, 0, p);
    secondaryBend = lerp(0.46, 0, p);
    travel = lerp(0.52, 0, p);
  }

  return {
    scaleX: 1 + compression * 0.060 - stretch * 0.020,
    scaleY: 1 - compression * 0.095 + stretch * 0.060,
    scaleZ: 1 + compression * 0.035 - stretch * 0.020,
    jump,
    wobbleZ: 0,
    travel,
    releaseProgress: t >= 0.30 ? clampEnemy01((t - 0.30) / 0.70) : -1,
    secondary: { primaryBend, secondaryBend },
  };
}

/** Two-leaf gust release: close, snap through a half-spin, then coast to rest. */
export function leafWhirl(u: number): EnemyPose {
  const t = clampEnemy01(u);
  let primaryBend = 0;
  let secondaryBend = 0;
  let twist = 0;
  let compression = 0;
  let jump = 0;
  let travel = 0;

  if (t < 0.34) {
    const p = easeInOutCubic(t / 0.34);
    primaryBend = -0.18 * p;
    secondaryBend = 0.22 * p;
    twist = -0.07 * p;
    compression = p;
  } else if (t < 0.50) {
    const p = easeOutCubic((t - 0.34) / 0.16);
    primaryBend = lerp(-0.18, 0.10, p);
    secondaryBend = lerp(0.22, -0.08, p);
    twist = lerp(-0.07, Math.PI, p);
    jump = Math.sin(p * Math.PI) * 0.050;
    travel = p * 0.10;
    compression = 1 - p;
  } else if (t < 0.68) {
    const p = easeOutCubic((t - 0.50) / 0.18);
    primaryBend = lerp(0.10, -0.035, p);
    secondaryBend = lerp(-0.08, 0.12, p);
    twist = lerp(Math.PI, Math.PI * 1.28, p);
    jump = (1 - p) * 0.012;
    travel = lerp(0.10, -0.025, p);
  } else {
    const p = easeInOutCubic((t - 0.68) / 0.32);
    const settle = Math.sin(p * Math.PI * 2) * (1 - p);
    primaryBend = settle * 0.045;
    secondaryBend = -settle * 0.075;
    // Continue in the same rotational direction; 2π is the authored rest orientation.
    twist = lerp(Math.PI * 1.28, Math.PI * 2, p);
    travel = lerp(-0.025, 0, p);
  }

  return {
    scaleX: 1 + compression * 0.045,
    scaleY: 1 - compression * 0.075,
    scaleZ: 1 + compression * 0.030,
    jump,
    wobbleZ: 0,
    travel,
    releaseProgress: t >= 0.34 ? clampEnemy01((t - 0.34) / 0.66) : -1,
    secondary: { primaryBend, secondaryBend, twist },
  };
}

function gustMesh(): THREE.Object3D {
  const group = new THREE.Group();
  group.name = 'LeafGustProjectile';

  const mainMaterial = new THREE.MeshBasicMaterial({
    color: '#c8f0a5',
    transparent: true,
    opacity: 0.72,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const echoMaterial = mainMaterial.clone();
  echoMaterial.opacity = 0.42;

  const mainArc = new THREE.Mesh(new THREE.TorusGeometry(0.064, 0.011, 8, 24, Math.PI * 1.18), mainMaterial);
  mainArc.rotation.x = Math.PI / 2;
  mainArc.rotation.z = -0.18;
  group.add(mainArc);

  const echoArc = new THREE.Mesh(new THREE.TorusGeometry(0.043, 0.007, 8, 18, Math.PI * 1.04), echoMaterial);
  echoArc.rotation.x = Math.PI / 2;
  echoArc.rotation.z = 0.28;
  echoArc.position.set(-0.018, 0.004, 0.012);
  group.add(echoArc);

  const moteGeometry = new THREE.SphereGeometry(0.008, 8, 6);
  const moteA = new THREE.Mesh(moteGeometry, echoMaterial);
  moteA.position.set(0.060, 0.004, -0.010);
  group.add(moteA);
  const moteB = new THREE.Mesh(moteGeometry, echoMaterial);
  moteB.scale.setScalar(0.72);
  moteB.position.set(0.034, -0.006, 0.050);
  group.add(moteB);

  return group;
}

const profiles: Record<LeafBehaviorId, EnemyMotionProfile> = {
  'leaf-hop-slap': {
    familyId: 'leaf',
    idle: leafIdle,
    move: leafMove,
    attack: leafSlap,
    hit: leafHit,
    defeat: leafDefeat,
    moveDuration: 1.30,
    moveDistance: 0.80,
    attackDuration: 0.62,
    attackTravelDistance: 0.36,
    contactU: 0.55,
    defeatDuration: 0.96,
  },
  'leaf-whirl': {
    familyId: 'leaf',
    idle: leafIdle,
    move: leafMove,
    attack: leafWhirl,
    hit: leafHit,
    defeat: leafDefeat,
    moveDuration: 1.18,
    moveDistance: 0.90,
    attackDuration: 0.70,
    attackTravelDistance: 0.10,
    contactU: 0.50,
    defeatDuration: 0.96,
    projectile: {
      kind: 'gust',
      flightSeconds: 0.30,
      createMesh: gustMesh,
      arcHeight: (flightU) => Math.sin(clampEnemy01(flightU) * Math.PI) * 0.10,
    },
  },
};

export const getLeafMotionProfile = (id: LeafBehaviorId): EnemyMotionProfile => profiles[id];
