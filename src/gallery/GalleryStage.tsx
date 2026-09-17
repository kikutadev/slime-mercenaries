import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber';
import { Suspense, useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import {
  SLIME_MOTION_TIMING,
  SLIME_MOTION_THRESHOLDS,
  applyDeformationPose,
  applyEquipmentPose,
  clearMorphs,
  clamp01,
  createGreatswordSpinArc,
  createGunBulletMesh,
  createMagicOrbMesh,
  createMuzzleFlashMesh,
  createSlimeArrowMesh,
  createSwordSlashArc,
  getAllyDefeatMotion,
  getArrowArcHeight,
  getBowAttackMotion,
  getDaggerAttackMotion,
  getFighterAttackMotion,
  getGreatswordAttackMotion,
  getGreatswordSpinVfxPose,
  getGunAttackMotion,
  getHopTravelMotion,
  getIdleMotion,
  getRangerAttackMotion,
  getRangerShotReleaseU,
  getShieldAttackMotion,
  getSwordAttackMotion,
  getWandAttackMotion,
  getSwordSlashVfxPose,
  type MorphMesh,
  type SlimeEquipmentMotionKind,
} from '../game/slime-motion';
import { EnemyGalleryStage } from './EnemyGalleryStage';
import type { GalleryCameraId, GalleryMotionId, SlimeGalleryDefinition } from './types';

interface ModelParts {
  body: MorphMesh | null;
  faceRoot: THREE.Object3D | null;
  equipment: THREE.Object3D | null;
  weaponTip: THREE.Object3D | null;
  projectileOrigin: THREE.Object3D | null;
  spellOrigin: THREE.Object3D | null;
  normalEyes: THREE.Object3D[];
  xEyes: THREE.Group[];
  bodyBaseScale: THREE.Vector3;
  faceBasePosition: THREE.Vector3;
  faceBaseScale: THREE.Vector3;
  equipmentBaseQuaternion: THREE.Quaternion;
  equipmentBasePosition: THREE.Vector3;
}

interface StageProps {
  definition: SlimeGalleryDefinition;
  motion: GalleryMotionId;
  speed: number;
  loop: boolean;
  cameraMode: GalleryCameraId;
  showDummy: boolean;
  replayKey: number;
}

const PRODUCTION_SCALE = 0.19;
const GALLERY_HOME = new THREE.Vector3(0, 0.02, 0.38);
const BATTLE_CAMERA_POSITION = new THREE.Vector3(2.8, 5.35, 8.9);
const BATTLE_CAMERA_LOOK_AT = new THREE.Vector3(0, 0.38, -1.05);
const BATTLE_CAMERA_OFFSET = BATTLE_CAMERA_POSITION.clone().sub(BATTLE_CAMERA_LOOK_AT);
const yAxis = new THREE.Vector3(0, 1, 0);
const tempA = new THREE.Vector3();
const tempB = new THREE.Vector3();
const tempQ = new THREE.Quaternion();

function buildDefeatEyes(model: THREE.Object3D): { normalEyes: THREE.Object3D[]; xEyes: THREE.Group[] } {
  const normalEyes = ['Eye_L', 'Eye_R']
    .map((name) => model.getObjectByName(name))
    .filter((eye): eye is THREE.Object3D => Boolean(eye));
  const xEyes: THREE.Group[] = [];
  for (const eye of normalEyes) {
    const group = new THREE.Group();
    group.name = `${eye.name}_GalleryDefeatX`;
    group.position.copy(eye.position);
    group.position.z += 0.068;
    const geometry = new THREE.BoxGeometry(0.28, 0.052, 0.034);
    const material = new THREE.MeshBasicMaterial({ color: '#201925' });
    for (const rotation of [-Math.PI / 4, Math.PI / 4]) {
      const bar = new THREE.Mesh(geometry, material);
      bar.rotation.z = rotation;
      group.add(bar);
    }
    group.visible = false;
    eye.parent?.add(group);
    xEyes.push(group);
  }
  return { normalEyes, xEyes };
}

function collectParts(model: THREE.Object3D, definition: SlimeGalleryDefinition): ModelParts {
  const body = model.getObjectByName('Body') as MorphMesh | null;
  const faceRoot = model.getObjectByName('FaceRoot') ?? null;
  const equipment = definition.equipmentAnchor ? model.getObjectByName(definition.equipmentAnchor) ?? null : null;
  const weaponTip = definition.weaponTipName ? model.getObjectByName(definition.weaponTipName) ?? null : null;
  const projectileOrigin = model.getObjectByName('ProjectileOrigin') ?? null;
  const spellOrigin = model.getObjectByName('SpellOrigin') ?? null;
  const { normalEyes, xEyes } = buildDefeatEyes(model);
  return {
    body,
    faceRoot,
    equipment,
    weaponTip,
    projectileOrigin,
    spellOrigin,
    normalEyes,
    xEyes,
    bodyBaseScale: body?.scale.clone() ?? new THREE.Vector3(1, 1, 1),
    faceBasePosition: faceRoot?.position.clone() ?? new THREE.Vector3(),
    faceBaseScale: faceRoot?.scale.clone() ?? new THREE.Vector3(1, 1, 1),
    equipmentBaseQuaternion: equipment?.quaternion.clone() ?? new THREE.Quaternion(),
    equipmentBasePosition: equipment?.position.clone() ?? new THREE.Vector3(),
  };
}

function equipmentKind(definition: SlimeGalleryDefinition): SlimeEquipmentMotionKind {
  if (definition.modelKind === 'bow') return 'bow';
  if (definition.modelKind === 'shield') return 'shield';
  if (definition.modelKind === 'wand') return 'wand';
  if (definition.modelKind === 'dagger') return 'dagger';
  if (definition.modelKind === 'gun') return 'gun';
  return 'sword';
}

function targetDistanceFor(definition: SlimeGalleryDefinition): number {
  if (definition.modelKind === 'bow' || definition.modelKind === 'wand' || definition.modelKind === 'gun') return 1.55;
  if (definition.modelKind === 'shield') return 0.82;
  return 0.95;
}

function resetParts(parts: ModelParts): void {
  clearMorphs(parts.body);
  parts.body?.scale.copy(parts.bodyBaseScale);
  if (parts.faceRoot) {
    parts.faceRoot.position.copy(parts.faceBasePosition);
    parts.faceRoot.scale.copy(parts.faceBaseScale);
  }
  parts.equipment?.quaternion.copy(parts.equipmentBaseQuaternion);
  if (parts.equipment) parts.equipment.position.copy(parts.equipmentBasePosition);
  parts.normalEyes.forEach((eye) => { eye.visible = true; });
  parts.xEyes.forEach((eye) => { eye.visible = false; });
}

function applyPose(parts: ModelParts, definition: SlimeGalleryDefinition, pose: ReturnType<typeof getIdleMotion>): void {
  applyDeformationPose(parts.body, parts.faceRoot, pose.deformation);
  applyEquipmentPose(
    parts.equipment,
    parts.equipmentBaseQuaternion,
    parts.equipmentBasePosition,
    equipmentKind(definition),
    pose.equipment,
  );
}

function clipDuration(motion: GalleryMotionId, definition: SlimeGalleryDefinition): number {
  if (motion === 'move') return 1.55;
  if (motion === 'defeat') return SLIME_MOTION_TIMING.allyDefeat;
  if (motion === 'attack') {
    if (definition.id === 'fighter') return SLIME_MOTION_TIMING.fighterAttack;
    if (definition.id === 'ranger') {
      return SLIME_MOTION_TIMING.rangerAttack * getRangerShotReleaseU(1) + SLIME_MOTION_TIMING.arrowFlight;
    }
    if (definition.modelKind === 'greatsword') return SLIME_MOTION_TIMING.greatswordAttack;
    if (definition.modelKind === 'bow') {
      const releaseAt = SLIME_MOTION_TIMING.bowAttack * SLIME_MOTION_THRESHOLDS.bowReleaseU;
      return releaseAt + SLIME_MOTION_TIMING.arrowFlight;
    }
    if (definition.modelKind === 'shield') return SLIME_MOTION_TIMING.shieldAttack;
    if (definition.modelKind === 'wand') {
      const releaseAt = SLIME_MOTION_TIMING.wandAttack * SLIME_MOTION_THRESHOLDS.wandReleaseU;
      return releaseAt + SLIME_MOTION_TIMING.magicOrbFlight;
    }
    if (definition.modelKind === 'dagger') return SLIME_MOTION_TIMING.daggerAttack;
    if (definition.modelKind === 'gun') {
      const releaseAt = SLIME_MOTION_TIMING.gunAttack * SLIME_MOTION_THRESHOLDS.gunReleaseU;
      return releaseAt + SLIME_MOTION_TIMING.bulletFlight;
    }
    return SLIME_MOTION_TIMING.swordAttack;
  }
  return 2.4;
}

function CameraRig({ mode, motion, definition }: { mode: GalleryCameraId; motion: GalleryMotionId; definition: SlimeGalleryDefinition }) {
  const { camera, size } = useThree();
  useEffect(() => {
    const compact = size.width < 620 ? 1.20 : 1;
    const lookAt = GALLERY_HOME.clone().setY(0.28);
    const yaw = THREE.MathUtils.degToRad(definition.inspectionFacingYawDegrees ?? 0);
    const inspectForward = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw)).normalize();
    const inspectRight = new THREE.Vector3(-inspectForward.z, 0, inspectForward.x).normalize();
    const targetDistance = targetDistanceFor(definition);

    if (mode === 'gameplay') {
      camera.position.copy(lookAt).addScaledVector(BATTLE_CAMERA_OFFSET, 0.34 * compact);
      camera.lookAt(lookAt);
    } else if (mode === 'front') {
      camera.position.set(0, 0.82, 2.15 * compact);
      camera.lookAt(lookAt);
    } else if (motion === 'attack') {
      const ranged = targetDistance >= 1.4;
      const focusFraction = ranged ? 0.44 : 0.42;
      const midpoint = GALLERY_HOME.clone().addScaledVector(inspectForward, targetDistance * focusFraction);
      midpoint.y = 0.26;
      const sideDistance = (ranged ? 2.85 : 2.35) * compact;
      const forwardDistance = (ranged ? 0.92 : 0.82) * compact;
      const height = (ranged ? 0.96 : 0.88) * compact;
      camera.position.copy(midpoint)
        .addScaledVector(inspectRight, sideDistance)
        .addScaledVector(inspectForward, forwardDistance)
        .add(new THREE.Vector3(0, height, 0));
      camera.lookAt(midpoint);
    } else {
      camera.position.copy(GALLERY_HOME)
        .addScaledVector(inspectRight, (definition.inspectionSideDistance ?? 1.52) * compact)
        .addScaledVector(inspectForward, 0.50 * compact)
        .add(new THREE.Vector3(0, 0.72 * compact, 0));
      camera.lookAt(lookAt);
    }
    camera.updateProjectionMatrix();
  }, [camera, definition, mode, motion, size.width]);
  return null;
}

