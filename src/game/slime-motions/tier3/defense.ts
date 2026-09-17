import * as THREE from 'three';

import {
  clamp01,
  easeInOutCubic,
  easeOutCubic,
  type EquipmentPose,
  type IdleMotionPose,
} from '../../slime-motion';

/**
 * Tier-3 defense deliberately spends more screen time on the payoff than Guardian.
 * Paladin resolves into a sanctuary after the hit; Fortress resolves into a planted lock.
 */
export const TIER3_DEFENSE_TIMING = {
  paladinAttack: 1.18,
  fortressAttack: 1.38,
} as const;

export const TIER3_DEFENSE_THRESHOLDS = {
  paladinShieldFlashU: 0.27,
  paladinContactU: 0.46,
  paladinBarrierStartU: 0.50,
  fortressPlantU: 0.43,
  fortressFortifyLockU: 0.50,
  fortressGroundWaveEndU: 0.76,
} as const;

export interface PaladinAttackMotionPose extends IdleMotionPose {
  bodyOffset: number;
  strikeProgress: number;
  shieldFlashPulse: number;
  holyImpactPulse: number;
  hitStopPulse: number;
  barrierProgress: number;
  barrierPulse: number;
  sanctuaryPulse: number;
}

export interface FortressAttackMotionPose extends IdleMotionPose {
  bodyOffset: number;
  plantProgress: number;
  impactPulse: number;
  dustPulse: number;
  groundWaveProgress: number;
  groundWavePulse: number;
  fortifyLock: number;
  lockPulse: number;
}

type PaladinSignaturePose = Pick<
  PaladinAttackMotionPose,
  | 'shieldFlashPulse'
  | 'holyImpactPulse'
  | 'hitStopPulse'
  | 'barrierProgress'
  | 'barrierPulse'
  | 'sanctuaryPulse'
>;

type FortressSignaturePose = Pick<
  FortressAttackMotionPose,
  | 'impactPulse'
  | 'dustPulse'
  | 'groundWaveProgress'
  | 'groundWavePulse'
  | 'fortifyLock'
  | 'lockPulse'
>;

const equipment = (angle = 0, lift = 0, sweep = 0): EquipmentPose => ({ angle, lift, sweep });

/**
 * Motion functions are animation boundaries. Treat invalid runtime time values as the
 * beginning of the animation instead of allowing NaN/Infinity to leak into transforms.
 */
function normalizedU(value: number): number {
  return Number.isFinite(value) ? clamp01(value) : 0;
}

function pulse01(value: number): number {
  return Math.sin(clamp01(value) * Math.PI);
}

function trailingPulse(value: number): number {
  const t = clamp01(value);
  return Math.sin(t * Math.PI * 0.5);
}

/**
 * Paladin is not a faster Guardian bash.
 *
 * Beat 1: the shield is pulled in and catches a white-gold flash.
 * Beat 2: the slime and shield commit together to one heavy holy edge strike.
 * Beat 3: only after impact, a thin sanctuary/barrier opens around the caster.
 *
 * The body translation is intentionally restrained so the white-gold shield remains
 * the hero silhouette at mobile size.
 */
