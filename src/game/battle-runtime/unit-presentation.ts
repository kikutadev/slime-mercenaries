import * as THREE from 'three';
import {
  applyDeformationPose,
  applyEquipmentPose,
  applyMageRunePose,
  clamp01,
  getHopTravelMotion,
  getIdleMotion,
  type SlimeEquipmentMotionKind,
} from '../slime-motion';
import { applyGuardPulseVfx, applyMageCastSigil } from '../slime-vfx';
import { MELEE_BODY_GAP } from './layout';
import type { AllyUnit, BattleSnapshot, EnemyUnit } from './types';

export function setMorph(unit: AllyUnit, name: string, value: number): void {
  const index = unit.body.morphTargetDictionary?.[name];
  if (index === undefined || !unit.body.morphTargetInfluences) return;
  unit.body.morphTargetInfluences[index] = clamp01(value);
}

export function clearMorphs(unit: AllyUnit): void {
  unit.body.morphTargetInfluences?.fill(0);
}

export function facePoint(unit: AllyUnit | EnemyUnit, point: THREE.Vector3): void {
  const dx = point.x - unit.root.position.x;
  const dz = point.z - unit.root.position.z;
  unit.root.rotation.y = Math.atan2(dx, dz);
}

export function applyUnitDeformation(
  unit: AllyUnit,
  squash = 0,
  stretch = 0,
  lean = 0,
  wobble = 0,
  jump = 0,
): void {
  applyDeformationPose(unit.body, unit.faceRoot, { squash, stretch, lean, wobble, jump });
  const airborne = clamp01(jump / 0.16);
  const airScale = THREE.MathUtils.lerp(1, 0.66, airborne);
  unit.shadow.position.x = unit.root.position.x;
  unit.shadow.position.z = unit.root.position.z + 0.01;
  unit.shadow.scale.set(1.35 * airScale, 0.68 * airScale, 1);
  unit.shadow.material.opacity = THREE.MathUtils.lerp(0.22, 0.08, airborne);
}

export function equipmentKindFor(unit: AllyUnit): SlimeEquipmentMotionKind {
  switch (unit.behaviorId) {
    case 'bow-ranged':
    case 'ranger-double-shot':
    case 'sniper-pierce':
    case 'storm-archer-volley': return 'bow';
    case 'fighter-combo':
    case 'blademaster-dash':
    case 'berserker-heavy': return 'sword';
    case 'shield-defender':
    case 'guardian-guard':
    case 'paladin-barrier':
    case 'fortress-plant': return 'shield';
    case 'wand-magic':
    case 'mage-aoe':
    case 'archmage-burst':
    case 'frost-mage-control': return 'wand';
    case 'dagger-skirmisher':
    case 'rogue-twin-strike':
    case 'ninja-vanish':
    case 'assassin-execute': return 'dagger';
    case 'gun-ranged':
    case 'gunner-burst':
    case 'cannoneer-shell':
    case 'engineer-turret': return 'gun';
    default: return 'sword';
  }
}

export function isMeleeBehavior(unit: AllyUnit): boolean {
  return unit.behaviorId === 'sword-melee'
    || unit.behaviorId === 'fighter-combo'
    || unit.behaviorId === 'blademaster-dash'
    || unit.behaviorId === 'berserker-heavy'
    || unit.behaviorId === 'shield-defender'
    || unit.behaviorId === 'guardian-guard'
    || unit.behaviorId === 'paladin-barrier'
    || unit.behaviorId === 'fortress-plant'
    || unit.behaviorId === 'dagger-skirmisher'
    || unit.behaviorId === 'rogue-twin-strike'
    || unit.behaviorId === 'ninja-vanish'
    || unit.behaviorId === 'assassin-execute';
}

export function setEquipmentSwing(unit: AllyUnit, angle: number, lift = 0, sweep = 0): void {
  applyEquipmentPose(
    unit.equipmentAnchor,
    unit.equipmentBaseQuaternion,
    unit.equipmentBasePosition,
    equipmentKindFor(unit),
    { angle, lift, sweep },
  );
}

export function setSecondaryEquipmentSwing(unit: AllyUnit, angle: number, lift = 0, sweep = 0): void {
  applyEquipmentPose(
    unit.secondaryEquipmentAnchor,
    unit.secondaryEquipmentBaseQuaternion,
    unit.secondaryEquipmentBasePosition,
    'dagger',
    { angle, lift, sweep },
  );
}

