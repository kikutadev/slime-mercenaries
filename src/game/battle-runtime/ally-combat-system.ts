import * as THREE from 'three';
import { isGreatswordRank } from '../fusion';
import {
  SLIME_MOTION_THRESHOLDS,
  SLIME_MOTION_TIMING,
  applyMageRunePose,
  clamp01,
  getBowAttackMotion,
  getDaggerAttackMotion,
  getFighterAttackMotion,
  getGuardianAttackMotion,
  getGreatswordAttackMotion,
  getGreatswordSpinVfxPose,
  getGunAttackMotion,
  getGunnerAttackMotion,
  getGunnerShotReleaseU,
  getMageAttackMotion,
  getRangerAttackMotion,
  getRogueAttackMotion,
  getShieldAttackMotion,
  getSwordAttackMotion,
  getSwordSlashVfxPose,
  getWandAttackMotion,
} from '../slime-motion';
import {
  applyGuardPulseVfx,
  applyMageCastSigil,
  applyRogueSlashVfx,
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
import {
  TIER3_BOW_THRESHOLDS,
  TIER3_BOW_TIMING,
  applySniperSignatureVfx,
  applyStormSignatureVfx,
  getSniperAttackMotion,
  getStormArcherAttackMotion,
  getStormShotReleaseU,
} from '../slime-motions/tier3/bow';
import {
  TIER3_DEFENSE_THRESHOLDS,
  TIER3_DEFENSE_TIMING,
  applyFortressSignatureVfx,
  applyPaladinSignatureVfx,
  getFortressAttackMotion,
  getPaladinAttackMotion,
} from '../slime-motions/tier3/defense';
import {
  TIER3_MAGIC_THRESHOLDS,
  TIER3_MAGIC_TIMING,
  applyArchmageSignatureVfx,
  applyFrostMageSignatureVfx,
  getArchmageAttackMotion,
  getFrostMageAttackMotion,
} from '../slime-motions/tier3/magic';
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
  CANNONEER_SIGNATURE_TIMING,
  ENGINEER_SIGNATURE_TIMING,
  getCannoneerImpactU,
  getCannoneerSignatureMotion,
  getEngineerSignatureMotion,
  getEngineerTurretShotReleaseU,
} from '../slime-motions/tier3/gun';
import {
  applyAssassinSignatureVfx,
  applyCannoneerSignatureVfx,
  applyEngineerSignatureVfx,
  applyNinjaSignatureVfx,
} from '../slime-motions/tier3/effects';
import type { BattleBehaviorId } from '../slimes';
import { MELEE_BODY_GAP } from './layout';
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
import type {
  AllyUnit,
  EnemyUnit,
} from './types';
import type { BattleEffectsSystem } from './effects-system';

type DamageSource = 'melee' | 'projectile' | 'enemy';

export interface BattleAllyCombatDependencies {
  camera: THREE.PerspectiveCamera;
  effects: BattleEffectsSystem;
  addSceneObject: (object: THREE.Object3D) => void;
  getLivingEnemies: () => EnemyUnit[];
  applyDamage: (
    target: AllyUnit | EnemyUnit,
    amount: number,
    source: DamageSource,
    sourcePosition: THREE.Vector3,
  ) => void;
  startCameraShake: (duration: number, amplitude: number) => void;
  startHitStop: (durationSeconds: number) => void;
}

export class BattleAllyCombatSystem {
  private readonly tempVector = new THREE.Vector3();
  private readonly tempVector2 = new THREE.Vector3();
  private readonly tempVector3 = new THREE.Vector3();
  private readonly tempVector4 = new THREE.Vector3();
  private readonly tempVector5 = new THREE.Vector3();
  private readonly tempVector6 = new THREE.Vector3();
  private slashArc: THREE.Mesh<THREE.TorusGeometry, THREE.MeshBasicMaterial> | null = null;
  private spinArc: THREE.Mesh<THREE.TorusGeometry, THREE.MeshBasicMaterial> | null = null;

