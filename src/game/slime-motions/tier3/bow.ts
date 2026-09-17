import * as THREE from 'three';

import {
  clamp01,
  easeInOutCubic,
  easeOutCubic,
  type EquipmentPose,
  type IdleMotionPose,
} from '../../slime-motion';

export const TIER3_BOW_TIMING = {
  sniperAttack: 1.06,
  stormArcherAttack: 1.02,
  sniperArrowFlight: 0.22,
  stormArrowFlight: 0.28,
} as const;

export const TIER3_BOW_THRESHOLDS = {
  sniperReleaseU: 0.58,
} as const;

export interface SniperAttackMotionPose extends IdleMotionPose {
  tension: number;
  release: number;
  recoil: number;
  focusPulse: number;
  shotFlash: number;
}

export interface StormArcherAttackMotionPose extends IdleMotionPose {
  bodyOffset: number;
  shotIndex: 0 | 1 | 2;
  shotProgress: number;
  electricPulse: number;
  volleySpread: number;
  chainPulse: number;
}

const equipment = (angle = 0, lift = 0, sweep = 0): EquipmentPose => ({ angle, lift, sweep });

/**
 * Sniper's power fantasy is contrast: nearly motionless aim, then one brutally crisp line.
 * The animation intentionally avoids busy pre-fire wobble.
 */
export function getSniperAttackMotion(uInput: number): SniperAttackMotionPose {
  const u = clamp01(uInput);
  if (u < 0.48) {
    const t = easeInOutCubic(u / 0.48);
    return {
      tension: t,
      release: 0,
      recoil: 0,
      focusPulse: 0.24 + t * 0.76,
      shotFlash: 0,
      deformation: { squash: 0.06 * t, stretch: 0.12 * t, lean: -0.035 * t, wobble: 0, jump: 0 },
      equipment: equipment(-0.18 * t, 0, -0.06 * t),
    };
  }
  if (u < 0.64) {
    const t = easeOutCubic((u - 0.48) / 0.16);
    const recoil = Math.sin(t * Math.PI);
    const flash = Math.sin(clamp01(t / 0.52) * Math.PI);
    return {
      tension: 1 - t,
      release: t,
      recoil,
      focusPulse: 1 - t * 0.52,
      shotFlash: flash,
      deformation: { squash: 0.04 * (1 - t), stretch: 0.24 * (1 - t), lean: 0.28 * recoil, wobble: 0.15 * recoil, jump: 0.012 * recoil },
      equipment: equipment(THREE.MathUtils.lerp(-0.18, 0.26, t), 0.022 * recoil, THREE.MathUtils.lerp(-0.06, 0.16, t)),
    };
  }
  const t = easeInOutCubic((u - 0.64) / 0.36);
  return {
    tension: 0,
    release: 1,
    recoil: (1 - t) * 0.30,
    focusPulse: 0.48 * (1 - t),
    shotFlash: 0,
    deformation: { squash: 0.06 * (1 - t), stretch: 0, lean: 0.09 * (1 - t), wobble: 0.07 * Math.sin(t * Math.PI * 2) * (1 - t), jump: 0 },
    equipment: equipment(0.26 * (1 - t), 0, 0.16 * (1 - t)),
  };
}

export function getStormShotReleaseU(shotIndex: 0 | 1 | 2): number {
  return [0.36, 0.48, 0.60][shotIndex];
}

/**
 * Storm Archer compresses and rises into a short fan volley. The three arrows are a single
 * signature beat, not three ordinary Ranger shots in sequence.
 */
