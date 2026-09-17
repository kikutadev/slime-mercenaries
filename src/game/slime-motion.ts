import * as THREE from 'three';

export type SlimeEquipmentMotionKind = 'sword' | 'bow' | 'shield' | 'wand' | 'dagger' | 'gun';

export type MorphMesh = THREE.Mesh & {
  morphTargetDictionary?: Record<string, number>;
  morphTargetInfluences?: number[];
};

export interface SlimeDeformationPose {
  squash: number;
  stretch: number;
  lean: number;
  wobble: number;
  jump: number;
}

export interface EquipmentPose {
  angle: number;
  lift: number;
  sweep: number;
}

export interface IdleMotionPose {
  deformation: SlimeDeformationPose;
  equipment: EquipmentPose;
}

export interface HopTravelMotionPose extends IdleMotionPose {
  eased: number;
}

export interface SwordAttackMotionPose extends IdleMotionPose {
  bodyOffset: number;
  releaseProgress: number;
}

export interface FighterAttackMotionPose extends SwordAttackMotionPose {
  comboHit: 0 | 1;
  slashDirection: 1 | -1;
}

export interface GreatswordAttackMotionPose extends IdleMotionPose {
  rootYawOffset: number;
  slashU: number;
  slashEase: number;
  arcPulse: number;
}

export interface BowAttackMotionPose extends IdleMotionPose {
  tension: number;
  release: number;
}

export interface RangerAttackMotionPose extends BowAttackMotionPose {
  shotIndex: 0 | 1;
  shotProgress: number;
  lateralOffset: number;
}

export interface ShieldAttackMotionPose extends IdleMotionPose {
  bodyOffset: number;
  contactProgress: number;
}

export interface WandAttackMotionPose extends IdleMotionPose {
  bodyOffset: number;
  castProgress: number;
}

export interface DaggerAttackMotionPose extends IdleMotionPose {
  bodyOffset: number;
  stabProgress: number;
}

export interface GunAttackMotionPose extends IdleMotionPose {
  bodyOffset: number;
  shotProgress: number;
  muzzlePulse: number;
}

export interface AllyDefeatMotionPose {
  squash: number;
  bodyScaleX: number;
  bodyScaleY: number;
  bodyScaleZ: number;
  rootRotationZ: number;
  equipment: EquipmentPose;
}

export const SLIME_MOTION_TIMING = {
  swordAttack: 0.88,
  greatswordAttack: 0.60,
  bowAttack: 0.62,
  fighterAttack: 0.84,
  rangerAttack: 0.84,
  shieldAttack: 0.74,
  wandAttack: 0.82,
  daggerAttack: 0.62,
  gunAttack: 0.70,
  allyDefeat: 0.72,
  arrowFlight: 0.38,
  magicOrbFlight: 0.44,
  bulletFlight: 0.24,
  hopCycles: 3,
} as const;
export const SLIME_MOTION_THRESHOLDS = {
  swordHitReleaseProgress: 0.50,
  greatswordHitSlashU: 0.50,
  bowReleaseU: 0.56,
  fighterHitReleaseProgress: 0.46,
  arrowHitU: 0.94,
  shieldContactU: 0.48,
  wandReleaseU: 0.54,
  daggerContactU: 0.42,
  gunReleaseU: 0.40,
} as const;

export interface SwordSlashVfxPose {
  visible: boolean;
  rotationZ: number;
  scaleX: number;
  scaleY: number;
  opacity: number;
}

export interface GreatswordSpinVfxPose {
  visible: boolean;
  rotationZ: number;
  scaleX: number;
  scaleY: number;
  opacity: number;
}

export function getSwordSlashVfxPose(releaseProgress: number): SwordSlashVfxPose {
  if (releaseProgress < 0) {
    return { visible: false, rotationZ: 0, scaleX: 1, scaleY: 1, opacity: 0 };
  }
  const arcU = clamp01((releaseProgress - 0.08) / 0.82);
  const pulse = Math.sin(arcU * Math.PI);
  return {
    visible: pulse > 0.01,
    rotationZ: -0.95 + arcU * 1.15,
    scaleX: 0.90 + arcU * 0.52,
    scaleY: 0.68 + arcU * 0.16,
    opacity: pulse * 0.88,
  };
}

