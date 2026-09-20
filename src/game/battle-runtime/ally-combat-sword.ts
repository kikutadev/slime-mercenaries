import * as THREE from 'three';
import { isGreatswordRank } from '../fusion';
import {
  SLIME_MOTION_THRESHOLDS,
  SLIME_MOTION_TIMING,
  clamp01,
  getFighterAttackMotion,
  getGreatswordAttackMotion,
  getGreatswordSpinVfxPose,
  getSwordAttackMotion,
  getSwordSlashVfxPose,
} from '../slime-motion';
import {
  createGreatswordSpinArc,
  createSwordSlashArc,
} from '../slime-vfx';
import {
  TIER3_SWORD_THRESHOLDS,
  TIER3_SWORD_TIMING,
  applyBerserkerSignatureVfx,
  applyBlademasterSignatureVfx,
  getBerserkerAttackMotion,
  getBlademasterAttackMotion,
} from '../slime-motions/tier3/sword';
import { MELEE_BODY_GAP } from './layout';
import {
  applyUnitDeformation,
  facePoint,
  findNearest,
  safeMeleeForwardOffset,
  setEquipmentSwing,
  updateIdle,
} from './unit-presentation';
import type {
  AllyUnit,
  EnemyUnit,
} from './types';
import type { BattleAllyCombatDependencies } from './ally-combat-deps';

export class SwordCombatFamily {
  private readonly tempVector = new THREE.Vector3();
  private readonly tempVector2 = new THREE.Vector3();
  private readonly tempVector3 = new THREE.Vector3();
  private slashArc: THREE.Mesh<THREE.TorusGeometry, THREE.MeshBasicMaterial> | null = null;
  private spinArc: THREE.Mesh<THREE.TorusGeometry, THREE.MeshBasicMaterial> | null = null;

  constructor(private readonly deps: BattleAllyCombatDependencies) {}

  initializePresentationVfx(): void {
    if (this.slashArc === null) {
      this.slashArc = createSwordSlashArc();
      this.deps.addSceneObject(this.slashArc);
    }
    if (this.spinArc === null) {
      this.spinArc = createGreatswordSpinArc();
      this.deps.addSceneObject(this.spinArc);
    }
  }

  resetTransientVfx(): void {
    this.resetSlash();
    this.resetSpinArc();
  }

