import * as THREE from 'three';
import {
  SLIME_MOTION_THRESHOLDS,
  SLIME_MOTION_TIMING,
  clamp01,
  createGunBulletMesh,
  createGunnerTracerMesh,
  createMageOrbVfx,
  createMagicOrbMesh,
  createMuzzleFlashMesh,
  createSlimeArrowMesh,
  getArrowArcHeight,
} from '../slime-motion';
import {
  applyTimedMultiplier,
  distanceSqToSegment2D,
} from '../combat-effects';
import type {
  AllyUnit,
  EnemyProjectileRuntime,
  EnemyUnit,
  ImpactRuntime,
  MuzzleFlashRuntime,
  ProjectileRuntime,
  TracerRuntime,
} from './types';
import type { BattleSceneOwner } from './scene-owner';

export type BattleDamageSource = 'melee' | 'projectile' | 'enemy';

export interface BattleProjectileSystemOptions {
  sceneOwner: BattleSceneOwner;
  camera: THREE.PerspectiveCamera;
  now: () => number;
  getLivingEnemies: () => EnemyUnit[];
  applyDamage: (
    target: AllyUnit | EnemyUnit,
    amount: number,
    source: BattleDamageSource,
    sourcePosition: THREE.Vector3,
  ) => void;
}

export class BattleProjectileSystem {
  private readonly projectiles: ProjectileRuntime[] = [];
  private readonly enemyProjectiles: EnemyProjectileRuntime[] = [];
  private readonly muzzleFlashes: MuzzleFlashRuntime[] = [];
  private readonly tracers: TracerRuntime[] = [];
  private readonly impacts: ImpactRuntime[] = [];
  private readonly tempVector = new THREE.Vector3();
  private readonly tempVector2 = new THREE.Vector3();
  private readonly tempVector3 = new THREE.Vector3();

  constructor(private readonly options: BattleProjectileSystemOptions) {}