export function getStormArcherAttackMotion(uInput: number): StormArcherAttackMotionPose {
  const u = clamp01(uInput);
  let shotIndex: 0 | 1 | 2 = 0;
  if (u >= getStormShotReleaseU(2)) shotIndex = 2;
  else if (u >= getStormShotReleaseU(1)) shotIndex = 1;
  const releaseAt = getStormShotReleaseU(shotIndex);
  const nextRelease = shotIndex === 2 ? 0.72 : getStormShotReleaseU((shotIndex + 1) as 1 | 2);
  const shotProgress = u < releaseAt ? -1 : clamp01((u - releaseAt) / Math.max(0.01, nextRelease - releaseAt));

  if (u < 0.26) {
    const t = easeOutCubic(u / 0.26);
    return {
      bodyOffset: 0,
      shotIndex: 0,
      shotProgress: -1,
      electricPulse: t * 0.92,
      volleySpread: 0,
      chainPulse: 0,
      deformation: { squash: 0.52 * t, stretch: 0.10 * t, lean: -0.14 * t, wobble: 0.16 * Math.sin(t * Math.PI * 2), jump: 0.06 * t },
      equipment: equipment(-0.48 * t, 0.024 * t, -0.12 * t),
    };
  }
  if (u < 0.72) {
    const t = (u - 0.26) / 0.46;
    const jump = Math.sin(t * Math.PI) * 0.18;
    const pulse = 0.66 + 0.34 * Math.sin(t * Math.PI * 6) ** 2;
    const lateral = Math.sin(t * Math.PI * 2) * 0.045;
    const chainPulse = u > 0.58 ? Math.sin(clamp01((u - 0.58) / 0.14) * Math.PI) : 0;
    return {
      bodyOffset: lateral,
      shotIndex,
      shotProgress,
      electricPulse: pulse,
      volleySpread: (shotIndex - 1) * 0.24,
      chainPulse,
      deformation: { squash: 0.08 * (1 - t), stretch: 0.28 * Math.sin(t * Math.PI), lean: 0.18 * Math.sin(t * Math.PI * 2), wobble: 0.20 * Math.sin(t * Math.PI * 4), jump },
      equipment: equipment(-0.16 + shotIndex * 0.17, jump * 0.06, -0.12 + shotIndex * 0.12),
    };
  }
  const t = easeInOutCubic((u - 0.72) / 0.28);
  return {
    bodyOffset: 0,
    shotIndex: 2,
    shotProgress: 1,
    electricPulse: 0.52 * (1 - t),
    volleySpread: 0.24 * (1 - t),
    chainPulse: 0.42 * (1 - t),
    deformation: { squash: 0.14 * (1 - t), stretch: 0, lean: 0.06 * (1 - t), wobble: 0.12 * Math.sin(t * Math.PI * 2) * (1 - t), jump: 0 },
    equipment: equipment(0.18 * (1 - t), 0, 0.12 * (1 - t)),
  };
}

export function createSniperSignatureVfx(): THREE.Group {
  const group = new THREE.Group();
  group.visible = false;

  const ringMaterial = new THREE.MeshBasicMaterial({ color: '#ffd66b', transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false, depthTest: false });
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.13, 0.15, 40), ringMaterial);
  ring.name = 'SniperFocusRing';
  group.add(ring);

  const crossMaterial = new THREE.MeshBasicMaterial({ color: '#9edfff', transparent: true, opacity: 0, depthWrite: false, depthTest: false });
  const horizontal = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.018), crossMaterial.clone());
  horizontal.name = 'SniperCrossHorizontal';
  group.add(horizontal);
  const vertical = new THREE.Mesh(new THREE.PlaneGeometry(0.018, 0.34), crossMaterial.clone());
  vertical.name = 'SniperCrossVertical';
  group.add(vertical);

  const beamCore = new THREE.Mesh(
    new THREE.PlaneGeometry(2.75, 0.030),
    new THREE.MeshBasicMaterial({ color: '#f4fbff', transparent: true, opacity: 0, depthWrite: false, depthTest: false, side: THREE.DoubleSide }),
  );
  beamCore.name = 'SniperPiercingCore';
  beamCore.position.x = 1.38;
  group.add(beamCore);

  const beamGlow = new THREE.Mesh(
    new THREE.PlaneGeometry(2.95, 0.090),
    new THREE.MeshBasicMaterial({ color: '#77cfff', transparent: true, opacity: 0, depthWrite: false, depthTest: false, side: THREE.DoubleSide }),
  );
  beamGlow.name = 'SniperPiercingGlow';
  beamGlow.position.x = 1.48;
  group.add(beamGlow);
  group.renderOrder = 10;
  return group;
}

export function applySniperSignatureVfx(
  group: THREE.Group | null,
  pose: Pick<SniperAttackMotionPose, 'focusPulse' | 'shotFlash' | 'release'>,
  cameraQuaternion: THREE.Quaternion,
  position: THREE.Vector3,
): void {
  if (!group) return;
  group.visible = pose.focusPulse > 0.03 || pose.shotFlash > 0.01;
  if (!group.visible) return;
  group.position.copy(position);
  group.quaternion.copy(cameraQuaternion);

  group.children.forEach((child) => {
    if (!(child instanceof THREE.Mesh) || !(child.material instanceof THREE.MeshBasicMaterial)) return;
    if (child.name.startsWith('SniperFocus') || child.name.startsWith('SniperCross')) {
      child.visible = pose.shotFlash < 0.72;
      child.scale.setScalar(0.80 + pose.focusPulse * 0.38);
      child.material.opacity = pose.focusPulse * (child.name === 'SniperFocusRing' ? 0.88 : 0.62) * (1 - pose.shotFlash * 0.65);
      return;
    }
    if (child.name === 'SniperPiercingCore') {
      child.visible = pose.shotFlash > 0.01;
      child.scale.set(0.18 + pose.release * 0.92, 1, 1);
      child.material.opacity = pose.shotFlash * 0.98;
      return;
    }
    if (child.name === 'SniperPiercingGlow') {
      child.visible = pose.shotFlash > 0.01;
      child.scale.set(0.16 + pose.release * 0.96, 0.70 + pose.shotFlash * 0.65, 1);
      child.material.opacity = pose.shotFlash * 0.45;
    }
  });
}

