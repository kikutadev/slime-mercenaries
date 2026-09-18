import * as THREE from 'three';
import {
  SLIME_MOTION_TIMING,
  SLIME_MOTION_THRESHOLDS,
  applyGuardPulseVfx,
  clamp01,
  getGuardianAttackMotion,
  getShieldAttackMotion,
} from '../slime-motion';
import {
  TIER3_DEFENSE_THRESHOLDS,
  TIER3_DEFENSE_TIMING,
  applyFortressSignatureVfx,
  applyPaladinSignatureVfx,
  getFortressAttackMotion,
  getPaladinAttackMotion,
} from '../slime-motions/tier3/defense';
import { MELEE_BODY_GAP } from './layout';
import { AllyCombatFamily } from './ally-combat-family';
import type { AllyUnit } from './types';

export class DefenseCombatFamily extends AllyCombatFamily {
  update(unit: AllyUnit, now: number): boolean {
    if (unit.behaviorId === 'shield-defender') this.updateShield(now, unit);
    else if (unit.behaviorId === 'guardian-guard') this.updateGuardian(now, unit);
    else if (unit.behaviorId === 'paladin-barrier') this.updatePaladin(now, unit);
    else if (unit.behaviorId === 'fortress-plant') this.updateFortress(now, unit);
    else return false;
    return true;
  }

  private updateGuardian(now: number, guardian: AllyUnit): void {
    if (!guardian.alive) return;
    if (guardian.attackStartedAt !== -Infinity && !guardian.attackTarget?.alive) {
      guardian.attackStartedAt = -Infinity;
      guardian.attackTarget = null;
      guardian.hitsApplied = 0;
    }
    if (guardian.attackStartedAt === -Infinity && now >= guardian.nextAttackAt) {
      const target = this.findNearest(guardian, this.options.getLivingEnemies());
      if (target) {
        guardian.attackStartedAt = now;
        guardian.attackTarget = target;
        guardian.hitsApplied = 0;
      }
    }
    if (guardian.attackStartedAt === -Infinity || !guardian.attackTarget) {
      guardian.root.position.copy(guardian.combatAnchor);
      this.updateIdle(guardian, now, 0.55 + guardian.slotIndex * 0.17);
      const target = this.findNearest(guardian, this.options.getLivingEnemies());
      if (target) this.facePoint(guardian, target.root.position);
      return;
    }

    const target = guardian.attackTarget;
    const u = clamp01((now - guardian.attackStartedAt) / SLIME_MOTION_TIMING.guardianAttack);
    const pose = getGuardianAttackMotion(u);
    this.tempVector.copy(target.root.position).sub(guardian.combatAnchor).setY(0);
    const distance = this.tempVector.length();
    if (this.tempVector.lengthSq() > 0.0001) this.tempVector.normalize();
    let offset = pose.bodyOffset;
    if (offset > 0) {
      offset = Math.min(offset, Math.max(0, distance - MELEE_BODY_GAP));
      offset = this.getSafeMeleeForwardOffset(guardian.combatAnchor, this.tempVector, offset);
    }
    guardian.root.position.copy(guardian.combatAnchor).addScaledVector(this.tempVector, offset);
    this.facePoint(guardian, target.root.position);
    this.applyUnitDeformation(
      guardian,
      pose.deformation.squash,
      pose.deformation.stretch,
      pose.deformation.lean,
      pose.deformation.wobble,
      pose.deformation.jump,
    );
    this.setEquipmentSwing(guardian, pose.equipment.angle, pose.equipment.lift, pose.equipment.sweep);
    if (guardian.guardPulseVfx) {
      guardian.guardPulseVfx.position.copy(guardian.root.position);
      guardian.guardPulseVfx.position.y = 0.025;
      applyGuardPulseVfx(guardian.guardPulseVfx, pose.guardPulse, pose.guardPulseProgress);
    }
    if (u >= SLIME_MOTION_THRESHOLDS.guardianContactU && guardian.hitsApplied === 0 && target.alive) {
      guardian.hitsApplied = 1;
      this.options.applyDamage(target, 2, 'melee', guardian.root.position);
      this.options.startCameraShake(0.08, 0.022);
    }
    if (u >= 1 || !target.alive) {
      guardian.attackStartedAt = -Infinity;
      guardian.attackTarget = null;
      guardian.hitsApplied = 0;
      guardian.root.position.copy(guardian.combatAnchor);
      this.setEquipmentSwing(guardian, 0);
      this.resetBranchAccents(guardian);
      guardian.nextAttackAt = now + 0.72;
    }
  }

