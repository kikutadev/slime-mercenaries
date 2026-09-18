import * as THREE from 'three';
import { resolveTimedMultiplier } from '../combat-effects';
import { applyEnemySecondaryPose } from '../enemy-motion';
import {
  getBossApproachPresentation,
  getEnemyApproachEntryPose,
} from '../battle-approach';
import { clamp01 } from '../slime-motion';
import { MELEE_BODY_GAP } from './layout';
import type { BattleProjectileSystem } from './projectile-system';
import type { AllyUnit, BattleSnapshot, EnemyUnit } from './types';
import {
  enemyTargetPosition,
  facePoint,
  findNearest,
} from './unit-presentation';

export interface BattleEnemyCombatSystemOptions {
  projectileSystem: BattleProjectileSystem;
  phase: () => BattleSnapshot['phase'];
  phaseStartedAt: () => number;
  getLivingAllies: () => AllyUnit[];
  applyDamage: (
    target: AllyUnit | EnemyUnit,
    amount: number,
    source: 'melee' | 'projectile' | 'enemy',
    sourcePosition: THREE.Vector3,
  ) => void;
  startCameraShake: (duration: number, amplitude: number) => void;
}

export class BattleEnemyCombatSystem {
  private readonly tempVector = new THREE.Vector3();

  constructor(private readonly options: BattleEnemyCombatSystemOptions) {}

  updateApproach(enemies: readonly EnemyUnit[], now: number): void {
    enemies.forEach((enemy) => this.updateApproachIdle(enemy, now));
  }

  updateCombat(enemies: readonly EnemyUnit[], now: number): void {
    enemies.forEach((enemy) => this.updateUnit(enemy, now));
  }

  updateDefeats(enemies: readonly EnemyUnit[], now: number): void {
    enemies.forEach((enemy) => this.updateDefeat(enemy, now));
  }

  private targetPosition(target: AllyUnit): THREE.Vector3 {
    return enemyTargetPosition(target, this.options.phase());
  }

  private updateApproachIdle(enemy: EnemyUnit, now: number): void {
    if (!enemy.alive || enemy.state === 'defeat' || enemy.state === 'dead') return;
    const entry = getEnemyApproachEntryPose(
      now - this.options.phaseStartedAt(),
      enemy.index,
      enemy.formationSlot,
      enemy.scaleClass,
    );
    enemy.root.position.copy(enemy.home);
    enemy.root.position.z += entry.zOffset;
    const pose = enemy.motionProfile.idle(now, enemy.index * 0.73);
    enemy.root.position.y = pose.jump + entry.yOffset;
    const bossPresentation = enemy.scaleClass === 'boss'
      ? getBossApproachPresentation(now - this.options.phaseStartedAt())
      : null;
    const bossSquash = bossPresentation?.squash ?? 0;
    enemy.root.scale.set(
      enemy.baseScale * pose.scaleX * entry.scale * (1 + bossSquash * 0.055),
      enemy.baseScale * pose.scaleY * entry.scale * (1 - bossSquash * 0.12),
      enemy.baseScale * pose.scaleZ * entry.scale * (1 + bossSquash * 0.055),
    );
    const target = findNearest(enemy, this.options.getLivingAllies());
    if (target) facePoint(enemy, this.targetPosition(target));
    enemy.root.rotation.z = pose.wobbleZ;
    applyEnemySecondaryPose(enemy.rigParts, enemy.rigRest, pose.secondary);
    enemy.shadow.position.set(enemy.root.position.x, 0.011, enemy.root.position.z);
    enemy.shadow.scale.set(1.35 * entry.shadowScale, 0.68 * entry.shadowScale, 1);
    enemy.shadow.material.opacity = entry.shadowOpacity;
  }

