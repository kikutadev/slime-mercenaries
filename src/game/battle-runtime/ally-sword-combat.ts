import * as THREE from 'three';
import { isGreatswordRank } from '../fusion';
import {
  SLIME_MOTION_TIMING,
  SLIME_MOTION_THRESHOLDS,
  clamp01,
  createGreatswordSpinArc,
  createSwordSlashArc,
  getFighterAttackMotion,
  getGreatswordAttackMotion,
  getGreatswordSpinVfxPose,
  getSwordAttackMotion,
  getSwordSlashVfxPose,
} from '../slime-motion';
import {
  TIER3_SWORD_THRESHOLDS,
  TIER3_SWORD_TIMING,
  applyBerserkerSignatureVfx,
  applyBlademasterSignatureVfx,
  getBerserkerAttackMotion,
  getBlademasterAttackMotion,
} from '../slime-motions/tier3/sword';
import { MELEE_BODY_GAP } from './layout';
import { AllyCombatFamily, type AllyCombatFamilyOptions } from './ally-combat-family';
import type { AllyUnit, EnemyUnit } from './types';

export class SwordCombatFamily extends AllyCombatFamily {
  private readonly slashArc: THREE.Mesh<THREE.TorusGeometry, THREE.MeshBasicMaterial>;
  private readonly spinArc: THREE.Mesh<THREE.TorusGeometry, THREE.MeshBasicMaterial>;

  constructor(options: AllyCombatFamilyOptions) {
    super(options);
    this.slashArc = createSwordSlashArc();
    this.spinArc = createGreatswordSpinArc();
    options.sceneOwner.add(this.slashArc);
    options.sceneOwner.add(this.spinArc);
  }

  update(unit: AllyUnit, now: number): boolean {
    if (unit.behaviorId === 'sword-melee') this.updateSword(now, unit);
    else if (unit.behaviorId === 'fighter-combo') this.updateFighter(now, unit);
    else if (unit.behaviorId === 'blademaster-dash') this.updateBlademaster(now, unit);
    else if (unit.behaviorId === 'berserker-heavy') this.updateBerserker(now, unit);
    else return false;
    return true;
  }

  private updateSword(now: number, sword: AllyUnit): void {
    if (!sword.alive) return;
    const fusionRank = sword.fusionRank;
    const greatsword = isGreatswordRank(fusionRank);

    if (sword.attackStartedAt !== -Infinity && !sword.attackTarget?.alive) {
      const replacement = greatsword ? this.findNearest(sword, this.options.getLivingEnemies()) : null;
      if (replacement) {
        sword.attackTarget = replacement;
      } else {
        sword.attackStartedAt = -Infinity;
        sword.attackTarget = null;
        sword.hitsApplied = 0;
        sword.root.position.copy(sword.combatAnchor);
        this.setEquipmentSwing(sword, 0);
        this.resetSlash();
        this.resetSpinArc();
      }
    }

    if (sword.attackStartedAt === -Infinity && now >= sword.nextAttackAt) {
      const target = this.findNearest(sword, this.options.getLivingEnemies());
      if (target) {
        sword.attackStartedAt = now;
        sword.attackTarget = target;
        sword.hitsApplied = 0;
        sword.nextAttackAt = now + 1.08;
      }
    }

    if (sword.attackStartedAt === -Infinity || !sword.attackTarget) {
      sword.root.position.copy(sword.combatAnchor);
      this.updateIdle(sword, now, 0.2 + sword.slotIndex * 0.23);
      const target = this.findNearest(sword, this.options.getLivingEnemies());
      if (target) this.facePoint(sword, target.root.position);
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
      bodyOffset = this.getSafeMeleeForwardOffset(sword.combatAnchor, this.tempVector, bodyOffset);
    }
    sword.root.position.copy(sword.combatAnchor).addScaledVector(this.tempVector, bodyOffset);
    this.facePoint(sword, target.root.position);
    this.applyUnitDeformation(sword, pose.deformation.squash, pose.deformation.stretch, pose.deformation.lean, pose.deformation.wobble, pose.deformation.jump);
    this.setEquipmentSwing(sword, pose.equipment.angle, pose.equipment.lift, pose.equipment.sweep);
    sword.root.updateMatrixWorld(true);

    if (pose.releaseProgress >= 0 && sword.weaponTip) {
      sword.weaponTip.getWorldPosition(this.tempVector3);
      const slashVfx = getSwordSlashVfxPose(pose.releaseProgress);
      if (this.slashArc) {
        this.slashArc.visible = slashVfx.visible;
        this.slashArc.position.copy(this.tempVector3);
        this.slashArc.position.y += 0.012;
        this.slashArc.quaternion.copy(this.options.camera.quaternion);
        this.slashArc.rotation.z = slashVfx.rotationZ;
        this.slashArc.scale.set(slashVfx.scaleX, slashVfx.scaleY, 1);
        this.slashArc.material.opacity = slashVfx.opacity;
      }

      if (pose.releaseProgress >= SLIME_MOTION_THRESHOLDS.swordHitReleaseProgress && sword.hitsApplied === 0 && target.alive) {
        sword.hitsApplied = 1;
        this.options.applyDamage(target, 2, 'melee', sword.root.position);
      }
    } else {
      this.resetSlash();
    }

    if (u >= 1 || !target.alive) this.finishSwordAttack(now, sword, target);
  }