  private updatePaladin(now: number, unit: AllyUnit): void {
    if (!unit.alive) return;
    if (unit.attackStartedAt !== -Infinity && !unit.attackTarget?.alive) {
      unit.attackStartedAt = -Infinity;
      unit.attackTarget = null;
      unit.hitsApplied = 0;
      unit.root.position.copy(unit.combatAnchor);
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
      this.updateIdle(unit, now, 0.54 + unit.slotIndex * 0.17);
      const target = this.findNearest(unit, this.options.getLivingEnemies());
      if (target) this.facePoint(unit, target.root.position);
      return;
    }

    const target = unit.attackTarget;
    const u = clamp01((now - unit.attackStartedAt) / TIER3_DEFENSE_TIMING.paladinAttack);
    const pose = getPaladinAttackMotion(u);
    this.tempVector.copy(target.root.position).sub(unit.combatAnchor).setY(0);
    const distance = this.tempVector.length();
    if (this.tempVector.lengthSq() > 0.0001) this.tempVector.normalize();
    let offset = pose.bodyOffset;
    if (offset > 0) {
      offset = Math.min(offset, Math.max(0, distance - MELEE_BODY_GAP));
      offset = this.getSafeMeleeForwardOffset(unit.combatAnchor, this.tempVector, offset);
    }
    unit.root.position.copy(unit.combatAnchor).addScaledVector(this.tempVector, offset);
    this.facePoint(unit, target.root.position);
    this.applyUnitDeformation(unit, pose.deformation.squash, pose.deformation.stretch, pose.deformation.lean, pose.deformation.wobble, pose.deformation.jump);
    this.setEquipmentSwing(unit, pose.equipment.angle, pose.equipment.lift, pose.equipment.sweep);
    unit.root.updateMatrixWorld(true);
    unit.equipmentAnchor.getWorldPosition(this.tempVector3);
    applyPaladinSignatureVfx(unit.signatureVfx, pose, this.options.camera.quaternion, unit.root.position, this.tempVector3);

    if (u >= TIER3_DEFENSE_THRESHOLDS.paladinContactU && unit.hitsApplied === 0 && target.alive) {
      unit.hitsApplied = 1;
      this.options.applyDamage(target, 2, 'melee', unit.root.position);
      this.options.startHitStop(0.05);
      this.options.startCameraShake(0.09, 0.032);
    }

    if (u >= 1 || !target.alive) {
      unit.attackStartedAt = -Infinity;
      unit.attackTarget = null;
      unit.hitsApplied = 0;
      unit.root.position.copy(unit.combatAnchor);
      unit.nextAttackAt = now + 0.78;
      this.setEquipmentSwing(unit, 0);
      this.resetBranchAccents(unit);
    }
  }