  private updateUnit(enemy: EnemyUnit, now: number): void {
    if (enemy.state === 'defeat' || enemy.state === 'dead') {
      this.updateDefeat(enemy, now);
      return;
    }
    const dt = enemy.lastUpdateAt > 0
      ? Math.min(0.05, Math.max(0, now - enemy.lastUpdateAt))
      : 0;
    enemy.lastUpdateAt = now;
    const target = enemy.attackTarget?.alive
      ? enemy.attackTarget
      : findNearest(enemy, this.options.getLivingAllies());
    if (!target) return;

    if (enemy.attackStartedAt !== -Infinity) {
      this.updateAttack(enemy, now);
      return;
    }

    const targetPosition = this.targetPosition(target);
    facePoint(enemy, targetPosition);
    this.tempVector.copy(targetPosition).sub(enemy.root.position).setY(0);
    const distance = this.tempVector.length();
    if (distance > enemy.attackRange) {
      this.tempVector.normalize();
      const moveMultiplier = resolveTimedMultiplier(enemy.moveSpeedEffect, now);
      let step = Math.min(
        distance - enemy.attackRange,
        enemy.moveSpeed * moveMultiplier * dt,
      );
      if (target.behaviorId === 'sword-melee' && this.options.phase() === 'combat') {
        const actualDistance = Math.hypot(
          target.root.position.x - enemy.root.position.x,
          target.root.position.z - enemy.root.position.z,
        );
        step = Math.min(step, Math.max(0, actualDistance - MELEE_BODY_GAP));
      }
      enemy.root.position.addScaledVector(this.tempVector, step);
      const pose = enemy.motionProfile.move(now, enemy.index * 0.19);
      enemy.root.position.y = pose.jump;
      enemy.root.scale.set(
        enemy.baseScale * pose.scaleX,
        enemy.baseScale * pose.scaleY,
        enemy.baseScale * pose.scaleZ,
      );
      enemy.root.rotation.z = pose.wobbleZ;
      applyEnemySecondaryPose(enemy.rigParts, enemy.rigRest, pose.secondary);
    } else {
      enemy.root.position.y = 0;
      const idle = enemy.motionProfile.idle(now, enemy.index * 0.73);
      const hitU = clamp01((now - enemy.hitStartedAt) / 0.2);
      const hit = enemy.motionProfile.hit(hitU, enemy.index % 2 === 0 ? -1 : 1);
      const hitActive = enemy.hitStartedAt > 0 && hitU < 1;
      enemy.root.scale.set(
        enemy.baseScale * idle.scaleX * (hitActive ? hit.scaleX : 1),
        enemy.baseScale * idle.scaleY * (hitActive ? hit.scaleY : 1),
        enemy.baseScale * idle.scaleZ * (hitActive ? hit.scaleZ : 1),
      );
      enemy.root.rotation.z = idle.wobbleZ + (hitActive ? hit.rotationZ : 0);
      applyEnemySecondaryPose(
        enemy.rigParts,
        enemy.rigRest,
        hitActive ? hit.secondary : idle.secondary,
      );
      if (now >= enemy.nextAttackAt) {
        enemy.attackStartedAt = now;
        enemy.attackOrigin.copy(enemy.root.position);
        enemy.attackTarget = target;
        enemy.attackHitApplied = false;
        enemy.attackTelegraphPosition.copy(target.root.position);
        enemy.attackTelegraphPosition.y = 0.014;
        enemy.nextAttackAt = now + enemy.attackInterval + enemy.index * 0.07;
      }
    }
    enemy.shadow.position.set(enemy.root.position.x, 0.011, enemy.root.position.z);
    const airborne = clamp01(enemy.root.position.y / 0.14);
    enemy.shadow.scale.set(
      1.35 * THREE.MathUtils.lerp(1, 0.72, airborne),
      0.68 * THREE.MathUtils.lerp(1, 0.72, airborne),
      1,
    );
    enemy.shadow.material.opacity = THREE.MathUtils.lerp(0.22, 0.12, airborne);
  }

