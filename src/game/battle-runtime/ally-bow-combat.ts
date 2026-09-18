import * as THREE from 'three';
import {
  SLIME_MOTION_TIMING,
  SLIME_MOTION_THRESHOLDS,
  clamp01,
  getBowAttackMotion,
  getRangerAttackMotion,
} from '../slime-motion';
import {
  TIER3_BOW_THRESHOLDS,
  TIER3_BOW_TIMING,
  applySniperSignatureVfx,
  applyStormSignatureVfx,
  getSniperAttackMotion,
  getStormArcherAttackMotion,
  getStormShotReleaseU,
} from '../slime-motions/tier3/bow';
import { AllyCombatFamily } from './ally-combat-family';
import type { AllyUnit } from './types';

export class BowCombatFamily extends AllyCombatFamily {
  update(unit: AllyUnit, now: number): boolean {
    if (unit.behaviorId === 'bow-ranged') this.updateBow(now, unit);
    else if (unit.behaviorId === 'ranger-double-shot') this.updateRanger(now, unit);
    else if (unit.behaviorId === 'sniper-pierce') this.updateSniper(now, unit);
    else if (unit.behaviorId === 'storm-archer-volley') this.updateStormArcher(now, unit);
    else return false;
    return true;
  }

  private updateSniper(now: number, unit: AllyUnit): void {
    if (!unit.alive) return;
    if (unit.attackStartedAt !== -Infinity && !unit.attackTarget?.alive) {
      unit.attackStartedAt = -Infinity;
      unit.attackTarget = null;
      unit.shotApplied = false;
      if (unit.signatureVfx) unit.signatureVfx.visible = false;
    }
    if (unit.attackStartedAt === -Infinity && now >= unit.nextAttackAt) {
      const target = this.findNearest(unit, this.options.getLivingEnemies());
      if (target) {
        unit.attackStartedAt = now;
        unit.attackTarget = target;
        unit.shotApplied = false;
      }
    }
    if (unit.attackStartedAt === -Infinity || !unit.attackTarget) {
      unit.root.position.copy(unit.home);
      this.updateIdle(unit, now, 1.48 + unit.slotIndex * 0.11);
      const target = this.findNearest(unit, this.options.getLivingEnemies());
      if (target) this.facePoint(unit, target.root.position);
      return;
    }
    const target = unit.attackTarget;
    const u = clamp01((now - unit.attackStartedAt) / TIER3_BOW_TIMING.sniperAttack);
    const pose = getSniperAttackMotion(u);
    this.facePoint(unit, target.root.position);
    this.applyUnitDeformation(unit, pose.deformation.squash, pose.deformation.stretch, pose.deformation.lean, pose.deformation.wobble, pose.deformation.jump);
    this.setEquipmentSwing(unit, pose.equipment.angle, pose.equipment.lift, pose.equipment.sweep);
    unit.root.updateMatrixWorld(true);
    (unit.projectileOrigin ?? unit.equipmentAnchor).getWorldPosition(this.tempVector2);
    this.tempVector3.copy(target.root.position).add(new THREE.Vector3(0, 0.28, 0));
    applySniperSignatureVfx(unit.signatureVfx, pose, this.tempVector2, this.tempVector3, this.options.camera.quaternion);
    if (!unit.shotApplied && u >= TIER3_BOW_THRESHOLDS.sniperReleaseU) {
      unit.shotApplied = true;
      this.options.projectileSystem.fireArrowProfile(unit, target, TIER3_BOW_TIMING.sniperArrowFlight, 4, 0.10, 0.86);
      this.options.startCameraShake(0.08, 0.028);
    }
    if (u >= 1) {
      unit.attackStartedAt = -Infinity;
      unit.attackTarget = null;
      unit.shotApplied = false;
      unit.nextAttackAt = now + 1.18;
      this.setEquipmentSwing(unit, 0);
      if (unit.signatureVfx) unit.signatureVfx.visible = false;
    }
  }

