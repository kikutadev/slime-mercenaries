import * as THREE from 'three';
import {
  SLIME_MOTION_THRESHOLDS,
  SLIME_MOTION_TIMING,
  clamp01,
  getGunAttackMotion,
  getGunnerAttackMotion,
  getGunnerShotReleaseU,
} from '../slime-motion';
import {
  CANNONEER_SIGNATURE_TIMING,
  ENGINEER_SIGNATURE_TIMING,
  getCannoneerImpactU,
  getCannoneerSignatureMotion,
  getEngineerSignatureMotion,
  getEngineerTurretShotReleaseU,
} from '../slime-motions/tier3/gun';
import {
  applyCannoneerSignatureVfx,
  applyEngineerSignatureVfx,
} from '../slime-motions/tier3/effects';
import {
  applyUnitDeformation,
  facePoint,
  findNearest,
  resetBranchAccents,
  setEquipmentSwing,
  updateIdle,
} from './unit-presentation';
import type { AllyUnit } from './types';
import type { BattleAllyCombatDependencies } from './ally-combat-deps';

export class GunCombatFamily {
  private readonly tempVector = new THREE.Vector3();
  private readonly tempVector2 = new THREE.Vector3();
  private readonly tempVector3 = new THREE.Vector3();
  private readonly tempVector4 = new THREE.Vector3();
  private readonly tempVector5 = new THREE.Vector3();

  constructor(private readonly deps: BattleAllyCombatDependencies) {}

  updateGunner(now: number, gunner: AllyUnit): void {
    if (!gunner.alive) return;
    if (gunner.attackStartedAt !== -Infinity && !gunner.attackTarget?.alive) {
      gunner.attackStartedAt = -Infinity;
      gunner.attackTarget = null;
      gunner.hitsApplied = 0;
    }
    if (gunner.attackStartedAt === -Infinity && now >= gunner.nextAttackAt) {
      const target = findNearest(gunner, this.deps.getLivingEnemies());
      if (target) {
        gunner.attackStartedAt = now;
        gunner.attackTarget = target;
        gunner.hitsApplied = 0;
      }
    }
    if (gunner.attackStartedAt === -Infinity || !gunner.attackTarget) {
      gunner.root.position.copy(gunner.home);
      updateIdle(gunner, now, 2.85 + gunner.slotIndex * 0.19);
      const target = findNearest(gunner, this.deps.getLivingEnemies());
      if (target) facePoint(gunner, target.root.position);
      return;
    }

    const target = gunner.attackTarget;
    const u = clamp01((now - gunner.attackStartedAt) / SLIME_MOTION_TIMING.gunnerAttack);
    const pose = getGunnerAttackMotion(u);
    facePoint(gunner, target.root.position);
    this.tempVector.copy(target.root.position).sub(gunner.home).setY(0);
    if (this.tempVector.lengthSq() > 0.0001) this.tempVector.normalize();
    gunner.root.position.copy(gunner.home).addScaledVector(this.tempVector, pose.bodyOffset);
    applyUnitDeformation(
      gunner,
      pose.deformation.squash,
      pose.deformation.stretch,
      pose.deformation.lean,
      pose.deformation.wobble,
      pose.deformation.jump,
    );
    setEquipmentSwing(gunner, pose.equipment.angle, pose.equipment.lift, pose.equipment.sweep);
    for (const shotIndex of [0, 1, 2] as const) {
      const mask = 1 << shotIndex;
      if (u >= getGunnerShotReleaseU(shotIndex) && (gunner.hitsApplied & mask) === 0) {
        gunner.hitsApplied |= mask;
        this.deps.effects.fireBullet(gunner, target, true);
      }
    }
    if (u >= 1) {
      gunner.attackStartedAt = -Infinity;
      gunner.attackTarget = null;
      gunner.hitsApplied = 0;
      gunner.root.position.copy(gunner.home);
      gunner.nextAttackAt = now + 0.56;
      setEquipmentSwing(gunner, 0);
    }
  }


