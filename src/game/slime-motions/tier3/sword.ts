import * as THREE from 'three';

import {
  clamp01,
  easeInOutCubic,
  easeOutCubic,
  type EquipmentPose,
  type IdleMotionPose,
} from '../../slime-motion';

export const TIER3_SWORD_TIMING = {
  blademasterAttack: 0.96,
  berserkerAttack: 1.06,
} as const;

export const TIER3_SWORD_THRESHOLDS = {
  blademasterCutU: 0.56,
  berserkerImpactU: 0.47,
  berserkerFollowThroughU: 0.69,
} as const;

export interface BlademasterAttackMotionPose extends IdleMotionPose {
  bodyOffset: number;
  dashProgress: number;
  cutProgress: number;
  scarfPulse: number;
  vanishPulse: number;
  hitStopPulse: number;
}

export interface BerserkerAttackMotionPose extends IdleMotionPose {
  bodyOffset: number;
  impactProgress: number;
  followThroughProgress: number;
  impactPulse: number;
  ragePulse: number;
  hitStopPulse: number;
}

const equipment = (angle = 0, lift = 0, sweep = 0): EquipmentPose => ({ angle, lift, sweep });

/**
 * Blademaster is built around contrast: one tight coil, an almost instantaneous pass-through,
 * then a delayed oversized cut. The delayed cut is the visual payoff, not particle spam.
 */
export function getBlademasterAttackMotion(uInput: number): BlademasterAttackMotionPose {
  const u = clamp01(uInput);
  if (u < 0.20) {
    const t = easeInOutCubic(u / 0.20);
    return {
      bodyOffset: 0,
      dashProgress: 0,
      cutProgress: -1,
      scarfPulse: t * 0.50,
      vanishPulse: 0,
      hitStopPulse: 0,
      deformation: { squash: 0.54 * t, stretch: 0, lean: -0.20 * t, wobble: -0.08 * t, jump: 0 },
      equipment: equipment(-0.82 * t, -0.018 * t, -0.18 * t),
    };
  }
  if (u < 0.46) {
    const t = easeOutCubic((u - 0.20) / 0.26);
    const speedPulse = Math.sin(t * Math.PI);
    return {
      bodyOffset: 1.42 * t,
      dashProgress: t,
      cutProgress: -1,
      scarfPulse: 0.55 + speedPulse * 0.45,
      vanishPulse: Math.sin(clamp01(t / 0.76) * Math.PI),
      hitStopPulse: 0,
      deformation: { squash: 0.08 * (1 - t), stretch: 0.62 * speedPulse, lean: 0.38 * speedPulse, wobble: 0.16 * Math.sin(t * Math.PI * 2), jump: 0.045 * speedPulse },
      equipment: equipment(THREE.MathUtils.lerp(-0.82, -0.14, t), 0.024 * speedPulse, -0.06),
    };
  }
  if (u < 0.58) {
    const t = (u - 0.46) / 0.12;
    return {
      bodyOffset: THREE.MathUtils.lerp(1.42, 1.35, t),
      dashProgress: 1,
      cutProgress: -1,
      scarfPulse: 0.82,
      vanishPulse: 0.18 * (1 - t),
      hitStopPulse: 0,
      deformation: { squash: 0.06, stretch: 0.10, lean: -0.05, wobble: 0, jump: 0 },
      equipment: equipment(-0.14, 0, -0.06),
    };
  }
  if (u < 0.75) {
    const t = clamp01((u - 0.58) / 0.17);
    const cut = easeOutCubic(t);
    const pulse = Math.sin(t * Math.PI);
    return {
      bodyOffset: THREE.MathUtils.lerp(1.35, 1.24, t),
      dashProgress: 1,
      cutProgress: cut,
      scarfPulse: 0.82 - t * 0.18,
      vanishPulse: 0,
      hitStopPulse: Math.sin(clamp01((t - 0.24) / 0.40) * Math.PI),
      deformation: { squash: 0.06 * pulse, stretch: 0.10 * (1 - t), lean: -0.18 * pulse, wobble: -0.22 * pulse, jump: 0 },
      equipment: equipment(THREE.MathUtils.lerp(-0.14, 1.72, cut), 0.030 * pulse, THREE.MathUtils.lerp(-0.06, 0.98, cut)),
    };
  }
  const t = easeInOutCubic((u - 0.75) / 0.25);
  return {
    bodyOffset: THREE.MathUtils.lerp(1.24, 0, t),
    dashProgress: 1,
    cutProgress: 1,
    scarfPulse: 0.64 * (1 - t),
    vanishPulse: 0,
    hitStopPulse: 0,
    deformation: { squash: 0.12 * Math.sin(t * Math.PI), stretch: 0.06 * (1 - t), lean: -0.08 * (1 - t), wobble: 0.09 * Math.sin(t * Math.PI * 2), jump: 0.035 * Math.sin(t * Math.PI) },
    equipment: equipment(1.72 * (1 - t), 0, 0.98 * (1 - t)),
  };
}