export function getPaladinAttackMotion(uInput: number): PaladinAttackMotionPose {
  const u = normalizedU(uInput);

  if (u < 0.20) {
    const t = easeInOutCubic(u / 0.20);
    return {
      bodyOffset: -0.035 * t,
      strikeProgress: -1,
      shieldFlashPulse: 0.10 * t,
      holyImpactPulse: 0,
      hitStopPulse: 0,
      barrierProgress: 0,
      barrierPulse: 0,
      sanctuaryPulse: 0,
      deformation: {
        squash: 0.38 * t,
        stretch: 0,
        lean: -0.12 * t,
        wobble: -0.025 * t,
        jump: 0,
      },
      equipment: equipment(-0.44 * t, -0.014 * t, -0.10 * t),
    };
  }

  if (u < 0.34) {
    const t = clamp01((u - 0.20) / 0.14);
    const flash = pulse01(t);
    return {
      bodyOffset: THREE.MathUtils.lerp(-0.035, -0.055, easeInOutCubic(t)),
      strikeProgress: -1,
      shieldFlashPulse: Math.max(0.10 * (1 - t), flash),
      holyImpactPulse: 0,
      hitStopPulse: 0,
      barrierProgress: 0,
      barrierPulse: 0,
      sanctuaryPulse: 0,
      deformation: {
        squash: 0.38 + flash * 0.08,
        stretch: flash * 0.035,
        lean: -0.12 - flash * 0.035,
        wobble: flash * 0.025,
        jump: 0,
      },
      equipment: equipment(
        THREE.MathUtils.lerp(-0.44, -0.58, easeInOutCubic(t)),
        -0.014 + flash * 0.010,
        THREE.MathUtils.lerp(-0.10, -0.16, t),
      ),
    };
  }

  if (u < 0.52) {
    const t = clamp01((u - 0.34) / 0.18);
    const strike = easeOutCubic(t);
    const releasePulse = pulse01(t);
    const contactWindow = clamp01((u - 0.415) / 0.105);
    const impact = pulse01(contactWindow);
    const hitStop = pulse01((u - 0.445) / 0.055);
    return {
      bodyOffset: THREE.MathUtils.lerp(-0.055, 0.43, strike),
      strikeProgress: strike,
      shieldFlashPulse: Math.max(0, 0.22 * (1 - t)),
      holyImpactPulse: impact,
      hitStopPulse: hitStop,
      barrierProgress: 0,
      barrierPulse: 0,
      sanctuaryPulse: impact * 0.18,
      deformation: {
        squash: 0.18 * (1 - t),
        stretch: 0.34 * releasePulse,
        lean: THREE.MathUtils.lerp(-0.16, 0.30, strike),
        wobble: 0.055 * Math.sin(t * Math.PI * 2),
        jump: 0.012 * releasePulse,
      },
      equipment: equipment(
        THREE.MathUtils.lerp(-0.58, 0.86, strike),
        0.026 * releasePulse,
        THREE.MathUtils.lerp(-0.16, 0.30, strike),
      ),
    };
  }

  if (u < 0.82) {
    const t = clamp01((u - 0.52) / 0.30);
    const settle = easeOutCubic(t);
    const barrierProgress = settle;
    const barrierPulse = trailingPulse(1 - Math.abs(t * 2 - 1));
    const sanctuaryPulse = Math.sin(t * Math.PI) * 0.85 + 0.15 * (1 - t);
    return {
      bodyOffset: THREE.MathUtils.lerp(0.43, 0.12, settle),
      strikeProgress: 1,
      shieldFlashPulse: 0,
      holyImpactPulse: Math.max(0, 0.24 * (1 - t)),
      hitStopPulse: 0,
      barrierProgress,
      barrierPulse,
      sanctuaryPulse,
      deformation: {
        squash: 0.16 + barrierPulse * 0.10,
        stretch: 0.035 * (1 - t),
        lean: THREE.MathUtils.lerp(0.16, -0.04, settle),
        wobble: 0.022 * Math.sin(t * Math.PI * 2),
        jump: 0,
      },
      equipment: equipment(
        THREE.MathUtils.lerp(0.86, 0.14, settle),
        0.008 * (1 - t),
        THREE.MathUtils.lerp(0.30, 0.04, settle),
      ),
    };
  }

  const t = easeInOutCubic((u - 0.82) / 0.18);
  return {
    bodyOffset: THREE.MathUtils.lerp(0.12, 0, t),
    strikeProgress: 1,
    shieldFlashPulse: 0,
    holyImpactPulse: 0,
    hitStopPulse: 0,
    barrierProgress: THREE.MathUtils.lerp(1, 0, t),
    barrierPulse: 0.20 * (1 - t),
    sanctuaryPulse: 0.30 * (1 - t),
    deformation: {
      squash: 0.16 * (1 - t),
      stretch: 0,
      lean: -0.04 * (1 - t),
      wobble: 0,
      jump: 0,
    },
    equipment: equipment(0.14 * (1 - t), 0, 0.04 * (1 - t)),
  };
}

