import * as THREE from 'three';
import {
  SLIME_MOTION_TIMING,
  SLIME_MOTION_THRESHOLDS,
  applyMageCastSigil,
  applyMageRunePose,
  clamp01,
  getMageAttackMotion,
  getWandAttackMotion,
} from '../slime-motion';
import {
  TIER3_MAGIC_THRESHOLDS,
  TIER3_MAGIC_TIMING,
  applyArchmageSignatureVfx,
  applyFrostMageSignatureVfx,
  getArchmageAttackMotion,
  getFrostMageAttackMotion,
} from '../slime-motions/tier3/magic';
import { AllyCombatFamily } from './ally-combat-family';
import type { AllyUnit } from './types';

export class MagicCombatFamily extends AllyCombatFamily {
  update(unit: AllyUnit, now: number): boolean {
    if (unit.behaviorId === 'wand-magic') this.updateWand(now, unit);
    else if (unit.behaviorId === 'mage-aoe') this.updateMage(now, unit);
    else if (unit.behaviorId === 'archmage-burst') this.updateArchmage(now, unit);
    else if (unit.behaviorId === 'frost-mage-control') this.updateFrostMage(now, unit);
    else return false;
    return true;
  }

  private updateMage(now: number, mage: AllyUnit): void {
    if (!mage.alive) return;
    if (mage.attackStartedAt !== -Infinity && !mage.attackTarget?.alive) {
      mage.attackStartedAt = -Infinity;
      mage.attackTarget = null;
      mage.shotApplied = false;
    }
    if (mage.attackStartedAt === -Infinity && now >= mage.nextAttackAt) {
      const target = this.findNearest(mage, this.options.getLivingEnemies());
      if (target) {
        mage.attackStartedAt = now;
        mage.attackTarget = target;
        mage.shotApplied = false;
      }
    }
    if (mage.attackStartedAt === -Infinity || !mage.attackTarget) {
      mage.root.position.copy(mage.home);
      this.updateIdle(mage, now, 2.25 + mage.slotIndex * 0.23);
      const target = this.findNearest(mage, this.options.getLivingEnemies());
      if (target) this.facePoint(mage, target.root.position);
      return;
    }

    const target = mage.attackTarget;
    const u = clamp01((now - mage.attackStartedAt) / SLIME_MOTION_TIMING.mageAttack);
    const pose = getMageAttackMotion(u);
    this.facePoint(mage, target.root.position);
    this.tempVector.copy(target.root.position).sub(mage.home).setY(0);
    if (this.tempVector.lengthSq() > 0.0001) this.tempVector.normalize();
    mage.root.position.copy(mage.home).addScaledVector(this.tempVector, pose.bodyOffset);
    this.applyUnitDeformation(
      mage,
      pose.deformation.squash,
      pose.deformation.stretch,
      pose.deformation.lean,
      pose.deformation.wobble,
      pose.deformation.jump,
    );
    this.setEquipmentSwing(mage, pose.equipment.angle, pose.equipment.lift, pose.equipment.sweep);
    applyMageRunePose(
      mage.mageRuneAnchor,
      mage.mageRuneBaseQuaternion,
      mage.mageRuneBaseScale,
      pose.runeRotation,
      pose.runePulse,
    );
    if (mage.mageCastSigil) {
      mage.root.updateMatrixWorld(true);
      (mage.spellOrigin ?? mage.equipmentAnchor).getWorldPosition(this.tempVector3);
      mage.mageCastSigil.position.copy(this.tempVector3);
      mage.mageCastSigil.quaternion.copy(this.options.camera.quaternion);
      applyMageCastSigil(mage.mageCastSigil, pose.runePulse, pose.runeRotation);
    }
    if (!mage.shotApplied && u >= SLIME_MOTION_THRESHOLDS.mageReleaseU) {
      mage.shotApplied = true;
      this.options.projectileSystem.fireMagicOrb(mage, target, 0.58, true);
    }
    if (u >= 1) {
      mage.attackStartedAt = -Infinity;
      mage.attackTarget = null;
      mage.root.position.copy(mage.home);
      mage.nextAttackAt = now + 1.05;
      this.setEquipmentSwing(mage, 0);
      this.resetBranchAccents(mage);
    }
  }