export function getGreatswordSpinVfxPose(
  pose: Pick<GreatswordAttackMotionPose, 'arcPulse' | 'slashEase'>,
  fusionRank: number,
): GreatswordSpinVfxPose {
  const radiusScale = fusionRank >= 4 ? 1.58 : fusionRank >= 3 ? 1.48 : 1.38;
  return {
    visible: pose.arcPulse > 0.01,
    rotationZ: THREE.MathUtils.lerp(-0.72, 0.28, pose.slashEase),
    scaleX: radiusScale * (1.22 + pose.arcPulse * 0.14),
    scaleY: radiusScale * (0.38 + pose.arcPulse * 0.05),
    opacity: pose.arcPulse * 0.74,
  };
}


const localXAxis = new THREE.Vector3(1, 0, 0);
const localZAxis = new THREE.Vector3(0, 0, 1);
const tempQuaternion = new THREE.Quaternion();
const tempQuaternion2 = new THREE.Quaternion();

export function clamp01(value: number): number {
  return THREE.MathUtils.clamp(value, 0, 1);
}

export function easeOutCubic(value: number): number {
  const t = clamp01(value);
  return 1 - ((1 - t) ** 3);
}

export function easeInOutCubic(value: number): number {
  const t = clamp01(value);
  return t < 0.5 ? 4 * t * t * t : 1 - ((-2 * t + 2) ** 3) / 2;
}

export function clearMorphs(body: MorphMesh | null): void {
  body?.morphTargetInfluences?.fill(0);
}

export function setMorph(body: MorphMesh | null, name: string, value: number): void {
  if (!body?.morphTargetDictionary || !body.morphTargetInfluences) return;
  const index = body.morphTargetDictionary[name];
  if (index === undefined) return;
  body.morphTargetInfluences[index] = clamp01(value);
}

export function applyDeformationPose(
  body: MorphMesh | null,
  faceRoot: THREE.Object3D | null,
  pose: SlimeDeformationPose,
): void {
  clearMorphs(body);
  setMorph(body, 'Squash', pose.squash);
  setMorph(body, 'Stretch', pose.stretch);
  setMorph(body, pose.lean < 0 ? 'LeanLeft' : 'LeanRight', Math.abs(pose.lean));
  setMorph(body, pose.wobble < 0 ? 'WobbleLeft' : 'WobbleRight', Math.abs(pose.wobble));
  if (faceRoot) {
    faceRoot.scale.set(
      1 + pose.squash * 0.045,
      1 - pose.squash * 0.04 + pose.stretch * 0.028,
      1,
    );
  }
}

export function applyEquipmentPose(
  equipment: THREE.Object3D | null,
  baseQuaternion: THREE.Quaternion,
  basePosition: THREE.Vector3,
  kind: SlimeEquipmentMotionKind,
  pose: EquipmentPose,
): void {
  if (!equipment) return;
  const primaryAxis = kind === 'bow' ? localZAxis : localXAxis;
  tempQuaternion.setFromAxisAngle(primaryAxis, pose.angle);
  equipment.quaternion.copy(baseQuaternion).multiply(tempQuaternion);
  if (kind !== 'bow' && Math.abs(pose.sweep) > 0.0001) {
    tempQuaternion2.setFromAxisAngle(localZAxis, pose.sweep);
    equipment.quaternion.multiply(tempQuaternion2);
  }
  equipment.position.copy(basePosition);
  equipment.position.y += pose.lift;
}