  private readonly handlers: Readonly<Record<BattleBehaviorId, (now: number, ally: AllyUnit) => void>> = {
    'sword-melee': (now, ally) => this.updateSword(now, ally),
    'fighter-combo': (now, ally) => this.updateFighter(now, ally),
    'blademaster-dash': (now, ally) => this.updateBlademaster(now, ally),
    'berserker-heavy': (now, ally) => this.updateBerserker(now, ally),
    'bow-ranged': (now, ally) => this.updateBow(now, ally),
    'ranger-double-shot': (now, ally) => this.updateRanger(now, ally),
    'sniper-pierce': (now, ally) => this.updateSniper(now, ally),
    'storm-archer-volley': (now, ally) => this.updateStormArcher(now, ally),
    'shield-defender': (now, ally) => this.updateShield(now, ally),
    'guardian-guard': (now, ally) => this.updateGuardian(now, ally),
    'paladin-barrier': (now, ally) => this.updatePaladin(now, ally),
    'fortress-plant': (now, ally) => this.updateFortress(now, ally),
    'wand-magic': (now, ally) => this.updateWand(now, ally),
    'mage-aoe': (now, ally) => this.updateMage(now, ally),
    'archmage-burst': (now, ally) => this.updateArchmage(now, ally),
    'frost-mage-control': (now, ally) => this.updateFrostMage(now, ally),
    'dagger-skirmisher': (now, ally) => this.updateDagger(now, ally),
    'rogue-twin-strike': (now, ally) => this.updateRogue(now, ally),
    'ninja-vanish': (now, ally) => this.updateNinja(now, ally),
    'assassin-execute': (now, ally) => this.updateAssassin(now, ally),
    'gun-ranged': (now, ally) => this.updateGun(now, ally),
    'gunner-burst': (now, ally) => this.updateGunner(now, ally),
    'cannoneer-shell': (now, ally) => this.updateCannoneer(now, ally),
    'engineer-turret': (now, ally) => this.updateEngineer(now, ally),
  };

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

  update(now: number, ally: AllyUnit): void {
    this.handlers[ally.behaviorId](now, ally);
  }

  resetTransientVfx(): void {
    this.resetSlash();
    this.resetSpinArc();
  }

