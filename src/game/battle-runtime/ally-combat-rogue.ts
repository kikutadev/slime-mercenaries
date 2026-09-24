import * as THREE from 'three';
import {
  SLIME_MOTION_THRESHOLDS,
  SLIME_MOTION_TIMING,
  clamp01,
  getDaggerAttackMotion,
  getRogueAttackMotion,
} from '../slime-motion';
import { applyRogueSlashVfx } from '../slime-vfx';
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
import {
  applyUnitDeformation,
  facePoint,
  findNearest,
  meleePresentationTarget,
  resetBranchAccents,
  safeMeleeForwardOffset,
  setEquipmentSwing,
  setSecondaryEquipmentSwing,
  updateIdle,
} from './unit-presentation';
import type { AllyUnit } from './types';
import type { BattleAllyCombatDependencies } from './ally-combat-deps';

export class RogueCombatFamily {
  private readonly tempVector = new THREE.Vector3();
  private readonly tempVector2 = new THREE.Vector3();
  private readonly tempVector3 = new THREE.Vector3();

  constructor(private readonly deps: BattleAllyCombatDependencies) {}

  updateRogue(now: number, rogue: AllyUnit): void {
    if (!rogue.alive) return;
    if (rogue.attackStartedAt !== -Infinity && !rogue.attackTarget?.alive) {
      rogue.attackStartedAt = -Infinity;
      rogue.attackTarget = null;
      rogue.hitsApplied = 0;
    }
    if (rogue.attackStartedAt === -Infinity && now >= rogue.nextAttackAt) {
      const target = findNearest(rogue, this.deps.getLivingEnemies());
      if (target) {
        rogue.attackStartedAt = now;
        rogue.attackTarget = target;
        rogue.hitsApplied = 0;
      }
    }
    if (rogue.attackStartedAt === -Infinity || !rogue.attackTarget) {
      rogue.root.position.copy(rogue.combatAnchor);
      updateIdle(rogue, now, 1.85 + rogue.slotIndex * 0.21);
      const target = findNearest(rogue, this.deps.getLivingEnemies());
      if (target) facePoint(rogue, target.root.position);
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
      forward = safeMeleeForwardOffset(rogue.combatAnchor, this.tempVector, forward, this.deps.getLivingEnemies());
    }
    rogue.root.position.copy(rogue.combatAnchor)
      .addScaledVector(this.tempVector, forward)
      .addScaledVector(this.tempVector2, pose.lateralOffset);
    facePoint(rogue, target.root.position);
    applyUnitDeformation(
      rogue,
      pose.deformation.squash,
      pose.deformation.stretch,
      pose.deformation.lean,
      pose.deformation.wobble,
      pose.deformation.jump,
    );
    setEquipmentSwing(rogue, pose.equipment.angle, pose.equipment.lift, pose.equipment.sweep);
    setSecondaryEquipmentSwing(
      rogue,
      pose.secondaryEquipment.angle,
      pose.secondaryEquipment.lift,
      pose.secondaryEquipment.sweep,
    );
    rogue.root.updateMatrixWorld(true);
    const slashAnchor = pose.comboHit === 1 ? rogue.secondaryEquipmentAnchor : rogue.equipmentAnchor;
    (slashAnchor ?? rogue.root).getWorldPosition(this.tempVector3);
    this.tempVector3.y += 0.02;
    applyRogueSlashVfx(rogue.rogueSlashArc, pose, this.deps.camera.quaternion, this.tempVector3);
    const hitMask = 1 << pose.comboHit;
    if (
      pose.hitProgress >= SLIME_MOTION_THRESHOLDS.rogueHitProgress
      && (rogue.hitsApplied & hitMask) === 0
      && target.alive
    ) {
      rogue.hitsApplied |= hitMask;
      this.deps.applyDamage(target, pose.comboHit === 0 ? 1 : 2, 'melee', rogue.root.position);
    }
    if (u >= 1 || !target.alive) {
      rogue.attackStartedAt = -Infinity;
      rogue.attackTarget = null;
      rogue.hitsApplied = 0;
      rogue.root.position.copy(rogue.combatAnchor);
      setEquipmentSwing(rogue, 0);
      setSecondaryEquipmentSwing(rogue, 0);
      rogue.nextAttackAt = now + 0.30;
    }
  }