  updateCannoneer(now: number, unit: AllyUnit): void {
    if (!unit.alive) return;
    if (unit.attackStartedAt !== -Infinity && !unit.attackTarget?.alive) {
      unit.attackStartedAt = -Infinity;
      unit.attackTarget = null;
      unit.hitsApplied = 0;
      resetBranchAccents(unit);
    }
    if (unit.attackStartedAt === -Infinity && now >= unit.nextAttackAt) {
      const target = findNearest(unit, this.deps.getLivingEnemies());
      if (target) {
        unit.attackStartedAt = now;
        unit.attackTarget = target;
        unit.hitsApplied = 0;
      }
    }
    if (unit.attackStartedAt === -Infinity || !unit.attackTarget) {
      unit.root.position.copy(unit.home);
      updateIdle(unit, now, 2.82 + unit.slotIndex * 0.13);
      const target = findNearest(unit, this.deps.getLivingEnemies());
      if (target) facePoint(unit, target.root.position);
      return;
    }

    const target = unit.attackTarget;
    const u = clamp01((now - unit.attackStartedAt) / CANNONEER_SIGNATURE_TIMING.duration);
    const pose = getCannoneerSignatureMotion(u);
    facePoint(unit, target.root.position);
    this.tempVector.copy(target.root.position).sub(unit.home).setY(0);
    if (this.tempVector.lengthSq() > 0.0001) this.tempVector.normalize();
    unit.root.position.copy(unit.home).addScaledVector(this.tempVector, pose.bodyOffset);
    applyUnitDeformation(unit, pose.deformation.squash, pose.deformation.stretch, pose.deformation.lean, pose.deformation.wobble, pose.deformation.jump);
    setEquipmentSwing(unit, pose.equipment.angle, pose.equipment.lift, pose.equipment.sweep);
    unit.root.updateMatrixWorld(true);
    (unit.auxiliaryMuzzle ?? unit.projectileOrigin ?? unit.equipmentAnchor).getWorldPosition(this.tempVector2);
    this.tempVector3.copy(target.root.position);
    this.tempVector3.y += 0.24;
    applyCannoneerSignatureVfx(unit.signatureVfx, pose, this.deps.camera.quaternion, this.tempVector2, this.tempVector3);

    if (u >= CANNONEER_SIGNATURE_TIMING.shellReleaseU && (unit.hitsApplied & 1) === 0) {
      unit.hitsApplied |= 1;
      this.deps.startHitStop(0.035);
      this.deps.startCameraShake(0.10, 0.045);
    }
    if (u >= getCannoneerImpactU() && (unit.hitsApplied & 2) === 0) {
      unit.hitsApplied |= 2;
      const center = target.root.position;
      for (const enemy of this.deps.getLivingEnemies()) {
        this.tempVector4.copy(enemy.root.position).sub(center).setY(0);
        if (this.tempVector4.lengthSq() <= 0.82 ** 2) {
          this.deps.applyDamage(enemy, enemy === target ? 4 : 2, 'projectile', unit.root.position);
        }
      }
      this.deps.startHitStop(0.06);
      this.deps.startCameraShake(0.14, 0.060);
    }

    if (u >= 1) {
      unit.attackStartedAt = -Infinity;
      unit.attackTarget = null;
      unit.hitsApplied = 0;
      unit.root.position.copy(unit.home);
      unit.nextAttackAt = now + 1.05;
      setEquipmentSwing(unit, 0);
      resetBranchAccents(unit);
    }
  }