/**
 * Fortress communicates power through immovability.
 *
 * It compresses broadly, plants the pavise into the ground, then stops translating.
 * The body remains visibly flattened and the shield remains visibly planted while
 * dust and a ground wave move around it. There is deliberately no airborne beat.
 */
export function getFortressAttackMotion(uInput: number): FortressAttackMotionPose {
  const u = normalizedU(uInput);

  if (u < 0.26) {
    const t = easeInOutCubic(u / 0.26);
    const weight = t * t;
    return {
      bodyOffset: -0.018 * t,
      plantProgress: -1,
      impactPulse: 0,
      dustPulse: 0,
      groundWaveProgress: 0,
      groundWavePulse: 0,
      fortifyLock: 0.18 * t,
      lockPulse: 0,
      deformation: {
        squash: 0.58 * t,
        stretch: 0,
        lean: -0.055 * t,
        wobble: 0,
        jump: 0,
      },
      equipment: equipment(-0.18 * t, -0.025 * weight, -0.025 * t),
    };
  }

  if (u < 0.46) {
    const t = clamp01((u - 0.26) / 0.20);
    const plant = easeOutCubic(t);
    const impactWindow = clamp01((u - 0.385) / 0.075);
    const impact = pulse01(impactWindow);
    return {
      bodyOffset: THREE.MathUtils.lerp(-0.018, 0.105, plant),
      plantProgress: plant,
      impactPulse: impact,
      dustPulse: impact,
      groundWaveProgress: 0,
      groundWavePulse: impact * 0.65,
      fortifyLock: THREE.MathUtils.lerp(0.18, 0.78, plant),
      lockPulse: impact * 0.35,
      deformation: {
        squash: THREE.MathUtils.lerp(0.58, 0.46, plant) + impact * 0.16,
        stretch: 0,
        lean: THREE.MathUtils.lerp(-0.055, 0.035, plant),
        wobble: impact * 0.018,
        jump: 0,
      },
      equipment: equipment(
        THREE.MathUtils.lerp(-0.18, -1.02, plant),
        THREE.MathUtils.lerp(-0.025, -0.085, plant),
        THREE.MathUtils.lerp(-0.025, 0.015, plant),
      ),
    };
  }

  if (u < 0.78) {
    const t = clamp01((u - 0.46) / 0.32);
    const waveProgress = easeOutCubic(t);
    const wavePulse = Math.sin(t * Math.PI) * 0.92;
    const lockIn = easeOutCubic(clamp01(t / 0.38));
    const dust = Math.max(0, 1 - t * 1.75);
    return {
      bodyOffset: THREE.MathUtils.lerp(0.105, 0.092, waveProgress),
      plantProgress: 1,
      impactPulse: Math.max(0, 0.18 * (1 - t * 2)),
      dustPulse: dust,
      groundWaveProgress: waveProgress,
      groundWavePulse: wavePulse,
      fortifyLock: THREE.MathUtils.lerp(0.78, 1, lockIn),
      lockPulse: Math.max(0.42, pulse01(clamp01(t / 0.55))),
      deformation: {
        squash: 0.56 + lockIn * 0.10,
        stretch: 0,
        lean: 0,
        wobble: 0,
        jump: 0,
      },
      equipment: equipment(
        THREE.MathUtils.lerp(-1.02, -0.88, lockIn),
        THREE.MathUtils.lerp(-0.085, -0.070, lockIn),
        0.015 * (1 - lockIn),
      ),
    };
  }

  if (u < 0.90) {
    const t = clamp01((u - 0.78) / 0.12);
    return {
      bodyOffset: 0.092,
      plantProgress: 1,
      impactPulse: 0,
      dustPulse: 0,
      groundWaveProgress: 1,
      groundWavePulse: 0,
      fortifyLock: 1,
      lockPulse: 0.72 + Math.sin(t * Math.PI) * 0.10,
      deformation: {
        squash: 0.66,
        stretch: 0,
        lean: 0,
        wobble: 0,
        jump: 0,
      },
      equipment: equipment(-0.88, -0.070, 0),
    };
  }

  const t = easeInOutCubic((u - 0.90) / 0.10);
  return {
    bodyOffset: THREE.MathUtils.lerp(0.092, 0, t),
    plantProgress: 1,
    impactPulse: 0,
    dustPulse: 0,
    groundWaveProgress: 1,
    groundWavePulse: 0,
    fortifyLock: 1 - t,
    lockPulse: 0.72 * (1 - t),
    deformation: {
      squash: 0.66 * (1 - t),
      stretch: 0,
      lean: 0,
      wobble: 0,
      jump: 0,
    },
    equipment: equipment(-0.88 * (1 - t), -0.070 * (1 - t), 0),
  };
}

