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

function leaflingHit(u: number, side: number): EnemyHitPose {
  const pulse = Math.sin(clampEnemy01(u) * Math.PI);
  return {
    scaleX: 1 + pulse * 0.065,
    scaleY: 1 - pulse * 0.125,
    scaleZ: 1 + pulse * 0.035,
    rotationZ: side * pulse * 0.10,
    secondary: {
      primaryBend: pulse * 0.34,
      secondaryBend: -pulse * 0.28,
      twist: 0,
    },
  };
}

function whirlLeafHit(u: number, side: number): EnemyHitPose {
  const pulse = Math.sin(clampEnemy01(u) * Math.PI);
  return {
    scaleX: 1 + pulse * 0.045,
    scaleY: 1 - pulse * 0.090,
    scaleZ: 1 + pulse * 0.025,
    rotationZ: side * pulse * 0.070,
    secondary: {
      primaryBend: pulse * 0.14,
      secondaryBend: -pulse * 0.18,
      twist: side * pulse * 0.30,
    },
  };
}

function leaflingDefeat(u: number, side: number): EnemyDefeatPose {
  const t = clampEnemy01(u);
  const fall = easeOutCubic(t / 0.66);
  const settle = Math.sin(clampEnemy01((t - 0.42) / 0.58) * Math.PI) * (1 - t);
  return {
    scaleX: 1 + fall * 0.12,
    scaleY: 1 - fall * 0.24,
    scaleZ: 1 + fall * 0.040,
    rotationZ: side * fall * 0.24,
    yOffset: -0.024 * fall,
    lateralDrift: side * 0.048 * fall,
    backwardDrift: 0.025 * fall,
    opacity: 1,
    secondary: {
      // The single leaf folds over the face/body rather than fluttering repeatedly.
      primaryBend: 0.94 * fall - settle * 0.07,
      secondaryBend: -0.56 * fall + settle * 0.05,
      twist: 0,
    },
  };
}

function whirlLeafDefeat(u: number, side: number): EnemyDefeatPose {
  const t = clampEnemy01(u);
  const wilt = easeOutCubic(t / 0.72);
  const untwist = smoothLeaf(clampEnemy01((t - 0.48) / 0.52));
  return {
    scaleX: 1 + wilt * 0.09,
    scaleY: 1 - wilt * 0.20,
    scaleZ: 1 + wilt * 0.030,
    rotationZ: side * wilt * 0.18,
    yOffset: -0.020 * wilt,
    lateralDrift: side * 0.040 * wilt,
    backwardDrift: 0.032 * wilt,
    opacity: 1,
    secondary: {
      primaryBend: 0.42 * wilt,
      secondaryBend: -0.34 * wilt,
      // Short twist on collapse, then relax. Never becomes another full-spin gag.
      twist: side * (0.52 * wilt * (1 - 0.55 * untwist)),
    },
  };
}

function smoothLeaf(value: number): number {
  const t = clampEnemy01(value);
  return t * t * (3 - 2 * t);
}

export function leafIdle(now: number, phase = 0): EnemyPose {
  // One slow sway drives the whole plant. The tip follows a fraction later.
  const sway = Math.sin(now * 1.28 + phase);
  const delayedTip = Math.sin(now * 1.28 + phase - 0.46);
  return {
    scaleX: 1 + sway * 0.003,
    scaleY: 1 - sway * 0.002,
    scaleZ: 1 + sway * 0.003,
    jump: 0,
    wobbleZ: sway * 0.009,
    travel: 0,
    releaseProgress: -1,
    secondary: {
      primaryBend: sway * 0.025,
      secondaryBend: delayedTip * 0.042,
      twist: 0,
    },
  };
}

export function leafMove(now: number, phase = 0): EnemyPose {
  const cycle = (now * 1.52 + phase) % 1;
  const lift = Math.sin(cycle * Math.PI) ** 2;
  const follow = Math.sin(cycle * Math.PI * 2);
  const jump = lift * 0.048;
  return {
    scaleX: 1 - lift * 0.032,
    scaleY: 1 + lift * 0.052,
    scaleZ: 1 - lift * 0.018,
    jump,
    wobbleZ: follow * 0.018,
    travel: 0,
    releaseProgress: -1,
    secondary: {
      primaryBend: -lift * 0.12,
      secondaryBend: lift * 0.14 - follow * 0.035,
      twist: 0,
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

/** Two-leaf gust release: hold still, snap through a partial turn, then let the tip settle. */
export function leafWhirl(u: number): EnemyPose {
  const t = clampEnemy01(u);
  let primaryBend = 0;
  let secondaryBend = 0;
  let twist = 0;
  let compression = 0;
  let jump = 0;
  let travel = 0;

  if (t < 0.36) {
    const p = easeInOutCubic(t / 0.36);
    primaryBend = -0.12 * p;
    secondaryBend = 0.14 * p;
    twist = -0.05 * p;
    compression = p;
  } else if (t < 0.48) {
    const p = easeOutCubic((t - 0.36) / 0.12);
    primaryBend = lerp(-0.12, 0.06, p);
    // The tip trails the main leaf instead of corkscrewing with the whole body.
    secondaryBend = lerp(0.14, -0.04, p ** 1.35);
    twist = lerp(-0.05, Math.PI * 0.48, p);
    jump = Math.sin(p * Math.PI) * 0.032;
    travel = p * 0.070;
    compression = 1 - p;
  } else if (t < 0.62) {
    const p = easeOutCubic((t - 0.48) / 0.14);
    primaryBend = lerp(0.06, 0.01, p);
    secondaryBend = lerp(-0.04, 0.10, p);
    twist = lerp(Math.PI * 0.48, Math.PI * 0.54, p);
    jump = (1 - p) * 0.008;
    travel = lerp(0.070, -0.015, p);
  } else {
    const p = easeInOutCubic((t - 0.62) / 0.38);
    // One soft leaf-tip follow-through. The body itself does not keep spinning.
    const tipSettle = Math.sin(p * Math.PI) * (1 - p);
    primaryBend = tipSettle * 0.018;
    secondaryBend = 0.10 * (1 - p) - tipSettle * 0.050;
    twist = lerp(Math.PI * 0.54, 0, p);
    travel = lerp(-0.015, 0, p);
  }

  return {
    scaleX: 1 + compression * 0.035,
    scaleY: 1 - compression * 0.060,
    scaleZ: 1 + compression * 0.024,
    jump,
    wobbleZ: 0,
    travel,
    releaseProgress: t >= 0.36 ? clampEnemy01((t - 0.36) / 0.64) : -1,
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
    hit: leaflingHit,
    defeat: leaflingDefeat,
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
    hit: whirlLeafHit,
    defeat: whirlLeafDefeat,
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
