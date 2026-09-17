import * as THREE from 'three';
import type { EnemyBehaviorId } from './enemies';

export const ENEMY_MOTION_TIMING = {
  bumpAttack: 0.5,
  heavyAttack: 0.72,
  sporeAttack: 0.78,
  bossAttack: 0.92,
  defeat: 1.05,
} as const;

export const ENEMY_MOTION_THRESHOLDS = {
  bumpContactU: 0.57,
  heavyContactU: 0.6,
  sporeReleaseU: 0.48,
  bossContactU: 0.61,
} as const;

export interface EnemyPose {
  scaleX: number;
  scaleY: number;
  scaleZ: number;
  jump: number;
  wobbleZ: number;
  travel: number;
  releaseProgress: number;
}

export function clampEnemy01(value: number): number {
  return THREE.MathUtils.clamp(value, 0, 1);
}

export function getMushroomIdleMotion(now: number, phaseOffset = 0): EnemyPose {
  const breathe = Math.sin(now * 4.6 + phaseOffset);
  const sway = Math.sin(now * 2.5 + phaseOffset * 1.7);
  return {
    scaleX: 1 + breathe * 0.018,
    scaleY: 1 - breathe * 0.014,
    scaleZ: 1 + breathe * 0.018,
    jump: Math.max(0, Math.sin(now * 2.3 + phaseOffset)) * 0.008,
    wobbleZ: sway * 0.018,
    travel: 0,
    releaseProgress: -1,
  };
}

export function getMushroomMoveMotion(now: number, phaseOffset = 0): EnemyPose {
  const cycle = (now * 1.75 + phaseOffset) % 1;
  const jump = Math.abs(Math.sin(cycle * Math.PI * 2)) * 0.05;
  const compression = Math.max(0, Math.sin(cycle * Math.PI * 2 + Math.PI * 0.5));
  return {
    scaleX: 1 + compression * 0.035,
    scaleY: 1 - compression * 0.07 + jump * 0.5,
    scaleZ: 1 + compression * 0.035,
    jump,
    wobbleZ: Math.sin(cycle * Math.PI * 2) * 0.035,
    travel: 0,
    releaseProgress: -1,
  };
}

function bumpPose(u: number, heavy: boolean): EnemyPose {
  const t = clampEnemy01(u);
  const anticipationEnd = heavy ? 0.34 : 0.25;
  const contact = heavy ? ENEMY_MOTION_THRESHOLDS.heavyContactU : ENEMY_MOTION_THRESHOLDS.bumpContactU;
  let travel = 0;
  if (t >= anticipationEnd && t < contact) {
    travel = Math.sin(((t - anticipationEnd) / (contact - anticipationEnd)) * Math.PI * 0.5);
  } else if (t >= contact) {
    travel = 1 - clampEnemy01((t - contact) / (1 - contact));
  }
  const anticipation = t < anticipationEnd ? Math.sin((t / anticipationEnd) * Math.PI) : 0;
  const impact = Math.exp(-Math.pow((t - contact) / (heavy ? 0.12 : 0.09), 2));
  return {
    scaleX: 1 + anticipation * (heavy ? 0.13 : 0.09) + impact * 0.08,
    scaleY: 1 - anticipation * (heavy ? 0.2 : 0.14) - impact * 0.11,
    scaleZ: 1 + anticipation * (heavy ? 0.13 : 0.09),
    jump: Math.sin(t * Math.PI) * (heavy ? 0.11 : 0.08),
    wobbleZ: Math.sin(t * Math.PI * 3) * (1 - t) * 0.035,
    travel,
    releaseProgress: t >= anticipationEnd ? (t - anticipationEnd) / (1 - anticipationEnd) : -1,
  };
}

export function getMushroomBumpAttackMotion(u: number): EnemyPose {
  return bumpPose(u, false);
}

export function getMushroomHeavyAttackMotion(u: number): EnemyPose {
  return bumpPose(u, true);
}

export function getMushroomSporeAttackMotion(u: number): EnemyPose {
  const t = clampEnemy01(u);
  const puff = Math.sin(Math.min(1, t / 0.48) * Math.PI * 0.5);
  const recoil = t >= 0.48 ? Math.sin(clampEnemy01((t - 0.48) / 0.28) * Math.PI) : 0;
  return {
    scaleX: 1 + puff * 0.08 - recoil * 0.04,
    scaleY: 1 + puff * 0.12 - recoil * 0.08,
    scaleZ: 1 + puff * 0.08,
    jump: recoil * 0.025,
    wobbleZ: Math.sin(t * Math.PI * 2) * 0.025,
    travel: -recoil * 0.08,
    releaseProgress: t >= 0.48 ? clampEnemy01((t - 0.48) / 0.52) : -1,
  };
}