  private updateSword(now: number, sword: AllyUnit): void {
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

  private updateFighter(now: number, fighter: AllyUnit): void {
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

  private updateBerserker(now: number, unit: AllyUnit): void {
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

  private updateSniper(now: number, unit: AllyUnit): void {
    if (!unit.alive) return;
    if (unit.attackStartedAt !== -Infinity && !unit.attackTarget?.alive) {
      unit.attackStartedAt = -Infinity;
      unit.attackTarget = null;
      unit.shotApplied = false;
      if (unit.signatureVfx) unit.signatureVfx.visible = false;
    }
    if (unit.attackStartedAt === -Infinity && now >= unit.nextAttackAt) {
      const target = findNearest(unit, this.deps.getLivingEnemies());
      if (target) {
        unit.attackStartedAt = now;
        unit.attackTarget = target;
        unit.shotApplied = false;
      }
    }
    if (unit.attackStartedAt === -Infinity || !unit.attackTarget) {
      unit.root.position.copy(unit.home);
      updateIdle(unit, now, 1.48 + unit.slotIndex * 0.11);
      const target = findNearest(unit, this.deps.getLivingEnemies());
      if (target) facePoint(unit, target.root.position);
      return;
    }
    const target = unit.attackTarget;
    const u = clamp01((now - unit.attackStartedAt) / TIER3_BOW_TIMING.sniperAttack);
    const pose = getSniperAttackMotion(u);
    facePoint(unit, target.root.position);
    applyUnitDeformation(unit, pose.deformation.squash, pose.deformation.stretch, pose.deformation.lean, pose.deformation.wobble, pose.deformation.jump);
    setEquipmentSwing(unit, pose.equipment.angle, pose.equipment.lift, pose.equipment.sweep);
    unit.root.updateMatrixWorld(true);
    (unit.projectileOrigin ?? unit.equipmentAnchor).getWorldPosition(this.tempVector2);
    this.tempVector3.copy(target.root.position).add(new THREE.Vector3(0, 0.28, 0));
    applySniperSignatureVfx(unit.signatureVfx, pose, this.tempVector2, this.tempVector3, this.deps.camera.quaternion);
    if (!unit.shotApplied && u >= TIER3_BOW_THRESHOLDS.sniperReleaseU) {
      unit.shotApplied = true;
      this.deps.effects.fireArrowProfile(unit, target, TIER3_BOW_TIMING.sniperArrowFlight, 4, 0.10, 0.86);
      this.deps.startCameraShake(0.08, 0.028);
    }
    if (u >= 1) {
      unit.attackStartedAt = -Infinity;
      unit.attackTarget = null;
      unit.shotApplied = false;
      unit.nextAttackAt = now + 1.18;
      setEquipmentSwing(unit, 0);
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
      const target = findNearest(unit, this.deps.getLivingEnemies());
      if (target) {
        unit.attackStartedAt = now;
        unit.attackTarget = target;
        unit.hitsApplied = 0;
      }
    }
    if (unit.attackStartedAt === -Infinity || !unit.attackTarget) {
      unit.root.position.copy(unit.home);
      updateIdle(unit, now, 1.72 + unit.slotIndex * 0.13);
      const target = findNearest(unit, this.deps.getLivingEnemies());
      if (target) facePoint(unit, target.root.position);
      return;
    }
    const target = unit.attackTarget;
    const u = clamp01((now - unit.attackStartedAt) / TIER3_BOW_TIMING.stormArcherAttack);
    const pose = getStormArcherAttackMotion(u);
    facePoint(unit, target.root.position);
    this.tempVector.copy(target.root.position).sub(unit.home).setY(0);
    if (this.tempVector.lengthSq() > 0.0001) this.tempVector.normalize();
    this.tempVector2.set(-this.tempVector.z, 0, this.tempVector.x);
    unit.root.position.copy(unit.home).addScaledVector(this.tempVector2, pose.bodyOffset);
    applyUnitDeformation(unit, pose.deformation.squash, pose.deformation.stretch, pose.deformation.lean, pose.deformation.wobble, pose.deformation.jump);
    setEquipmentSwing(unit, pose.equipment.angle, pose.equipment.lift, pose.equipment.sweep);
    unit.root.updateMatrixWorld(true);
    (unit.projectileOrigin ?? unit.equipmentAnchor).getWorldPosition(this.tempVector3);
    const candidates = this.deps.getLivingEnemies().slice().sort((a, b) => a.root.position.distanceToSquared(unit.root.position) - b.root.position.distanceToSquared(unit.root.position));
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
      this.deps.camera.quaternion,
    );
    for (const shotIndex of [0, 1, 2] as const) {
      const mask = 1 << shotIndex;
      if (u >= getStormShotReleaseU(shotIndex) && (unit.hitsApplied & mask) === 0) {
        unit.hitsApplied |= mask;
        const shotTarget = impactTargets[shotIndex];
        if (shotTarget?.alive) this.deps.effects.fireArrowProfile(unit, shotTarget, TIER3_BOW_TIMING.stormArrowFlight, 2, 0.45, 0.90);
      }
    }
    if (u >= 1) {
      unit.attackStartedAt = -Infinity;
      unit.attackTarget = null;
      unit.hitsApplied = 0;
      unit.root.position.copy(unit.home);
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


  private updateGuardian(now: number, guardian: AllyUnit): void {
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

  private updateMage(now: number, mage: AllyUnit): void {
    if (!mage.alive) return;
    if (mage.attackStartedAt !== -Infinity && !mage.attackTarget?.alive) {
      mage.attackStartedAt = -Infinity;
      mage.attackTarget = null;
      mage.shotApplied = false;
    }
    if (mage.attackStartedAt === -Infinity && now >= mage.nextAttackAt) {
      const target = findNearest(mage, this.deps.getLivingEnemies());
      if (target) {
        mage.attackStartedAt = now;
        mage.attackTarget = target;
        mage.shotApplied = false;
      }
    }
    if (mage.attackStartedAt === -Infinity || !mage.attackTarget) {
      mage.root.position.copy(mage.home);
      updateIdle(mage, now, 2.25 + mage.slotIndex * 0.23);
      const target = findNearest(mage, this.deps.getLivingEnemies());
      if (target) facePoint(mage, target.root.position);
      return;
    }

    const target = mage.attackTarget;
    const u = clamp01((now - mage.attackStartedAt) / SLIME_MOTION_TIMING.mageAttack);
    const pose = getMageAttackMotion(u);
    facePoint(mage, target.root.position);
    this.tempVector.copy(target.root.position).sub(mage.home).setY(0);
    if (this.tempVector.lengthSq() > 0.0001) this.tempVector.normalize();
    mage.root.position.copy(mage.home).addScaledVector(this.tempVector, pose.bodyOffset);
    applyUnitDeformation(
      mage,
      pose.deformation.squash,
      pose.deformation.stretch,
      pose.deformation.lean,
      pose.deformation.wobble,
      pose.deformation.jump,
    );
    setEquipmentSwing(mage, pose.equipment.angle, pose.equipment.lift, pose.equipment.sweep);
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
      mage.mageCastSigil.quaternion.copy(this.deps.camera.quaternion);
      applyMageCastSigil(mage.mageCastSigil, pose.runePulse, pose.runeRotation);
    }
    if (!mage.shotApplied && u >= SLIME_MOTION_THRESHOLDS.mageReleaseU) {
      mage.shotApplied = true;
      this.deps.effects.fireMagicOrb(mage, target, 0.58, true);
    }
    if (u >= 1) {
      mage.attackStartedAt = -Infinity;
      mage.attackTarget = null;
      mage.root.position.copy(mage.home);
      mage.nextAttackAt = now + 1.05;
      setEquipmentSwing(mage, 0);
      resetBranchAccents(mage);
    }
  }

  private updateRogue(now: number, rogue: AllyUnit): void {
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

  private updateGunner(now: number, gunner: AllyUnit): void {
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


  private updatePaladin(now: number, unit: AllyUnit): void {
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

  private updateFortress(now: number, unit: AllyUnit): void {
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

  private updateArchmage(now: number, unit: AllyUnit): void {
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
      updateIdle(unit, now, 2.42 + unit.slotIndex * 0.19);
      const target = findNearest(unit, this.deps.getLivingEnemies());
      if (target) facePoint(unit, target.root.position);
      return;
    }

    const target = unit.attackTarget;
    const u = clamp01((now - unit.attackStartedAt) / TIER3_MAGIC_TIMING.archmageAttack);
    const pose = getArchmageAttackMotion(u);
    facePoint(unit, target.root.position);
    this.tempVector.copy(target.root.position).sub(unit.home).setY(0);
    if (this.tempVector.lengthSq() > 0.0001) this.tempVector.normalize();
    unit.root.position.copy(unit.home).addScaledVector(this.tempVector, pose.bodyOffset);
    applyUnitDeformation(unit, pose.deformation.squash, pose.deformation.stretch, pose.deformation.lean, pose.deformation.wobble, pose.deformation.jump);
    setEquipmentSwing(unit, pose.equipment.angle, pose.equipment.lift, pose.equipment.sweep);
    applyMageRunePose(
      unit.mageRuneAnchor,
      unit.mageRuneBaseQuaternion,
      unit.mageRuneBaseScale,
      pose.runeCharge * Math.PI * 1.6,
      Math.max(pose.runeCharge, pose.moteBoost),
    );
    this.tempVector2.copy(target.root.position);
    this.tempVector2.y = 0.02;
    applyArchmageSignatureVfx(unit.signatureVfx, pose, this.deps.camera.quaternion, unit.root.position, this.tempVector2);

    if (u >= TIER3_MAGIC_THRESHOLDS.archmageImpactU && unit.hitsApplied === 0) {
      unit.hitsApplied = 1;
      const center = target.root.position;
      for (const enemy of this.deps.getLivingEnemies()) {
        this.tempVector3.copy(enemy.root.position).sub(center).setY(0);
        if (this.tempVector3.lengthSq() <= 1.05 ** 2) {
          this.deps.applyDamage(enemy, enemy === target ? 4 : 2, 'projectile', unit.root.position);
        }
      }
      this.deps.startHitStop(0.065);
      this.deps.startCameraShake(0.16, 0.055);
    }

    if (u >= 1) {
      unit.attackStartedAt = -Infinity;
      unit.attackTarget = null;
      unit.hitsApplied = 0;
      unit.root.position.copy(unit.home);
      unit.nextAttackAt = now + 1.36;
      setEquipmentSwing(unit, 0);
      resetBranchAccents(unit);
    }
  }

  private updateFrostMage(now: number, unit: AllyUnit): void {
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
      updateIdle(unit, now, 2.64 + unit.slotIndex * 0.17);
      const target = findNearest(unit, this.deps.getLivingEnemies());
      if (target) facePoint(unit, target.root.position);
      return;
    }

    const target = unit.attackTarget;
    const u = clamp01((now - unit.attackStartedAt) / TIER3_MAGIC_TIMING.frostMageAttack);
    const pose = getFrostMageAttackMotion(u);
    facePoint(unit, target.root.position);
    this.tempVector.copy(target.root.position).sub(unit.home).setY(0);
    if (this.tempVector.lengthSq() > 0.0001) this.tempVector.normalize();
    unit.root.position.copy(unit.home).addScaledVector(this.tempVector, pose.bodyOffset);
    applyUnitDeformation(unit, pose.deformation.squash, pose.deformation.stretch, pose.deformation.lean, pose.deformation.wobble, pose.deformation.jump);
    setEquipmentSwing(unit, pose.equipment.angle, pose.equipment.lift, pose.equipment.sweep);
    unit.root.updateMatrixWorld(true);
    (unit.spellOrigin ?? unit.equipmentAnchor).getWorldPosition(this.tempVector2);
    this.tempVector3.copy(target.root.position);
    this.tempVector3.y = 0.18;
    applyFrostMageSignatureVfx(unit.signatureVfx, pose, this.tempVector2, this.tempVector3);

    if (u >= TIER3_MAGIC_THRESHOLDS.frostImpactU && unit.hitsApplied === 0 && target.alive) {
      unit.hitsApplied = 1;
      this.deps.applyDamage(target, 3, 'projectile', unit.root.position);
      for (const enemy of this.deps.getLivingEnemies()) {
        if (enemy === target) continue;
        this.tempVector.copy(enemy.root.position).sub(target.root.position).setY(0);
        if (this.tempVector.lengthSq() <= 0.72 ** 2) this.deps.applyDamage(enemy, 1, 'projectile', target.root.position);
      }
      this.deps.startHitStop(0.045);
      this.deps.startCameraShake(0.10, 0.026);
    }

    if (u >= 1) {
      unit.attackStartedAt = -Infinity;
      unit.attackTarget = null;
      unit.hitsApplied = 0;
      unit.root.position.copy(unit.home);
      unit.nextAttackAt = now + 1.12;
      setEquipmentSwing(unit, 0);
      resetBranchAccents(unit);
    }
  }

  private updateNinja(now: number, unit: AllyUnit): void {
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

  private updateAssassin(now: number, unit: AllyUnit): void {
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

  private updateCannoneer(now: number, unit: AllyUnit): void {
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

  private updateEngineer(now: number, unit: AllyUnit): void {
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

  private updateShield(now: number, shield: AllyUnit): void {
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
  }

  private updateDagger(now: number, dagger: AllyUnit): void {
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
  }

  private updateWand(now: number, wand: AllyUnit): void {
    if (!wand.alive) return;
    if (wand.attackStartedAt !== -Infinity && !wand.attackTarget?.alive) {
      wand.attackStartedAt = -Infinity;
      wand.attackTarget = null;
      wand.shotApplied = false;
    }
    if (wand.attackStartedAt === -Infinity && now >= wand.nextAttackAt) {
      const target = findNearest(wand, this.deps.getLivingEnemies());
      if (target) {
        wand.attackStartedAt = now;
        wand.attackTarget = target;
        wand.shotApplied = false;
      }
    }
    if (wand.attackStartedAt === -Infinity || !wand.attackTarget) {
      wand.root.position.copy(wand.home);
      updateIdle(wand, now, 2.05 + wand.slotIndex * 0.29);
      const target = findNearest(wand, this.deps.getLivingEnemies());
      if (target) facePoint(wand, target.root.position);
      return;
    }
    const target = wand.attackTarget;
    const u = clamp01((now - wand.attackStartedAt) / SLIME_MOTION_TIMING.wandAttack);
    const pose = getWandAttackMotion(u);
    facePoint(wand, target.root.position);
    this.tempVector.copy(target.root.position).sub(wand.home).setY(0);
    if (this.tempVector.lengthSq() > 0.0001) this.tempVector.normalize();
    wand.root.position.copy(wand.home).addScaledVector(this.tempVector, pose.bodyOffset);
    applyUnitDeformation(wand, pose.deformation.squash, pose.deformation.stretch, pose.deformation.lean, pose.deformation.wobble, pose.deformation.jump);
    setEquipmentSwing(wand, pose.equipment.angle, pose.equipment.lift, pose.equipment.sweep);
    if (!wand.shotApplied && u >= SLIME_MOTION_THRESHOLDS.wandReleaseU) {
      wand.shotApplied = true;
      this.deps.effects.fireMagicOrb(wand, target);
    }
    if (u >= 1) {
      wand.attackStartedAt = -Infinity;
      wand.attackTarget = null;
      wand.root.position.copy(wand.home);
      wand.nextAttackAt = now + 0.92;
      setEquipmentSwing(wand, 0);
    }
  }

  private updateGun(now: number, gun: AllyUnit): void {
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
  }

  private updateBow(now: number, bow: AllyUnit): void {
    if (!bow.alive) return;
    if (bow.attackStartedAt !== -Infinity && !bow.attackTarget?.alive) {
      bow.attackStartedAt = -Infinity;
      bow.attackTarget = null;
      bow.shotApplied = false;
    }
    if (bow.attackStartedAt === -Infinity && now >= bow.nextAttackAt) {
      const target = findNearest(bow, this.deps.getLivingEnemies());
      if (target) {
        bow.attackStartedAt = now;
        bow.attackTarget = target;
        bow.shotApplied = false;
      }
    }
    if (bow.attackStartedAt === -Infinity || !bow.attackTarget) {
      bow.root.position.copy(bow.home);
      updateIdle(bow, now, 1.1 + bow.slotIndex * 0.31);
      const target = findNearest(bow, this.deps.getLivingEnemies());
      if (target) facePoint(bow, target.root.position);
      return;
    }

    const u = clamp01((now - bow.attackStartedAt) / SLIME_MOTION_TIMING.bowAttack);
    facePoint(bow, bow.attackTarget.root.position);
    const pose = getBowAttackMotion(u);
    applyUnitDeformation(bow, pose.deformation.squash, pose.deformation.stretch, pose.deformation.lean, pose.deformation.wobble, pose.deformation.jump);
    setEquipmentSwing(bow, pose.equipment.angle, pose.equipment.lift, pose.equipment.sweep);
    if (!bow.shotApplied && u >= SLIME_MOTION_THRESHOLDS.bowReleaseU) {
      bow.shotApplied = true;
      this.deps.effects.fireArrow(bow, bow.attackTarget);
    }
    if (u >= 1) {
      bow.attackStartedAt = -Infinity;
      bow.attackTarget = null;
      bow.nextAttackAt = now + 1.0;
      setEquipmentSwing(bow, 0);
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
      const target = findNearest(ranger, this.deps.getLivingEnemies());
      if (target) {
        ranger.attackStartedAt = now;
        ranger.attackTarget = target;
        ranger.hitsApplied = 0;
      }
    }
    if (ranger.attackStartedAt === -Infinity || !ranger.attackTarget) {
      ranger.root.position.copy(ranger.home);
      updateIdle(ranger, now, 1.32 + ranger.slotIndex * 0.27);
      const target = findNearest(ranger, this.deps.getLivingEnemies());
      if (target) facePoint(ranger, target.root.position);
      return;
    }

    const target = ranger.attackTarget;
    const u = clamp01((now - ranger.attackStartedAt) / SLIME_MOTION_TIMING.rangerAttack);
    const pose = getRangerAttackMotion(u);
    facePoint(ranger, target.root.position);
    this.tempVector.copy(target.root.position).sub(ranger.home).setY(0);
    if (this.tempVector.lengthSq() > 0.0001) this.tempVector.normalize();
    this.tempVector2.set(-this.tempVector.z, 0, this.tempVector.x);
    ranger.root.position.copy(ranger.home).addScaledVector(this.tempVector2, pose.lateralOffset);
    applyUnitDeformation(
      ranger,
      pose.deformation.squash,
      pose.deformation.stretch,
      pose.deformation.lean,
      pose.deformation.wobble,
      pose.deformation.jump,
    );
    setEquipmentSwing(ranger, pose.equipment.angle, pose.equipment.lift, pose.equipment.sweep);
    if (
      pose.shotProgress >= SLIME_MOTION_THRESHOLDS.bowReleaseU
      && ranger.hitsApplied === pose.shotIndex
      && target.alive
    ) {
      ranger.hitsApplied += 1;
      ranger.root.updateMatrixWorld(true);
      this.deps.effects.fireArrow(ranger, target);
    }
    if (u >= 1) {
      ranger.attackStartedAt = -Infinity;
      ranger.attackTarget = null;
      ranger.hitsApplied = 0;
      ranger.root.position.copy(ranger.home);
      setEquipmentSwing(ranger, 0);
      ranger.nextAttackAt = now + 0.68;
    }
  }

}
