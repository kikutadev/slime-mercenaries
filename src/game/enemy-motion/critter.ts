import * as THREE from 'three';

import {
  clampEnemy01,
  type EnemyDefeatPose,
  type EnemyHitPose,
  type EnemyMotionProfile,
  type EnemyPose,
} from './shared';

export type CritterBehaviorId = 'critter-roll' | 'critter-acorn';

const TAU = Math.PI * 2;

function smooth01(value: number): number {
  const t = clampEnemy01(value);
  return t * t * (3 - 2 * t);
}

function easeOutCubic(value: number): number {
  const t = clampEnemy01(value);
  return 1 - Math.pow(1 - t, 3);
}

function hedgehogIdle(now: number, phase = 0): EnemyPose {
  const breath = Math.sin(now * 1.75 + phase);
  const sniff = Math.sin(now * 3.2 + phase * 0.6);
  return {
    scaleX: 1 + breath * .012,
    scaleY: 1 - breath * .010,
    scaleZ: 1 + breath * .008,
    jump: 0,
    wobbleZ: breath * .007,
    travel: 0,
    releaseProgress: -1,
    secondary: {
      shellCurl: breath * .045,
      headNod: sniff * .016,
      earDrop: Math.max(0, -sniff) * .012,
    },
  };
}

function squirrelIdle(now: number, phase = 0): EnemyPose {
  const breath = Math.sin(now * 1.65 + phase);
  const tail = Math.sin(now * .92 + phase * .55);
  const ear = Math.sin(now * 1.18 + phase * .31);
  return {
    scaleX: 1 + breath * .010,
    scaleY: 1 - breath * .008,
    scaleZ: 1 + breath * .010,
    jump: 0,
    wobbleZ: breath * .006,
    travel: 0,
    releaseProgress: -1,
    secondary: {
      wag: tail * .095,
      headNod: breath * .012,
      earDrop: Math.max(0, ear) * .020,
    },
  };
}

function hedgehogMove(now: number, phase = 0): EnemyPose {
  const cycle = ((now * 1.90 + phase) % 1 + 1) % 1;
  const hop = Math.abs(Math.sin(cycle * TAU)) * .040;
  const landing = Math.sin(cycle * TAU);
  return {
    scaleX: 1 + hop * .55,
    scaleY: 1 - hop * 1.25,
    scaleZ: 1 + hop * .35,
    jump: hop,
    wobbleZ: landing * .018,
    travel: 0,
    releaseProgress: -1,
    secondary: {
      shellCurl: hop * 2.0,
      headNod: -hop * .22,
      earDrop: hop * .18,
    },
  };
}

function squirrelMove(now: number, phase = 0): EnemyPose {
  const cycle = ((now * 2.25 + phase) % 1 + 1) % 1;
  const primaryHop = Math.pow(Math.sin(cycle * Math.PI), 2) * .055;
  const bob = Math.sin(cycle * TAU);
  return {
    scaleX: 1 - primaryHop * .65,
    scaleY: 1 + primaryHop * 1.15,
    scaleZ: 1 - primaryHop * .38,
    jump: primaryHop,
    wobbleZ: bob * .022,
    travel: 0,
    releaseProgress: -1,
    secondary: {
      wag: -bob * .18,
      headNod: -primaryHop * .28,
      earDrop: primaryHop * .16,
    },
  };
}

export function rollAttack(u: number): EnemyPose {
  const t = clampEnemy01(u);
  let curl = 0;
  let jump = 0;
  let rotation = 0;
  let travel = 0;
  let headNod = 0;

  if (t < .30) {
    const q = smooth01(t / .30);
    curl = q;
    headNod = q * .18;
  } else if (t < .42) {
    const q = easeOutCubic((t - .30) / .12);
    curl = 1;
    jump = Math.sin(q * Math.PI) * .075;
    rotation = q * .42;
    travel = q * .14;
    headNod = .18;
  } else if (t < .67) {
    const q = easeOutCubic((t - .42) / .25);
    curl = 1;
    jump = Math.sin(q * Math.PI) * .030;
    rotation = .42 + q * 2.32;
    travel = .14 + q * .86;
    headNod = .18;
  } else {
    const q = smooth01((t - .67) / .33);
    const settle = 1 - q;
    curl = settle;
    rotation = 2.74 * settle + Math.sin(q * Math.PI * 2) * .10 * settle;
    travel = settle;
    headNod = .18 * settle;
  }

  return {
    scaleX: 1 + curl * .085,
    scaleY: 1 - curl * .155,
    scaleZ: 1 + curl * .075,
    jump,
    wobbleZ: rotation,
    travel,
    releaseProgress: t >= .42 ? clampEnemy01((t - .42) / .58) : -1,
    secondary: {
      shellCurl: curl * .30,
      headNod,
      earDrop: curl * .22,
    },
  };
}