  updateNinja(now: number, unit: AllyUnit): void {
    if (!unit.alive) return;
    if (unit.attackStartedAt !== -Infinity && !unit.attackTarget?.alive) {
      unit.attackStartedAt = -Infinity;
      unit.attackTarget = null;
      unit.hitsApplied = 0;
      unit.root.visible = true;
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
      unit.root.visible = true;
      updateIdle(unit, now, 1.86 + unit.slotIndex * 0.17);
      const target = findNearest(unit, this.deps.getLivingEnemies());
      if (target) facePoint(unit, target.root.position);
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
    facePoint(unit, target.root.position);
    unit.root.visible = pose.bodyAlpha > 0.08;
    applyUnitDeformation(unit, pose.deformation.squash, pose.deformation.stretch, pose.deformation.lean, pose.deformation.wobble, pose.deformation.jump);
    setEquipmentSwing(unit, pose.equipment.angle, pose.equipment.lift, pose.equipment.sweep);
    setSecondaryEquipmentSwing(unit, pose.secondaryEquipment.angle, pose.secondaryEquipment.lift, pose.secondaryEquipment.sweep);
    this.tempVector2.copy(unit.combatAnchor);
    this.tempVector2.y += 0.22;
    this.tempVector3.copy(target.root.position);
    this.tempVector3.y += 0.24;
    applyNinjaSignatureVfx(unit.signatureVfx, pose, this.deps.camera.quaternion, this.tempVector2, this.tempVector3);

    if (u >= getNinjaDelayedSlashU(0) && unit.hitsApplied === 0 && target.alive) {
      unit.hitsApplied = 1;
      this.deps.applyDamage(target, 3, 'melee', unit.root.position);
      const echo = this.deps.getLivingEnemies().find((enemy) => enemy !== target);
      if (echo) this.deps.applyDamage(echo, 1, 'melee', target.root.position);
      this.deps.startHitStop(0.035);
      this.deps.startCameraShake(0.09, 0.034);
    }

    if (u >= 1 || !target.alive) {
      unit.attackStartedAt = -Infinity;
      unit.attackTarget = null;
      unit.hitsApplied = 0;
      unit.root.visible = true;
      unit.root.position.copy(unit.combatAnchor);
      unit.nextAttackAt = now + 0.34;
      setEquipmentSwing(unit, 0);
      setSecondaryEquipmentSwing(unit, 0);
      resetBranchAccents(unit);
    }
  }

  updateAssassin(now: number, unit: AllyUnit): void {
    if (!unit.alive) return;
    if (unit.attackStartedAt !== -Infinity && !unit.attackTarget?.alive) {
      unit.attackStartedAt = -Infinity;
      unit.attackTarget = null;
      unit.hitsApplied = 0;
      unit.root.visible = true;
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
      unit.root.visible = true;
      updateIdle(unit, now, 2.04 + unit.slotIndex * 0.15);
      const target = findNearest(unit, this.deps.getLivingEnemies());
      if (target) facePoint(unit, target.root.position);
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
    facePoint(unit, target.root.position);
    unit.root.visible = pose.bodyAlpha > 0.08;
    applyUnitDeformation(unit, pose.deformation.squash, pose.deformation.stretch, pose.deformation.lean, pose.deformation.wobble, pose.deformation.jump);
    setEquipmentSwing(unit, pose.equipment.angle, pose.equipment.lift, pose.equipment.sweep);
    setSecondaryEquipmentSwing(unit, pose.secondaryEquipment.angle, pose.secondaryEquipment.lift, pose.secondaryEquipment.sweep);
    this.tempVector3.copy(target.root.position);
    this.tempVector3.y += 0.25;
    applyAssassinSignatureVfx(unit.signatureVfx, pose, this.deps.camera.quaternion, this.tempVector3);

    if (u >= getAssassinCrossHitU() && (unit.hitsApplied & 1) === 0) {
      unit.hitsApplied |= 1;
      this.deps.startHitStop(0.065);
    }
    if (u >= getAssassinExecutionLineU() && (unit.hitsApplied & 2) === 0 && target.alive) {
      unit.hitsApplied |= 2;
      this.deps.applyDamage(target, 4, 'melee', unit.root.position);
      this.deps.startCameraShake(0.11, 0.046);
    }

    if (u >= 1 || !target.alive) {
      unit.attackStartedAt = -Infinity;
      unit.attackTarget = null;
      unit.hitsApplied = 0;
      unit.root.visible = true;
      unit.root.position.copy(unit.combatAnchor);
      unit.nextAttackAt = now + 0.48;
      setEquipmentSwing(unit, 0);
      setSecondaryEquipmentSwing(unit, 0);
      resetBranchAccents(unit);
    }
  }

  updateDagger(now: number, dagger: AllyUnit): void {
    if (!dagger.alive) return;
    if (dagger.attackStartedAt !== -Infinity && !dagger.attackTarget?.alive) {
      dagger.attackStartedAt = -Infinity;
      dagger.attackTarget = null;
      dagger.hitsApplied = 0;
    }
    if (dagger.attackStartedAt === -Infinity && now >= dagger.nextAttackAt) {
      const target = findNearest(dagger, this.deps.getLivingEnemies());
      if (target) {
        dagger.attackStartedAt = now;
        dagger.attackTarget = target;
        dagger.hitsApplied = 0;
      }
    }
    if (dagger.attackStartedAt === -Infinity || !dagger.attackTarget) {
      dagger.root.position.copy(dagger.combatAnchor);
      updateIdle(dagger, now, 1.65 + dagger.slotIndex * 0.27);
      const target = findNearest(dagger, this.deps.getLivingEnemies());
      if (target) facePoint(dagger, target.root.position);
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
      offset = safeMeleeForwardOffset(dagger.combatAnchor, this.tempVector, offset, this.deps.getLivingEnemies());
    }
    dagger.root.position.copy(dagger.combatAnchor).addScaledVector(this.tempVector, offset);
    facePoint(dagger, target.root.position);
    applyUnitDeformation(dagger, pose.deformation.squash, pose.deformation.stretch, pose.deformation.lean, pose.deformation.wobble, pose.deformation.jump);
    setEquipmentSwing(dagger, pose.equipment.angle, pose.equipment.lift, pose.equipment.sweep);
    if (u >= SLIME_MOTION_THRESHOLDS.daggerContactU && dagger.hitsApplied === 0 && target.alive) {
      dagger.hitsApplied = 1;
      this.deps.applyDamage(target, 1, 'melee', dagger.root.position);
    }
    if (u >= 1 || !target.alive) {
      dagger.attackStartedAt = -Infinity;
      dagger.attackTarget = null;
      dagger.hitsApplied = 0;
      dagger.root.position.copy(dagger.combatAnchor);
      setEquipmentSwing(dagger, 0);
      dagger.nextAttackAt = now + 0.36;
    }
  }}
