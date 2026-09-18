import * as THREE from 'three';
import {
  SLIME_MOTION_TIMING,
  SLIME_MOTION_THRESHOLDS,
  applyRogueSlashVfx,
  clamp01,
  getDaggerAttackMotion,
  getRogueAttackMotion,
} from '../slime-motion';
import {
  ASSASSIN_SIGNATURE_TIMING,
  NINJA_SIGNATURE_TIMING,
  getAssassinCrossHitU,
  getAssassinExecutionLineU,
  getAssassinSignatureMotion,
  getNinjaDelayedSlashU,
  getNinjaSignatureMotion,
} from '../slime-motions/tier3/rogue';
import {
  applyAssassinSignatureVfx,
  applyNinjaSignatureVfx,
} from '../slime-motions/tier3/effects';
import { MELEE_BODY_GAP } from './layout';
import { AllyCombatFamily } from './ally-combat-family';
import type { AllyUnit } from './types';

export class RogueCombatFamily extends AllyCombatFamily {
  update(unit: AllyUnit, now: number): boolean {
    if (unit.behaviorId === 'dagger-skirmisher') this.updateDagger(now, unit);
    else if (unit.behaviorId === 'rogue-twin-strike') this.updateRogue(now, unit);
    else if (unit.behaviorId === 'ninja-vanish') this.updateNinja(now, unit);
    else if (unit.behaviorId === 'assassin-execute') this.updateAssassin(now, unit);
    else return false;
    return true;
  }

  private updateRogue(now: number, rogue: AllyUnit): void {
    if (!rogue.alive) return;
    if (rogue.attackStartedAt !== -Infinity && !rogue.attackTarget?.alive) {
      rogue.attackStartedAt = -Infinity;
      rogue.attackTarget = null;
      rogue.hitsApplied = 0;
    }
    if (rogue.attackStartedAt === -Infinity && now >= rogue.nextAttackAt) {
      const target = this.findNearest(rogue, this.options.getLivingEnemies());
      if (target) {
        rogue.attackStartedAt = now;
        rogue.attackTarget = target;
        rogue.hitsApplied = 0;
      }
    }
    if (rogue.attackStartedAt === -Infinity || !rogue.attackTarget) {
      rogue.root.position.copy(rogue.combatAnchor);
      this.updateIdle(rogue, now, 1.85 + rogue.slotIndex * 0.21);
      const target = this.findNearest(rogue, this.options.getLivingEnemies());
      if (target) this.facePoint(rogue, target.root.position);
      return;
    }

    const target = rogue.attackTarget;
    const u = clamp01((now - rogue.attackStartedAt) / SLIME_MOTION_TIMING.rogueAttack);
    const pose = getRogueAttackMotion(u);
    this.tempVector.copy(target.root.position).sub(rogue.combatAnchor).setY(0);
    const distance = this.tempVector.length();
    if (this.tempVector.lengthSq() > 0.0001) this.tempVector.normalize();
    this.tempVector2.set(-this.tempVector.z, 0, this.tempVector.x);
    let forward = pose.bodyOffset;
    if (forward > 0) {
      forward = Math.min(forward, Math.max(0, distance - MELEE_BODY_GAP));
      forward = this.getSafeMeleeForwardOffset(rogue.combatAnchor, this.tempVector, forward);
    }
    rogue.root.position.copy(rogue.combatAnchor)
      .addScaledVector(this.tempVector, forward)
      .addScaledVector(this.tempVector2, pose.lateralOffset);
    this.facePoint(rogue, target.root.position);
    this.applyUnitDeformation(
      rogue,
      pose.deformation.squash,
      pose.deformation.stretch,
      pose.deformation.lean,
      pose.deformation.wobble,
      pose.deformation.jump,
    );
    this.setEquipmentSwing(rogue, pose.equipment.angle, pose.equipment.lift, pose.equipment.sweep);
    this.setSecondaryEquipmentSwing(
      rogue,
      pose.secondaryEquipment.angle,
      pose.secondaryEquipment.lift,
      pose.secondaryEquipment.sweep,
    );
    rogue.root.updateMatrixWorld(true);
    const slashAnchor = pose.comboHit === 1 ? rogue.secondaryEquipmentAnchor : rogue.equipmentAnchor;
    (slashAnchor ?? rogue.root).getWorldPosition(this.tempVector3);
    this.tempVector3.y += 0.02;
    applyRogueSlashVfx(rogue.rogueSlashArc, pose, this.options.camera.quaternion, this.tempVector3);
    const hitMask = 1 << pose.comboHit;
    if (
      pose.hitProgress >= SLIME_MOTION_THRESHOLDS.rogueHitProgress
      && (rogue.hitsApplied & hitMask) === 0
      && target.alive
    ) {
      rogue.hitsApplied |= hitMask;
      this.options.applyDamage(target, pose.comboHit === 0 ? 1 : 2, 'melee', rogue.root.position);
    }
    if (u >= 1 || !target.alive) {
      rogue.attackStartedAt = -Infinity;
      rogue.attackTarget = null;
      rogue.hitsApplied = 0;
      rogue.root.position.copy(rogue.combatAnchor);
      this.setEquipmentSwing(rogue, 0);
      this.setSecondaryEquipmentSwing(rogue, 0);
      rogue.nextAttackAt = now + 0.30;
    }
  }