  createImpact(
    position: THREE.Vector3,
    color = '#fff1a5',
    size = 0.11,
    duration = 0.28,
  ): void {
    const group = new THREE.Group();
    group.position.copy(position);
    group.quaternion.copy(this.options.camera.quaternion);
    const materials: THREE.MeshBasicMaterial[] = [];
    const ringMaterial = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.92,
      side: THREE.DoubleSide,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
    });
    materials.push(ringMaterial);
    group.add(new THREE.Mesh(new THREE.RingGeometry(size * 0.52, size, 24), ringMaterial));
    for (let i = 0; i < 7; i += 1) {
      const angle = (i / 7) * Math.PI * 2 + 0.22;
      const material = ringMaterial.clone();
      materials.push(material);
      const spark = new THREE.Mesh(new THREE.PlaneGeometry(size * 0.12, size * 0.78), material);
      spark.position.set(Math.cos(angle) * size * 0.62, Math.sin(angle) * size * 0.62, 0.002);
      spark.rotation.z = angle - Math.PI / 2;
      group.add(spark);
    }
    this.options.sceneOwner.add(group);
    this.impacts.push({ group, materials, startedAt: this.options.now(), duration });
  }

  fireMagicOrb(
    wand: AllyUnit,
    target: EnemyUnit,
    splashRadius = 0,
    enhanced = false,
    slowEffect?: Readonly<{ durationSec: number; multiplier: number; radius: number }>,
    damage = 1,
    splashDamage = splashRadius > 0 ? 1 : 0,
  ): void {
    const root = enhanced ? createMageOrbVfx() : createMagicOrbMesh();
    (wand.spellOrigin ?? wand.equipmentAnchor).getWorldPosition(this.tempVector);
    const start = this.tempVector.clone();
    const end = target.root.position.clone().add(new THREE.Vector3(0, 0.28, 0));
    root.position.copy(start);
    root.visible = true;
    this.options.sceneOwner.add(root);
    this.projectiles.push({
      root,
      start,
      end,
      target,
      startedAt: this.options.now(),
      duration: SLIME_MOTION_TIMING.magicOrbFlight,
      hitApplied: false,
      damage,
      splashRadius,
      splashDamage,
      arcHeightScale: enhanced ? 0.58 : 0.45,
      orientToTravel: false,
      hitU: 0.92,
      ...(slowEffect === undefined ? {} : { slowEffect }),
    });
  }

  fireBullet(
    gun: AllyUnit,
    target: EnemyUnit,
    enhanced = false,
    options: Readonly<{
      damage?: number;
      splashRadius?: number;
      splashDamage?: number;
      arcHeightScale?: number;
      durationScale?: number;
    }> = {},
  ): void {
    const root = createGunBulletMesh();
    (gun.projectileOrigin ?? gun.equipmentAnchor).getWorldPosition(this.tempVector);
    const start = this.tempVector.clone();
    const end = target.root.position.clone().add(new THREE.Vector3(0, 0.25, 0));
    root.position.copy(start);
    root.visible = true;
    this.options.sceneOwner.add(root);
    this.projectiles.push({
      root,
      start,
      end,
      target,
      startedAt: this.options.now(),
      duration: SLIME_MOTION_TIMING.bulletFlight * (options.durationScale ?? 1),
      hitApplied: false,
      damage: options.damage ?? 1,
      splashRadius: options.splashRadius ?? 0,
      splashDamage: options.splashDamage ?? 0,
      arcHeightScale: options.arcHeightScale ?? 0,
      orientToTravel: false,
      hitU: 0.88,
    });

    const flash = createMuzzleFlashMesh();
    flash.visible = true;
    flash.position.copy(start);
    this.tempVector2.copy(end).sub(start).normalize();
    flash.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), this.tempVector2);
    flash.material.opacity = 0.95;
    this.options.sceneOwner.add(flash);
    this.muzzleFlashes.push({
      mesh: flash,
      startedAt: this.options.now(),
      duration: enhanced ? 0.14 : 0.11,
    });

    if (!enhanced) return;
    const tracer = createGunnerTracerMesh();
    this.tempVector2.copy(end).sub(start);
    const distance = this.tempVector2.length();
    if (distance <= 0.0001) {
      tracer.geometry.dispose();
      tracer.material.dispose();
      return;
    }

    tracer.visible = true;
    const tracerLength = Math.min(0.72, distance * 0.58);
    this.tempVector3.copy(this.tempVector2).normalize();
    tracer.position.copy(start).addScaledVector(this.tempVector3, tracerLength * 0.5);
    tracer.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), this.tempVector3);
    tracer.scale.y = tracerLength / 0.20;
    this.options.sceneOwner.add(tracer);
    this.tracers.push({ mesh: tracer, startedAt: this.options.now(), duration: 0.15 });
  }

  fireArrowProfile(
    bow: AllyUnit,
    target: EnemyUnit,
    duration: number,
    damage: number,
    arcHeightScale: number,
    hitU: number,
  ): void {
    this.fireArrow(bow, target, {
      damage,
      durationScale: duration / SLIME_MOTION_TIMING.arrowFlight,
      arcHeightScale,
      hitU,
    });
  }

  fireArrow(
    bow: AllyUnit,
    target: EnemyUnit,
    options: Readonly<{
      damage?: number;
      durationScale?: number;
      arcHeightScale?: number;
      hitU?: number;
      pierceDamage?: number;
      pierceWidth?: number;
    }> = {},
  ): void {
    const root = createSlimeArrowMesh();
    (bow.projectileOrigin ?? bow.equipmentAnchor).getWorldPosition(this.tempVector);
    const start = this.tempVector.clone();
    const end = target.root.position.clone().add(new THREE.Vector3(0, 0.28, 0));
    root.position.copy(start);
    this.options.sceneOwner.add(root);
    this.projectiles.push({
      root,
      start,
      end,
      target,
      startedAt: this.options.now(),
      duration: SLIME_MOTION_TIMING.arrowFlight * (options.durationScale ?? 1),
      hitApplied: false,
      damage: options.damage ?? 1,
      splashRadius: 0,
      splashDamage: 0,
      arcHeightScale: options.arcHeightScale ?? 1,
      orientToTravel: true,
      hitU: options.hitU ?? SLIME_MOTION_THRESHOLDS.arrowHitU,
      ...(options.pierceDamage === undefined ? {} : { pierceDamage: options.pierceDamage }),
      ...(options.pierceWidth === undefined ? {} : { pierceWidth: options.pierceWidth }),
    });
  }

  fireEnemyProjectile(enemy: EnemyUnit, target: AllyUnit): void {
    const projectile = enemy.motionProfile.projectile;
    if (!projectile) return;
    const root = projectile.createMesh();
    enemy.root.updateMatrixWorld(true);
    if (enemy.effectOrigin) enemy.effectOrigin.getWorldPosition(this.tempVector);
    else this.tempVector.copy(enemy.root.position).add(new THREE.Vector3(0, 0.34, 0));
    const start = this.tempVector.clone();
    const end = target.root.position.clone().add(new THREE.Vector3(0, 0.22, 0));
    root.position.copy(start);
    this.options.sceneOwner.add(root);
    this.enemyProjectiles.push({
      root,
      start,
      end,
      target,
      sourcePosition: enemy.root.position.clone(),
      damage: enemy.attackDamage,
      startedAt: this.options.now(),
      duration: projectile.flightSeconds,
      hitApplied: false,
      arcHeight: projectile.arcHeight,
    });
  }

  update(now: number): void {
    this.updateProjectiles(now);
    this.updateEnemyProjectiles(now);
    this.updateMuzzleFlashes(now);
    this.updateTracers(now);
    this.updateImpacts(now);
  }

  clearFlight(): void {
    this.projectiles.splice(0).forEach((projectile) => this.options.sceneOwner.remove(projectile.root));
    this.muzzleFlashes.splice(0).forEach((flash) => this.options.sceneOwner.remove(flash.mesh));
    this.tracers.splice(0).forEach((tracer) => this.options.sceneOwner.remove(tracer.mesh));
    this.enemyProjectiles.splice(0).forEach((projectile) => this.options.sceneOwner.remove(projectile.root));
  }

  clear(): void {
    this.clearFlight();
    this.impacts.splice(0).forEach((impact) => this.options.sceneOwner.remove(impact.group));
  }

  private updateProjectiles(now: number): void {
    for (let i = this.projectiles.length - 1; i >= 0; i -= 1) {
      const projectile = this.projectiles[i]!;
      const u = clamp01((now - projectile.startedAt) / projectile.duration);
      const targetPosition = projectile.target.root.position.clone().add(new THREE.Vector3(0, 0.26, 0));
      projectile.end.lerp(targetPosition, 0.22);
      projectile.root.position.lerpVectors(projectile.start, projectile.end, u);
      projectile.root.position.y += getArrowArcHeight(u) * projectile.arcHeightScale;
      if (projectile.orientToTravel) {
        this.tempVector.copy(projectile.end).sub(projectile.start).normalize();
        projectile.root.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), this.tempVector);
      }
      if (!projectile.hitApplied && u >= projectile.hitU) {
        projectile.hitApplied = true;
        if (projectile.target.alive) {
          this.options.applyDamage(projectile.target, projectile.damage, 'projectile', projectile.start);
          if (projectile.pierceDamage !== undefined && projectile.pierceWidth !== undefined) {
            const widthSq = projectile.pierceWidth ** 2;
            for (const enemy of this.options.getLivingEnemies()) {
              if (enemy === projectile.target) continue;
              const distanceSq = distanceSqToSegment2D(
                enemy.root.position.x,
                enemy.root.position.z,
                projectile.start.x,
                projectile.start.z,
                projectile.end.x,
                projectile.end.z,
              );
              if (distanceSq <= widthSq) {
                this.options.applyDamage(enemy, projectile.pierceDamage, 'projectile', projectile.start);
              }
            }
            this.createImpact(
              projectile.target.root.position.clone().add(new THREE.Vector3(0, 0.22, 0)),
              '#e8fbff',
              0.10,
            );
          }
          if (projectile.slowEffect !== undefined) {
            const radiusSq = projectile.slowEffect.radius ** 2;
            for (const enemy of this.options.getLivingEnemies()) {
              this.tempVector.copy(enemy.root.position).sub(projectile.target.root.position).setY(0);
              if (this.tempVector.lengthSq() > radiusSq) continue;
              enemy.moveSpeedEffect = applyTimedMultiplier(
                enemy.moveSpeedEffect,
                now,
                projectile.slowEffect.durationSec,
                projectile.slowEffect.multiplier,
              );
            }
            this.createImpact(
              projectile.target.root.position.clone().add(new THREE.Vector3(0, 0.16, 0)),
              '#9cecff',
              0.16,
            );
          }
          if (projectile.splashRadius > 0) {
            const splashRadiusSq = projectile.splashRadius ** 2;
            for (const enemy of this.options.getLivingEnemies()) {
              if (enemy === projectile.target) continue;
              this.tempVector.copy(enemy.root.position).sub(projectile.target.root.position).setY(0);
              if (this.tempVector.lengthSq() <= splashRadiusSq) {
                this.options.applyDamage(
                  enemy,
                  projectile.splashDamage,
                  'projectile',
                  projectile.target.root.position,
                );
              }
            }
            this.createImpact(
              projectile.target.root.position.clone().add(new THREE.Vector3(0, 0.20, 0)),
              '#b88cff',
              0.12,
            );
          }
        }
      }
      if (u >= 1) {
        this.options.sceneOwner.remove(projectile.root);
        this.projectiles.splice(i, 1);
      }
    }
  }

  private updateMuzzleFlashes(now: number): void {
    for (let i = this.muzzleFlashes.length - 1; i >= 0; i -= 1) {
      const flash = this.muzzleFlashes[i]!;
      const u = clamp01((now - flash.startedAt) / flash.duration);
      flash.mesh.visible = u < 1;
      flash.mesh.scale.setScalar(0.70 + u * 0.55);
      flash.mesh.material.opacity = (1 - u) * 0.95;
      if (u >= 1) {
        this.options.sceneOwner.remove(flash.mesh);
        this.muzzleFlashes.splice(i, 1);
      }
    }
  }

  private updateTracers(now: number): void {
    for (let i = this.tracers.length - 1; i >= 0; i -= 1) {
      const tracer = this.tracers[i]!;
      const u = clamp01((now - tracer.startedAt) / tracer.duration);
      tracer.mesh.material.opacity = (1 - u) * 0.96;
      tracer.mesh.scale.x = 1 + u * 0.55;
      tracer.mesh.scale.z = 1 + u * 0.55;
      if (u >= 1) {
        this.options.sceneOwner.remove(tracer.mesh);
        this.tracers.splice(i, 1);
      }
    }
  }

  private updateEnemyProjectiles(now: number): void {
    for (let i = this.enemyProjectiles.length - 1; i >= 0; i -= 1) {
      const projectile = this.enemyProjectiles[i]!;
      const u = clamp01((now - projectile.startedAt) / projectile.duration);
      if (projectile.target.alive) {
        this.tempVector.copy(projectile.target.root.position).add(new THREE.Vector3(0, 0.22, 0));
        projectile.end.lerp(this.tempVector, 0.2);
      }
      projectile.root.position.lerpVectors(projectile.start, projectile.end, u);
      projectile.root.position.y += projectile.arcHeight(u);
      projectile.root.rotation.y = now * 7.5;
      projectile.root.rotation.z = now * 4.2;
      if (!projectile.hitApplied && u >= 0.86) {
        projectile.hitApplied = true;
        if (projectile.target.alive) {
          this.options.applyDamage(
            projectile.target,
            projectile.damage,
            'enemy',
            projectile.sourcePosition,
          );
        }
      }
      if (u >= 1) {
        this.options.sceneOwner.remove(projectile.root);
        this.enemyProjectiles.splice(i, 1);
      }
    }
  }

  private updateImpacts(now: number): void {
    for (let i = this.impacts.length - 1; i >= 0; i -= 1) {
      const impact = this.impacts[i]!;
      const u = clamp01((now - impact.startedAt) / impact.duration);
      impact.group.scale.setScalar(1 + u * 1.35);
      impact.materials.forEach((material) => {
        material.opacity = (1 - u) * 0.92;
      });
      impact.group.quaternion.copy(this.options.camera.quaternion);
      if (u >= 1) {
        this.options.sceneOwner.remove(impact.group);
        this.impacts.splice(i, 1);
      }
    }
  }
}
