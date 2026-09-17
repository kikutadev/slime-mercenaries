import * as THREE from 'three';

export type EnemyFamilyId = 'mushroom' | 'leaf' | 'flower' | 'critter';
export type EnemyProjectileKind = 'spore' | 'gust' | 'pollen' | 'acorn';

export interface EnemySecondaryPose {
  primaryBend?: number;
  secondaryBend?: number;
  open?: number;
  twist?: number;
  wag?: number;
  earDrop?: number;
  shellCurl?: number;
  headNod?: number;
}

export interface EnemyPose {
  scaleX: number;
  scaleY: number;
  scaleZ: number;
  jump: number;
  wobbleZ: number;
  travel: number;
  releaseProgress: number;
  secondary?: EnemySecondaryPose;
}

export interface EnemyHitPose {
  scaleX: number;
  scaleY: number;
  scaleZ: number;
  rotationZ: number;
  secondary?: EnemySecondaryPose;
}

export interface EnemyDefeatPose {
  scaleX: number;
  scaleY: number;
  scaleZ: number;
  rotationZ: number;
  yOffset: number;
  lateralDrift: number;
  backwardDrift: number;
  opacity: number;
  secondary?: EnemySecondaryPose;
}

export interface EnemyProjectileProfile {
  kind: EnemyProjectileKind;
  flightSeconds: number;
  createMesh: () => THREE.Object3D;
  arcHeight: (u: number) => number;
}

export interface EnemyMotionProfile {
  familyId: EnemyFamilyId;
  idle: (now: number, phaseOffset?: number) => EnemyPose;
  move: (now: number, phaseOffset?: number) => EnemyPose;
  attack: (u: number) => EnemyPose;
  hit: (u: number, side: number) => EnemyHitPose;
  defeat: (u: number, side: number) => EnemyDefeatPose;
  moveDuration: number;
  moveDistance: number;
  attackDuration: number;
  attackTravelDistance: number;
  contactU: number;
  defeatDuration: number;
  projectile?: EnemyProjectileProfile;
}

export function clampEnemy01(value: number): number {
  return THREE.MathUtils.clamp(value, 0, 1);
}

export function neutralSecondaryPose(): EnemySecondaryPose {
  return {};
}
