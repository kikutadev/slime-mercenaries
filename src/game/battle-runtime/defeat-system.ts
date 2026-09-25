import * as THREE from 'three';

import {
  SLIME_MOTION_TIMING,
  clamp01,
  getAllyDefeatMotion,
} from '../slime-motion';
import {
  applyEnemyDefeatFacePose,
  applyEnemySecondaryPose,
} from '../enemy-motion';
import { SCALE } from './layout';
import {
  clearMorphs,
  resetBranchAccents,
  setEquipmentSwing,
} from './unit-presentation';
import {
  compensateAllyDefeatEyeScale,
  setAllyDefeatEyes,
  setEnemyDefeatEyes,
} from './unit-visuals';
import type { AllyUnit, EnemyUnit } from './types';

export function beginAllyDefeat(
  unit: AllyUnit,
  now: number,
  playSound: (cue: 'ally-defeat') => void,
): void {
  if (!unit.alive) return;
  unit.alive = false;
  unit.state = 'defeat';
  unit.defeatStartedAt = now;
  resetBranchAccents(unit);
  setAllyDefeatEyes(unit, true);
  playSound('ally-defeat');
}

export function beginEnemyDefeat(
  enemy: EnemyUnit,
  now: number,
  playSound: (cue: 'enemy-defeat') => void,
): void {
  if (!enemy.alive) return;
  enemy.alive = false;
  enemy.state = 'defeat';
  enemy.defeatStartedAt = now;
  enemy.attackOrigin.copy(enemy.root.position);
  enemy.attackStartedAt = -Infinity;
  enemy.attackTarget = null;
  if (enemy.attackTelegraph) enemy.attackTelegraph.visible = false;
  setEnemyDefeatEyes(enemy.normalEyes, enemy.xEyes, true);
  playSound('enemy-defeat');
}

export function updateAllyDefeat(unit: AllyUnit, now: number): void {
  if (unit.state !== 'defeat') return;

  const u = clamp01((now - unit.defeatStartedAt) / SLIME_MOTION_TIMING.allyDefeat);
  const side = unit.slotIndex % 2 === 0 ? -1 : 1;
  const pose = getAllyDefeatMotion(u, side);

  unit.root.position.y = THREE.MathUtils.lerp(unit.root.position.y, 0.005, 0.18);
  unit.root.rotation.z = pose.rootRotationZ;
  unit.body.scale.set(
    unit.bodyBaseScale.x * pose.bodyScaleX,
    unit.bodyBaseScale.y * pose.bodyScaleY,
    unit.bodyBaseScale.z * pose.bodyScaleZ,
  );
  if (unit.faceRoot) {
    unit.faceRoot.scale.set(pose.bodyScaleX, pose.bodyScaleY, pose.bodyScaleZ);
  }
  compensateAllyDefeatEyeScale(unit, pose.bodyScaleX, pose.bodyScaleY, pose.bodyScaleZ);
  setEquipmentSwing(unit, pose.equipment.angle, pose.equipment.lift, pose.equipment.sweep);
  if (u >= 1) unit.state = 'dead';
}

export function updateEnemyDefeat(enemy: EnemyUnit, now: number): void {
  if (enemy.state !== 'defeat') return;

  const u = clamp01((now - enemy.defeatStartedAt) / enemy.motionProfile.defeatDuration);
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
  applyEnemyDefeatFacePose(
    enemy.faceRoot,
    enemy.bodyRoot,
    enemy.faceBasePosition,
    enemy.faceBaseScale,
    pose,
  );
  enemy.shadow.material.opacity = 0.22 * pose.opacity;

  if (u >= 1) {
    enemy.root.visible = false;
    enemy.shadow.visible = false;
    enemy.state = 'dead';
  }
}

export function resetAllyForEncounter(unit: AllyUnit): void {
  unit.hp = unit.maxHp;
  unit.alive = true;
  unit.state = 'idle';
  unit.defeatStartedAt = -Infinity;
  unit.hitStartedAt = -Infinity;
  unit.nextAttackAt = 0;
  unit.attackStartedAt = -Infinity;
  unit.attackTarget = null;
  unit.hitsApplied = 0;
  unit.shotApplied = false;
  unit.root.visible = true;
  unit.root.position.copy(unit.home);
  unit.root.rotation.set(0, 0, 0);
  unit.root.scale.setScalar(SCALE);
  unit.body.scale.copy(unit.bodyBaseScale);
  if (unit.faceRoot) {
    unit.faceRoot.scale.set(1, 1, 1);
    unit.faceRoot.position.copy(unit.faceBasePosition);
  }
  clearMorphs(unit);
  setEquipmentSwing(unit, 0);
  resetBranchAccents(unit);
  setAllyDefeatEyes(unit, false);
  unit.shadow.visible = true;
  unit.shadow.material.opacity = 0.22;
  unit.healthBar.visible = true;
}