  private updateNinja(now: number, unit: AllyUnit): void {
    if (!unit.alive) return;
    if (unit.attackStartedAt !== -Infinity && !unit.attackTarget?.alive) {
      unit.attackStartedAt = -Infinity;
      unit.attackTarget = null;
      unit.hitsApplied = 0;
      unit.root.visible = true;
      this.resetBranchAccents(unit);
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
      unit.root.position.copy(unit.combatAnchor);
      unit.root.visible = true;
      this.updateIdle(unit, now, 1.86 + unit.slotIndex * 0.17);
      const target = this.findNearest(unit, this.options.getLivingEnemies());
      if (target) this.facePoint(unit, target.root.position);
      return;
    }

    const target = unit.attackTarget;
    const u = clamp01((now - unit.attackStartedAt) / NINJA_SIGNATURE_TIMING.duration);
    const pose = getNinjaSignatureMotion(u);
    this.tempVector.copy(target.root.position).sub(unit.combatAnchor).setY(0);
    if (this.tempVector.lengthSq() > 0.0001) this.tempVector.normalize();
    this.tempVector2.set(-this.tempVector.z, 0, this.tempVector.x);
    unit.root.position.copy(unit.combatAnchor)
      .addScaledVector(this.tempVector, pose.bodyOffset)
      .addScaledVector(this.tempVector2, pose.lateralOffset);
    this.facePoint(unit, target.root.position);
    unit.root.visible = pose.bodyAlpha > 0.08;
    this.applyUnitDeformation(unit, pose.deformation.squash, pose.deformation.stretch, pose.deformation.lean, pose.deformation.wobble, pose.deformation.jump);
    this.setEquipmentSwing(unit, pose.equipment.angle, pose.equipment.lift, pose.equipment.sweep);
    this.setSecondaryEquipmentSwing(unit, pose.secondaryEquipment.angle, pose.secondaryEquipment.lift, pose.secondaryEquipment.sweep);
    this.tempVector2.copy(unit.combatAnchor);
    this.tempVector2.y += 0.22;
    this.tempVector3.copy(target.root.position);
    this.tempVector3.y += 0.24;
    applyNinjaSignatureVfx(unit.signatureVfx, pose, this.options.camera.quaternion, this.tempVector2, this.tempVector3);

    if (u >= getNinjaDelayedSlashU(0) && unit.hitsApplied === 0 && target.alive) {
      unit.hitsApplied = 1;
      this.options.applyDamage(target, 3, 'melee', unit.root.position);
      const echo = this.options.getLivingEnemies().find((enemy) => enemy !== target);
      if (echo) this.options.applyDamage(echo, 1, 'melee', target.root.position);
      this.options.startHitStop(0.035);
      this.options.startCameraShake(0.09, 0.034);
    }

    if (u >= 1 || !target.alive) {
      unit.attackStartedAt = -Infinity;
      unit.attackTarget = null;
      unit.hitsApplied = 0;
      unit.root.visible = true;
      unit.root.position.copy(unit.combatAnchor);
      unit.nextAttackAt = now + 0.34;
      this.setEquipmentSwing(unit, 0);
      this.setSecondaryEquipmentSwing(unit, 0);
      this.resetBranchAccents(unit);
    }
  }