function basicMaterial(color: string, blending: THREE.Blending = THREE.AdditiveBlending): THREE.MeshBasicMaterial {
  return new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0,
    side: THREE.DoubleSide,
    depthWrite: false,
    depthTest: false,
    blending,
  });
}

/**
 * Production VFX contract for Paladin.
 *
 * Runtime owns this group once, then passes the current pose plus caster/shield world
 * positions every frame. The flash is shield-local in appearance while the sanctuary
 * and barrier are caster-local, so the shield remains the visual source of the attack.
 */
export function createPaladinSignatureVfx(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'PaladinSignatureVfx';
  group.visible = false;
  group.renderOrder = 10;

  const flashRing = new THREE.Mesh(new THREE.RingGeometry(0.18, 0.27, 40), basicMaterial('#fff7d6'));
  flashRing.name = 'PaladinShieldFlashRing';
  group.add(flashRing);

  const flashBlade = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.055), basicMaterial('#ffffff'));
  flashBlade.name = 'PaladinShieldFlashBlade';
  flashBlade.rotation.z = -0.58;
  group.add(flashBlade);

  const impact = new THREE.Mesh(new THREE.RingGeometry(0.13, 0.23, 44), basicMaterial('#ffd96a'));
  impact.name = 'PaladinHolyImpact';
  group.add(impact);

  const barrier = new THREE.Mesh(
    new THREE.SphereGeometry(0.48, 24, 14),
    basicMaterial('#bfefff', THREE.NormalBlending),
  );
  barrier.name = 'PaladinBarrierShell';
  group.add(barrier);

  const sanctuaryOuter = new THREE.Mesh(new THREE.RingGeometry(0.34, 0.40, 56), basicMaterial('#fff2a8'));
  sanctuaryOuter.name = 'PaladinSanctuaryOuter';
  sanctuaryOuter.rotation.x = -Math.PI / 2;
  group.add(sanctuaryOuter);

  const sanctuaryInner = new THREE.Mesh(new THREE.RingGeometry(0.19, 0.23, 48), basicMaterial('#d8f7ff'));
  sanctuaryInner.name = 'PaladinSanctuaryInner';
  sanctuaryInner.rotation.x = -Math.PI / 2;
  group.add(sanctuaryInner);

  return group;
}