  private updateFighter(now: number, fighter: AllyUnit): void {
    if (!fighter.alive) return;
    if (fighter.attackStartedAt !== -Infinity && !fighter.attackTarget?.alive) {
      fighter.attackStartedAt = -Infinity;
      fighter.attackTarget = null;
      fighter.hitsApplied = 0;
      fighter.root.position.copy(fighter.combatAnchor);
      this.setEquipmentSwing(fighter, 0);
      this.resetSlash();
    }
    if (fighter.attackStartedAt === -Infinity && now >= fighter.nextAttackAt) {
      const target = this.findNearest(fighter, this.options.getLivingEnemies());
      if (target) {
        fighter.attackStartedAt = now;
        fighter.attackTarget = target;
        fighter.hitsApplied = 0;
      }
    }
    if (fighter.attackStartedAt === -Infinity || !fighter.attackTarget) {
      fighter.root.position.copy(fighter.combatAnchor);
      this.updateIdle(fighter, now, 0.32 + fighter.slotIndex * 0.21);
      const target = this.findNearest(fighter, this.options.getLivingEnemies());
      if (target) this.facePoint(fighter, target.root.position);
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
      offset = this.getSafeMeleeForwardOffset(fighter.combatAnchor, this.tempVector, offset);
    }
    fighter.root.position.copy(fighter.combatAnchor).addScaledVector(this.tempVector, offset);
    this.facePoint(fighter, target.root.position);
    this.applyUnitDeformation(
      fighter,
      pose.deformation.squash,
      pose.deformation.stretch,
      pose.deformation.lean,
      pose.deformation.wobble,
      pose.deformation.jump,
    );
    this.setEquipmentSwing(fighter, pose.equipment.angle, pose.equipment.lift, pose.equipment.sweep);
    fighter.root.updateMatrixWorld(true);

    if (pose.releaseProgress >= 0 && fighter.weaponTip) {
      fighter.weaponTip.getWorldPosition(this.tempVector3);
      const slashVfx = getSwordSlashVfxPose(pose.releaseProgress);
      if (this.slashArc) {
        this.slashArc.visible = slashVfx.visible;
        this.slashArc.position.copy(this.tempVector3);
        this.slashArc.position.y += 0.012;
        this.slashArc.quaternion.copy(this.options.camera.quaternion);
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
        this.options.applyDamage(target, pose.comboHit === 0 ? 1 : 2, 'melee', fighter.root.position);
      }
    } else {
      this.resetSlash();
    }

    if (u >= 1 || !target.alive) {
      fighter.attackStartedAt = -Infinity;
      fighter.attackTarget = null;
      fighter.hitsApplied = 0;
      fighter.root.position.copy(fighter.combatAnchor);
      this.setEquipmentSwing(fighter, 0);
      this.resetSlash();
      fighter.nextAttackAt = now + 0.46;
    }
  }