function GalleryModel({ definition, motion, speed, loop, cameraMode, showDummy, replayKey }: StageProps) {
  const gltf = useLoader(GLTFLoader, `${import.meta.env.BASE_URL}${definition.asset}`);
  const model = useMemo(() => gltf.scene.clone(true), [gltf.scene]);
  const parts = useMemo(() => collectParts(model, definition), [definition, model]);
  const rootRef = useRef<THREE.Group>(null);
  const dummyRef = useRef<THREE.Group>(null);
  const slash = useMemo(() => createSwordSlashArc(), []);
  const spin = useMemo(() => createGreatswordSpinArc(), []);
  const arrow = useMemo(() => createSlimeArrowMesh(), []);
  const magicOrb = useMemo(() => createMagicOrbMesh(), []);
  const bullet = useMemo(() => createGunBulletMesh(), []);
  const muzzleFlash = useMemo(() => createMuzzleFlashMesh(), []);
  const startedAt = useRef(0);
  const previousReplayKey = useRef(replayKey);
  const inspectionYaw = THREE.MathUtils.degToRad(definition.inspectionFacingYawDegrees ?? 0);

  const forward = useMemo(() => {
    if (cameraMode === 'inspection') {
      return new THREE.Vector3(Math.sin(inspectionYaw), 0, Math.cos(inspectionYaw)).normalize();
    }
    return new THREE.Vector3(0, 0, -1);
  }, [cameraMode, inspectionYaw]);
  const baseYaw = cameraMode === 'inspection' ? inspectionYaw : Math.PI;

  useEffect(() => {
    model.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.castShadow = true;
        object.receiveShadow = true;
      }
    });
    document.documentElement.dataset.galleryModelLoaded = definition.id;
    return () => {
      if (document.documentElement.dataset.galleryModelLoaded === definition.id) {
        delete document.documentElement.dataset.galleryModelLoaded;
      }
    };
  }, [definition.id, model]);

  useEffect(() => () => {
    slash.geometry.dispose();
    slash.material.dispose();
    spin.geometry.dispose();
    spin.material.dispose();
    magicOrb.geometry.dispose();
    magicOrb.material.dispose();
    bullet.geometry.dispose();
    bullet.material.dispose();
    muzzleFlash.geometry.dispose();
    muzzleFlash.material.dispose();
  }, [bullet, magicOrb, muzzleFlash, slash, spin]);

  useFrame(({ clock, camera }) => {
    const root = rootRef.current;
    if (!root) return;
    if (previousReplayKey.current !== replayKey) {
      previousReplayKey.current = replayKey;
      startedAt.current = clock.elapsedTime;
    }

    resetParts(parts);
    root.position.copy(GALLERY_HOME);
    root.rotation.set(0, baseYaw, 0);
    root.scale.setScalar(PRODUCTION_SCALE);

    const targetDistance = targetDistanceFor(definition);
    const dummyHome = tempA.copy(GALLERY_HOME).addScaledVector(forward, targetDistance).clone();
    if (dummyRef.current) {
      dummyRef.current.visible = showDummy && cameraMode !== 'front' && motion === 'attack';
      dummyRef.current.position.copy(dummyHome);
      dummyRef.current.rotation.set(0, Math.atan2(-forward.x, -forward.z), 0);
      dummyRef.current.scale.set(1, 1, 1);
    }
    slash.visible = false; slash.material.opacity = 0;
    spin.visible = false; spin.material.opacity = 0;
    arrow.visible = false;
    magicOrb.visible = false;
    bullet.visible = false;
    muzzleFlash.visible = false;
    muzzleFlash.material.opacity = 0;

    const duration = clipDuration(motion, definition);
    const elapsed = Math.max(0, (clock.elapsedTime - startedAt.current) * speed);
    const local = loop ? elapsed % duration : Math.min(elapsed, duration);

    if (motion === 'idle') {
      const phase = definition.modelKind === 'bow' ? 1.1 : 0.2;
      applyPose(parts, definition, getIdleMotion(local, phase));
      return;
    }

    if (motion === 'move') {
      const u = clamp01(local / 1.55);
      const pose = getHopTravelMotion(u);
      root.position.copy(GALLERY_HOME).addScaledVector(forward, pose.eased * 0.74);
      root.position.y = GALLERY_HOME.y + pose.deformation.jump;
      applyPose(parts, definition, pose);
      return;
    }

    if (motion === 'defeat') {
      const u = clamp01(local / SLIME_MOTION_TIMING.allyDefeat);
      const pose = getAllyDefeatMotion(u, -1);
      root.position.y = THREE.MathUtils.lerp(GALLERY_HOME.y, 0.005, 0.18);
      root.rotation.z = pose.rootRotationZ;
      if (parts.body) {
        parts.body.scale.set(
          parts.bodyBaseScale.x * pose.bodyScaleX,
          parts.bodyBaseScale.y * pose.bodyScaleY,
          parts.bodyBaseScale.z * pose.bodyScaleZ,
        );
      }
      parts.normalEyes.forEach((eye) => { eye.visible = false; });
      parts.xEyes.forEach((eye) => { eye.visible = true; });
      applyEquipmentPose(
        parts.equipment,
        parts.equipmentBaseQuaternion,
        parts.equipmentBasePosition,
        equipmentKind(definition),
        pose.equipment,
      );
      return;
    }

    if (definition.id === 'ranger') {
      const attackTime = Math.min(local, SLIME_MOTION_TIMING.rangerAttack);
      const attackU = clamp01(attackTime / SLIME_MOTION_TIMING.rangerAttack);
      if (attackTime < SLIME_MOTION_TIMING.rangerAttack) {
        const pose = getRangerAttackMotion(attackU);
        tempB.set(-forward.z, 0, forward.x);
        root.position.copy(GALLERY_HOME).addScaledVector(tempB, pose.lateralOffset);
        applyPose(parts, definition, pose);
      } else {
        applyPose(parts, definition, getIdleMotion(local, 1.32));
      }
      for (const shotIndex of [0, 1] as const) {
        const releaseAt = SLIME_MOTION_TIMING.rangerAttack * getRangerShotReleaseU(shotIndex);
        if (local < releaseAt || local >= releaseAt + SLIME_MOTION_TIMING.arrowFlight) continue;
        const flightU = clamp01((local - releaseAt) / SLIME_MOTION_TIMING.arrowFlight);
        root.updateMatrixWorld(true);
        if (parts.projectileOrigin) parts.projectileOrigin.getWorldPosition(tempA);
        else if (parts.equipment) parts.equipment.getWorldPosition(tempA);
        else tempA.copy(root.position);
        tempB.copy(dummyHome).add(new THREE.Vector3(0, 0.28, 0));
        arrow.visible = true;
        arrow.position.lerpVectors(tempA, tempB, flightU);
        arrow.position.y += getArrowArcHeight(flightU);
        tempQ.setFromUnitVectors(yAxis, tempB.clone().sub(tempA).normalize());
        arrow.quaternion.copy(tempQ);
        break;
      }
      return;
    }

    if (definition.modelKind === 'bow') {
      const attackTime = Math.min(local, SLIME_MOTION_TIMING.bowAttack);
      const attackU = clamp01(attackTime / SLIME_MOTION_TIMING.bowAttack);
      if (attackTime < SLIME_MOTION_TIMING.bowAttack) {
        applyPose(parts, definition, getBowAttackMotion(attackU));
      } else {
        applyPose(parts, definition, getIdleMotion(local, 1.1));
      }
      const releaseAt = SLIME_MOTION_TIMING.bowAttack * SLIME_MOTION_THRESHOLDS.bowReleaseU;
      if (local >= releaseAt) {
        const flightU = clamp01((local - releaseAt) / SLIME_MOTION_TIMING.arrowFlight);
        root.updateMatrixWorld(true);
        if (parts.equipment) parts.equipment.getWorldPosition(tempA);
        else tempA.copy(root.position);
        tempB.copy(dummyHome).add(new THREE.Vector3(0, 0.28, 0));
        arrow.visible = flightU < 1;
        arrow.position.lerpVectors(tempA, tempB, flightU);
        arrow.position.y += getArrowArcHeight(flightU);
        tempQ.setFromUnitVectors(yAxis, tempB.clone().sub(tempA).normalize());
        arrow.quaternion.copy(tempQ);
      }
      return;
    }

    if (definition.modelKind === 'shield') {
      const u = clamp01(local / SLIME_MOTION_TIMING.shieldAttack);
      const pose = getShieldAttackMotion(u);
      root.position.copy(GALLERY_HOME).addScaledVector(forward, pose.bodyOffset);
      applyPose(parts, definition, pose);
      return;
    }

    if (definition.modelKind === 'wand') {
      const attackTime = Math.min(local, SLIME_MOTION_TIMING.wandAttack);
      const attackU = clamp01(attackTime / SLIME_MOTION_TIMING.wandAttack);
      applyPose(parts, definition, getWandAttackMotion(attackU));
      root.updateMatrixWorld(true);
      const releaseAt = SLIME_MOTION_TIMING.wandAttack * SLIME_MOTION_THRESHOLDS.wandReleaseU;
      if (local >= releaseAt) {
        const flightU = clamp01((local - releaseAt) / SLIME_MOTION_TIMING.magicOrbFlight);
        if (parts.spellOrigin) parts.spellOrigin.getWorldPosition(tempA);
        else tempA.copy(root.position);
        tempB.copy(dummyHome).add(new THREE.Vector3(0, 0.28, 0));
        magicOrb.visible = flightU < 1;
        magicOrb.position.lerpVectors(tempA, tempB, flightU);
        magicOrb.position.y += getArrowArcHeight(flightU) * 0.45;
      }
      return;
    }

    if (definition.modelKind === 'dagger') {
      const u = clamp01(local / SLIME_MOTION_TIMING.daggerAttack);
      const pose = getDaggerAttackMotion(u);
      root.position.copy(GALLERY_HOME).addScaledVector(forward, pose.bodyOffset);
      applyPose(parts, definition, pose);
      return;
    }

    if (definition.modelKind === 'gun') {
      const attackTime = Math.min(local, SLIME_MOTION_TIMING.gunAttack);
      const attackU = clamp01(attackTime / SLIME_MOTION_TIMING.gunAttack);
      const pose = getGunAttackMotion(attackU);
      root.position.copy(GALLERY_HOME).addScaledVector(forward, pose.bodyOffset);
      applyPose(parts, definition, pose);
      root.updateMatrixWorld(true);
      const releaseAt = SLIME_MOTION_TIMING.gunAttack * SLIME_MOTION_THRESHOLDS.gunReleaseU;
      if (local >= releaseAt) {
        const flightU = clamp01((local - releaseAt) / SLIME_MOTION_TIMING.bulletFlight);
        if (parts.projectileOrigin) parts.projectileOrigin.getWorldPosition(tempA);
        else tempA.copy(root.position);
        tempB.copy(dummyHome).add(new THREE.Vector3(0, 0.25, 0));
        bullet.visible = flightU < 1;
        bullet.position.lerpVectors(tempA, tempB, flightU);
        if (pose.muzzlePulse > 0.01) {
          muzzleFlash.visible = true;
          muzzleFlash.position.copy(tempA);
          tempQ.setFromUnitVectors(yAxis, tempB.clone().sub(tempA).normalize());
          muzzleFlash.quaternion.copy(tempQ);
          muzzleFlash.scale.setScalar(0.65 + pose.muzzlePulse * 0.75);
          muzzleFlash.material.opacity = pose.muzzlePulse * 0.95;
        }
      }
      return;
    }

    if (definition.id === 'fighter') {
      const u = clamp01(local / SLIME_MOTION_TIMING.fighterAttack);
      const pose = getFighterAttackMotion(u);
      root.position.copy(GALLERY_HOME).addScaledVector(forward, pose.bodyOffset);
      applyPose(parts, definition, pose);
      root.updateMatrixWorld(true);
      if (pose.releaseProgress >= 0 && parts.weaponTip) {
        parts.weaponTip.getWorldPosition(tempA);
        const slashVfx = getSwordSlashVfxPose(pose.releaseProgress);
        slash.visible = slashVfx.visible;
        slash.position.copy(tempA);
        slash.position.y += 0.012;
        slash.quaternion.copy(camera.quaternion);
        slash.rotation.z = pose.slashDirection > 0 ? slashVfx.rotationZ : (-slashVfx.rotationZ - 0.28);
        slash.scale.set(slashVfx.scaleX, slashVfx.scaleY, 1);
        slash.material.opacity = slashVfx.opacity;
      }
      return;
    }

    if (definition.modelKind === 'greatsword') {
      const u = clamp01(local / SLIME_MOTION_TIMING.greatswordAttack);
      const pose = getGreatswordAttackMotion(u);
      root.rotation.y = baseYaw + pose.rootYawOffset;
      applyPose(parts, definition, pose);
      const spinVfx = getGreatswordSpinVfxPose(pose, 2);
      if (spinVfx.visible) {
        spin.visible = true;
        spin.position.copy(root.position).addScaledVector(forward, 0.28);
        spin.position.y = 0.30;
        spin.quaternion.copy(camera.quaternion);
        spin.rotation.z = spinVfx.rotationZ;
        spin.scale.set(spinVfx.scaleX, spinVfx.scaleY, 1);
        spin.material.opacity = spinVfx.opacity;
      }
      return;
    }

    const u = clamp01(local / SLIME_MOTION_TIMING.swordAttack);
    const pose = getSwordAttackMotion(u);
    root.position.copy(GALLERY_HOME).addScaledVector(forward, pose.bodyOffset);
    applyPose(parts, definition, pose);
    root.updateMatrixWorld(true);
    if (pose.releaseProgress >= 0 && parts.weaponTip) {
      parts.weaponTip.getWorldPosition(tempA);
      const slashVfx = getSwordSlashVfxPose(pose.releaseProgress);
      slash.visible = slashVfx.visible;
      slash.position.copy(tempA);
      slash.position.y += 0.012;
      slash.quaternion.copy(camera.quaternion);
      slash.rotation.z = slashVfx.rotationZ;
      slash.scale.set(slashVfx.scaleX, slashVfx.scaleY, 1);
      slash.material.opacity = slashVfx.opacity;
    }
  });

  return (
    <>
      <group ref={rootRef}><primitive object={model} /></group>
      <group ref={dummyRef}>
        <mesh castShadow position={[0, 0.22, 0]} scale={[0.25, 0.22, 0.24]}>
          <sphereGeometry args={[1, 28, 20]} />
          <meshStandardMaterial color="#9c6a8f" roughness={0.68} />
        </mesh>
        <mesh position={[-0.055, 0.26, 0.21]}><sphereGeometry args={[0.026, 12, 8]} /><meshBasicMaterial color="#251d2a" /></mesh>
        <mesh position={[0.055, 0.26, 0.21]}><sphereGeometry args={[0.026, 12, 8]} /><meshBasicMaterial color="#251d2a" /></mesh>
      </group>
      <primitive object={slash} />
      <primitive object={spin} />
      <primitive object={arrow} />
      <primitive object={magicOrb} />
      <primitive object={bullet} />
      <primitive object={muzzleFlash} />
    </>
  );
}

export function GalleryStage(props: StageProps) {
  if (props.definition.entityKind === 'enemy') return <EnemyGalleryStage {...props} />;
  return (
    <div className="gallery-stage" aria-label={`${props.definition.name} motion preview`}>
      <Canvas
        camera={{ fov: 31, near: 0.05, far: 40, position: [1.25, 0.92, 2.0] }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        shadows
      >
        <color attach="background" args={['#eff5e8']} />
        <fog attach="fog" args={['#eff5e8', 5.5, 11]} />
        <ambientLight intensity={2.0} />
        <directionalLight position={[-3, 5, 4]} intensity={4.1} castShadow />
        <CameraRig mode={props.cameraMode} motion={props.motion} definition={props.definition} />
        <Suspense fallback={null}>
          <GalleryModel {...props} />
        </Suspense>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.15, -0.005, 0]} receiveShadow>
          <circleGeometry args={[1.55, 64]} />
          <meshStandardMaterial color="#d8e8cd" roughness={1} />
        </mesh>
      </Canvas>
      <div className="gallery-stage__badge">{props.definition.implementationStatus === 'implemented' ? 'PRODUCTION MOTION' : 'MODEL REVIEW'}</div>
    </div>
  );
}