export function getIdleMotion(now: number, phaseOffset = 0): IdleMotionPose {
  const wave = Math.sin(now * 2.2 + phaseOffset);
  const breathe = 0.5 + 0.5 * wave;
  const lean = Math.sin(now * 1.25 + phaseOffset) * 0.05;
  const wobble = Math.sin(now * 2.05 + phaseOffset * 1.7) * 0.055;
  return {
    deformation: {
      squash: 0.04 * breathe,
      stretch: 0.02 * (1 - breathe),
      lean,
      wobble,
      jump: 0,
    },
    equipment: {
      angle: lean * 0.18,
      lift: 0,
      sweep: 0,
    },
  };
}

export function getHopTravelMotion(uInput: number): HopTravelMotionPose {
  const u = clamp01(uInput);
  const eased = easeInOutCubic(u);
  const cycle = (u * SLIME_MOTION_TIMING.hopCycles) % 1;
  const jump = 4 * 0.115 * cycle * (1 - cycle);
  const landing = cycle < 0.12 ? 1 - cycle / 0.12 : 0;
  const stretch = Math.max(0, Math.sin(cycle * Math.PI)) * 0.22;
  const squash = landing * 0.58 + (cycle > 0.7 ? ((cycle - 0.7) / 0.3) * 0.3 : 0);
  const lean = Math.sin(u * Math.PI) * 0.08;
  const wobble = Math.sin(cycle * Math.PI * 2) * (0.1 + landing * 0.2);
  return {
    eased,
    deformation: { squash, stretch, lean, wobble, jump },
    equipment: {
      angle: lean * 0.22,
      lift: jump * 0.03,
      sweep: 0,
    },
  };
}

export function getSwordAttackMotion(uInput: number): SwordAttackMotionPose {
  const u = clamp01(uInput);
  let squash = 0;
  let stretch = 0;
  let lean = 0;
  let weaponAngle = 0;
  let weaponSweep = 0;
  let weaponLift = 0;
  let bodyOffset = 0;
  let releaseProgress = -1;

  if (u < 0.32) {
    const p = easeInOutCubic(u / 0.32);
    squash = p * 0.32;
    lean = -p * 0.20;
    weaponAngle = THREE.MathUtils.lerp(0, -0.72, p);
    weaponSweep = THREE.MathUtils.lerp(0, -0.22, p);
    weaponLift = p * 0.018;
    bodyOffset = -p * 0.045;
  } else if (u < 0.62) {
    const p = (u - 0.32) / 0.30;
    const release = easeOutCubic(p);
    releaseProgress = p;
    squash = Math.max(0, 0.10 * (1 - p));
    stretch = Math.sin(p * Math.PI) * 0.24;
    lean = THREE.MathUtils.lerp(-0.20, 0.34, release);
    weaponAngle = THREE.MathUtils.lerp(-0.72, 1.34, release);
    weaponSweep = THREE.MathUtils.lerp(-0.22, 0.18, release);
    weaponLift = Math.sin(p * Math.PI) * 0.026;
    bodyOffset = THREE.MathUtils.lerp(-0.045, 0.32, release);
  } else {
    const p = (u - 0.62) / 0.38;
    const recovery = easeInOutCubic(p);
    const spring = Math.sin(p * Math.PI * 2) * Math.exp(-4.2 * p);
    weaponAngle = THREE.MathUtils.lerp(1.34, 0, recovery);
    weaponSweep = THREE.MathUtils.lerp(0.18, 0, recovery);
    bodyOffset = THREE.MathUtils.lerp(0.32, 0, recovery);
    squash = Math.max(0, -spring) * 0.20;
    stretch = Math.max(0, spring) * 0.15;
    lean = spring * 0.09;
  }

  return {
    bodyOffset,
    releaseProgress,
    deformation: { squash, stretch, lean, wobble: 0, jump: 0 },
    equipment: { angle: weaponAngle, lift: weaponLift, sweep: weaponSweep },
  };
}