  private updateAssassin(now: number, unit: AllyUnit): void {
    if (!unit.alive) return;
    if (unit.attackStartedAt !== -Infinity && !unit.attackTarget?.alive) {
      unit.attackStartedAt = -Infinity;
      unit.attackTarget = null;
      unit.hitsApplied = 0;
      unit.root.visible = true;
      this.resetBranchAccents(unit);
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
      unit.root.position.copy(unit.combatAnchor);
      unit.root.visible = true;
      this.updateIdle(unit, now, 2.04 + unit.slotIndex * 0.15);
      const target = this.findNearest(unit, this.options.getLivingEnemies());
      if (target) this.facePoint(unit, target.root.position);
      return;
    }

    const target = unit.attackTarget;
    const u = clamp01((now - unit.attackStartedAt) / ASSASSIN_SIGNATURE_TIMING.duration);
    const pose = getAssassinSignatureMotion(u);
    this.tempVector.copy(target.root.position).sub(unit.combatAnchor).setY(0);
    if (this.tempVector.lengthSq() > 0.0001) this.tempVector.normalize();
    this.tempVector2.copy(target.root.position).addScaledVector(this.tempVector, 0.34);
    unit.root.position.lerpVectors(unit.combatAnchor, this.tempVector2, pose.behindTargetProgress);
    unit.root.position.addScaledVector(new THREE.Vector3(-this.tempVector.z, 0, this.tempVector.x), pose.lateralOffset);
    this.facePoint(unit, target.root.position);
    unit.root.visible = pose.bodyAlpha > 0.08;
    this.applyUnitDeformation(unit, pose.deformation.squash, pose.deformation.stretch, pose.deformation.lean, pose.deformation.wobble, pose.deformation.jump);
    this.setEquipmentSwing(unit, pose.equipment.angle, pose.equipment.lift, pose.equipment.sweep);
    this.setSecondaryEquipmentSwing(unit, pose.secondaryEquipment.angle, pose.secondaryEquipment.lift, pose.secondaryEquipment.sweep);
    this.tempVector3.copy(target.root.position);
    this.tempVector3.y += 0.25;
    applyAssassinSignatureVfx(unit.signatureVfx, pose, this.options.camera.quaternion, this.tempVector3);

    if (u >= getAssassinCrossHitU() && (unit.hitsApplied & 1) === 0) {
      unit.hitsApplied |= 1;
      this.options.startHitStop(0.065);
    }
    if (u >= getAssassinExecutionLineU() && (unit.hitsApplied & 2) === 0 && target.alive) {
      unit.hitsApplied |= 2;
      this.options.applyDamage(target, 4, 'melee', unit.root.position);
      this.options.startCameraShake(0.11, 0.046);
    }

    if (u >= 1 || !target.alive) {
      unit.attackStartedAt = -Infinity;
      unit.attackTarget = null;
      unit.hitsApplied = 0;
      unit.root.visible = true;
      unit.root.position.copy(unit.combatAnchor);
      unit.nextAttackAt = now + 0.48;
      this.setEquipmentSwing(unit, 0);
      this.setSecondaryEquipmentSwing(unit, 0);
      this.resetBranchAccents(unit);
    }
  }

  private updateDagger(now: number, dagger: AllyUnit): void {
    if (!dagger.alive) return;
    if (dagger.attackStartedAt !== -Infinity && !dagger.attackTarget?.alive) {
      dagger.attackStartedAt = -Infinity;
      dagger.attackTarget = null;
      dagger.hitsApplied = 0;
    }
    if (dagger.attackStartedAt === -Infinity && now >= dagger.nextAttackAt) {
      const target = this.findNearest(dagger, this.options.getLivingEnemies());
      if (target) {
        dagger.attackStartedAt = now;
        dagger.attackTarget = target;
        dagger.hitsApplied = 0;
      }
    }
    if (dagger.attackStartedAt === -Infinity || !dagger.attackTarget) {
      dagger.root.position.copy(dagger.combatAnchor);
      this.updateIdle(dagger, now, 1.65 + dagger.slotIndex * 0.27);
      const target = this.findNearest(dagger, this.options.getLivingEnemies());
      if (target) this.facePoint(dagger, target.root.position);
      return;
    }
    const target = dagger.attackTarget;
    const u = clamp01((now - dagger.attackStartedAt) / SLIME_MOTION_TIMING.daggerAttack);
    const pose = getDaggerAttackMotion(u);
    this.tempVector.copy(target.root.position).sub(dagger.combatAnchor).setY(0);
    const distance = this.tempVector.length();
    if (this.tempVector.lengthSq() > 0.0001) this.tempVector.normalize();
    let offset = pose.bodyOffset;
    if (offset > 0) {
      offset = Math.min(offset, Math.max(0, distance - MELEE_BODY_GAP));
      offset = this.getSafeMeleeForwardOffset(dagger.combatAnchor, this.tempVector, offset);
    }
    dagger.root.position.copy(dagger.combatAnchor).addScaledVector(this.tempVector, offset);
    this.facePoint(dagger, target.root.position);
    this.applyUnitDeformation(dagger, pose.deformation.squash, pose.deformation.stretch, pose.deformation.lean, pose.deformation.wobble, pose.deformation.jump);
    this.setEquipmentSwing(dagger, pose.equipment.angle, pose.equipment.lift, pose.equipment.sweep);
    if (u >= SLIME_MOTION_THRESHOLDS.daggerContactU && dagger.hitsApplied === 0 && target.alive) {
      dagger.hitsApplied = 1;
      this.options.applyDamage(target, 1, 'melee', dagger.root.position);
    }
    if (u >= 1 || !target.alive) {
      dagger.attackStartedAt = -Infinity;
      dagger.attackTarget = null;
      dagger.hitsApplied = 0;
      dagger.root.position.copy(dagger.combatAnchor);
      this.setEquipmentSwing(dagger, 0);
      dagger.nextAttackAt = now + 0.36;
    }
  }
}
