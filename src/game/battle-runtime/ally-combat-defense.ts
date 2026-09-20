import * as THREE from 'three';
import {
  SLIME_MOTION_THRESHOLDS,
  SLIME_MOTION_TIMING,
  clamp01,
  getGuardianAttackMotion,
  getShieldAttackMotion,
} from '../slime-motion';
import { applyGuardPulseVfx } from '../slime-vfx';
import {
  TIER3_DEFENSE_THRESHOLDS,
  TIER3_DEFENSE_TIMING,
  applyFortressSignatureVfx,
  applyPaladinSignatureVfx,
  getFortressAttackMotion,
  getPaladinAttackMotion,
} from '../slime-motions/tier3/defense';
import { MELEE_BODY_GAP } from './layout';
import {
  applyUnitDeformation,
  facePoint,
  findNearest,
  resetBranchAccents,
  safeMeleeForwardOffset,
  setEquipmentSwing,
  updateIdle,
} from './unit-presentation';
import type { AllyUnit } from './types';
import type { BattleAllyCombatDependencies } from './ally-combat-deps';

export class DefenseCombatFamily {
  private readonly tempVector = new THREE.Vector3();
  private readonly tempVector3 = new THREE.Vector3();

  constructor(private readonly deps: BattleAllyCombatDependencies) {}

  updateGuardian(now: number, guardian: AllyUnit): void {
    if (!guardian.alive) return;
    if (guardian.attackStartedAt !== -Infinity && !guardian.attackTarget?.alive) {
      guardian.attackStartedAt = -Infinity;
      guardian.attackTarget = null;
      guardian.hitsApplied = 0;
    }
    if (guardian.attackStartedAt === -Infinity && now >= guardian.nextAttackAt) {
      const target = findNearest(guardian, this.deps.getLivingEnemies());
      if (target) {
        guardian.attackStartedAt = now;
        guardian.attackTarget = target;
        guardian.hitsApplied = 0;
      }
    }
    if (guardian.attackStartedAt === -Infinity || !guardian.attackTarget) {
      guardian.root.position.copy(guardian.combatAnchor);
      updateIdle(guardian, now, 0.55 + guardian.slotIndex * 0.17);
      const target = findNearest(guardian, this.deps.getLivingEnemies());
      if (target) facePoint(guardian, target.root.position);
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
      offset = safeMeleeForwardOffset(guardian.combatAnchor, this.tempVector, offset, this.deps.getLivingEnemies());
    }
    guardian.root.position.copy(guardian.combatAnchor).addScaledVector(this.tempVector, offset);
    facePoint(guardian, target.root.position);
    applyUnitDeformation(
      guardian,
      pose.deformation.squash,
      pose.deformation.stretch,
      pose.deformation.lean,
      pose.deformation.wobble,
      pose.deformation.jump,
    );
    setEquipmentSwing(guardian, pose.equipment.angle, pose.equipment.lift, pose.equipment.sweep);
    if (guardian.guardPulseVfx) {
      guardian.guardPulseVfx.position.copy(guardian.root.position);
      guardian.guardPulseVfx.position.y = 0.025;
      applyGuardPulseVfx(guardian.guardPulseVfx, pose.guardPulse, pose.guardPulseProgress);
    }
    if (u >= SLIME_MOTION_THRESHOLDS.guardianContactU && guardian.hitsApplied === 0 && target.alive) {
      guardian.hitsApplied = 1;
      this.deps.applyDamage(target, 2, 'melee', guardian.root.position);
      this.deps.startCameraShake(0.08, 0.022);
    }
    if (u >= 1 || !target.alive) {
      guardian.attackStartedAt = -Infinity;
      guardian.attackTarget = null;
      guardian.hitsApplied = 0;
      guardian.root.position.copy(guardian.combatAnchor);
      setEquipmentSwing(guardian, 0);
      resetBranchAccents(guardian);
      guardian.nextAttackAt = now + 0.72;
    }
  }

  updatePaladin(now: number, unit: AllyUnit): void {
    if (!unit.alive) return;
    if (unit.attackStartedAt !== -Infinity && !unit.attackTarget?.alive) {
      unit.attackStartedAt = -Infinity;
      unit.attackTarget = null;
      unit.hitsApplied = 0;
      unit.root.position.copy(unit.combatAnchor);
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
      unit.root.position.copy(unit.combatAnchor);
      updateIdle(unit, now, 0.54 + unit.slotIndex * 0.17);
      const target = findNearest(unit, this.deps.getLivingEnemies());
      if (target) facePoint(unit, target.root.position);
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
      offset = safeMeleeForwardOffset(unit.combatAnchor, this.tempVector, offset, this.deps.getLivingEnemies());
    }
    unit.root.position.copy(unit.combatAnchor).addScaledVector(this.tempVector, offset);
    facePoint(unit, target.root.position);
    applyUnitDeformation(unit, pose.deformation.squash, pose.deformation.stretch, pose.deformation.lean, pose.deformation.wobble, pose.deformation.jump);
    setEquipmentSwing(unit, pose.equipment.angle, pose.equipment.lift, pose.equipment.sweep);
    unit.root.updateMatrixWorld(true);
    unit.equipmentAnchor.getWorldPosition(this.tempVector3);
    applyPaladinSignatureVfx(unit.signatureVfx, pose, this.deps.camera.quaternion, unit.root.position, this.tempVector3);

    if (u >= TIER3_DEFENSE_THRESHOLDS.paladinContactU && unit.hitsApplied === 0 && target.alive) {
      unit.hitsApplied = 1;
      this.deps.applyDamage(target, 2, 'melee', unit.root.position);
      this.deps.startHitStop(0.05);
      this.deps.startCameraShake(0.09, 0.032);
    }

    if (u >= 1 || !target.alive) {
      unit.attackStartedAt = -Infinity;
      unit.attackTarget = null;
      unit.hitsApplied = 0;
      unit.root.position.copy(unit.combatAnchor);
      unit.nextAttackAt = now + 0.78;
      setEquipmentSwing(unit, 0);
      resetBranchAccents(unit);
    }
  }