export function getFighterAttackMotion(uInput: number): FighterAttackMotionPose {
  const u = clamp01(uInput);
  const firstPhaseEnd = 0.48;
  const comboHit: 0 | 1 = u < firstPhaseEnd ? 0 : 1;
  const localU = comboHit === 0 ? u / firstPhaseEnd : (u - firstPhaseEnd) / (1 - firstPhaseEnd);
  const base = getSwordAttackMotion(localU);
  const direction: 1 | -1 = comboHit === 0 ? 1 : -1;
  const settleBlend = comboHit === 1 ? 0.92 : 1;
  return {
    ...base,
    comboHit,
    slashDirection: direction,
    bodyOffset: base.bodyOffset * (comboHit === 0 ? 0.92 : 0.78),
    deformation: {
      ...base.deformation,
      lean: base.deformation.lean * direction * settleBlend,
      wobble: base.deformation.wobble + (comboHit === 1 ? Math.sin(localU * Math.PI) * 0.035 : 0),
    },
    equipment: {
      angle: base.equipment.angle * direction,
      lift: base.equipment.lift,
      sweep: base.equipment.sweep * direction,
    },
  };
}

export function getGreatswordAttackMotion(uInput: number): GreatswordAttackMotionPose {
  const u = clamp01(uInput);
  const anticipation = clamp01(u / 0.16);
  const slashU = clamp01((u - 0.14) / 0.22);
  const slashEase = 1 - ((1 - slashU) ** 4);
  const settle = clamp01((u - 0.52) / 0.48);
  const settleEase = easeOutCubic(settle);
  const windupOffset = -0.30 * anticipation;
  const sweepEndOffset = -0.30 + Math.PI * 0.78;
  const rootYawOffset = slashU < 1
    ? THREE.MathUtils.lerp(windupOffset, sweepEndOffset, slashEase)
    : THREE.MathUtils.lerp(sweepEndOffset, 0, settleEase);
  const squash = u < 0.18 ? 0.28 * anticipation : 0.05 * (1 - settleEase);
  const stretch = slashU > 0 && slashU < 1 ? 0.30 * Math.sin(slashU * Math.PI) : 0;
  const wobble = slashU > 0 && slashU < 1 ? Math.sin(slashU * Math.PI * 2) * 0.07 : 0;
  const horizontalTilt = slashU > 0
    ? THREE.MathUtils.lerp(-1.52, -1.68, Math.sin(slashU * Math.PI))
    : THREE.MathUtils.lerp(0, -1.52, anticipation);
  const recoverTilt = settle > 0 ? THREE.MathUtils.lerp(horizontalTilt, 0, settleEase) : horizontalTilt;
  const sweep = slashU > 0
    ? THREE.MathUtils.lerp(-0.78, -1.02, Math.sin(slashU * Math.PI))
    : THREE.MathUtils.lerp(0, -0.78, anticipation);
  const recoverSweep = settle > 0 ? THREE.MathUtils.lerp(sweep, 0, settleEase) : sweep;
  const arcPulse = slashU > 0 && slashU < 1 ? Math.sin(slashU * Math.PI) : 0;

  return {
    rootYawOffset,
    slashU,
    slashEase,
    arcPulse,
    deformation: {
      squash,
      stretch,
      lean: -0.08 * anticipation,
      wobble,
      jump: 0,
    },
    equipment: {
      angle: recoverTilt,
      lift: 0.012 * Math.sin(slashU * Math.PI),
      sweep: recoverSweep,
    },
  };
}

export function getBowAttackMotion(uInput: number): BowAttackMotionPose {
  const u = clamp01(uInput);
  const tension = Math.sin(Math.min(1, u / 0.55) * Math.PI * 0.5);
  const release = clamp01((u - 0.55) / 0.18);
  return {
    tension,
    release,
    deformation: {
      squash: 0.08 * tension,
      stretch: 0.12 * release,
      lean: -0.06 * tension + 0.08 * release,
      wobble: 0,
      jump: 0,
    },
    equipment: {
      angle: -0.36 * tension + 0.5 * release,
      lift: 0.012 * tension,
      sweep: 0,
    },
  };
}