  private updateArchmage(now: number, unit: AllyUnit): void {
    if (!unit.alive) return;
    if (unit.attackStartedAt !== -Infinity && !unit.attackTarget?.alive) {
      unit.attackStartedAt = -Infinity;
      unit.attackTarget = null;
      unit.hitsApplied = 0;
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
      unit.root.position.copy(unit.home);
      this.updateIdle(unit, now, 2.42 + unit.slotIndex * 0.19);
      const target = this.findNearest(unit, this.options.getLivingEnemies());
      if (target) this.facePoint(unit, target.root.position);
      return;
    }

    const target = unit.attackTarget;
    const u = clamp01((now - unit.attackStartedAt) / TIER3_MAGIC_TIMING.archmageAttack);
    const pose = getArchmageAttackMotion(u);
    this.facePoint(unit, target.root.position);
    this.tempVector.copy(target.root.position).sub(unit.home).setY(0);
    if (this.tempVector.lengthSq() > 0.0001) this.tempVector.normalize();
    unit.root.position.copy(unit.home).addScaledVector(this.tempVector, pose.bodyOffset);
    this.applyUnitDeformation(unit, pose.deformation.squash, pose.deformation.stretch, pose.deformation.lean, pose.deformation.wobble, pose.deformation.jump);
    this.setEquipmentSwing(unit, pose.equipment.angle, pose.equipment.lift, pose.equipment.sweep);
    applyMageRunePose(
      unit.mageRuneAnchor,
      unit.mageRuneBaseQuaternion,
      unit.mageRuneBaseScale,
      pose.runeCharge * Math.PI * 1.6,
      Math.max(pose.runeCharge, pose.moteBoost),
    );
    this.tempVector2.copy(target.root.position);
    this.tempVector2.y = 0.02;
    applyArchmageSignatureVfx(unit.signatureVfx, pose, this.options.camera.quaternion, unit.root.position, this.tempVector2);

    if (u >= TIER3_MAGIC_THRESHOLDS.archmageImpactU && unit.hitsApplied === 0) {
      unit.hitsApplied = 1;
      const center = target.root.position;
      for (const enemy of this.options.getLivingEnemies()) {
        this.tempVector3.copy(enemy.root.position).sub(center).setY(0);
        if (this.tempVector3.lengthSq() <= 1.05 ** 2) {
          this.options.applyDamage(enemy, enemy === target ? 4 : 2, 'projectile', unit.root.position);
        }
      }
      this.options.startHitStop(0.065);
      this.options.startCameraShake(0.16, 0.055);
    }

    if (u >= 1) {
      unit.attackStartedAt = -Infinity;
      unit.attackTarget = null;
      unit.hitsApplied = 0;
      unit.root.position.copy(unit.home);
      unit.nextAttackAt = now + 1.36;
      this.setEquipmentSwing(unit, 0);
      this.resetBranchAccents(unit);
    }
  }

