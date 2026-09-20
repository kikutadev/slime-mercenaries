import * as THREE from 'three';
import {
  applyDeformationPose,
  applyEquipmentPose,
  applyMageRunePose,
  clearMorphs,
  type IdleMotionPose,
  type MorphMesh,
  type SlimeEquipmentMotionKind,
} from '../game/slime-motion';
import { createAllyDefeatEyes } from '../game/battle-runtime/unit-visuals';
import type { SlimeGalleryDefinition } from './types';

export interface GalleryModelParts {
  body: MorphMesh | null;
  faceRoot: THREE.Object3D | null;
  equipment: THREE.Object3D | null;
  secondaryEquipment: THREE.Object3D | null;
  mageRune: THREE.Object3D | null;
  weaponTip: THREE.Object3D | null;
  projectileOrigin: THREE.Object3D | null;
  spellOrigin: THREE.Object3D | null;
  auxiliaryRoot: THREE.Object3D | null;
  auxiliaryMuzzle: THREE.Object3D | null;
  normalEyes: THREE.Object3D[];
  xEyes: THREE.Object3D[];
  bodyBaseScale: THREE.Vector3;
  faceBasePosition: THREE.Vector3;
  faceBaseScale: THREE.Vector3;
  equipmentBaseQuaternion: THREE.Quaternion;
  equipmentBasePosition: THREE.Vector3;
  secondaryEquipmentBaseQuaternion: THREE.Quaternion;
  secondaryEquipmentBasePosition: THREE.Vector3;
  mageRuneBaseQuaternion: THREE.Quaternion;
  mageRuneBaseScale: THREE.Vector3;
  auxiliaryBasePosition: THREE.Vector3;
  auxiliaryBaseQuaternion: THREE.Quaternion;
  auxiliaryBaseScale: THREE.Vector3;
}

export function collectGalleryModelParts(
  model: THREE.Object3D,
  definition: SlimeGalleryDefinition,
): GalleryModelParts {
  const body = model.getObjectByName('Body') as MorphMesh | null;
  const faceRoot = model.getObjectByName('FaceRoot') ?? null;
  const equipment = definition.equipmentAnchor
    ? model.getObjectByName(definition.equipmentAnchor) ?? null
    : null;
  const secondaryEquipment = model.getObjectByName('OffhandAnchor') ?? null;
  const mageRune = model.getObjectByName('MageRuneAnchor') ?? null;
  const weaponTip = definition.weaponTipName
    ? model.getObjectByName(definition.weaponTipName) ?? null
    : null;
  const projectileOrigin = model.getObjectByName('ProjectileOrigin') ?? null;
  const spellOrigin = model.getObjectByName('SpellOrigin') ?? null;
  const auxiliaryRoot = definition.id === 'engineer'
    ? model.getObjectByName('EngineerTurretRoot') ?? null
    : null;
  const auxiliaryMuzzle = definition.id === 'engineer'
    ? model.getObjectByName('EngineerTurretMuzzle') ?? null
    : definition.id === 'cannoneer'
      ? model.getObjectByName('CannoneerMuzzle') ?? null
      : null;
  const { normalEyes, xEyes } = createAllyDefeatEyes(model);

  return {
    body,
    faceRoot,
    equipment,
    secondaryEquipment,
    mageRune,
    weaponTip,
    projectileOrigin,
    spellOrigin,
    auxiliaryRoot,
    auxiliaryMuzzle,
    normalEyes,
    xEyes,
    bodyBaseScale: body?.scale.clone() ?? new THREE.Vector3(1, 1, 1),
    faceBasePosition: faceRoot?.position.clone() ?? new THREE.Vector3(),
    faceBaseScale: faceRoot?.scale.clone() ?? new THREE.Vector3(1, 1, 1),
    equipmentBaseQuaternion: equipment?.quaternion.clone() ?? new THREE.Quaternion(),
    equipmentBasePosition: equipment?.position.clone() ?? new THREE.Vector3(),
    secondaryEquipmentBaseQuaternion: secondaryEquipment?.quaternion.clone() ?? new THREE.Quaternion(),
    secondaryEquipmentBasePosition: secondaryEquipment?.position.clone() ?? new THREE.Vector3(),
    mageRuneBaseQuaternion: mageRune?.quaternion.clone() ?? new THREE.Quaternion(),
    mageRuneBaseScale: mageRune?.scale.clone() ?? new THREE.Vector3(1, 1, 1),
    auxiliaryBasePosition: auxiliaryRoot?.position.clone() ?? new THREE.Vector3(),
    auxiliaryBaseQuaternion: auxiliaryRoot?.quaternion.clone() ?? new THREE.Quaternion(),
    auxiliaryBaseScale: auxiliaryRoot?.scale.clone() ?? new THREE.Vector3(1, 1, 1),
  };
}

export function resetGalleryModelParts(parts: GalleryModelParts): void {
  clearMorphs(parts.body);
  parts.body?.scale.copy(parts.bodyBaseScale);
  if (parts.faceRoot) {
    parts.faceRoot.position.copy(parts.faceBasePosition);
    parts.faceRoot.scale.copy(parts.faceBaseScale);
  }
  parts.equipment?.quaternion.copy(parts.equipmentBaseQuaternion);
  if (parts.equipment) parts.equipment.position.copy(parts.equipmentBasePosition);
  parts.secondaryEquipment?.quaternion.copy(parts.secondaryEquipmentBaseQuaternion);
  if (parts.secondaryEquipment) {
    parts.secondaryEquipment.position.copy(parts.secondaryEquipmentBasePosition);
  }
  applyMageRunePose(parts.mageRune, parts.mageRuneBaseQuaternion, parts.mageRuneBaseScale, 0, 0);
  if (parts.auxiliaryRoot) {
    parts.auxiliaryRoot.position.copy(parts.auxiliaryBasePosition);
    parts.auxiliaryRoot.quaternion.copy(parts.auxiliaryBaseQuaternion);
    parts.auxiliaryRoot.scale.copy(parts.auxiliaryBaseScale);
    parts.auxiliaryRoot.visible = false;
  }
  parts.normalEyes.forEach((eye) => { eye.visible = true; });
  parts.xEyes.forEach((eye) => { eye.visible = false; });
}

export function applyGalleryPose(
  parts: GalleryModelParts,
  definition: SlimeGalleryDefinition,
  pose: IdleMotionPose,
): void {
  applyDeformationPose(parts.body, parts.faceRoot, pose.deformation);
  applyEquipmentPose(
    parts.equipment,
    parts.equipmentBaseQuaternion,
    parts.equipmentBasePosition,
    galleryEquipmentKind(definition),
    pose.equipment,
  );
}

export function galleryEquipmentKind(definition: SlimeGalleryDefinition): SlimeEquipmentMotionKind {
  if (definition.modelKind === 'bow') return 'bow';
  if (definition.modelKind === 'shield') return 'shield';
  if (definition.modelKind === 'wand') return 'wand';
  if (definition.modelKind === 'dagger') return 'dagger';
  if (definition.modelKind === 'gun') return 'gun';
  return 'sword';
}