/**
 * Berserker is intentionally not “slow”. The wind-up is heavy; the release is brutally fast.
 * The hit-stop pulse gives BattleRuntime/Gallery a shared cue for camera and impact accents.
 */
export function getBerserkerAttackMotion(uInput: number): BerserkerAttackMotionPose {
  const u = clamp01(uInput);
  if (u < 0.32) {
    const t = easeInOutCubic(u / 0.32);
    const tremor = Math.sin(t * Math.PI * 8) * t;
    return {
      bodyOffset: -0.05 * t,
      impactProgress: -1,
      followThroughProgress: -1,
      impactPulse: 0,
      ragePulse: 0.25 + t * 0.75,
      hitStopPulse: 0,
      deformation: { squash: 0.70 * t, stretch: 0, lean: -0.32 * t, wobble: tremor * 0.14, jump: 0 },
      equipment: equipment(-1.34 * t, -0.045 * t, -0.22 * t),
    };
  }
  if (u < 0.55) {
    const t = easeOutCubic((u - 0.32) / 0.23);
    const pulse = Math.sin(t * Math.PI);
    const impactPulse = Math.sin(clamp01((t - 0.28) / 0.72) * Math.PI);
    return {
      bodyOffset: 0.42 * t,
      impactProgress: t,
      followThroughProgress: -1,
      impactPulse,
      ragePulse: 1,
      hitStopPulse: Math.sin(clamp01((t - 0.62) / 0.28) * Math.PI),
      deformation: { squash: 0.14 * (1 - t), stretch: 0.52 * pulse, lean: 0.56 * pulse, wobble: 0.26 * Math.sin(t * Math.PI * 2), jump: 0.030 * pulse },
      equipment: equipment(THREE.MathUtils.lerp(-1.34, 1.58, t), 0.045 * pulse, THREE.MathUtils.lerp(-0.22, 0.84, t)),
    };
  }
  if (u < 0.78) {
    const t = easeOutCubic((u - 0.55) / 0.23);
    const pulse = Math.sin(t * Math.PI);
    return {
      bodyOffset: THREE.MathUtils.lerp(0.42, 0.24, t),
      impactProgress: 1,
      followThroughProgress: t,
      impactPulse: pulse * 0.82,
      ragePulse: 0.86 - t * 0.22,
      hitStopPulse: 0,
      deformation: { squash: 0.36 * pulse, stretch: 0.14 * (1 - t), lean: -0.34 * pulse, wobble: -0.44 * pulse, jump: 0 },
      equipment: equipment(THREE.MathUtils.lerp(1.58, -0.48, t), 0.018 * pulse, THREE.MathUtils.lerp(0.84, -0.46, t)),
    };
  }
  const t = easeInOutCubic((u - 0.78) / 0.22);
  return {
    bodyOffset: THREE.MathUtils.lerp(0.24, 0, t),
    impactProgress: 1,
    followThroughProgress: 1,
    impactPulse: 0,
    ragePulse: 0.64 * (1 - t),
    hitStopPulse: 0,
    deformation: { squash: 0.20 * (1 - t), stretch: 0, lean: -0.12 * (1 - t), wobble: 0.18 * Math.sin(t * Math.PI * 2) * (1 - t), jump: 0 },
    equipment: equipment(-0.48 * (1 - t), 0, -0.46 * (1 - t)),
  };
}