  private updateFrostMage(now: number, unit: AllyUnit): void {
    if (!unit.alive) return;
    if (unit.attackStartedAt !== -Infinity && !unit.attackTarget?.alive) {
      unit.attackStartedAt = -Infinity;
      unit.attackTarget = null;
      unit.hitsApplied = 0;
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
      unit.root.position.copy(unit.home);
      this.updateIdle(unit, now, 2.64 + unit.slotIndex * 0.17);
      const target = this.findNearest(unit, this.options.getLivingEnemies());
      if (target) this.facePoint(unit, target.root.position);
      return;
    }

    const target = unit.attackTarget;
    const u = clamp01((now - unit.attackStartedAt) / TIER3_MAGIC_TIMING.frostMageAttack);
    const pose = getFrostMageAttackMotion(u);
    this.facePoint(unit, target.root.position);
    this.tempVector.copy(target.root.position).sub(unit.home).setY(0);
    if (this.tempVector.lengthSq() > 0.0001) this.tempVector.normalize();
    unit.root.position.copy(unit.home).addScaledVector(this.tempVector, pose.bodyOffset);
    this.applyUnitDeformation(unit, pose.deformation.squash, pose.deformation.stretch, pose.deformation.lean, pose.deformation.wobble, pose.deformation.jump);
    this.setEquipmentSwing(unit, pose.equipment.angle, pose.equipment.lift, pose.equipment.sweep);
    unit.root.updateMatrixWorld(true);
    (unit.spellOrigin ?? unit.equipmentAnchor).getWorldPosition(this.tempVector2);
    this.tempVector3.copy(target.root.position);
    this.tempVector3.y = 0.18;
    applyFrostMageSignatureVfx(unit.signatureVfx, pose, this.tempVector2, this.tempVector3);

    if (u >= TIER3_MAGIC_THRESHOLDS.frostImpactU && unit.hitsApplied === 0 && target.alive) {
      unit.hitsApplied = 1;
      this.options.applyDamage(target, 3, 'projectile', unit.root.position);
      for (const enemy of this.options.getLivingEnemies()) {
        if (enemy === target) continue;
        this.tempVector.copy(enemy.root.position).sub(target.root.position).setY(0);
        if (this.tempVector.lengthSq() <= 0.72 ** 2) this.options.applyDamage(enemy, 1, 'projectile', target.root.position);
      }
      this.options.startHitStop(0.045);
      this.options.startCameraShake(0.10, 0.026);
    }

    if (u >= 1) {
      unit.attackStartedAt = -Infinity;
      unit.attackTarget = null;
      unit.hitsApplied = 0;
      unit.root.position.copy(unit.home);
      unit.nextAttackAt = now + 1.12;
      this.setEquipmentSwing(unit, 0);
      this.resetBranchAccents(unit);
    }
  }

  private updateWand(now: number, wand: AllyUnit): void {
    if (!wand.alive) return;
    if (wand.attackStartedAt !== -Infinity && !wand.attackTarget?.alive) {
      wand.attackStartedAt = -Infinity;
      wand.attackTarget = null;
      wand.shotApplied = false;
    }
    if (wand.attackStartedAt === -Infinity && now >= wand.nextAttackAt) {
      const target = this.findNearest(wand, this.options.getLivingEnemies());
      if (target) {
        wand.attackStartedAt = now;
        wand.attackTarget = target;
        wand.shotApplied = false;
      }
    }
    if (wand.attackStartedAt === -Infinity || !wand.attackTarget) {
      wand.root.position.copy(wand.home);
      this.updateIdle(wand, now, 2.05 + wand.slotIndex * 0.29);
      const target = this.findNearest(wand, this.options.getLivingEnemies());
      if (target) this.facePoint(wand, target.root.position);
      return;
    }
    const target = wand.attackTarget;
    const u = clamp01((now - wand.attackStartedAt) / SLIME_MOTION_TIMING.wandAttack);
    const pose = getWandAttackMotion(u);
    this.facePoint(wand, target.root.position);
    this.tempVector.copy(target.root.position).sub(wand.home).setY(0);
    if (this.tempVector.lengthSq() > 0.0001) this.tempVector.normalize();
    wand.root.position.copy(wand.home).addScaledVector(this.tempVector, pose.bodyOffset);
    this.applyUnitDeformation(wand, pose.deformation.squash, pose.deformation.stretch, pose.deformation.lean, pose.deformation.wobble, pose.deformation.jump);
    this.setEquipmentSwing(wand, pose.equipment.angle, pose.equipment.lift, pose.equipment.sweep);
    if (!wand.shotApplied && u >= SLIME_MOTION_THRESHOLDS.wandReleaseU) {
      wand.shotApplied = true;
      this.options.projectileSystem.fireMagicOrb(wand, target);
    }
    if (u >= 1) {
      wand.attackStartedAt = -Infinity;
      wand.attackTarget = null;
      wand.root.position.copy(wand.home);
      wand.nextAttackAt = now + 0.92;
      this.setEquipmentSwing(wand, 0);
    }
  }
}
