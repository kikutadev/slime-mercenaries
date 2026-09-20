import * as THREE from 'three';
import type { BattleEffectsSystem } from './effects-system';
import type { AllyUnit, EnemyUnit } from './types';

export type BattleDamageSource = 'melee' | 'projectile' | 'enemy';

export interface BattleAllyCombatDependencies {
  camera: THREE.PerspectiveCamera;
  effects: BattleEffectsSystem;
  addSceneObject: (object: THREE.Object3D) => void;
  getLivingEnemies: () => EnemyUnit[];
  applyDamage: (
    target: AllyUnit | EnemyUnit,
    amount: number,
    source: BattleDamageSource,
    sourcePosition: THREE.Vector3,
  ) => void;
  startCameraShake: (duration: number, amplitude: number) => void;
  startHitStop: (durationSeconds: number) => void;
}