export function createBlademasterSignatureVfx(): THREE.Group {
  const group = new THREE.Group();
  group.visible = false;

  const dashMaterial = new THREE.MeshBasicMaterial({ color: '#57d9ff', transparent: true, opacity: 0, depthWrite: false, depthTest: false, side: THREE.DoubleSide });
  for (let i = 0; i < 3; i += 1) {
    const streak = new THREE.Mesh(new THREE.PlaneGeometry(0.85 - i * 0.13, 0.055 - i * 0.008), dashMaterial.clone());
    streak.name = `BlademasterDashStreak${i}`;
    streak.position.y = (i - 1) * 0.11;
    group.add(streak);
  }

  const cut = new THREE.Mesh(
    new THREE.PlaneGeometry(1.95, 0.075),
    new THREE.MeshBasicMaterial({ color: '#d8f8ff', transparent: true, opacity: 0, depthWrite: false, depthTest: false, side: THREE.DoubleSide }),
  );
  cut.name = 'BlademasterDelayedCut';
  cut.rotation.z = -0.58;
  group.add(cut);

  const echo = new THREE.Mesh(
    new THREE.PlaneGeometry(1.60, 0.035),
    new THREE.MeshBasicMaterial({ color: '#55aaff', transparent: true, opacity: 0, depthWrite: false, depthTest: false, side: THREE.DoubleSide }),
  );
  echo.name = 'BlademasterCutEcho';
  echo.rotation.z = -0.58;
  echo.position.y = 0.05;
  group.add(echo);
  group.renderOrder = 10;
  return group;
}

export function applyBlademasterSignatureVfx(
  group: THREE.Group | null,
  pose: Pick<BlademasterAttackMotionPose, 'dashProgress' | 'cutProgress' | 'vanishPulse' | 'hitStopPulse'>,
  cameraQuaternion: THREE.Quaternion,
  position: THREE.Vector3,
): void {
  if (!group) return;
  const dashVisible = pose.dashProgress > 0 && pose.dashProgress < 1 && pose.cutProgress < 0;
  const cutVisible = pose.cutProgress >= 0 && pose.cutProgress < 1;
  group.visible = dashVisible || cutVisible || pose.hitStopPulse > 0.01;
  if (!group.visible) return;
  group.position.copy(position);
  group.quaternion.copy(cameraQuaternion);

  group.children.forEach((child) => {
    if (!(child instanceof THREE.Mesh) || !(child.material instanceof THREE.MeshBasicMaterial)) return;
    if (child.name.startsWith('BlademasterDashStreak')) {
      const index = Number(child.name.at(-1) ?? 0);
      const dashPulse = Math.sin(clamp01(pose.dashProgress) * Math.PI);
      child.visible = dashVisible;
      child.position.x = -0.35 - index * 0.18 - pose.dashProgress * 0.25;
      child.scale.x = 0.9 + dashPulse * (0.6 - index * 0.08);
      child.material.opacity = dashPulse * (0.76 - index * 0.15) * (0.65 + pose.vanishPulse * 0.35);
      return;
    }
    if (child.name === 'BlademasterDelayedCut') {
      const p = clamp01(pose.cutProgress);
      const pulse = Math.sin(p * Math.PI);
      child.visible = cutVisible;
      child.scale.set(0.65 + p * 0.85, 0.72 + pulse * 0.65, 1);
      child.material.opacity = pulse * 0.98;
      return;
    }
    if (child.name === 'BlademasterCutEcho') {
      const p = clamp01((pose.cutProgress - 0.12) / 0.88);
      const pulse = Math.sin(p * Math.PI);
      child.visible = cutVisible && p > 0;
      child.scale.set(0.70 + p * 0.72, 0.85, 1);
      child.material.opacity = pulse * 0.66;
    }
  });
}