export function getRangerAttackMotion(uInput: number): RangerAttackMotionPose {
  const u = clamp01(uInput);
  const firstPhaseEnd = 0.44;
  const shotIndex: 0 | 1 = u < firstPhaseEnd ? 0 : 1;
  const shotProgress = shotIndex === 0 ? u / firstPhaseEnd : (u - firstPhaseEnd) / (1 - firstPhaseEnd);
  const base = getBowAttackMotion(shotProgress);
  const lateralOffset = Math.sin(u * Math.PI) * 0.10;
  const sideSign = shotIndex === 0 ? -1 : 1;
  return {
    ...base,
    shotIndex,
    shotProgress,
    lateralOffset,
    deformation: {
      ...base.deformation,
      lean: base.deformation.lean + sideSign * Math.sin(shotProgress * Math.PI) * 0.035,
      wobble: sideSign * Math.sin(shotProgress * Math.PI) * 0.025,
    },
    equipment: {
      ...base.equipment,
      angle: base.equipment.angle + sideSign * 0.035 * Math.sin(shotProgress * Math.PI),
    },
  };
}

export function getRangerShotReleaseU(shotIndex: 0 | 1): number {
  const firstPhaseEnd = 0.44;
  return shotIndex === 0
    ? firstPhaseEnd * SLIME_MOTION_THRESHOLDS.bowReleaseU
    : firstPhaseEnd + (1 - firstPhaseEnd) * SLIME_MOTION_THRESHOLDS.bowReleaseU;
}

export function getShieldAttackMotion(uInput: number): ShieldAttackMotionPose {
  const u = clamp01(uInput);
  let bodyOffset = 0;
  let squash = 0;
  let stretch = 0;
  let lean = 0;
  let angle = 0;
  let lift = 0;
  let contactProgress = -1;
  if (u < 0.28) {
    const p = easeInOutCubic(u / 0.28);
    bodyOffset = -0.06 * p;
    squash = 0.26 * p;
    lean = -0.10 * p;
    angle = -0.16 * p;
    lift = 0.008 * p;
  } else if (u < 0.58) {
    const p = (u - 0.28) / 0.30;
    const release = easeOutCubic(p);
    contactProgress = p;
    bodyOffset = THREE.MathUtils.lerp(-0.06, 0.28, release);
    squash = 0.10 * (1 - p);
    stretch = 0.19 * Math.sin(p * Math.PI);
    lean = THREE.MathUtils.lerp(-0.10, 0.18, release);
    angle = THREE.MathUtils.lerp(-0.16, 0.20, release);
    lift = 0.012 * Math.sin(p * Math.PI);
  } else {
    const p = easeInOutCubic((u - 0.58) / 0.42);
    bodyOffset = THREE.MathUtils.lerp(0.28, 0, p);
    angle = THREE.MathUtils.lerp(0.20, 0, p);
    lean = THREE.MathUtils.lerp(0.18, 0, p);
    squash = 0.08 * Math.sin(p * Math.PI);
  }
  return {
    bodyOffset, contactProgress,
    deformation: { squash, stretch, lean, wobble: 0, jump: 0 },
    equipment: { angle, lift, sweep: 0 },
  };
}

export function getWandAttackMotion(uInput: number): WandAttackMotionPose {
  const u = clamp01(uInput);
  const charge = clamp01(u / 0.42);
  const castProgress = clamp01((u - 0.42) / 0.22);
  const recover = clamp01((u - 0.64) / 0.36);
  const castEase = easeOutCubic(castProgress);
  const recoverEase = easeInOutCubic(recover);
  const releaseKick = castProgress > 0 && castProgress < 1 ? Math.sin(castProgress * Math.PI) : 0;
  const bodyOffset = u < 0.42
    ? -0.07 * easeInOutCubic(charge)
    : THREE.MathUtils.lerp(THREE.MathUtils.lerp(-0.07, 0.12, castEase), 0, recoverEase);
  const angleBeforeRecover = THREE.MathUtils.lerp(-0.46 * charge, 0.72, castEase);
  return {
    bodyOffset, castProgress: u < 0.42 ? -1 : castProgress,
    deformation: {
      squash: 0.14 * charge * (1 - castProgress),
      stretch: 0.18 * releaseKick,
      lean: (-0.09 * charge + 0.16 * releaseKick) * (1 - recoverEase),
      wobble: 0.04 * Math.sin(u * Math.PI * 3) * (1 - recoverEase),
      jump: 0,
    },
    equipment: {
      angle: THREE.MathUtils.lerp(angleBeforeRecover, 0, recoverEase),
      lift: 0.018 * charge + 0.022 * releaseKick,
      sweep: THREE.MathUtils.lerp(-0.08 * charge + 0.16 * castEase, 0, recoverEase),
    },
  };
}