export function getGreatMushroomAttackMotion(u: number): EnemyPose {
  const t = clampEnemy01(u);
  const anticipation = t < 0.42 ? Math.sin((t / 0.42) * Math.PI * 0.5) : 1 - clampEnemy01((t - 0.42) / 0.22);
  const slam = t >= 0.42 ? Math.sin(clampEnemy01((t - 0.42) / 0.36) * Math.PI) : 0;
  return {
    scaleX: 1 + anticipation * 0.14 + slam * 0.12,
    scaleY: 1 - anticipation * 0.22 - slam * 0.16,
    scaleZ: 1 + anticipation * 0.14,
    jump: slam * 0.13,
    wobbleZ: Math.sin(t * Math.PI * 4) * (1 - t) * 0.045,
    travel: t < 0.42 ? 0 : Math.sin(clampEnemy01((t - 0.42) / 0.58) * Math.PI) * 0.72,
    releaseProgress: t >= 0.42 ? clampEnemy01((t - 0.42) / 0.58) : -1,
  };
}

export function getEnemyAttackMotion(behaviorId: EnemyBehaviorId, u: number): EnemyPose {
  if (behaviorId === 'mushroom-heavy-bump') return getMushroomHeavyAttackMotion(u);
  if (behaviorId === 'mushroom-spore') return getMushroomSporeAttackMotion(u);
  if (behaviorId === 'mushroom-boss') return getGreatMushroomAttackMotion(u);
  return getMushroomBumpAttackMotion(u);
}

export function getMushroomHitMotion(u: number, side: number): Readonly<{ scaleX: number; scaleY: number; scaleZ: number; rotationZ: number }> {
  const t = clampEnemy01(u);
  const pulse = Math.sin(t * Math.PI);
  return {
    scaleX: 1 + pulse * 0.1,
    scaleY: 1 - pulse * 0.17,
    scaleZ: 1 + pulse * 0.05,
    rotationZ: side * pulse * 0.1,
  };
}

export function getMushroomDefeatMotion(u: number, side: number): Readonly<{ scaleX: number; scaleY: number; scaleZ: number; rotationZ: number; yOffset: number; lateralDrift: number; backwardDrift: number; opacity: number }> {
  const t = clampEnemy01(u);
  const collapse = Math.sin(Math.min(1, t / 0.62) * Math.PI * 0.5);
  const drift = Math.sin(Math.min(1, t / 0.46) * Math.PI * 0.5);
  const fade = clampEnemy01((t - 0.82) / 0.18);
  return {
    scaleX: 1 + collapse * 0.28,
    scaleY: 1 - collapse * 0.58,
    scaleZ: 1 + collapse * 0.1,
    rotationZ: side * collapse * 0.3,
    yOffset: -0.028 * collapse - 0.04 * fade,
    lateralDrift: side * drift * 0.13,
    backwardDrift: drift * 0.12,
    opacity: 1 - fade,
  };
}

export function getEnemyAttackDuration(behaviorId: EnemyBehaviorId): number {
  if (behaviorId === 'mushroom-heavy-bump') return ENEMY_MOTION_TIMING.heavyAttack;
  if (behaviorId === 'mushroom-spore') return ENEMY_MOTION_TIMING.sporeAttack;
  if (behaviorId === 'mushroom-boss') return ENEMY_MOTION_TIMING.bossAttack;
  return ENEMY_MOTION_TIMING.bumpAttack;
}

export function getEnemyAttackContactU(behaviorId: EnemyBehaviorId): number {
  if (behaviorId === 'mushroom-heavy-bump') return ENEMY_MOTION_THRESHOLDS.heavyContactU;
  if (behaviorId === 'mushroom-spore') return ENEMY_MOTION_THRESHOLDS.sporeReleaseU;
  if (behaviorId === 'mushroom-boss') return ENEMY_MOTION_THRESHOLDS.bossContactU;
  return ENEMY_MOTION_THRESHOLDS.bumpContactU;
}

export const MUSHROOM_SPORE_FLIGHT_SECONDS = 0.42;

/** Production spore projectile shared by battle and gallery. */
export function createMushroomSporeMesh(): THREE.Group {
  const root = new THREE.Group();
  root.name = 'MushroomSporeProjectile';

  const coreMaterial = new THREE.MeshBasicMaterial({
    color: '#d9b9ff',
    transparent: true,
    opacity: 0.92,
    depthWrite: false,
  });
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.045, 12, 8), coreMaterial);
  root.add(core);

  const moteMaterial = new THREE.MeshBasicMaterial({
    color: '#f4e8ff',
    transparent: true,
    opacity: 0.82,
    depthWrite: false,
  });
  for (let index = 0; index < 4; index += 1) {
    const angle = (index / 4) * Math.PI * 2;
    const mote = new THREE.Mesh(new THREE.SphereGeometry(0.015, 8, 6), moteMaterial);
    mote.position.set(Math.cos(angle) * 0.065, Math.sin(angle) * 0.038, Math.sin(angle) * 0.024);
    root.add(mote);
  }
  return root;
}

export function getMushroomSporeArcHeight(u: number): number {
  return Math.sin(clampEnemy01(u) * Math.PI) * 0.16;
}