export function applyPaladinSignatureVfx(
  group: THREE.Group | null,
  pose: PaladinSignaturePose,
  cameraQuaternion: THREE.Quaternion,
  casterPosition: THREE.Vector3,
  shieldPosition: THREE.Vector3 = casterPosition,
): void {
  if (!group) return;

  const flashVisible = pose.shieldFlashPulse > 0.01;
  const impactVisible = pose.holyImpactPulse > 0.01 || pose.hitStopPulse > 0.01;
  const barrierVisible = pose.barrierPulse > 0.01 || pose.sanctuaryPulse > 0.01;
  group.visible = flashVisible || impactVisible || barrierVisible;
  if (!group.visible) return;

  group.position.set(0, 0, 0);

  const flashRing = group.getObjectByName('PaladinShieldFlashRing') as
    | THREE.Mesh<THREE.RingGeometry, THREE.MeshBasicMaterial>
    | undefined;
  if (flashRing) {
    flashRing.visible = flashVisible;
    flashRing.position.copy(shieldPosition);
    flashRing.quaternion.copy(cameraQuaternion);
    flashRing.scale.setScalar(0.72 + pose.shieldFlashPulse * 1.25);
    flashRing.material.opacity = pose.shieldFlashPulse * 0.96;
  }

  const flashBlade = group.getObjectByName('PaladinShieldFlashBlade') as
    | THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>
    | undefined;
  if (flashBlade) {
    flashBlade.visible = flashVisible;
    flashBlade.position.copy(shieldPosition);
    flashBlade.quaternion.copy(cameraQuaternion);
    flashBlade.rotateZ(-0.58);
    flashBlade.scale.set(
      0.76 + pose.shieldFlashPulse * 0.82,
      0.62 + pose.shieldFlashPulse * 0.48,
      1,
    );
    flashBlade.material.opacity = pose.shieldFlashPulse * 0.82;
  }

  const impact = group.getObjectByName('PaladinHolyImpact') as
    | THREE.Mesh<THREE.RingGeometry, THREE.MeshBasicMaterial>
    | undefined;
  if (impact) {
    const impactPulse = Math.max(pose.holyImpactPulse, pose.hitStopPulse);
    impact.visible = impactVisible;
    impact.position.copy(shieldPosition);
    impact.quaternion.copy(cameraQuaternion);
    impact.scale.setScalar(0.75 + impactPulse * 2.15);
    impact.material.opacity = impactPulse * 0.94;
  }

  const barrier = group.getObjectByName('PaladinBarrierShell') as
    | THREE.Mesh<THREE.SphereGeometry, THREE.MeshBasicMaterial>
    | undefined;
  if (barrier) {
    barrier.visible = barrierVisible;
    barrier.position.copy(casterPosition);
    barrier.scale.setScalar(0.78 + easeOutCubic(pose.barrierProgress) * 0.66);
    barrier.material.opacity = Math.min(0.24, pose.barrierPulse * 0.18 + pose.sanctuaryPulse * 0.08);
  }

  const outer = group.getObjectByName('PaladinSanctuaryOuter') as
    | THREE.Mesh<THREE.RingGeometry, THREE.MeshBasicMaterial>
    | undefined;
  if (outer) {
    outer.visible = barrierVisible;
    outer.position.copy(casterPosition);
    outer.position.y += 0.018;
    outer.scale.setScalar(0.72 + easeOutCubic(pose.barrierProgress) * 1.62);
    outer.material.opacity = pose.sanctuaryPulse * 0.76;
  }

  const inner = group.getObjectByName('PaladinSanctuaryInner') as
    | THREE.Mesh<THREE.RingGeometry, THREE.MeshBasicMaterial>
    | undefined;
  if (inner) {
    inner.visible = barrierVisible;
    inner.position.copy(casterPosition);
    inner.position.y += 0.022;
    inner.rotation.z = pose.barrierProgress * 0.42;
    inner.scale.setScalar(0.86 + pose.barrierProgress * 1.05);
    inner.material.opacity = Math.max(pose.barrierPulse * 0.62, pose.sanctuaryPulse * 0.38);
  }
}

/**
 * Production VFX contract for Fortress.
 *
 * All movement after the plant is environmental: dust travels outward, the ground wave
 * expands, and locking plates stay around the caster. The character itself should not
 * be made to hop or dash by the parent runtime while fortifyLock is active.
 */