  private updateFortress(now: number, unit: AllyUnit): void {
    if (!unit.alive) return;
    if (unit.attackStartedAt !== -Infinity && !unit.attackTarget?.alive) {
      unit.attackStartedAt = -Infinity;
      unit.attackTarget = null;
      unit.hitsApplied = 0;
      unit.root.position.copy(unit.combatAnchor);
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
      this.updateIdle(unit, now, 0.78 + unit.slotIndex * 0.13);
      const target = this.findNearest(unit, this.options.getLivingEnemies());
      if (target) this.facePoint(unit, target.root.position);
      return;
    }

    const target = unit.attackTarget;
    const u = clamp01((now - unit.attackStartedAt) / TIER3_DEFENSE_TIMING.fortressAttack);
    const pose = getFortressAttackMotion(u);
    this.tempVector.copy(target.root.position).sub(unit.combatAnchor).setY(0);
    if (this.tempVector.lengthSq() > 0.0001) this.tempVector.normalize();
    unit.root.position.copy(unit.combatAnchor).addScaledVector(this.tempVector, pose.bodyOffset);
    this.facePoint(unit, target.root.position);
    this.applyUnitDeformation(unit, pose.deformation.squash, pose.deformation.stretch, pose.deformation.lean, pose.deformation.wobble, 0);
    this.setEquipmentSwing(unit, pose.equipment.angle, pose.equipment.lift, pose.equipment.sweep);
    applyFortressSignatureVfx(unit.signatureVfx, pose, this.options.camera.quaternion, unit.root.position);

    if (u >= TIER3_DEFENSE_THRESHOLDS.fortressPlantU && unit.hitsApplied === 0 && target.alive) {
      unit.hitsApplied = 1;
      this.options.applyDamage(target, 2, 'melee', unit.root.position);
      this.options.startHitStop(0.055);
      this.options.startCameraShake(0.12, 0.038);
    }

    if (u >= 1 || !target.alive) {
      unit.attackStartedAt = -Infinity;
      unit.attackTarget = null;
      unit.hitsApplied = 0;
      unit.root.position.copy(unit.combatAnchor);
      unit.nextAttackAt = now + 0.98;
      this.setEquipmentSwing(unit, 0);
      this.resetBranchAccents(unit);
    }
  }

  private updateShield(now: number, shield: AllyUnit): void {
    if (!shield.alive) return;
    if (shield.attackStartedAt !== -Infinity && !shield.attackTarget?.alive) {
      shield.attackStartedAt = -Infinity;
      shield.attackTarget = null;
      shield.hitsApplied = 0;
    }
    if (shield.attackStartedAt === -Infinity && now >= shield.nextAttackAt) {
      const target = this.findNearest(shield, this.options.getLivingEnemies());
      if (target) {
        shield.attackStartedAt = now;
        shield.attackTarget = target;
        shield.hitsApplied = 0;
      }
    }
    if (shield.attackStartedAt === -Infinity || !shield.attackTarget) {
      shield.root.position.copy(shield.combatAnchor);
      this.updateIdle(shield, now, 0.45 + shield.slotIndex * 0.19);
      const target = this.findNearest(shield, this.options.getLivingEnemies());
      if (target) this.facePoint(shield, target.root.position);
      return;
    }
    const target = shield.attackTarget;
    const u = clamp01((now - shield.attackStartedAt) / SLIME_MOTION_TIMING.shieldAttack);
    const pose = getShieldAttackMotion(u);
    this.tempVector.copy(target.root.position).sub(shield.combatAnchor).setY(0);
    const distance = this.tempVector.length();
    if (this.tempVector.lengthSq() > 0.0001) this.tempVector.normalize();
    let offset = pose.bodyOffset;
    if (offset > 0) {
      offset = Math.min(offset, Math.max(0, distance - MELEE_BODY_GAP));
      offset = this.getSafeMeleeForwardOffset(shield.combatAnchor, this.tempVector, offset);
    }
    shield.root.position.copy(shield.combatAnchor).addScaledVector(this.tempVector, offset);
    this.facePoint(shield, target.root.position);
    this.applyUnitDeformation(shield, pose.deformation.squash, pose.deformation.stretch, pose.deformation.lean, pose.deformation.wobble, pose.deformation.jump);
    this.setEquipmentSwing(shield, pose.equipment.angle, pose.equipment.lift, pose.equipment.sweep);
    if (u >= SLIME_MOTION_THRESHOLDS.shieldContactU && shield.hitsApplied === 0 && target.alive) {
      shield.hitsApplied = 1;
      this.options.applyDamage(target, 1, 'melee', shield.root.position);
    }
    if (u >= 1 || !target.alive) {
      shield.attackStartedAt = -Infinity;
      shield.attackTarget = null;
      shield.hitsApplied = 0;
      shield.root.position.copy(shield.combatAnchor);
      this.setEquipmentSwing(shield, 0);
      shield.nextAttackAt = now + 0.58;
    }
  }
}