export function resetBranchAccents(unit: AllyUnit): void {
  unit.root.visible = true;
  setSecondaryEquipmentSwing(unit, 0);
  applyMageRunePose(unit.mageRuneAnchor, unit.mageRuneBaseQuaternion, unit.mageRuneBaseScale, 0, 0);
  applyGuardPulseVfx(unit.guardPulseVfx, 0, 1);
  applyMageCastSigil(unit.mageCastSigil, 0, 0);
  if (unit.rogueSlashArc) {
    unit.rogueSlashArc.visible = false;
    unit.rogueSlashArc.material.opacity = 0;
  }
  if (unit.signatureVfx) unit.signatureVfx.visible = false;
  if (unit.auxiliaryRoot) {
    unit.auxiliaryRoot.position.copy(unit.auxiliaryBasePosition);
    unit.auxiliaryRoot.quaternion.copy(unit.auxiliaryBaseQuaternion);
    unit.auxiliaryRoot.scale.copy(unit.auxiliaryBaseScale);
    unit.auxiliaryRoot.visible = false;
  }
}

export function updateIdle(unit: AllyUnit, now: number, phaseOffset = 0): void {
  if (!unit.alive) return;
  unit.body.scale.copy(unit.bodyBaseScale);
  resetBranchAccents(unit);
  if (unit.faceRoot) unit.faceRoot.position.copy(unit.faceBasePosition);
  const pose = getIdleMotion(now, phaseOffset);
  applyUnitDeformation(
    unit,
    pose.deformation.squash,
    pose.deformation.stretch,
    pose.deformation.lean,
    pose.deformation.wobble,
    pose.deformation.jump,
  );
  setEquipmentSwing(unit, pose.equipment.angle, pose.equipment.lift, pose.equipment.sweep);
}

export function updateHopTravel(
  unit: AllyUnit,
  now: number,
  startTime: number,
  start: THREE.Vector3,
  end: THREE.Vector3,
  duration: number,
): boolean {
  const u = clamp01((now - startTime) / duration);
  const pose = getHopTravelMotion(u);
  unit.root.position.lerpVectors(start, end, pose.eased);
  unit.root.position.y = THREE.MathUtils.lerp(start.y, end.y, pose.eased) + pose.deformation.jump;
  applyUnitDeformation(
    unit,
    pose.deformation.squash,
    pose.deformation.stretch,
    pose.deformation.lean,
    pose.deformation.wobble,
    pose.deformation.jump,
  );
  setEquipmentSwing(unit, pose.equipment.angle, pose.equipment.lift, pose.equipment.sweep);
  facePoint(unit, end);
  return u >= 1;
}

export function safeMeleeForwardOffset(
  anchor: THREE.Vector3,
  direction: THREE.Vector3,
  desiredOffset: number,
  enemies: readonly EnemyUnit[],
): number {
  if (desiredOffset <= 0) return desiredOffset;
  let safeOffset = desiredOffset;
  for (const enemy of enemies) {
    if (!enemy.alive) continue;
    const dx = anchor.x - enemy.root.position.x;
    const dz = anchor.z - enemy.root.position.z;
    const projection = dx * direction.x + dz * direction.z;
    const c = dx * dx + dz * dz - MELEE_BODY_GAP * MELEE_BODY_GAP;
    const discriminant = projection * projection - c;
    if (discriminant <= 0) continue;
    const root = Math.sqrt(discriminant);
    const enter = -projection - root;
    const exit = -projection + root;
    if (enter <= 0 && exit > 0) return 0;
    if (enter > 0 && safeOffset > enter) safeOffset = enter;
  }
  return Math.max(0, safeOffset - 0.002);
}

export function enemyTargetPosition(
  target: AllyUnit,
  phase: BattleSnapshot['phase'],
): THREE.Vector3 {
  if (isMeleeBehavior(target) && phase === 'combat') return target.combatAnchor;
  return target.root.position;
}

export function findNearest<T extends AllyUnit | EnemyUnit>(
  source: AllyUnit | EnemyUnit,
  candidates: readonly T[],
): T | null {
  let nearest: T | null = null;
  let nearestDistanceSq = Infinity;
  for (const candidate of candidates) {
    if (!candidate.alive || !candidate.root.visible) continue;
    const dx = candidate.root.position.x - source.root.position.x;
    const dz = candidate.root.position.z - source.root.position.z;
    const distanceSq = dx * dx + dz * dz;
    if (distanceSq < nearestDistanceSq) {
      nearestDistanceSq = distanceSq;
      nearest = candidate;
    }
  }
  return nearest;
}