  private updateStormArcher(now: number, unit: AllyUnit): void {
    if (!unit.alive) return;
    if (unit.attackStartedAt !== -Infinity && !unit.attackTarget?.alive) {
      unit.attackStartedAt = -Infinity;
      unit.attackTarget = null;
      unit.hitsApplied = 0;
      if (unit.signatureVfx) unit.signatureVfx.visible = false;
    }
    if (unit.attackStartedAt === -Infinity && now >= unit.nextAttackAt) {
      const target = this.findNearest(unit, this.options.getLivingEnemies());
      if (target) {
        unit.attackStartedAt = now;
        unit.attackTarget = target;
        unit.hitsApplied = 0;
      }
    }
    if (unit.attackStartedAt === -Infinity || !unit.attackTarget) {
      unit.root.position.copy(unit.home);
      this.updateIdle(unit, now, 1.72 + unit.slotIndex * 0.13);
      const target = this.findNearest(unit, this.options.getLivingEnemies());
      if (target) this.facePoint(unit, target.root.position);
      return;
    }
    const target = unit.attackTarget;
    const u = clamp01((now - unit.attackStartedAt) / TIER3_BOW_TIMING.stormArcherAttack);
    const pose = getStormArcherAttackMotion(u);
    this.facePoint(unit, target.root.position);
    this.tempVector.copy(target.root.position).sub(unit.home).setY(0);
    if (this.tempVector.lengthSq() > 0.0001) this.tempVector.normalize();
    this.tempVector2.set(-this.tempVector.z, 0, this.tempVector.x);
    unit.root.position.copy(unit.home).addScaledVector(this.tempVector2, pose.bodyOffset);
    this.applyUnitDeformation(unit, pose.deformation.squash, pose.deformation.stretch, pose.deformation.lean, pose.deformation.wobble, pose.deformation.jump);
    this.setEquipmentSwing(unit, pose.equipment.angle, pose.equipment.lift, pose.equipment.sweep);
    unit.root.updateMatrixWorld(true);
    (unit.projectileOrigin ?? unit.equipmentAnchor).getWorldPosition(this.tempVector3);
    const candidates = this.options.getLivingEnemies().slice().sort((a, b) => a.root.position.distanceToSquared(unit.root.position) - b.root.position.distanceToSquared(unit.root.position));
    const impactTargets = [
      candidates[0] ?? target,
      candidates[1] ?? candidates[0] ?? target,
      candidates[2] ?? candidates[1] ?? candidates[0] ?? target,
    ] as const;
    this.tempVector4.copy(impactTargets[0].root.position).add(new THREE.Vector3(0, 0.28, 0));
    this.tempVector5.copy(impactTargets[1].root.position).add(new THREE.Vector3(0, 0.28, 0));
    this.tempVector6.copy(impactTargets[2].root.position).add(new THREE.Vector3(0, 0.28, 0));
    applyStormSignatureVfx(
      unit.signatureVfx,
      pose,
      this.tempVector3,
      [this.tempVector4, this.tempVector5, this.tempVector6],
      this.options.camera.quaternion,
    );
    for (const shotIndex of [0, 1, 2] as const) {
      const mask = 1 << shotIndex;
      if (u >= getStormShotReleaseU(shotIndex) && (unit.hitsApplied & mask) === 0) {
        unit.hitsApplied |= mask;
        const shotTarget = impactTargets[shotIndex];
        if (shotTarget?.alive) this.options.projectileSystem.fireArrowProfile(unit, shotTarget, TIER3_BOW_TIMING.stormArrowFlight, 2, 0.45, 0.90);
      }
    }
    if (u >= 1) {
      unit.attackStartedAt = -Infinity;
      unit.attackTarget = null;
      unit.hitsApplied = 0;
      unit.root.position.copy(unit.home);
      unit.nextAttackAt = now + 0.72;
      this.setEquipmentSwing(unit, 0);
      if (unit.signatureVfx) unit.signatureVfx.visible = false;
    }
  }