  private updateAttack(enemy: EnemyUnit, now: number): void {
    const target = enemy.attackTarget;
    if (!target?.alive) {
      enemy.attackStartedAt = -Infinity;
      enemy.attackTarget = null;
      enemy.root.position.copy(enemy.attackOrigin);
      if (enemy.attackTelegraph) enemy.attackTelegraph.visible = false;
      return;
    }
    const duration = enemy.motionProfile.attackDuration;
    const u = clamp01((now - enemy.attackStartedAt) / duration);
    const pose = enemy.motionProfile.attack(u);
    const targetPosition = target.root.position;
    this.tempVector.copy(targetPosition).sub(enemy.attackOrigin).setY(0);
    const distance = this.tempVector.length();
    if (this.tempVector.lengthSq() > 0.0001) this.tempVector.normalize();
    const maxTravel = Math.max(0, distance - MELEE_BODY_GAP);
    const travelBase = enemy.motionProfile.projectile
      ? enemy.motionProfile.attackTravelDistance
      : Math.min(distance * 0.42, enemy.motionProfile.attackTravelDistance, maxTravel);
    enemy.root.position
      .copy(enemy.attackOrigin)
      .addScaledVector(this.tempVector, travelBase * pose.travel);
    enemy.root.position.y = pose.jump;
    enemy.root.scale.set(
      enemy.baseScale * pose.scaleX,
      enemy.baseScale * pose.scaleY,
      enemy.baseScale * pose.scaleZ,
    );
    facePoint(enemy, targetPosition);
    enemy.root.rotation.z = pose.wobbleZ;
    applyEnemySecondaryPose(enemy.rigParts, enemy.rigRest, pose.secondary);

    const attackVfx = enemy.motionProfile.attackVfx;
    if (attackVfx !== undefined && enemy.attackTelegraph !== null) {
      const vfxPose = attackVfx.pose(u);
      enemy.attackTelegraph.visible = vfxPose.telegraphOpacity > 0.001 && u < 1;
      enemy.attackTelegraph.position.copy(enemy.attackTelegraphPosition);
      enemy.attackTelegraph.position.y = 0.014;
      enemy.attackTelegraph.scale.setScalar(vfxPose.telegraphScale);
      enemy.attackTelegraph.material.opacity = vfxPose.telegraphOpacity;
      enemy.attackTelegraph.rotation.z = now * 0.22;
    }

    if (!enemy.attackHitApplied && u >= enemy.motionProfile.contactU) {
      enemy.attackHitApplied = true;
      if (attackVfx !== undefined) {
        const impactPosition = enemy.attackTelegraphPosition.clone();
        impactPosition.y = 0.10;
        this.options.projectileSystem.createImpact(
          impactPosition,
          attackVfx.impactColor,
          attackVfx.impactSize,
          0.34,
        );
        this.options.startCameraShake(
          attackVfx.cameraShakeDuration,
          attackVfx.cameraShakeAmplitude,
        );
      }
      if (enemy.motionProfile.projectile) {
        this.options.projectileSystem.fireEnemyProjectile(enemy, target);
      } else {
        this.options.applyDamage(target, enemy.attackDamage, 'enemy', enemy.root.position);
      }
    }
    if (u >= 1) {
      enemy.attackStartedAt = -Infinity;
      enemy.attackTarget = null;
      enemy.attackHitApplied = false;
      if (enemy.attackTelegraph) enemy.attackTelegraph.visible = false;
      enemy.root.position.copy(enemy.attackOrigin);
      enemy.root.position.y = 0;
      enemy.root.rotation.z = 0;
    }
  }

  private updateDefeat(enemy: EnemyUnit, now: number): void {
    if (enemy.state !== 'defeat') return;
    const u = clamp01(
      (now - enemy.defeatStartedAt) / enemy.motionProfile.defeatDuration,
    );
    const side = enemy.index % 2 === 0 ? -1 : 1;
    const pose = enemy.motionProfile.defeat(u, side);
    enemy.root.rotation.z = pose.rotationZ;
    enemy.root.position.x = enemy.attackOrigin.x + pose.lateralDrift;
    enemy.root.position.z = enemy.attackOrigin.z - pose.backwardDrift;
    enemy.root.position.y = pose.yOffset;
    enemy.root.scale.setScalar(enemy.baseScale * pose.opacity);
    enemy.bodyRoot.scale.set(
      enemy.bodyBaseScale.x * pose.scaleX,
      enemy.bodyBaseScale.y * pose.scaleY,
      enemy.bodyBaseScale.z * pose.scaleZ,
    );
    applyEnemySecondaryPose(enemy.rigParts, enemy.rigRest, pose.secondary);
    if (enemy.faceRoot) {
      enemy.faceRoot.position.copy(enemy.faceBasePosition);
      enemy.faceRoot.position.y += 0.055
        * Math.sin(Math.min(1, u / 0.72) * Math.PI * 0.5);
      enemy.faceRoot.position.z += 0.38
        * Math.sin(Math.min(1, u / 0.72) * Math.PI * 0.5);
      enemy.faceRoot.scale.copy(enemy.faceBaseScale);
    }
    enemy.shadow.material.opacity = 0.22 * pose.opacity;
    if (u >= 1) {
      enemy.root.visible = false;
      enemy.shadow.visible = false;
      enemy.state = 'dead';
    }
  }
}