export function createFortressSignatureVfx(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'FortressSignatureVfx';
  group.visible = false;
  group.renderOrder = 9;

  const wave = new THREE.Mesh(
    new THREE.RingGeometry(0.22, 0.31, 56),
    basicMaterial('#b7d1d8', THREE.NormalBlending),
  );
  wave.name = 'FortressGroundWave';
  wave.rotation.x = -Math.PI / 2;
  group.add(wave);

  const impact = new THREE.Mesh(
    new THREE.RingGeometry(0.12, 0.19, 40),
    basicMaterial('#e8d2a8', THREE.NormalBlending),
  );
  impact.name = 'FortressPlantImpact';
  impact.rotation.x = -Math.PI / 2;
  group.add(impact);

  const lockRing = new THREE.Mesh(
    new THREE.RingGeometry(0.28, 0.34, 8),
    basicMaterial('#7f9fa8', THREE.NormalBlending),
  );
  lockRing.name = 'FortressLockRing';
  lockRing.rotation.x = -Math.PI / 2;
  group.add(lockRing);

  for (let i = 0; i < 6; i += 1) {
    const dust = new THREE.Mesh(
      new THREE.CircleGeometry(0.08, 12),
      basicMaterial(i % 2 === 0 ? '#c5b293' : '#a9997f', THREE.NormalBlending),
    );
    dust.name = `FortressDust${i}`;
    group.add(dust);
  }

  for (let i = 0; i < 4; i += 1) {
    const plate = new THREE.Mesh(
      new THREE.BoxGeometry(0.14, 0.055, 0.30),
      basicMaterial('#78939a', THREE.NormalBlending),
    );
    plate.name = `FortressLockPlate${i}`;
    group.add(plate);
  }

  return group;
}

export function applyFortressSignatureVfx(
  group: THREE.Group | null,
  pose: FortressSignaturePose,
  cameraQuaternion: THREE.Quaternion,
  casterPosition: THREE.Vector3,
): void {
  if (!group) return;

  const impactVisible = pose.impactPulse > 0.01;
  const waveVisible = pose.groundWavePulse > 0.01 && pose.groundWaveProgress < 1;
  const dustVisible = pose.dustPulse > 0.01;
  const lockVisible = pose.fortifyLock > 0.05;
  group.visible = impactVisible || waveVisible || dustVisible || lockVisible;
  if (!group.visible) return;

  group.position.set(0, 0, 0);

  const impact = group.getObjectByName('FortressPlantImpact') as
    | THREE.Mesh<THREE.RingGeometry, THREE.MeshBasicMaterial>
    | undefined;
  if (impact) {
    impact.visible = impactVisible;
    impact.position.copy(casterPosition);
    impact.position.y += 0.014;
    impact.scale.setScalar(0.80 + pose.impactPulse * 1.25);
    impact.material.opacity = pose.impactPulse * 0.72;
  }

  const wave = group.getObjectByName('FortressGroundWave') as
    | THREE.Mesh<THREE.RingGeometry, THREE.MeshBasicMaterial>
    | undefined;
  if (wave) {
    wave.visible = waveVisible;
    wave.position.copy(casterPosition);
    wave.position.y += 0.012;
    wave.scale.setScalar(0.70 + easeOutCubic(pose.groundWaveProgress) * 2.65);
    wave.material.opacity = pose.groundWavePulse * 0.68;
  }

  const lockRing = group.getObjectByName('FortressLockRing') as
    | THREE.Mesh<THREE.RingGeometry, THREE.MeshBasicMaterial>
    | undefined;
  if (lockRing) {
    lockRing.visible = lockVisible;
    lockRing.position.copy(casterPosition);
    lockRing.position.y += 0.010;
    lockRing.rotation.z = Math.PI / 8;
    lockRing.scale.setScalar(0.78 + pose.fortifyLock * 0.64);
    lockRing.material.opacity = (0.20 + pose.lockPulse * 0.28) * pose.fortifyLock;
  }

  for (let i = 0; i < 6; i += 1) {
    const dust = group.getObjectByName(`FortressDust${i}`) as
      | THREE.Mesh<THREE.CircleGeometry, THREE.MeshBasicMaterial>
      | undefined;
    if (!dust) continue;
    const angle = (i / 6) * Math.PI * 2 + 0.18;
    const travel = 0.18 + (1 - pose.dustPulse) * (0.28 + (i % 2) * 0.07);
    dust.visible = dustVisible;
    dust.position.set(
      casterPosition.x + Math.cos(angle) * travel,
      casterPosition.y + 0.045 + (i % 3) * 0.018,
      casterPosition.z + Math.sin(angle) * travel,
    );
    dust.quaternion.copy(cameraQuaternion);
    dust.scale.setScalar(0.68 + pose.dustPulse * (0.70 + (i % 3) * 0.10));
    dust.material.opacity = pose.dustPulse * (0.44 + (i % 2) * 0.10);
  }

  for (let i = 0; i < 4; i += 1) {
    const plate = group.getObjectByName(`FortressLockPlate${i}`) as
      | THREE.Mesh<THREE.BoxGeometry, THREE.MeshBasicMaterial>
      | undefined;
    if (!plate) continue;
    const angle = i * Math.PI * 0.5 + Math.PI * 0.25;
    const radius = 0.34 + pose.fortifyLock * 0.08;
    plate.visible = lockVisible;
    plate.position.set(
      casterPosition.x + Math.cos(angle) * radius,
      casterPosition.y + 0.035,
      casterPosition.z + Math.sin(angle) * radius,
    );
    plate.rotation.set(0, -angle, 0);
    plate.scale.set(0.80 + pose.fortifyLock * 0.22, 1, 0.72 + pose.lockPulse * 0.18);
    plate.material.opacity = pose.fortifyLock * (0.34 + pose.lockPulse * 0.28);
  }
}