  private updateBow(now: number, bow: AllyUnit): void {
    if (!bow.alive) return;
    if (bow.attackStartedAt !== -Infinity && !bow.attackTarget?.alive) {
      bow.attackStartedAt = -Infinity;
      bow.attackTarget = null;
      bow.shotApplied = false;
    }
    if (bow.attackStartedAt === -Infinity && now >= bow.nextAttackAt) {
      const target = this.findNearest(bow, this.options.getLivingEnemies());
      if (target) {
        bow.attackStartedAt = now;
        bow.attackTarget = target;
        bow.shotApplied = false;
      }
    }
    if (bow.attackStartedAt === -Infinity || !bow.attackTarget) {
      bow.root.position.copy(bow.home);
      this.updateIdle(bow, now, 1.1 + bow.slotIndex * 0.31);
      const target = this.findNearest(bow, this.options.getLivingEnemies());
      if (target) this.facePoint(bow, target.root.position);
      return;
    }

    const u = clamp01((now - bow.attackStartedAt) / SLIME_MOTION_TIMING.bowAttack);
    this.facePoint(bow, bow.attackTarget.root.position);
    const pose = getBowAttackMotion(u);
    this.applyUnitDeformation(bow, pose.deformation.squash, pose.deformation.stretch, pose.deformation.lean, pose.deformation.wobble, pose.deformation.jump);
    this.setEquipmentSwing(bow, pose.equipment.angle, pose.equipment.lift, pose.equipment.sweep);
    if (!bow.shotApplied && u >= SLIME_MOTION_THRESHOLDS.bowReleaseU) {
      bow.shotApplied = true;
      this.options.projectileSystem.fireArrow(bow, bow.attackTarget);
    }
    if (u >= 1) {
      bow.attackStartedAt = -Infinity;
      bow.attackTarget = null;
      bow.nextAttackAt = now + 1.0;
      this.setEquipmentSwing(bow, 0);
    }
  }

  private updateRanger(now: number, ranger: AllyUnit): void {
    if (!ranger.alive) return;
    if (ranger.attackStartedAt !== -Infinity && !ranger.attackTarget?.alive) {
      ranger.attackStartedAt = -Infinity;
      ranger.attackTarget = null;
      ranger.hitsApplied = 0;
    }
    if (ranger.attackStartedAt === -Infinity && now >= ranger.nextAttackAt) {
      const target = this.findNearest(ranger, this.options.getLivingEnemies());
      if (target) {
        ranger.attackStartedAt = now;
        ranger.attackTarget = target;
        ranger.hitsApplied = 0;
      }
    }
    if (ranger.attackStartedAt === -Infinity || !ranger.attackTarget) {
      ranger.root.position.copy(ranger.home);
      this.updateIdle(ranger, now, 1.32 + ranger.slotIndex * 0.27);
      const target = this.findNearest(ranger, this.options.getLivingEnemies());
      if (target) this.facePoint(ranger, target.root.position);
      return;
    }

    const target = ranger.attackTarget;
    const u = clamp01((now - ranger.attackStartedAt) / SLIME_MOTION_TIMING.rangerAttack);
    const pose = getRangerAttackMotion(u);
    this.facePoint(ranger, target.root.position);
    this.tempVector.copy(target.root.position).sub(ranger.home).setY(0);
    if (this.tempVector.lengthSq() > 0.0001) this.tempVector.normalize();
    this.tempVector2.set(-this.tempVector.z, 0, this.tempVector.x);
    ranger.root.position.copy(ranger.home).addScaledVector(this.tempVector2, pose.lateralOffset);
    this.applyUnitDeformation(
      ranger,
      pose.deformation.squash,
      pose.deformation.stretch,
      pose.deformation.lean,
      pose.deformation.wobble,
      pose.deformation.jump,
    );
    this.setEquipmentSwing(ranger, pose.equipment.angle, pose.equipment.lift, pose.equipment.sweep);
    if (
      pose.shotProgress >= SLIME_MOTION_THRESHOLDS.bowReleaseU
      && ranger.hitsApplied === pose.shotIndex
      && target.alive
    ) {
      ranger.hitsApplied += 1;
      ranger.root.updateMatrixWorld(true);
      this.options.projectileSystem.fireArrow(ranger, target);
    }
    if (u >= 1) {
      ranger.attackStartedAt = -Infinity;
      ranger.attackTarget = null;
      ranger.hitsApplied = 0;
      ranger.root.position.copy(ranger.home);
      this.setEquipmentSwing(ranger, 0);
      ranger.nextAttackAt = now + 0.68;
    }
  }
}