  updateSword(now: number, sword: AllyUnit): void {
    if (!sword.alive) return;
    const fusionRank = sword.fusionRank;
    const greatsword = isGreatswordRank(fusionRank);

    if (sword.attackStartedAt !== -Infinity && !sword.attackTarget?.alive) {
      const replacement = greatsword ? findNearest(sword, this.deps.getLivingEnemies()) : null;
      if (replacement) {
        sword.attackTarget = replacement;
      } else {
        sword.attackStartedAt = -Infinity;
        sword.attackTarget = null;
        sword.hitsApplied = 0;
        sword.root.position.copy(sword.combatAnchor);
        setEquipmentSwing(sword, 0);
        this.resetSlash();
        this.resetSpinArc();
      }
    }

    if (sword.attackStartedAt === -Infinity && now >= sword.nextAttackAt) {
      const target = findNearest(sword, this.deps.getLivingEnemies());
      if (target) {
        sword.attackStartedAt = now;
        sword.attackTarget = target;
        sword.hitsApplied = 0;
        sword.nextAttackAt = now + 1.08;
      }
    }

    if (sword.attackStartedAt === -Infinity || !sword.attackTarget) {
      sword.root.position.copy(sword.combatAnchor);
      updateIdle(sword, now, 0.2 + sword.slotIndex * 0.23);
      const target = findNearest(sword, this.deps.getLivingEnemies());
      if (target) facePoint(sword, target.root.position);
      this.resetSpinArc();
      return;
    }

    if (greatsword) {
      this.updateGreatswordAttack(now, sword, sword.attackTarget, fusionRank);
      return;
    }

    const duration = SLIME_MOTION_TIMING.swordAttack;
    const u = clamp01((now - sword.attackStartedAt) / duration);
    const target = sword.attackTarget;
    const pose = getSwordAttackMotion(u);
    let bodyOffset = pose.bodyOffset;

    this.tempVector.copy(target.root.position).sub(sword.combatAnchor).setY(0);
    const targetDistanceFromAnchor = this.tempVector.length();
    if (this.tempVector.lengthSq() > 0.0001) this.tempVector.normalize();
    if (bodyOffset > 0) {
      bodyOffset = Math.min(bodyOffset, Math.max(0, targetDistanceFromAnchor - MELEE_BODY_GAP));
      bodyOffset = safeMeleeForwardOffset(sword.combatAnchor, this.tempVector, bodyOffset, this.deps.getLivingEnemies());
    }
    sword.root.position.copy(sword.combatAnchor).addScaledVector(this.tempVector, bodyOffset);
    facePoint(sword, target.root.position);
    applyUnitDeformation(sword, pose.deformation.squash, pose.deformation.stretch, pose.deformation.lean, pose.deformation.wobble, pose.deformation.jump);
    setEquipmentSwing(sword, pose.equipment.angle, pose.equipment.lift, pose.equipment.sweep);
    sword.root.updateMatrixWorld(true);

    if (pose.releaseProgress >= 0 && sword.weaponTip) {
      sword.weaponTip.getWorldPosition(this.tempVector3);
      const slashVfx = getSwordSlashVfxPose(pose.releaseProgress);
      if (this.slashArc) {
        this.slashArc.visible = slashVfx.visible;
        this.slashArc.position.copy(this.tempVector3);
        this.slashArc.position.y += 0.012;
        this.slashArc.quaternion.copy(this.deps.camera.quaternion);
        this.slashArc.rotation.z = slashVfx.rotationZ;
        this.slashArc.scale.set(slashVfx.scaleX, slashVfx.scaleY, 1);
        this.slashArc.material.opacity = slashVfx.opacity;
      }

      if (pose.releaseProgress >= SLIME_MOTION_THRESHOLDS.swordHitReleaseProgress && sword.hitsApplied === 0 && target.alive) {
        sword.hitsApplied = 1;
        this.deps.applyDamage(target, 2, 'melee', sword.root.position);
      }
    } else {
      this.resetSlash();
    }

    if (u >= 1 || !target.alive) this.finishSwordAttack(now, sword, target);
  }

