import * as THREE from 'three';
import type { EnemyFormationSlot } from '../encounters';

export const SCALE = 0.19;
export const MELEE_BODY_GAP = 0.58;

const ALLY_HOME_POSITIONS = [
  new THREE.Vector3(-0.62, 0.02, 1.18),
  new THREE.Vector3(0, 0.02, 1.34),
  new THREE.Vector3(0.62, 0.02, 1.18),
  new THREE.Vector3(-0.66, 0.02, 1.78),
  new THREE.Vector3(0, 0.02, 1.92),
  new THREE.Vector3(0.66, 0.02, 1.78),
] as const;

const MELEE_COMBAT_POSITIONS = [
  new THREE.Vector3(-0.52, 0.02, -0.72),
  new THREE.Vector3(0, 0.02, -0.82),
  new THREE.Vector3(0.52, 0.02, -0.72),
  new THREE.Vector3(-0.72, 0.02, -0.34),
  new THREE.Vector3(0, 0.02, -0.42),
  new THREE.Vector3(0.72, 0.02, -0.34),
] as const;

const ENEMY_FORMATION_POSITIONS: Readonly<Record<EnemyFormationSlot, THREE.Vector3>> = {
  'front-left': new THREE.Vector3(-0.62, 0, -1.34),
  'front-center': new THREE.Vector3(0, 0, -1.46),
  'front-right': new THREE.Vector3(0.62, 0, -1.34),
  'mid-left': new THREE.Vector3(-0.82, 0, -1.78),
  'mid-center': new THREE.Vector3(0, 0, -1.86),
  'mid-right': new THREE.Vector3(0.82, 0, -1.78),
  'back-left': new THREE.Vector3(-0.68, 0, -2.18),
  'back-center': new THREE.Vector3(0, 0, -2.26),
  'back-right': new THREE.Vector3(0.68, 0, -2.18),
  'rear-left': new THREE.Vector3(-0.94, 0, -2.52),
  'rear-center': new THREE.Vector3(0, 0, -2.60),
  'rear-right': new THREE.Vector3(0.94, 0, -2.52),
};

export const TARGET_HOME = ENEMY_FORMATION_POSITIONS['front-center'];
export const CAMERA_BASE_POSITION = new THREE.Vector3(2.8, 5.35, 8.9);
export const CAMERA_LOOK_AT = new THREE.Vector3(0, 0.38, -1.05);

export function allyHome(slotIndex: number): THREE.Vector3 {
  return (ALLY_HOME_POSITIONS[slotIndex] ?? ALLY_HOME_POSITIONS[ALLY_HOME_POSITIONS.length - 1]!).clone();
}

export function meleeCombatAnchor(slotIndex: number): THREE.Vector3 {
  return (MELEE_COMBAT_POSITIONS[slotIndex] ?? MELEE_COMBAT_POSITIONS[MELEE_COMBAT_POSITIONS.length - 1]!).clone();
}

export function enemyHome(formationSlot: EnemyFormationSlot): THREE.Vector3 {
  return ENEMY_FORMATION_POSITIONS[formationSlot].clone();
}
