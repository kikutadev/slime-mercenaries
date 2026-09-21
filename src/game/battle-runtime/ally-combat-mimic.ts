import * as THREE from 'three';
import { clamp01 } from '../slime-motion';
import {
  applyUnitDeformation,
  facePoint,
  findNearest,
  updateIdle,
} from './unit-presentation';
import type { BattleAllyCombatDependencies } from './ally-combat-deps';
import type { AllyUnit } from './types';

const ATTACK_SECONDS = 0.92;
const HIT_U = 0.48;

function smoothstep(edge0: number, edge1: number, value: number): number {
  const t = Math.max(0, Math.min(1, (value - edge0) / Math.max(0.0001, edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

export class MimicCombatFamily {
  private readonly direction = new THREE.Vector3();

  constructor(private readonly deps: BattleAllyCombatDependencies) {}

  updateMimic(now: number, unit: AllyUnit): void {
    if (!unit.alive) return;

    if (unit.attackStartedAt !== -Infinity && !unit.attackTarget?.alive) {
      this.finish(now, unit);
    }
    if (unit.attackStartedAt === -Infinity && now >= unit.nextAttackAt) {
      const target = findNearest(unit, this.deps.getLivingEnemies());
      if (target) {
        unit.attackStartedAt = now;
        unit.attackTarget = target;
        unit.hitsApplied = 0;
      }
    }

    if (unit.attackStartedAt === -Infinity || unit.attackTarget === null) {
      unit.root.position.copy(unit.combatAnchor);
      this.setLidOpen(unit, 0.05 + Math.sin(now * 2.1 + unit.slotIndex) * 0.025);
      updateIdle(unit, now, 0.77 + unit.slotIndex * 0.19);
      const target = findNearest(unit, this.deps.getLivingEnemies());
      if (target) facePoint(unit, target.root.position);
      return;
    }

    const target = unit.attackTarget;
    const u = clamp01((now - unit.attackStartedAt) / ATTACK_SECONDS);
    const surprise = smoothstep(0.25, 0.48, u) * (1 - smoothstep(0.72, 1, u));
    const recoil = Math.sin(Math.min(1, u / 0.30) * Math.PI) * 0.08;

    this.direction.copy(target.root.position).sub(unit.combatAnchor).setY(0);
    if (this.direction.lengthSq() > 0.0001) this.direction.normalize();
    unit.root.position.copy(unit.combatAnchor).addScaledVector(this.direction, surprise * 0.46);
    facePoint(unit, target.root.position);
    this.setLidOpen(unit, surprise);
    applyUnitDeformation(
      unit,
      u < 0.28 ? 0.18 * (u / 0.28) : -0.08 * surprise,
      0.24 * surprise,
      -0.08 + surprise * 0.13,
      recoil,
      surprise * 0.12,
    );

    if (u >= HIT_U && unit.hitsApplied === 0 && target.alive) {
      unit.hitsApplied = 1;
      this.deps.applyDamage(target, 3, 'melee', unit.root.position);
      this.deps.effects.createImpact(target.root.position.clone().add(new THREE.Vector3(0, 0.22, 0)), '#ffd36e', 0.11);
      this.deps.startHitStop(0.045);
      this.deps.startCameraShake(0.08, 0.025);
    }

    if (u >= 1 || !target.alive) this.finish(now, unit);
  }

  private setLidOpen(unit: AllyUnit, open: number): void {
    unit.equipmentAnchor.quaternion.copy(unit.equipmentBaseQuaternion);
    unit.equipmentAnchor.rotateX(-Math.max(0, Math.min(1, open)) * 1.36);
  }

  private finish(now: number, unit: AllyUnit): void {
    unit.attackStartedAt = -Infinity;
    unit.attackTarget = null;
    unit.hitsApplied = 0;
    unit.root.position.copy(unit.combatAnchor);
    this.setLidOpen(unit, 0);
    unit.nextAttackAt = now + 0.58;
  }
}