  updateFighter(now: number, fighter: AllyUnit): void {
    if (!fighter.alive) return;
    if (fighter.attackStartedAt !== -Infinity && !fighter.attackTarget?.alive) {
      fighter.attackStartedAt = -Infinity;
      fighter.attackTarget = null;
      fighter.hitsApplied = 0;
      fighter.root.position.copy(fighter.combatAnchor);
      setEquipmentSwing(fighter, 0);
      this.resetSlash();
    }
    if (fighter.attackStartedAt === -Infinity && now >= fighter.nextAttackAt) {
      const target = findNearest(fighter, this.deps.getLivingEnemies());
      if (target) {
        fighter.attackStartedAt = now;
        fighter.attackTarget = target;
        fighter.hitsApplied = 0;
      }
    }
    if (fighter.attackStartedAt === -Infinity || !fighter.attackTarget) {
      fighter.root.position.copy(fighter.combatAnchor);
      updateIdle(fighter, now, 0.32 + fighter.slotIndex * 0.21);
      const target = findNearest(fighter, this.deps.getLivingEnemies());
      if (target) facePoint(fighter, target.root.position);
      this.resetSlash();
      return;
    }

    const target = fighter.attackTarget;
    const u = clamp01((now - fighter.attackStartedAt) / SLIME_MOTION_TIMING.fighterAttack);
    const pose = getFighterAttackMotion(u);
    this.tempVector.copy(target.root.position).sub(fighter.combatAnchor).setY(0);
    const distance = this.tempVector.length();
    if (this.tempVector.lengthSq() > 0.0001) this.tempVector.normalize();
    let offset = pose.bodyOffset;
    if (offset > 0) {
      offset = Math.min(offset, Math.max(0, distance - MELEE_BODY_GAP));
      offset = safeMeleeForwardOffset(fighter.combatAnchor, this.tempVector, offset, this.deps.getLivingEnemies());
    }
    fighter.root.position.copy(fighter.combatAnchor).addScaledVector(this.tempVector, offset);
    facePoint(fighter, target.root.position);
    applyUnitDeformation(
      fighter,
      pose.deformation.squash,
      pose.deformation.stretch,
      pose.deformation.lean,
      pose.deformation.wobble,
      pose.deformation.jump,
    );
    setEquipmentSwing(fighter, pose.equipment.angle, pose.equipment.lift, pose.equipment.sweep);
    fighter.root.updateMatrixWorld(true);

    if (pose.releaseProgress >= 0 && fighter.weaponTip) {
      fighter.weaponTip.getWorldPosition(this.tempVector3);
      const slashVfx = getSwordSlashVfxPose(pose.releaseProgress);
      if (this.slashArc) {
        this.slashArc.visible = slashVfx.visible;
        this.slashArc.position.copy(this.tempVector3);
        this.slashArc.position.y += 0.012;
        this.slashArc.quaternion.copy(this.deps.camera.quaternion);
        this.slashArc.rotation.z = pose.slashDirection > 0 ? slashVfx.rotationZ : (-slashVfx.rotationZ - 0.28);
        this.slashArc.scale.set(slashVfx.scaleX, slashVfx.scaleY, 1);
        this.slashArc.material.opacity = slashVfx.opacity;
      }
      if (
        pose.releaseProgress >= SLIME_MOTION_THRESHOLDS.fighterHitReleaseProgress
        && fighter.hitsApplied === pose.comboHit
        && target.alive
      ) {
        fighter.hitsApplied += 1;
        this.deps.applyDamage(target, pose.comboHit === 0 ? 1 : 2, 'melee', fighter.root.position);
      }
    } else {
      this.resetSlash();
    }

    if (u >= 1 || !target.alive) {
      fighter.attackStartedAt = -Infinity;
      fighter.attackTarget = null;
      fighter.hitsApplied = 0;
      fighter.root.position.copy(fighter.combatAnchor);
      setEquipmentSwing(fighter, 0);
      this.resetSlash();
      fighter.nextAttackAt = now + 0.46;
    }
  }

