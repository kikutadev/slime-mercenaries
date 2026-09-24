import * as THREE from 'three';
import type { EnemyFormationSlot } from '../encounters';

export const SCALE = 0.19;
export const MELEE_BODY_GAP = 0.58;

const ALLY_HOME_POSITIONS = [
  new THREE.Vector3(-0.50, 0.02, 0.82),
  new THREE.Vector3(0.25, 0.02, 0.82),
  new THREE.Vector3(1.00, 0.02, 0.82),
  new THREE.Vector3(-0.25, 0.02, 1.08),
  new THREE.Vector3(0.55, 0.02, 1.08),
  new THREE.Vector3(1.25, 0.02, 1.08),
] as const;

/**
 * Front-role slimes deliberately use a wider presentation fan than their Camp formation.
 * This is presentation-only: combat targeting and damage remain authoritative elsewhere.
 *
 * The second row is pulled slightly toward the viewer so multiple melee slimes attacking
 * the same target retain distinct silhouettes instead of collapsing into one blue mass.
 */
const MELEE_COMBAT_POSITIONS = [
  new THREE.Vector3(-0.72, 0.02, -0.56),
  new THREE.Vector3(0, 0.02, -0.68),
  new THREE.Vector3(0.72, 0.02, -0.56),
  new THREE.Vector3(-0.94, 0.02, -0.12),
  new THREE.Vector3(0, 0.02, -0.22),
  new THREE.Vector3(0.94, 0.02, -0.12),
] as const;

const ENEMY_FORMATION_POSITIONS: Readonly<Record<EnemyFormationSlot, THREE.Vector3>> = {
  'front-left': new THREE.Vector3(-0.68, 0, -1.26),
  'front-center': new THREE.Vector3(0, 0, -1.38),
  'front-right': new THREE.Vector3(0.68, 0, -1.26),
  'mid-left': new THREE.Vector3(-0.86, 0, -1.66),
  'mid-center': new THREE.Vector3(0, 0, -1.74),
  'mid-right': new THREE.Vector3(0.86, 0, -1.66),
  'back-left': new THREE.Vector3(-0.72, 0, -2.02),
  'back-center': new THREE.Vector3(0, 0, -2.10),
  'back-right': new THREE.Vector3(0.72, 0, -2.02),
  'rear-left': new THREE.Vector3(-0.98, 0, -2.34),
  'rear-center': new THREE.Vector3(0, 0, -2.42),
  'rear-right': new THREE.Vector3(0.98, 0, -2.34),
};

export const TARGET_HOME = ENEMY_FORMATION_POSITIONS['front-center'];

/**
 * Normal encounters are framed closer than the previous production camera so characters,
 * not empty road, dominate a portrait phone. Bosses keep the wider legacy framing.
 */
export const CAMERA_BASE_POSITION = new THREE.Vector3(2.5, 4.9, 8.0);
export const CAMERA_LOOK_AT = new THREE.Vector3(0, 0.36, -0.72);
export const BOSS_CAMERA_BASE_POSITION = new THREE.Vector3(2.8, 5.35, 8.9);
export const BOSS_CAMERA_LOOK_AT = new THREE.Vector3(0, 0.38, -1.05);

export function allyHome(slotIndex: number): THREE.Vector3 {
  return (ALLY_HOME_POSITIONS[slotIndex] ?? ALLY_HOME_POSITIONS[ALLY_HOME_POSITIONS.length - 1]!).clone();
}

export function meleeCombatAnchor(slotIndex: number): THREE.Vector3 {
  return (MELEE_COMBAT_POSITIONS[slotIndex] ?? MELEE_COMBAT_POSITIONS[MELEE_COMBAT_POSITIONS.length - 1]!).clone();
}

export function enemyHome(formationSlot: EnemyFormationSlot): THREE.Vector3 {
  return ENEMY_FORMATION_POSITIONS[formationSlot].clone();
}