  updateEngineer(now: number, unit: AllyUnit): void {
    if (!unit.alive) return;
    if (unit.attackStartedAt !== -Infinity && !unit.attackTarget?.alive) {
      unit.attackStartedAt = -Infinity;
      unit.attackTarget = null;
      unit.hitsApplied = 0;
      resetBranchAccents(unit);
    }
    if (unit.attackStartedAt === -Infinity && now >= unit.nextAttackAt) {
      const target = findNearest(unit, this.deps.getLivingEnemies());
      if (target) {
        unit.attackStartedAt = now;
        unit.attackTarget = target;
        unit.hitsApplied = 0;
      }
    }
    if (unit.attackStartedAt === -Infinity || !unit.attackTarget) {
      unit.root.position.copy(unit.home);
      updateIdle(unit, now, 3.08 + unit.slotIndex * 0.11);
      const target = findNearest(unit, this.deps.getLivingEnemies());
      if (target) facePoint(unit, target.root.position);
      return;
    }

    const target = unit.attackTarget;
    const u = clamp01((now - unit.attackStartedAt) / ENGINEER_SIGNATURE_TIMING.duration);
    const pose = getEngineerSignatureMotion(u);
    facePoint(unit, target.root.position);
    this.tempVector.copy(target.root.position).sub(unit.home).setY(0);
    if (this.tempVector.lengthSq() > 0.0001) this.tempVector.normalize();
    unit.root.position.copy(unit.home).addScaledVector(this.tempVector, pose.bodyOffset);
    applyUnitDeformation(unit, pose.deformation.squash, pose.deformation.stretch, pose.deformation.lean, pose.deformation.wobble, pose.deformation.jump);
    setEquipmentSwing(unit, pose.equipment.angle, pose.equipment.lift, pose.equipment.sweep);

    if (unit.auxiliaryRoot) {
      unit.auxiliaryRoot.visible = pose.turret.visibility > 0.01;
      unit.auxiliaryRoot.position.copy(unit.auxiliaryBasePosition);
      unit.auxiliaryRoot.position.y += pose.turret.lift;
      unit.auxiliaryRoot.quaternion.copy(unit.auxiliaryBaseQuaternion);
      unit.auxiliaryRoot.rotateY(pose.turret.yaw);
      const deployScale = Math.max(0.001, pose.turret.visibility * (0.74 + pose.turret.deployProgress * 0.26));
      unit.auxiliaryRoot.scale.copy(unit.auxiliaryBaseScale).multiplyScalar(deployScale);
    }

    unit.root.updateMatrixWorld(true);
    unit.root.getWorldPosition(this.tempVector2);
    if (unit.auxiliaryRoot) unit.auxiliaryRoot.getWorldPosition(this.tempVector3);
    else this.tempVector3.copy(unit.root.position);
    if (unit.auxiliaryMuzzle) unit.auxiliaryMuzzle.getWorldPosition(this.tempVector4);
    else this.tempVector4.copy(this.tempVector3);
    this.tempVector5.copy(target.root.position);
    this.tempVector5.y += 0.24;
    applyEngineerSignatureVfx(
      unit.signatureVfx,
      pose,
      this.deps.camera.quaternion,
      this.tempVector2,
      this.tempVector3,
      this.tempVector4,
      this.tempVector5,
    );

    for (const shotIndex of [0, 1, 2] as const) {
      const mask = 1 << shotIndex;
      if (u >= getEngineerTurretShotReleaseU(shotIndex) && (unit.hitsApplied & mask) === 0) {
        unit.hitsApplied |= mask;
        const candidates = this.deps.getLivingEnemies();
        const shotTarget = candidates[shotIndex] ?? target;
        if (shotTarget?.alive) this.deps.applyDamage(shotTarget, 1, 'projectile', this.tempVector4);
      }
    }

    if (u >= 1) {
      unit.attackStartedAt = -Infinity;
      unit.attackTarget = null;
      unit.hitsApplied = 0;
      unit.root.position.copy(unit.home);
      unit.nextAttackAt = now + 1.08;
      setEquipmentSwing(unit, 0);
      resetBranchAccents(unit);
    }
  }

  updateGun(now: number, gun: AllyUnit): void {
    if (!gun.alive) return;
    if (gun.attackStartedAt !== -Infinity && !gun.attackTarget?.alive) {
      gun.attackStartedAt = -Infinity;
      gun.attackTarget = null;
      gun.shotApplied = false;
    }
    if (gun.attackStartedAt === -Infinity && now >= gun.nextAttackAt) {
      const target = findNearest(gun, this.deps.getLivingEnemies());
      if (target) {
        gun.attackStartedAt = now;
        gun.attackTarget = target;
        gun.shotApplied = false;
      }
    }
    if (gun.attackStartedAt === -Infinity || !gun.attackTarget) {
      gun.root.position.copy(gun.home);
      updateIdle(gun, now, 2.65 + gun.slotIndex * 0.21);
      const target = findNearest(gun, this.deps.getLivingEnemies());
      if (target) facePoint(gun, target.root.position);
      return;
    }
    const target = gun.attackTarget;
    const u = clamp01((now - gun.attackStartedAt) / SLIME_MOTION_TIMING.gunAttack);
    const pose = getGunAttackMotion(u);
    facePoint(gun, target.root.position);
    this.tempVector.copy(target.root.position).sub(gun.home).setY(0);
    if (this.tempVector.lengthSq() > 0.0001) this.tempVector.normalize();
    gun.root.position.copy(gun.home).addScaledVector(this.tempVector, pose.bodyOffset);
    applyUnitDeformation(gun, pose.deformation.squash, pose.deformation.stretch, pose.deformation.lean, pose.deformation.wobble, pose.deformation.jump);
    setEquipmentSwing(gun, pose.equipment.angle, pose.equipment.lift, pose.equipment.sweep);
    if (!gun.shotApplied && u >= SLIME_MOTION_THRESHOLDS.gunReleaseU) {
      gun.shotApplied = true;
      this.deps.effects.fireBullet(gun, target);
    }
    if (u >= 1) {
      gun.attackStartedAt = -Infinity;
      gun.attackTarget = null;
      gun.root.position.copy(gun.home);
      gun.nextAttackAt = now + 0.78;
      setEquipmentSwing(gun, 0);
    }
  }}