  updateBlademaster(now: number, unit: AllyUnit): void {
    if (!unit.alive) return;
    if (unit.attackStartedAt !== -Infinity && !unit.attackTarget?.alive) {
      unit.attackStartedAt = -Infinity;
      unit.attackTarget = null;
      unit.hitsApplied = 0;
      unit.root.position.copy(unit.combatAnchor);
      if (unit.signatureVfx) unit.signatureVfx.visible = false;
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
      updateIdle(unit, now, 0.18 + unit.slotIndex * 0.17);
      const target = findNearest(unit, this.deps.getLivingEnemies());
      if (target) facePoint(unit, target.root.position);
      return;
    }
    const target = unit.attackTarget;
    const u = clamp01((now - unit.attackStartedAt) / TIER3_SWORD_TIMING.blademasterAttack);
    const pose = getBlademasterAttackMotion(u);
    this.tempVector.copy(target.root.position).sub(unit.combatAnchor).setY(0);
    if (this.tempVector.lengthSq() > 0.0001) this.tempVector.normalize();
    unit.root.position.copy(unit.combatAnchor).addScaledVector(this.tempVector, pose.bodyOffset);
    facePoint(unit, target.root.position);
    applyUnitDeformation(unit, pose.deformation.squash, pose.deformation.stretch, pose.deformation.lean, pose.deformation.wobble, pose.deformation.jump);
    setEquipmentSwing(unit, pose.equipment.angle, pose.equipment.lift, pose.equipment.sweep);
    this.tempVector2.copy(target.root.position);
    this.tempVector2.y = 0.28;
    applyBlademasterSignatureVfx(unit.signatureVfx, pose, this.deps.camera.quaternion, this.tempVector2);
    if (u >= TIER3_SWORD_THRESHOLDS.blademasterCutU && unit.hitsApplied === 0) {
      unit.hitsApplied = 1;
      const lineStart = unit.combatAnchor.clone();
      const lineDirection = this.tempVector.clone();
      const targets = this.deps.getLivingEnemies().filter((enemy) => {
        this.tempVector2.copy(enemy.root.position).sub(lineStart).setY(0);
        const projection = this.tempVector2.dot(lineDirection);
        if (projection < -0.08 || projection > 1.72) return false;
        this.tempVector3.copy(lineDirection).multiplyScalar(projection);
        return this.tempVector2.sub(this.tempVector3).length() <= 0.34;
      });
      for (const enemy of targets) this.deps.applyDamage(enemy, enemy === target ? 3 : 2, 'melee', unit.root.position);
      this.deps.startHitStop(0.055);
      this.deps.startCameraShake(0.10, 0.032);
    }
    if (u >= 1) {
      unit.attackStartedAt = -Infinity;
      unit.attackTarget = null;
      unit.hitsApplied = 0;
      unit.root.position.copy(unit.combatAnchor);
      unit.nextAttackAt = now + 0.48;
      setEquipmentSwing(unit, 0);
      if (unit.signatureVfx) unit.signatureVfx.visible = false;
    }
  }

  updateBerserker(now: number, unit: AllyUnit): void {
    if (!unit.alive) return;
    if (unit.attackStartedAt !== -Infinity && !unit.attackTarget?.alive) {
      unit.attackStartedAt = -Infinity;
      unit.attackTarget = null;
      unit.hitsApplied = 0;
      if (unit.signatureVfx) unit.signatureVfx.visible = false;
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
      updateIdle(unit, now, 0.64 + unit.slotIndex * 0.21);
      const target = findNearest(unit, this.deps.getLivingEnemies());
      if (target) facePoint(unit, target.root.position);
      return;
    }
    const target = unit.attackTarget;
    const u = clamp01((now - unit.attackStartedAt) / TIER3_SWORD_TIMING.berserkerAttack);
    const pose = getBerserkerAttackMotion(u);
    this.tempVector.copy(target.root.position).sub(unit.combatAnchor).setY(0);
    const distance = this.tempVector.length();
    if (this.tempVector.lengthSq() > 0.0001) this.tempVector.normalize();
    const offset = Math.min(pose.bodyOffset, Math.max(0, distance - MELEE_BODY_GAP));
    unit.root.position.copy(unit.combatAnchor).addScaledVector(this.tempVector, offset);
    facePoint(unit, target.root.position);
    applyUnitDeformation(unit, pose.deformation.squash, pose.deformation.stretch, pose.deformation.lean, pose.deformation.wobble, pose.deformation.jump);
    setEquipmentSwing(unit, pose.equipment.angle, pose.equipment.lift, pose.equipment.sweep);
    this.tempVector2.copy(target.root.position); this.tempVector2.y = 0.12;
    applyBerserkerSignatureVfx(unit.signatureVfx, pose, this.deps.camera.quaternion, this.tempVector2);
    if (u >= TIER3_SWORD_THRESHOLDS.berserkerImpactU && unit.hitsApplied === 0 && target.alive) {
      unit.hitsApplied = 1;
      this.deps.applyDamage(target, 4, 'melee', unit.root.position);
      this.deps.startHitStop(0.070);
      this.deps.startCameraShake(0.15, 0.055);
    }
    if (u >= 1 || !target.alive) {
      unit.attackStartedAt = -Infinity;
      unit.attackTarget = null;
      unit.hitsApplied = 0;
      unit.root.position.copy(unit.combatAnchor);
      unit.nextAttackAt = now + 0.72;
      setEquipmentSwing(unit, 0);
      if (unit.signatureVfx) unit.signatureVfx.visible = false;
    }
  }

