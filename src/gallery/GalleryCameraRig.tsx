import { useThree } from '@react-three/fiber';
import { useEffect } from 'react';
import * as THREE from 'three';
import { GALLERY_HOME } from './gallery-layout';
import { galleryTargetDistance } from './gallery-timing';
import type { GalleryCameraId, GalleryMotionId, SlimeGalleryDefinition } from './types';

const BATTLE_CAMERA_POSITION = new THREE.Vector3(2.8, 5.35, 8.9);
const BATTLE_CAMERA_LOOK_AT = new THREE.Vector3(0, 0.38, -1.05);
const BATTLE_CAMERA_OFFSET = BATTLE_CAMERA_POSITION.clone().sub(BATTLE_CAMERA_LOOK_AT);

interface GalleryCameraRigProps {
  mode: GalleryCameraId;
  motion: GalleryMotionId;
  definition: SlimeGalleryDefinition;
}

export function GalleryCameraRig({ mode, motion, definition }: GalleryCameraRigProps) {
  const { camera, size } = useThree();

  useEffect(() => {
    const compact = size.width < 620 ? 1.20 : 1;
    const lookAt = GALLERY_HOME.clone().setY(0.28);
    const yaw = THREE.MathUtils.degToRad(definition.inspectionFacingYawDegrees ?? 0);
    const inspectForward = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw)).normalize();
    const inspectRight = new THREE.Vector3(-inspectForward.z, 0, inspectForward.x).normalize();
    const targetDistance = galleryTargetDistance(definition);

    if (mode === 'gameplay') {
      camera.position.copy(lookAt).addScaledVector(BATTLE_CAMERA_OFFSET, 0.34 * compact);
      camera.lookAt(lookAt);
    } else if (mode === 'front') {
      camera.position.set(0, 0.82, 2.15 * compact);
      camera.lookAt(lookAt);
    } else if (motion === 'attack') {
      const ranged = targetDistance >= 1.4;
      const cinematicTier3 = [
        'blademaster', 'berserker', 'sniper', 'storm-archer',
        'paladin', 'fortress', 'archmage', 'frost-mage',
        'ninja', 'assassin', 'cannoneer', 'engineer',
      ].includes(definition.id);
      const focusFraction = cinematicTier3
        ? (definition.id === 'blademaster' ? 0.84 : ranged ? 0.50 : 0.58)
        : (ranged ? 0.44 : 0.42);
      const midpoint = GALLERY_HOME.clone().addScaledVector(inspectForward, targetDistance * focusFraction);
      midpoint.y = cinematicTier3 ? 0.24 : 0.26;
      const sideDistance = (
        cinematicTier3
          ? (ranged ? 2.88 : definition.id === 'blademaster' ? 2.35 : 2.10)
          : (ranged ? 2.85 : 2.35)
      ) * compact;
      const forwardDistance = (
        cinematicTier3 ? (ranged ? 0.72 : 0.68) : (ranged ? 0.92 : 0.82)
      ) * compact;
      const height = (
        cinematicTier3 ? (ranged ? 0.82 : 0.78) : (ranged ? 0.96 : 0.88)
      ) * compact;
      camera.position.copy(midpoint)
        .addScaledVector(inspectRight, sideDistance)
        .addScaledVector(inspectForward, forwardDistance)
        .add(new THREE.Vector3(0, height, 0));
      camera.lookAt(midpoint);
    } else {
      camera.position.copy(GALLERY_HOME)
        .addScaledVector(inspectRight, (definition.inspectionSideDistance ?? 1.52) * 0.55 * compact)
        .addScaledVector(inspectForward, 1.05 * compact)
        .add(new THREE.Vector3(0, 0.78 * compact, 0));
      camera.lookAt(lookAt);
    }
    camera.updateProjectionMatrix();
  }, [camera, definition, mode, motion, size.width]);

  return null;
}