export function getDaggerAttackMotion(uInput: number): DaggerAttackMotionPose {
  const u = clamp01(uInput);
  let bodyOffset = 0;
  let squash = 0;
  let stretch = 0;
  let lean = 0;
  let angle = 0;
  let sweep = 0;
  let stabProgress = -1;
  if (u < 0.18) {
    const p = easeInOutCubic(u / 0.18);
    bodyOffset = -0.04 * p;
    squash = 0.18 * p;
    lean = -0.12 * p;
    angle = -0.30 * p;
  } else if (u < 0.46) {
    const p = (u - 0.18) / 0.28;
    const dash = easeOutCubic(p);
    stabProgress = p;
    bodyOffset = THREE.MathUtils.lerp(-0.04, 0.42, dash);
    stretch = 0.27 * Math.sin(p * Math.PI);
    lean = THREE.MathUtils.lerp(-0.12, 0.28, dash);
    angle = THREE.MathUtils.lerp(-0.30, 0.58, dash);
    sweep = 0.08 * dash;
  } else {
    const p = easeInOutCubic((u - 0.46) / 0.54);
    const spring = Math.sin(p * Math.PI * 2) * Math.exp(-4 * p);
    bodyOffset = THREE.MathUtils.lerp(0.42, 0, p);
    angle = THREE.MathUtils.lerp(0.58, 0, p);
    sweep = THREE.MathUtils.lerp(0.08, 0, p);
    squash = Math.max(0, -spring) * 0.12;
    stretch = Math.max(0, spring) * 0.10;
    lean = spring * 0.08;
  }
  return {
    bodyOffset, stabProgress,
    deformation: { squash, stretch, lean, wobble: 0, jump: 0 },
    equipment: { angle, lift: 0.006 * stretch, sweep },
  };
}

export function getGunAttackMotion(uInput: number): GunAttackMotionPose {
  const u = clamp01(uInput);
  const aim = clamp01(u / 0.32);
  const shotProgress = clamp01((u - 0.32) / 0.14);
  const recover = clamp01((u - 0.46) / 0.54);
  const shotPulse = shotProgress > 0 && shotProgress < 1 ? Math.sin(shotProgress * Math.PI) : 0;
  const recoil = shotProgress > 0 ? easeOutCubic(shotProgress) : 0;
  const recoverEase = easeOutCubic(recover);
  const recoilOffset = THREE.MathUtils.lerp(-0.11 * recoil, 0, recoverEase);
  return {
    bodyOffset: recoilOffset,
    shotProgress: u < 0.32 ? -1 : shotProgress,
    muzzlePulse: shotPulse,
    deformation: {
      squash: (0.08 * aim + 0.24 * shotPulse) * (1 - recoverEase),
      stretch: 0.05 * recoverEase,
      lean: (-0.04 * aim - 0.16 * recoil) * (1 - recoverEase),
      wobble: 0.08 * Math.sin(recover * Math.PI * 3) * (1 - recoverEase),
      jump: 0,
    },
    equipment: {
      angle: THREE.MathUtils.lerp(-0.05 * aim - 0.18 * recoil, 0, recoverEase),
      lift: 0.006 * aim,
      sweep: 0,
    },
  };
}