export function acornAttack(u: number): EnemyPose {
  const t = clampEnemy01(u);
  let crouch = 0;
  let recoil = 0;
  let settle = 0;
  let wag = 0;
  let headNod = 0;

  if (t < .36) {
    const q = smooth01(t / .36);
    crouch = q;
    wag = -.62 * q;
    headNod = -.10 * q;
  } else if (t < .44) {
    crouch = 1;
    wag = -.62;
    headNod = -.10;
  } else if (t < .60) {
    const q = easeOutCubic((t - .44) / .16);
    recoil = Math.sin(q * Math.PI);
    crouch = 1 - q;
    wag = THREE.MathUtils.lerp(-.62, .44, q);
    headNod = THREE.MathUtils.lerp(-.10, .10, q);
  } else {
    const q = smooth01((t - .60) / .40);
    settle = 1 - q;
    wag = .44 * settle + Math.sin(q * Math.PI * 2) * .07 * settle;
    headNod = .10 * settle;
  }

  return {
    scaleX: 1 + crouch * .055 - recoil * .025,
    scaleY: 1 - crouch * .115 + recoil * .055,
    scaleZ: 1 + crouch * .035 - recoil * .020,
    jump: recoil * .045,
    wobbleZ: recoil * -.045,
    travel: -recoil * .075,
    releaseProgress: t >= .44 ? clampEnemy01((t - .44) / .56) : -1,
    secondary: {
      wag,
      earDrop: crouch * .095 + recoil * .06,
      headNod,
    },
  };
}

function hedgehogHit(u: number, side: number): EnemyHitPose {
  const p = Math.sin(clampEnemy01(u) * Math.PI);
  return {
    scaleX: 1 + p * .085,
    scaleY: 1 - p * .145,
    scaleZ: 1 + p * .055,
    rotationZ: side * p * .055,
    secondary: {
      shellCurl: p * .30,
      headNod: p * .08,
      earDrop: p * .10,
    },
  };
}

function squirrelHit(u: number, side: number): EnemyHitPose {
  const p = Math.sin(clampEnemy01(u) * Math.PI);
  return {
    scaleX: 1 + p * .045,
    scaleY: 1 - p * .095,
    scaleZ: 1 + p * .035,
    rotationZ: side * p * .075,
    secondary: {
      wag: -side * p * .34,
      headNod: p * .07,
      earDrop: p * .32,
    },
  };
}

function hedgehogDefeat(u: number, side: number): EnemyDefeatPose {
  const t = clampEnemy01(u);
  const rollIn = smooth01(Math.min(1, t / .48));
  const flop = smooth01(clampEnemy01((t - .34) / .42));
  return {
    scaleX: 1 + flop * .12,
    scaleY: 1 - flop * .30,
    scaleZ: 1 + flop * .045,
    rotationZ: side * (rollIn * .92 - flop * .18),
    yOffset: -.014 * flop,
    lateralDrift: side * .105 * flop,
    backwardDrift: .045 * flop,
    opacity: 1,
    secondary: {
      shellCurl: .26 * (1 - flop * .35),
      headNod: side * .16 * flop,
      earDrop: .26 * flop,
    },
  };
}

function squirrelDefeat(u: number, side: number): EnemyDefeatPose {
  const t = clampEnemy01(u);
  const sit = smooth01(Math.min(1, t / .56));
  const blanket = smooth01(clampEnemy01((t - .18) / .62));
  return {
    scaleX: 1 + sit * .10,
    scaleY: 1 - sit * .29,
    scaleZ: 1 + sit * .035,
    rotationZ: side * sit * .34,
    yOffset: -.016 * sit,
    lateralDrift: side * .075 * sit,
    backwardDrift: .050 * sit,
    opacity: 1,
    secondary: {
      // The tail is authored on the squirrel's right-rear side, so always fold it
      // inward over the body instead of mirroring by hit side. This reads as a soft blanket.
      wag: 1.08 * blanket,
      headNod: side * .18 * sit,
      earDrop: .40 * sit,
    },
  };
}

function createAcornMesh(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'AcornProjectile';

  const nutMaterial = new THREE.MeshStandardMaterial({ color: '#9b6337', roughness: .84, metalness: 0 });
  const capMaterial = new THREE.MeshStandardMaterial({ color: '#654029', roughness: .92, metalness: 0 });

  const nut = new THREE.Mesh(new THREE.SphereGeometry(.038, 14, 10), nutMaterial);
  nut.scale.set(.88, .82, 1.18);
  group.add(nut);

  const cap = new THREE.Mesh(new THREE.SphereGeometry(.032, 12, 8), capMaterial);
  cap.scale.set(1.04, .92, .42);
  cap.position.z = .037;
  group.add(cap);

  const stem = new THREE.Mesh(new THREE.CylinderGeometry(.0045, .006, .032, 7), capMaterial);
  stem.rotation.x = Math.PI / 2;
  stem.position.set(.004, 0, .063);
  stem.rotation.z = -.24;
  group.add(stem);

  return group;
}

const profiles: Record<CritterBehaviorId, EnemyMotionProfile> = {
  'critter-roll': {
    familyId: 'critter',
    idle: hedgehogIdle,
    move: hedgehogMove,
    attack: rollAttack,
    hit: hedgehogHit,
    defeat: hedgehogDefeat,
    moveDuration: 1.12,
    moveDistance: .76,
    attackDuration: .70,
    attackTravelDistance: .40,
    contactU: .67,
    defeatDuration: 1.02,
  },
  'critter-acorn': {
    familyId: 'critter',
    idle: squirrelIdle,
    move: squirrelMove,
    attack: acornAttack,
    hit: squirrelHit,
    defeat: squirrelDefeat,
    moveDuration: .96,
    moveDistance: .90,
    attackDuration: .70,
    attackTravelDistance: .06,
    contactU: .44,
    defeatDuration: 1.04,
    projectile: {
      kind: 'acorn',
      flightSeconds: .44,
      createMesh: createAcornMesh,
      arcHeight: (u) => Math.sin(clampEnemy01(u) * Math.PI) * .16,
    },
  },
};

export const getCritterMotionProfile = (id: CritterBehaviorId): EnemyMotionProfile => profiles[id];