export function createStormSignatureVfx(): THREE.Group {
  const group = new THREE.Group();
  group.visible = false;
  const colors = ['#8ef7ff', '#5bdcff', '#a2ffff'];
  for (let i = 0; i < 3; i += 1) {
    const trail = new THREE.Mesh(
      new THREE.PlaneGeometry(1.55, 0.055),
      new THREE.MeshBasicMaterial({ color: colors[i], transparent: true, opacity: 0, depthWrite: false, depthTest: false, side: THREE.DoubleSide }),
    );
    trail.name = `StormFanTrail${i}`;
    trail.position.x = 0.78;
    trail.rotation.z = (i - 1) * 0.24;
    group.add(trail);
  }

  const chain = new THREE.Mesh(
    new THREE.TorusGeometry(0.72, 0.024, 8, 48, Math.PI * 1.45),
    new THREE.MeshBasicMaterial({ color: '#84efff', transparent: true, opacity: 0, depthWrite: false, depthTest: false, side: THREE.DoubleSide }),
  );
  chain.name = 'StormChainArc';
  chain.rotation.z = -0.64;
  group.add(chain);

  const burst = new THREE.Mesh(
    new THREE.RingGeometry(0.11, 0.19, 36),
    new THREE.MeshBasicMaterial({ color: '#d9ffff', transparent: true, opacity: 0, depthWrite: false, depthTest: false, side: THREE.DoubleSide }),
  );
  burst.name = 'StormReleaseBurst';
  group.add(burst);
  group.renderOrder = 10;
  return group;
}

export function applyStormSignatureVfx(
  group: THREE.Group | null,
  pose: Pick<StormArcherAttackMotionPose, 'shotIndex' | 'shotProgress' | 'electricPulse' | 'chainPulse'>,
  cameraQuaternion: THREE.Quaternion,
  position: THREE.Vector3,
): void {
  if (!group) return;
  const shotPulse = pose.shotProgress >= 0 && pose.shotProgress < 1 ? Math.sin(pose.shotProgress * Math.PI) : 0;
  group.visible = pose.electricPulse > 0.05 || pose.chainPulse > 0.02 || shotPulse > 0.01;
  if (!group.visible) return;
  group.position.copy(position);
  group.quaternion.copy(cameraQuaternion);

  for (let i = 0; i < 3; i += 1) {
    const trail = group.getObjectByName(`StormFanTrail${i}`) as THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial> | undefined;
    if (!trail) continue;
    const active = i <= pose.shotIndex && pose.shotProgress >= 0;
    const echo = i < pose.shotIndex ? 0.24 * (1 - pose.shotProgress) : shotPulse;
    trail.visible = active;
    trail.scale.set(0.55 + (active ? 0.60 : 0), 0.78 + pose.electricPulse * 0.42, 1);
    trail.material.opacity = Math.max(echo * 0.90, pose.chainPulse * 0.28);
  }

  const chain = group.getObjectByName('StormChainArc') as THREE.Mesh<THREE.TorusGeometry, THREE.MeshBasicMaterial> | undefined;
  if (chain) {
    chain.visible = pose.chainPulse > 0.02;
    chain.scale.set(1 + pose.chainPulse * 0.45, 0.70 + pose.chainPulse * 0.22, 1);
    chain.material.opacity = pose.chainPulse * 0.86;
  }
  const burst = group.getObjectByName('StormReleaseBurst') as THREE.Mesh<THREE.RingGeometry, THREE.MeshBasicMaterial> | undefined;
  if (burst) {
    burst.visible = shotPulse > 0.01;
    burst.scale.setScalar(0.65 + shotPulse * 1.15);
    burst.material.opacity = shotPulse * 0.88;
  }
}