  private updateBlademaster(now: number, unit: AllyUnit): void {
    if (!unit.alive) return;
    if (unit.attackStartedAt !== -Infinity && !unit.attackTarget?.alive) {
      unit.attackStartedAt = -Infinity;
      unit.attackTarget = null;
      unit.hitsApplied = 0;
      unit.root.position.copy(unit.combatAnchor);
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
      unit.root.position.copy(unit.combatAnchor);
      this.updateIdle(unit, now, 0.18 + unit.slotIndex * 0.17);
      const target = this.findNearest(unit, this.options.getLivingEnemies());
      if (target) this.facePoint(unit, target.root.position);
      return;
    }
    const target = unit.attackTarget;
    const u = clamp01((now - unit.attackStartedAt) / TIER3_SWORD_TIMING.blademasterAttack);
    const pose = getBlademasterAttackMotion(u);
    this.tempVector.copy(target.root.position).sub(unit.combatAnchor).setY(0);
    if (this.tempVector.lengthSq() > 0.0001) this.tempVector.normalize();
    unit.root.position.copy(unit.combatAnchor).addScaledVector(this.tempVector, pose.bodyOffset);
    this.facePoint(unit, target.root.position);
    this.applyUnitDeformation(unit, pose.deformation.squash, pose.deformation.stretch, pose.deformation.lean, pose.deformation.wobble, pose.deformation.jump);
    this.setEquipmentSwing(unit, pose.equipment.angle, pose.equipment.lift, pose.equipment.sweep);
    this.tempVector2.copy(target.root.position);
    this.tempVector2.y = 0.28;
    applyBlademasterSignatureVfx(unit.signatureVfx, pose, this.options.camera.quaternion, this.tempVector2);
    if (u >= TIER3_SWORD_THRESHOLDS.blademasterCutU && unit.hitsApplied === 0) {
      unit.hitsApplied = 1;
      const lineStart = unit.combatAnchor.clone();
      const lineDirection = this.tempVector.clone();
      const targets = this.options.getLivingEnemies().filter((enemy) => {
        this.tempVector2.copy(enemy.root.position).sub(lineStart).setY(0);
        const projection = this.tempVector2.dot(lineDirection);
        if (projection < -0.08 || projection > 1.72) return false;
        this.tempVector3.copy(lineDirection).multiplyScalar(projection);
        return this.tempVector2.sub(this.tempVector3).length() <= 0.34;
      });
      for (const enemy of targets) this.options.applyDamage(enemy, enemy === target ? 3 : 2, 'melee', unit.root.position);
      this.options.startHitStop(0.055);
      this.options.startCameraShake(0.10, 0.032);
    }
    if (u >= 1) {
      unit.attackStartedAt = -Infinity;
      unit.attackTarget = null;
      unit.hitsApplied = 0;
      unit.root.position.copy(unit.combatAnchor);
      unit.nextAttackAt = now + 0.48;
      this.setEquipmentSwing(unit, 0);
      if (unit.signatureVfx) unit.signatureVfx.visible = false;
    }
  }