  private updateGreatswordAttack(now: number, sword: AllyUnit, target: EnemyUnit, fusionRank: number): void {
    const duration = SLIME_MOTION_TIMING.greatswordAttack;
    const u = clamp01((now - sword.attackStartedAt) / duration);
    const pose = getGreatswordAttackMotion(u);

    sword.root.position.copy(sword.combatAnchor);
    facePoint(sword, target.root.position);
    sword.root.rotation.y += pose.rootYawOffset;
    applyUnitDeformation(sword, pose.deformation.squash, pose.deformation.stretch, pose.deformation.lean, pose.deformation.wobble, pose.deformation.jump);
    setEquipmentSwing(sword, pose.equipment.angle, pose.equipment.lift, pose.equipment.sweep);

    if (this.spinArc) {
      const spinVfx = getGreatswordSpinVfxPose(pose, fusionRank);
      this.spinArc.visible = spinVfx.visible;
      this.tempVector.copy(target.root.position).sub(sword.root.position).setY(0);
      if (this.tempVector.lengthSq() > 0.0001) this.tempVector.normalize();
      this.spinArc.position.copy(sword.root.position).addScaledVector(this.tempVector, 0.28);
      this.spinArc.position.y = 0.30;
      this.spinArc.quaternion.copy(this.deps.camera.quaternion);
      this.spinArc.rotation.z = spinVfx.rotationZ;
      this.spinArc.scale.set(spinVfx.scaleX, spinVfx.scaleY, 1);
      this.spinArc.material.opacity = spinVfx.opacity;
    }

    if (pose.slashU >= SLIME_MOTION_THRESHOLDS.greatswordHitSlashU && sword.hitsApplied === 0) {
      sword.hitsApplied = 1;
      const radius = fusionRank >= 4 ? 1.34 : fusionRank >= 3 ? 1.24 : 1.14;
      const damage = fusionRank >= 3 ? 3 : 2;
      this.tempVector.copy(target.root.position).sub(sword.root.position).setY(0);
      if (this.tempVector.lengthSq() > 0.0001) this.tempVector.normalize();
      const cosHalfArc = Math.cos(THREE.MathUtils.degToRad(108));
      const targets = this.deps.getLivingEnemies().filter((enemy) => {
        this.tempVector2.copy(enemy.root.position).sub(sword.root.position).setY(0);
        const distanceSq = this.tempVector2.lengthSq();
        if (distanceSq > radius * radius) return false;
        if (distanceSq <= 0.0001) return true;
        this.tempVector2.normalize();
        return this.tempVector.dot(this.tempVector2) >= cosHalfArc;
      });
      for (const enemy of targets) this.deps.applyDamage(enemy, damage, 'melee', sword.root.position);
      this.deps.effects.createImpact(sword.root.position.clone().add(new THREE.Vector3(0, 0.14, 0)), '#fff0a0', 0.10);
      this.deps.startCameraShake(0.11, 0.036);
    }

    if (u >= 1) this.finishSwordAttack(now, sword, target);
  }

  private finishSwordAttack(now: number, sword: AllyUnit, target: EnemyUnit): void {
    sword.attackStartedAt = -Infinity;
    sword.attackTarget = null;
    sword.hitsApplied = 0;
    sword.root.position.copy(sword.combatAnchor);
    facePoint(sword, target.root.position);
    setEquipmentSwing(sword, 0);
    this.resetSlash();
    this.resetSpinArc();
    sword.nextAttackAt = Math.max(sword.nextAttackAt, now + 0.24);
  }

  private resetSlash(): void {
    if (!this.slashArc) return;
    this.slashArc.visible = false;
    this.slashArc.material.opacity = 0;
  }

  private resetSpinArc(): void {
    if (!this.spinArc) return;
    this.spinArc.visible = false;
    this.spinArc.material.opacity = 0;
  }


}
