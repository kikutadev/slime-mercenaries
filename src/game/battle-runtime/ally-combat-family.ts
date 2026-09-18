import * as THREE from 'three';
import type { BattleProjectileSystem } from './projectile-system';
import type { BattleSceneOwner } from './scene-owner';
import type { AllyUnit, EnemyUnit } from './types';
import {
  applyUnitDeformation,
  facePoint,
  findNearest,
  resetBranchAccents,
  safeMeleeForwardOffset,
  setEquipmentSwing,
  setSecondaryEquipmentSwing,
  updateIdle,
} from './unit-presentation';

export interface AllyCombatFamilyOptions {
  sceneOwner: BattleSceneOwner;
  camera: THREE.PerspectiveCamera;
  projectileSystem: BattleProjectileSystem;
  getLivingEnemies: () => EnemyUnit[];
  applyDamage: (
    target: AllyUnit | EnemyUnit,
    amount: number,
    source: 'melee' | 'projectile' | 'enemy',
    sourcePosition: THREE.Vector3,
  ) => void;
  startHitStop: (durationSeconds: number) => void;
  startCameraShake: (duration: number, amplitude: number) => void;
}

export abstract class AllyCombatFamily {
  protected readonly tempVector = new THREE.Vector3();
  protected readonly tempVector2 = new THREE.Vector3();
  protected readonly tempVector3 = new THREE.Vector3();
  protected readonly tempVector4 = new THREE.Vector3();
  protected readonly tempVector5 = new THREE.Vector3();
  protected readonly tempVector6 = new THREE.Vector3();

  constructor(protected readonly options: AllyCombatFamilyOptions) {}

  abstract update(unit: AllyUnit, now: number): boolean;

  protected findNearest<T extends AllyUnit | EnemyUnit>(
    source: AllyUnit | EnemyUnit,
    candidates: T[],
  ): T | null {
    return findNearest(source, candidates);
  }

  protected facePoint(unit: AllyUnit | EnemyUnit, point: THREE.Vector3): void {
    facePoint(unit, point);
  }

  protected applyUnitDeformation(
    unit: AllyUnit,
    squash = 0,
    stretch = 0,
    lean = 0,
    wobble = 0,
    jump = 0,
  ): void {
    applyUnitDeformation(unit, squash, stretch, lean, wobble, jump);
  }

  protected setEquipmentSwing(unit: AllyUnit, angle: number, lift = 0, sweep = 0): void {
    setEquipmentSwing(unit, angle, lift, sweep);
  }

  protected setSecondaryEquipmentSwing(
    unit: AllyUnit,
    angle: number,
    lift = 0,
    sweep = 0,
  ): void {
    setSecondaryEquipmentSwing(unit, angle, lift, sweep);
  }

  protected resetBranchAccents(unit: AllyUnit): void {
    resetBranchAccents(unit);
  }

  protected updateIdle(unit: AllyUnit, now: number, phaseOffset = 0): void {
    updateIdle(unit, now, phaseOffset);
  }

  protected getSafeMeleeForwardOffset(
    anchor: THREE.Vector3,
    direction: THREE.Vector3,
    desiredOffset: number,
  ): number {
    return safeMeleeForwardOffset(
      anchor,
      direction,
      desiredOffset,
      this.options.getLivingEnemies(),
    );
  }
}