  private updateBerserker(now: number, unit: AllyUnit): void {
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
      unit.root.position.copy(unit.combatAnchor);
      this.updateIdle(unit, now, 0.64 + unit.slotIndex * 0.21);
      const target = this.findNearest(unit, this.options.getLivingEnemies());
      if (target) this.facePoint(unit, target.root.position);
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
    this.facePoint(unit, target.root.position);
    this.applyUnitDeformation(unit, pose.deformation.squash, pose.deformation.stretch, pose.deformation.lean, pose.deformation.wobble, pose.deformation.jump);
    this.setEquipmentSwing(unit, pose.equipment.angle, pose.equipment.lift, pose.equipment.sweep);
    this.tempVector2.copy(target.root.position); this.tempVector2.y = 0.12;
    applyBerserkerSignatureVfx(unit.signatureVfx, pose, this.options.camera.quaternion, this.tempVector2);
    if (u >= TIER3_SWORD_THRESHOLDS.berserkerImpactU && unit.hitsApplied === 0 && target.alive) {
      unit.hitsApplied = 1;
      this.options.applyDamage(target, 4, 'melee', unit.root.position);
      this.options.startHitStop(0.070);
      this.options.startCameraShake(0.15, 0.055);
    }
    if (u >= 1 || !target.alive) {
      unit.attackStartedAt = -Infinity;
      unit.attackTarget = null;
      unit.hitsApplied = 0;
      unit.root.position.copy(unit.combatAnchor);
      unit.nextAttackAt = now + 0.72;
      this.setEquipmentSwing(unit, 0);
      if (unit.signatureVfx) unit.signatureVfx.visible = false;
    }
  }

  private updateGreatswordAttack(now: number, sword: AllyUnit, target: EnemyUnit, fusionRank: number): void {
    const duration = SLIME_MOTION_TIMING.greatswordAttack;
    const u = clamp01((now - sword.attackStartedAt) / duration);
    const pose = getGreatswordAttackMotion(u);

    sword.root.position.copy(sword.combatAnchor);
    this.facePoint(sword, target.root.position);
    sword.root.rotation.y += pose.rootYawOffset;
    this.applyUnitDeformation(sword, pose.deformation.squash, pose.deformation.stretch, pose.deformation.lean, pose.deformation.wobble, pose.deformation.jump);
    this.setEquipmentSwing(sword, pose.equipment.angle, pose.equipment.lift, pose.equipment.sweep);

    if (this.spinArc) {
      const spinVfx = getGreatswordSpinVfxPose(pose, fusionRank);
      this.spinArc.visible = spinVfx.visible;
      this.tempVector.copy(target.root.position).sub(sword.root.position).setY(0);
      if (this.tempVector.lengthSq() > 0.0001) this.tempVector.normalize();
      this.spinArc.position.copy(sword.root.position).addScaledVector(this.tempVector, 0.28);
      this.spinArc.position.y = 0.30;
      this.spinArc.quaternion.copy(this.options.camera.quaternion);
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
      const targets = this.options.getLivingEnemies().filter((enemy) => {
        this.tempVector2.copy(enemy.root.position).sub(sword.root.position).setY(0);
        const distanceSq = this.tempVector2.lengthSq();
        if (distanceSq > radius * radius) return false;
        if (distanceSq <= 0.0001) return true;
        this.tempVector2.normalize();
        return this.tempVector.dot(this.tempVector2) >= cosHalfArc;
      });
      for (const enemy of targets) this.options.applyDamage(enemy, damage, 'melee', sword.root.position);
      this.options.projectileSystem.createImpact(sword.root.position.clone().add(new THREE.Vector3(0, 0.14, 0)), '#fff0a0', 0.10);
      this.options.startCameraShake(0.11, 0.036);
    }

    if (u >= 1) this.finishSwordAttack(now, sword, target);
  }

  private finishSwordAttack(now: number, sword: AllyUnit, target: EnemyUnit): void {
    sword.attackStartedAt = -Infinity;
    sword.attackTarget = null;
    sword.hitsApplied = 0;
    sword.root.position.copy(sword.combatAnchor);
    this.facePoint(sword, target.root.position);
    this.setEquipmentSwing(sword, 0);
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