  updateFortress(now: number, unit: AllyUnit): void {
    if (!unit.alive) return;
    if (unit.attackStartedAt !== -Infinity && !unit.attackTarget?.alive) {
      unit.attackStartedAt = -Infinity;
      unit.attackTarget = null;
      unit.hitsApplied = 0;
      unit.root.position.copy(unit.combatAnchor);
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
      unit.root.position.copy(unit.combatAnchor);
      updateIdle(unit, now, 0.78 + unit.slotIndex * 0.13);
      const target = findNearest(unit, this.deps.getLivingEnemies());
      if (target) facePoint(unit, target.root.position);
      return;
    }

    const target = unit.attackTarget;
    const u = clamp01((now - unit.attackStartedAt) / TIER3_DEFENSE_TIMING.fortressAttack);
    const pose = getFortressAttackMotion(u);
    this.tempVector.copy(target.root.position).sub(unit.combatAnchor).setY(0);
    if (this.tempVector.lengthSq() > 0.0001) this.tempVector.normalize();
    unit.root.position.copy(unit.combatAnchor).addScaledVector(this.tempVector, pose.bodyOffset);
    facePoint(unit, target.root.position);
    applyUnitDeformation(unit, pose.deformation.squash, pose.deformation.stretch, pose.deformation.lean, pose.deformation.wobble, 0);
    setEquipmentSwing(unit, pose.equipment.angle, pose.equipment.lift, pose.equipment.sweep);
    applyFortressSignatureVfx(unit.signatureVfx, pose, this.deps.camera.quaternion, unit.root.position);

    if (u >= TIER3_DEFENSE_THRESHOLDS.fortressPlantU && unit.hitsApplied === 0 && target.alive) {
      unit.hitsApplied = 1;
      this.deps.applyDamage(target, 2, 'melee', unit.root.position);
      this.deps.startHitStop(0.055);
      this.deps.startCameraShake(0.12, 0.038);
    }

    if (u >= 1 || !target.alive) {
      unit.attackStartedAt = -Infinity;
      unit.attackTarget = null;
      unit.hitsApplied = 0;
      unit.root.position.copy(unit.combatAnchor);
      unit.nextAttackAt = now + 0.98;
      setEquipmentSwing(unit, 0);
      resetBranchAccents(unit);
    }
  }

  updateShield(now: number, shield: AllyUnit): void {
    if (!shield.alive) return;
    if (shield.attackStartedAt !== -Infinity && !shield.attackTarget?.alive) {
      shield.attackStartedAt = -Infinity;
      shield.attackTarget = null;
      shield.hitsApplied = 0;
    }
    if (shield.attackStartedAt === -Infinity && now >= shield.nextAttackAt) {
      const target = findNearest(shield, this.deps.getLivingEnemies());
      if (target) {
        shield.attackStartedAt = now;
        shield.attackTarget = target;
        shield.hitsApplied = 0;
      }
    }
    if (shield.attackStartedAt === -Infinity || !shield.attackTarget) {
      shield.root.position.copy(shield.combatAnchor);
      updateIdle(shield, now, 0.45 + shield.slotIndex * 0.19);
      const target = findNearest(shield, this.deps.getLivingEnemies());
      if (target) facePoint(shield, target.root.position);
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
      offset = safeMeleeForwardOffset(shield.combatAnchor, this.tempVector, offset, this.deps.getLivingEnemies());
    }
    shield.root.position.copy(shield.combatAnchor).addScaledVector(this.tempVector, offset);
    facePoint(shield, target.root.position);
    applyUnitDeformation(shield, pose.deformation.squash, pose.deformation.stretch, pose.deformation.lean, pose.deformation.wobble, pose.deformation.jump);
    setEquipmentSwing(shield, pose.equipment.angle, pose.equipment.lift, pose.equipment.sweep);
    if (u >= SLIME_MOTION_THRESHOLDS.shieldContactU && shield.hitsApplied === 0 && target.alive) {
      shield.hitsApplied = 1;
      this.deps.applyDamage(target, 1, 'melee', shield.root.position);
    }
    if (u >= 1 || !target.alive) {
      shield.attackStartedAt = -Infinity;
      shield.attackTarget = null;
      shield.hitsApplied = 0;
      shield.root.position.copy(shield.combatAnchor);
      setEquipmentSwing(shield, 0);
      shield.nextAttackAt = now + 0.58;
    }
  }}
