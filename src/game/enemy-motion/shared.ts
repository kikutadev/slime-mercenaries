import * as THREE from 'three';

export type EnemyFamilyId = 'mushroom' | 'leaf' | 'flower' | 'critter' | 'mine' | 'marsh' | 'frost' | 'ember';
export type EnemyProjectileKind = 'spore' | 'gust' | 'pollen' | 'acorn' | 'crystal-ring' | 'water-orb' | 'ice-shard' | 'ice-ray' | 'frost-icicle' | 'ember-spark' | 'fire-ring' | 'furnace-flame';

export interface EnemySecondaryPose {
  primaryBend?: number;
  primaryLift?: number;
  secondaryBend?: number;
  open?: number;
  twist?: number;
  wag?: number;
  earDrop?: number;
  shellCurl?: number;
  headNod?: number;
  headRetract?: number;
  shellRoll?: number;
  inflate?: number;
  glow?: number;
  glowHeat?: number;
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

export interface EnemyAttackVfxPose {
  telegraphOpacity: number;
  telegraphScale: number;
  impactStrength: number;
}

export interface EnemyAttackVfxProfile {
  color: string;
  radius: number;
  pose: (u: number) => EnemyAttackVfxPose;
  impactColor: string;
  impactSize: number;
  cameraShakeDuration: number;
  cameraShakeAmplitude: number;
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
  attackVfx?: EnemyAttackVfxProfile;
}

export function clampEnemy01(value: number): number {
  return THREE.MathUtils.clamp(value, 0, 1);
}

export function neutralSecondaryPose(): EnemySecondaryPose {
  return {};
}