export function createBerserkerSignatureVfx(): THREE.Group {
  const group = new THREE.Group();
  group.visible = false;

  const arc = new THREE.Mesh(
    new THREE.TorusGeometry(0.44, 0.065, 10, 56, Math.PI * 1.18),
    new THREE.MeshBasicMaterial({ color: '#ff8a3d', transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false, depthTest: false }),
  );
  arc.name = 'BerserkerImpactArc';
  group.add(arc);

  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.20, 0.29, 48),
    new THREE.MeshBasicMaterial({ color: '#ffd05c', transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false, depthTest: false }),
  );
  ring.name = 'BerserkerGroundRing';
  ring.rotation.x = -Math.PI / 2;
  group.add(ring);

  const flash = new THREE.Mesh(
    new THREE.CircleGeometry(0.19, 32),
    new THREE.MeshBasicMaterial({ color: '#fff0b0', transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false, depthTest: false }),
  );
  flash.name = 'BerserkerImpactFlash';
  group.add(flash);

  for (let i = 0; i < 7; i += 1) {
    const shard = new THREE.Mesh(
      new THREE.ConeGeometry(0.030, 0.20, 5),
      new THREE.MeshBasicMaterial({ color: i % 2 === 0 ? '#ffb84f' : '#ff6738', transparent: true, opacity: 0, depthWrite: false, depthTest: false }),
    );
    shard.name = `BerserkerShard${i}`;
    shard.rotation.z = (i / 7) * Math.PI * 2;
    group.add(shard);
  }
  group.renderOrder = 10;
  return group;
}

export function applyBerserkerSignatureVfx(
  group: THREE.Group | null,
  pose: Pick<BerserkerAttackMotionPose, 'impactPulse' | 'impactProgress' | 'followThroughProgress' | 'hitStopPulse'>,
  cameraQuaternion: THREE.Quaternion,
  position: THREE.Vector3,
): void {
  if (!group) return;
  const pulse = Math.max(pose.impactPulse, pose.hitStopPulse);
  group.visible = pulse > 0.01;
  if (!group.visible) return;
  group.position.copy(position);

  const arc = group.getObjectByName('BerserkerImpactArc') as THREE.Mesh<THREE.TorusGeometry, THREE.MeshBasicMaterial> | undefined;
  const ring = group.getObjectByName('BerserkerGroundRing') as THREE.Mesh<THREE.RingGeometry, THREE.MeshBasicMaterial> | undefined;
  const flash = group.getObjectByName('BerserkerImpactFlash') as THREE.Mesh<THREE.CircleGeometry, THREE.MeshBasicMaterial> | undefined;
  if (arc) {
    arc.quaternion.copy(cameraQuaternion);
    arc.rotation.z = -1.05 + clamp01(pose.impactProgress) * 1.45;
    arc.scale.set(1.15 + pulse * 1.05, 0.70 + pulse * 0.40, 1);
    arc.material.opacity = pulse * 0.96;
  }
  if (ring) {
    const expand = 0.82 + clamp01(pose.impactProgress) * 2.35;
    ring.scale.setScalar(expand);
    ring.material.opacity = pulse * 0.72;
  }
  if (flash) {
    flash.quaternion.copy(cameraQuaternion);
    flash.scale.setScalar(0.7 + pulse * 2.0);
    flash.material.opacity = pose.hitStopPulse * 0.88 + pose.impactPulse * 0.28;
  }

  for (let i = 0; i < 7; i += 1) {
    const shard = group.getObjectByName(`BerserkerShard${i}`) as THREE.Mesh<THREE.ConeGeometry, THREE.MeshBasicMaterial> | undefined;
    if (!shard) continue;
    const angle = (i / 7) * Math.PI * 2;
    const travel = 0.18 + pulse * (0.34 + (i % 3) * 0.06);
    shard.position.set(Math.cos(angle) * travel, 0.04 + pulse * (0.08 + (i % 2) * 0.05), Math.sin(angle) * travel);
    shard.rotation.z = -angle;
    shard.scale.setScalar(0.7 + pulse * 0.55);
    shard.material.opacity = pulse * 0.82;
  }
}