/**
 * Compatibility helpers retained for the coordinator's early integration prototype.
 * New runtime wiring should prefer the full signature functions above.
 */
export function createPaladinBarrierVfx(): THREE.Group {
  return createPaladinSignatureVfx();
}

export function applyPaladinBarrierVfx(group: THREE.Group | null, pulse: number): void {
  const safePulse = normalizedU(pulse);
  if (!group) return;
  const barrier = group.getObjectByName('PaladinBarrierShell') as
    | THREE.Mesh<THREE.SphereGeometry, THREE.MeshBasicMaterial>
    | undefined;
  const outer = group.getObjectByName('PaladinSanctuaryOuter') as
    | THREE.Mesh<THREE.RingGeometry, THREE.MeshBasicMaterial>
    | undefined;
  const inner = group.getObjectByName('PaladinSanctuaryInner') as
    | THREE.Mesh<THREE.RingGeometry, THREE.MeshBasicMaterial>
    | undefined;
  group.visible = safePulse > 0.01;
  if (barrier) {
    barrier.visible = group.visible;
    barrier.scale.setScalar(0.78 + safePulse * 0.66);
    barrier.material.opacity = safePulse * 0.18;
  }
  if (outer) {
    outer.visible = group.visible;
    outer.scale.setScalar(0.72 + safePulse * 1.62);
    outer.material.opacity = safePulse * 0.76;
  }
  if (inner) {
    inner.visible = group.visible;
    inner.scale.setScalar(0.86 + safePulse * 1.05);
    inner.material.opacity = safePulse * 0.62;
  }
}

export function createFortressLockVfx(): THREE.Group {
  return createFortressSignatureVfx();
}

export function applyFortressLockVfx(group: THREE.Group | null, pulse: number, fortify: number): void {
  if (!group) return;
  const safePulse = normalizedU(pulse);
  const safeFortify = normalizedU(fortify);
  group.visible = safeFortify > 0.05;
  const lockRing = group.getObjectByName('FortressLockRing') as
    | THREE.Mesh<THREE.RingGeometry, THREE.MeshBasicMaterial>
    | undefined;
  if (lockRing) {
    lockRing.visible = group.visible;
    lockRing.scale.setScalar(0.78 + safeFortify * 0.64);
    lockRing.material.opacity = safeFortify * (0.20 + safePulse * 0.28);
  }
  for (let i = 0; i < 4; i += 1) {
    const plate = group.getObjectByName(`FortressLockPlate${i}`) as
      | THREE.Mesh<THREE.BoxGeometry, THREE.MeshBasicMaterial>
      | undefined;
    if (!plate) continue;
    plate.visible = group.visible;
    plate.material.opacity = safeFortify * (0.34 + safePulse * 0.28);
  }
}