export function getAllyDefeatMotion(uInput: number, side: -1 | 1): AllyDefeatMotionPose {
  const u = clamp01(uInput);
  const squash = Math.sin(Math.min(1, u * 1.4) * Math.PI * 0.5);
  return {
    squash,
    bodyScaleX: 1 + 0.4 * squash,
    bodyScaleY: 1 - 0.72 * squash,
    bodyScaleZ: 1 + 0.22 * squash,
    rootRotationZ: side * 0.12 * squash,
    equipment: {
      angle: side * u * 0.72,
      lift: -u * 0.025,
      sweep: u * 0.16,
    },
  };
}

export function getArrowArcHeight(uInput: number): number {
  return Math.sin(clamp01(uInput) * Math.PI) * 0.08;
}


/** Build the exact arrow mesh used by production battle and gallery playback. */
export function createSlimeArrowMesh(): THREE.Group {
  const group = new THREE.Group();
  const wood = new THREE.MeshStandardMaterial({ color: '#8a5a2d', roughness: 0.85 });
  const steel = new THREE.MeshStandardMaterial({ color: '#d1dce3', roughness: 0.28, metalness: 0.65 });
  const feather = new THREE.MeshStandardMaterial({ color: '#72bf68', roughness: 0.68 });
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.38, 6), wood);
  group.add(shaft);
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.034, 0.09, 6), steel);
  tip.position.y = 0.235;
  group.add(tip);
  const fletching = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.065, 0.014), feather);
  fletching.position.y = -0.195;
  fletching.rotation.y = Math.PI / 4;
  group.add(fletching);
  return group;
}


export function createMagicOrbMesh(): THREE.Mesh<THREE.SphereGeometry, THREE.MeshBasicMaterial> {
  const material = new THREE.MeshBasicMaterial({
    color: '#aa7cff', transparent: true, opacity: 0.92, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const orb = new THREE.Mesh(new THREE.SphereGeometry(0.055, 16, 10), material);
  orb.visible = false;
  orb.renderOrder = 6;
  return orb;
}

export function createGunBulletMesh(): THREE.Mesh<THREE.SphereGeometry, THREE.MeshBasicMaterial> {
  const material = new THREE.MeshBasicMaterial({ color: '#ffe7a3' });
  const bullet = new THREE.Mesh(new THREE.SphereGeometry(0.022, 10, 6), material);
  bullet.visible = false;
  bullet.renderOrder = 6;
  return bullet;
}

export function createMuzzleFlashMesh(): THREE.Mesh<THREE.ConeGeometry, THREE.MeshBasicMaterial> {
  const material = new THREE.MeshBasicMaterial({
    color: '#ffd66b', transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const flash = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.16, 8), material);
  flash.visible = false;
  flash.renderOrder = 7;
  return flash;
}

/** Build the exact short slash arc used by production Sword attacks. */
export function createSwordSlashArc(): THREE.Mesh<THREE.TorusGeometry, THREE.MeshBasicMaterial> {
  const material = new THREE.MeshBasicMaterial({
    color: '#ffd85e',
    transparent: true,
    opacity: 0,
    side: THREE.DoubleSide,
    depthWrite: false,
    depthTest: false,
    blending: THREE.AdditiveBlending,
  });
  const arc = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.024, 8, 36, Math.PI * 0.62), material);
  arc.visible = false;
  arc.renderOrder = 5;
  return arc;
}

/** Build the exact broad arc used by production Greatsword attacks. */
export function createGreatswordSpinArc(): THREE.Mesh<THREE.TorusGeometry, THREE.MeshBasicMaterial> {
  const material = new THREE.MeshBasicMaterial({
    color: '#fff1a8',
    transparent: true,
    opacity: 0,
    side: THREE.DoubleSide,
    depthWrite: false,
    depthTest: false,
    blending: THREE.AdditiveBlending,
  });
  const arc = new THREE.Mesh(new THREE.TorusGeometry(0.70, 0.020, 8, 64), material);
  arc.visible = false;
  arc.rotation.x = Math.PI / 2;
  arc.renderOrder = 5;
  return arc;
}
