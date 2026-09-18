import * as THREE from 'three';

import {
  clamp01,
  easeInOutCubic,
  easeOutCubic,
  type EquipmentPose,
  type IdleMotionPose,
} from '../../slime-motion';

/**
 * Tier-3 Bow timing is deliberately slower than Ranger at the anticipation side and much
 * faster at the payoff side. Runtime and gallery should consume these values directly.
 */
export const TIER3_BOW_TIMING = {
  sniperAttack: 1.18,
  stormArcherAttack: 1.10,
  sniperArrowFlight: 0.11,
  stormArrowFlight: 0.16,
} as const;

export const TIER3_BOW_THRESHOLDS = {
  sniperSightLockU: 0.525,
  sniperReleaseU: 0.565,
  sniperImpactU: 0.658,
  stormFirstReleaseU: 0.485,
  stormSecondReleaseU: 0.535,
  stormThirdReleaseU: 0.585,
  stormChainStartU: 0.730,
} as const;

export interface SniperAttackMotionPose extends IdleMotionPose {
  tension: number;
  release: number;
  recoil: number;
  focusPulse: number;
  sightLockPulse: number;
  shotFlash: number;
  trailPulse: number;
  criticalPulse: number;
}

export interface StormArcherAttackMotionPose extends IdleMotionPose {
  bodyOffset: number;
  shotIndex: 0 | 1 | 2;
  shotProgress: number;
  shotPulses: readonly [number, number, number];
  electricPulse: number;
  volleySpread: number;
  chainPulse: number;
}

const LOCAL_X_AXIS = new THREE.Vector3(1, 0, 0);
const CAMERA_UP_AXIS = new THREE.Vector3(0, 1, 0);
const beamDelta = new THREE.Vector3();
const beamMidpoint = new THREE.Vector3();
const beamQuaternion = new THREE.Quaternion();
const screenUp = new THREE.Vector3();
const chainPoints = Array.from({ length: 5 }, () => new THREE.Vector3());

const equipment = (angle = 0, lift = 0, sweep = 0): EquipmentPose => ({ angle, lift, sweep });

function pulseAround(u: number, center: number, rise: number, fall: number): number {
  if (u < center - rise || u > center + fall) return 0;
  if (u < center) return easeOutCubic((u - (center - rise)) / rise);
  return 1 - easeInOutCubic((u - center) / fall);
}

function placeBeam(
  mesh: THREE.Mesh,
  source: THREE.Vector3,
  target: THREE.Vector3,
  opacity: number,
): void {
  if (!(mesh.material instanceof THREE.MeshBasicMaterial)) return;
  beamDelta.subVectors(target, source);
  const length = beamDelta.length();
  const visible = opacity > 0.005 && length > 0.0001;
  mesh.visible = visible;
  mesh.material.opacity = visible ? opacity : 0;
  if (!visible) return;

  beamMidpoint.copy(source).addScaledVector(beamDelta, 0.5);
  mesh.position.copy(beamMidpoint);
  beamDelta.multiplyScalar(1 / length);
  beamQuaternion.setFromUnitVectors(LOCAL_X_AXIS, beamDelta);
  mesh.quaternion.copy(beamQuaternion);
  mesh.scale.set(length, 1, 1);
}

function setBillboardSlash(
  mesh: THREE.Mesh,
  position: THREE.Vector3,
  cameraQuaternion: THREE.Quaternion,
  rotationZ: number,
  scaleX: number,
  scaleY: number,
  opacity: number,
): void {
  if (!(mesh.material instanceof THREE.MeshBasicMaterial)) return;
  mesh.visible = opacity > 0.005;
  mesh.material.opacity = mesh.visible ? opacity : 0;
  if (!mesh.visible) return;
  mesh.position.copy(position);
  mesh.quaternion.copy(cameraQuaternion);
  mesh.rotateZ(rotationZ);
  mesh.scale.set(scaleX, scaleY, 1);
}

function placeChain(
  group: THREE.Group,
  chainIndex: 0 | 1,
  source: THREE.Vector3,
  target: THREE.Vector3,
  cameraQuaternion: THREE.Quaternion,
  pulse: number,
): void {
  beamDelta.subVectors(target, source);
  const length = beamDelta.length();
  screenUp.copy(CAMERA_UP_AXIS).applyQuaternion(cameraQuaternion).normalize();
  const jitter = Math.min(0.055, length * 0.10);
  const offsets = [0, 0.85, -0.72, 0.52, 0] as const;

  for (let i = 0; i < chainPoints.length; i += 1) {
    chainPoints[i]!
      .copy(source)
      .lerp(target, i / (chainPoints.length - 1))
      .addScaledVector(screenUp, offsets[i]! * jitter);
  }

  for (let segment = 0; segment < chainPoints.length - 1; segment += 1) {
    const core = group.getObjectByName(`StormChain${chainIndex}Core${segment}`) as THREE.Mesh | undefined;
    const glow = group.getObjectByName(`StormChain${chainIndex}Glow${segment}`) as THREE.Mesh | undefined;
    if (glow) placeBeam(glow, chainPoints[segment]!, chainPoints[segment + 1]!, pulse * 0.34);
    if (core) placeBeam(core, chainPoints[segment]!, chainPoints[segment + 1]!, pulse * 0.94);
  }
}

/**
 * Sniper is intentionally almost frozen through the long aim. The only readable pre-fire
 * movement is the bow settling into tension; all spectacle is concentrated into lock/release.
 */
export function getSniperAttackMotion(uInput: number): SniperAttackMotionPose {
  const u = clamp01(uInput);

  if (u < TIER3_BOW_THRESHOLDS.sniperSightLockU) {
    const aimU = easeInOutCubic(u / TIER3_BOW_THRESHOLDS.sniperSightLockU);
    return {
      tension: 0.18 + aimU * 0.82,
      release: 0,
      recoil: 0,
      focusPulse: aimU,
      sightLockPulse: 0,
      shotFlash: 0,
      trailPulse: 0,
      criticalPulse: 0,
      deformation: {
        squash: 0.026 * aimU,
        stretch: 0.018 * aimU,
        lean: -0.014 * aimU,
        wobble: 0,
        jump: 0,
      },
      equipment: equipment(-0.075 * aimU, 0.004 * aimU, 0),
    };
  }

  if (u < TIER3_BOW_THRESHOLDS.sniperReleaseU) {
    const lockU = (u - TIER3_BOW_THRESHOLDS.sniperSightLockU)
      / (TIER3_BOW_THRESHOLDS.sniperReleaseU - TIER3_BOW_THRESHOLDS.sniperSightLockU);
    const sightLockPulse = Math.sin(lockU * Math.PI);
    return {
      tension: 1,
      release: 0,
      recoil: 0,
      focusPulse: 1,
      sightLockPulse,
      shotFlash: 0,
      trailPulse: 0,
      criticalPulse: 0,
      deformation: { squash: 0.026, stretch: 0.018, lean: -0.014, wobble: 0, jump: 0 },
      equipment: equipment(-0.075, 0.004, 0),
    };
  }

  if (u < 0.665) {
    const releaseU = clamp01(
      (u - TIER3_BOW_THRESHOLDS.sniperReleaseU)
      / (0.665 - TIER3_BOW_THRESHOLDS.sniperReleaseU),
    );
    const snap = easeOutCubic(clamp01(releaseU / 0.24));
    const recoil = Math.sin(releaseU * Math.PI);
    const shotFlash = Math.sin(clamp01(releaseU / 0.38) * Math.PI);
    const trailPulse = 1 - releaseU * 0.96;
    const criticalPulse = pulseAround(
      u,
      TIER3_BOW_THRESHOLDS.sniperImpactU + 0.015,
      0.015,
      0.095,
    );

    return {
      tension: 1 - snap,
      release: snap,
      recoil,
      focusPulse: 1 - snap,
      sightLockPulse: 0,
      shotFlash,
      trailPulse,
      criticalPulse,
      deformation: {
        squash: 0.026 * (1 - snap) + recoil * 0.29,
        stretch: recoil * 0.09,
        lean: -0.014 * (1 - snap) + recoil * 0.34,
        wobble: -recoil * 0.08,
        jump: recoil * 0.028,
      },
      equipment: equipment(
        -0.075 * (1 - snap) + recoil * 0.34,
        0.004 * (1 - snap) + recoil * 0.022,
        recoil * 0.045,
      ),
    };
  }

  const recoverU = easeOutCubic((u - 0.665) / 0.335);
  const settle = Math.sin(recoverU * Math.PI * 2) * Math.exp(-5.2 * recoverU);
  const lingeringCritical = pulseAround(
    u,
    TIER3_BOW_THRESHOLDS.sniperImpactU + 0.015,
    0.015,
    0.095,
  );

  return {
    tension: 0,
    release: 1,
    recoil: Math.max(0, settle) * 0.22,
    focusPulse: 0,
    sightLockPulse: 0,
    shotFlash: 0,
    trailPulse: 0.04 * (1 - recoverU),
    criticalPulse: lingeringCritical,
    deformation: {
      squash: Math.max(0, settle) * 0.10,
      stretch: Math.max(0, -settle) * 0.055,
      lean: settle * 0.075,
      wobble: settle * 0.035,
      jump: 0,
    },
    equipment: equipment(settle * 0.10, Math.max(0, settle) * 0.005, settle * 0.025),
  };
}

export function getStormShotReleaseU(shotIndex: 0 | 1 | 2): number {
  return [
    TIER3_BOW_THRESHOLDS.stormFirstReleaseU,
    TIER3_BOW_THRESHOLDS.stormSecondReleaseU,
    TIER3_BOW_THRESHOLDS.stormThirdReleaseU,
  ][shotIndex];
}

function getStormShotPulse(u: number, shotIndex: 0 | 1 | 2): number {
  return pulseAround(u, getStormShotReleaseU(shotIndex), 0.020, 0.145);
}

/**
 * Storm Archer uses one charged airborne fan volley. The three releases are intentionally
 * close enough to read as one signature attack, but separated enough for three distinct lines.
 */
export function getStormArcherAttackMotion(uInput: number): StormArcherAttackMotionPose {
  const u = clamp01(uInput);
  const release0 = getStormShotReleaseU(0);
  const release1 = getStormShotReleaseU(1);
  const release2 = getStormShotReleaseU(2);
  const shotPulses = [
    getStormShotPulse(u, 0),
    getStormShotPulse(u, 1),
    getStormShotPulse(u, 2),
  ] as const;

  let shotIndex: 0 | 1 | 2 = 0;
  if (u >= release2) shotIndex = 2;
  else if (u >= release1) shotIndex = 1;

  const releaseAt = getStormShotReleaseU(shotIndex);
  const nextRelease = shotIndex === 2
    ? TIER3_BOW_THRESHOLDS.stormChainStartU
    : getStormShotReleaseU((shotIndex + 1) as 1 | 2);
  const shotProgress = u < releaseAt
    ? -1
    : clamp01((u - releaseAt) / Math.max(0.001, nextRelease - releaseAt));

  if (u < 0.29) {
    const chargeU = easeInOutCubic(u / 0.29);
    return {
      bodyOffset: 0,
      shotIndex: 0,
      shotProgress: -1,
      shotPulses,
      electricPulse: chargeU,
      volleySpread: 0,
      chainPulse: 0,
      deformation: {
        squash: 0.34 * chargeU,
        stretch: 0.03 * chargeU,
        lean: -0.085 * chargeU,
        wobble: Math.sin(chargeU * Math.PI * 2) * 0.028 * chargeU,
        jump: 0,
      },
      equipment: equipment(-0.42 * chargeU, 0.012 * chargeU, -0.035 * chargeU),
    };
  }

  if (u < release0) {
    const drawU = easeOutCubic((u - 0.29) / (release0 - 0.29));
    const jumpArc = Math.sin(drawU * Math.PI * 0.58);
    return {
      bodyOffset: 0,
      shotIndex: 0,
      shotProgress: -1,
      shotPulses,
      electricPulse: 0.78 + 0.22 * drawU,
      volleySpread: 0,
      chainPulse: 0,
      deformation: {
        squash: 0.34 * (1 - drawU),
        stretch: 0.24 * drawU,
        lean: THREE.MathUtils.lerp(-0.085, 0.11, drawU),
        wobble: Math.sin(drawU * Math.PI * 3) * 0.035,
        jump: jumpArc * 0.205,
      },
      equipment: equipment(
        THREE.MathUtils.lerp(-0.42, -0.68, drawU),
        0.012 + drawU * 0.020,
        THREE.MathUtils.lerp(-0.035, -0.095, drawU),
      ),
    };
  }

  if (u < TIER3_BOW_THRESHOLDS.stormChainStartU) {
    const volleyU = (u - release0) / (TIER3_BOW_THRESHOLDS.stormChainStartU - release0);
    const kick = Math.max(...shotPulses);
    const postVolleyU = u <= release2
      ? 0
      : easeOutCubic((u - release2) / (TIER3_BOW_THRESHOLDS.stormChainStartU - release2));
    const jump = THREE.MathUtils.lerp(0.205, 0.145, easeInOutCubic(volleyU));
    const perShotLean = shotPulses[0] * -0.055 + shotPulses[1] * 0.01 + shotPulses[2] * 0.065;
    const electricHold = 0.82 * (1 - postVolleyU);
    return {
      bodyOffset: perShotLean * 0.14,
      shotIndex,
      shotProgress,
      shotPulses,
      electricPulse: Math.max(electricHold, kick),
      volleySpread: 1,
      chainPulse: 0,
      deformation: {
        squash: kick * 0.12,
        stretch: 0.20 * (1 - volleyU) + kick * 0.08,
        lean: 0.11 + perShotLean,
        wobble: (shotPulses[0] - shotPulses[2]) * 0.085,
        jump,
      },
      equipment: equipment(
        THREE.MathUtils.lerp(-0.68 + kick * 0.22, -0.46, postVolleyU),
        THREE.MathUtils.lerp(0.032 + kick * 0.012, 0.026, postVolleyU),
        THREE.MathUtils.lerp(-0.095 + (shotIndex - 1) * 0.055, 0.055, postVolleyU),
      ),
    };
  }

  if (u < 0.86) {
    const landU = easeInOutCubic(
      (u - TIER3_BOW_THRESHOLDS.stormChainStartU) / (0.86 - TIER3_BOW_THRESHOLDS.stormChainStartU),
    );
    const chainPulse = Math.sin(landU * Math.PI);
    return {
      bodyOffset: 0,
      shotIndex: 2,
      shotProgress: 1,
      shotPulses,
      electricPulse: 0,
      volleySpread: 1 - landU * 0.38,
      chainPulse,
      deformation: {
        squash: 0.22 * Math.sin(landU * Math.PI),
        stretch: 0.03 * Math.sin(landU * Math.PI),
        lean: 0.11 * (1 - landU),
        wobble: Math.sin(landU * Math.PI * 2) * 0.045 * (1 - landU),
        jump: THREE.MathUtils.lerp(0.145, 0, landU),
      },
      equipment: equipment(
        THREE.MathUtils.lerp(-0.46, 0.08, landU),
        0.026 * (1 - landU),
        THREE.MathUtils.lerp(0.055, 0.025, landU),
      ),
    };
  }

  const recoverU = easeOutCubic((u - 0.86) / 0.14);
  return {
    bodyOffset: 0,
    shotIndex: 2,
    shotProgress: 1,
    shotPulses,
    electricPulse: 0,
    volleySpread: 0.62 * (1 - recoverU),
    chainPulse: 0,
    deformation: { squash: 0, stretch: 0, lean: 0, wobble: 0, jump: 0 },
    equipment: equipment(0.08 * (1 - recoverU), 0, 0.025 * (1 - recoverU)),
  };
}

function makeBeam(name: string, thickness: number, color: string): THREE.Mesh {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(1, thickness, thickness),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
    }),
  );
  mesh.name = name;
  mesh.visible = false;
  return mesh;
}

function makeBillboardSlash(name: string, width: number, height: number, color: string): THREE.Mesh {
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(width, height),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
    }),
  );
  mesh.name = name;
  mesh.visible = false;
  return mesh;
}

/**
 * Sniper signature VFX contains no large circular field. The long thin shot line is the hero
 * shape, with only a tiny sight-lock glint at ProjectileOrigin and a compact impact star.
 */
export function createSniperSignatureVfx(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'SniperSignatureVfx';
  group.visible = false;
  group.renderOrder = 10;

  group.add(makeBeam('SniperPiercingGlow', 0.058, '#60c9ff'));
  group.add(makeBeam('SniperPiercingCore', 0.016, '#f8fdff'));

  group.add(makeBillboardSlash('SniperSightLockHorizontal', 0.22, 0.018, '#eafcff'));
  group.add(makeBillboardSlash('SniperSightLockVertical', 0.018, 0.22, '#93e4ff'));

  for (let i = 0; i < 4; i += 1) {
    group.add(makeBillboardSlash(`SniperImpactRay${i}`, 0.30, 0.020, i % 2 === 0 ? '#ffffff' : '#74d8ff'));
  }

  return group;
}

export function applySniperSignatureVfx(
  group: THREE.Group | null,
  pose: Pick<
    SniperAttackMotionPose,
    'sightLockPulse' | 'shotFlash' | 'trailPulse' | 'criticalPulse'
  >,
  source: THREE.Vector3,
  target: THREE.Vector3,
  cameraQuaternion: THREE.Quaternion,
): void {
  if (!group) return;
  const visible = pose.sightLockPulse > 0.005
    || pose.shotFlash > 0.005
    || pose.trailPulse > 0.005
    || pose.criticalPulse > 0.005;
  group.visible = visible;
  if (!visible) return;

  const glow = group.getObjectByName('SniperPiercingGlow') as THREE.Mesh | undefined;
  const core = group.getObjectByName('SniperPiercingCore') as THREE.Mesh | undefined;
  if (glow) placeBeam(glow, source, target, Math.max(pose.trailPulse * 0.44, pose.shotFlash * 0.22));
  if (core) placeBeam(core, source, target, Math.max(pose.trailPulse * 0.98, pose.shotFlash * 0.76));

  const lockScale = 0.72 + pose.sightLockPulse * 0.58;
  const lockHorizontal = group.getObjectByName('SniperSightLockHorizontal') as THREE.Mesh | undefined;
  const lockVertical = group.getObjectByName('SniperSightLockVertical') as THREE.Mesh | undefined;
  if (lockHorizontal) {
    setBillboardSlash(
      lockHorizontal,
      source,
      cameraQuaternion,
      0,
      lockScale,
      1,
      pose.sightLockPulse * 0.96,
    );
  }
  if (lockVertical) {
    setBillboardSlash(
      lockVertical,
      source,
      cameraQuaternion,
      0,
      1,
      lockScale,
      pose.sightLockPulse * 0.86,
    );
  }

  for (let i = 0; i < 4; i += 1) {
    const ray = group.getObjectByName(`SniperImpactRay${i}`) as THREE.Mesh | undefined;
    if (!ray) continue;
    const angle = i * Math.PI * 0.25;
    setBillboardSlash(
      ray,
      target,
      cameraQuaternion,
      angle,
      0.74 + pose.criticalPulse * 1.25,
      1,
      pose.criticalPulse * (i % 2 === 0 ? 0.96 : 0.72),
    );
  }
}

/**
 * Storm signature VFX is built around three explicit attack lines and short chain segments.
 * There are intentionally no ring/torus field meshes: the fan geometry itself sells the skill.
 */
export function createStormSignatureVfx(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'StormArcherSignatureVfx';
  group.visible = false;
  group.renderOrder = 10;

  for (let i = 0; i < 3; i += 1) {
    group.add(makeBeam(`StormFanTrail${i}Glow`, 0.070, i === 1 ? '#5fdfff' : '#6ef4ff'));
    group.add(makeBeam(`StormFanTrail${i}Core`, 0.021, i === 1 ? '#f1ffff' : '#c7ffff'));
    group.add(makeBillboardSlash(`StormImpactSlash${i}`, 0.22, 0.018, '#d8ffff'));
  }

  for (let chainIndex = 0; chainIndex < 2; chainIndex += 1) {
    for (let segment = 0; segment < 4; segment += 1) {
      group.add(makeBeam(`StormChain${chainIndex}Glow${segment}`, 0.048, '#4bd8ff'));
      group.add(makeBeam(`StormChain${chainIndex}Core${segment}`, 0.014, '#e9ffff'));
    }
  }

  for (let i = 0; i < 3; i += 1) {
    group.add(makeBillboardSlash(`StormChargeSlash${i}`, 0.13, 0.014, i === 1 ? '#e8ffff' : '#72ebff'));
  }

  return group;
}

export function applyStormSignatureVfx(
  group: THREE.Group | null,
  pose: Pick<StormArcherAttackMotionPose, 'shotPulses' | 'electricPulse' | 'chainPulse'>,
  source: THREE.Vector3,
  impactPoints: readonly [THREE.Vector3, THREE.Vector3, THREE.Vector3],
  cameraQuaternion: THREE.Quaternion,
): void {
  if (!group) return;

  const maxShotPulse = Math.max(...pose.shotPulses);
  const visible = pose.electricPulse > 0.42 || maxShotPulse > 0.005 || pose.chainPulse > 0.005;
  group.visible = visible;
  if (!visible) return;

  for (let i = 0; i < 3; i += 1) {
    const pulse = pose.shotPulses[i]!;
    const glow = group.getObjectByName(`StormFanTrail${i}Glow`) as THREE.Mesh | undefined;
    const core = group.getObjectByName(`StormFanTrail${i}Core`) as THREE.Mesh | undefined;
    if (glow) placeBeam(glow, source, impactPoints[i]!, pulse * 0.46);
    if (core) placeBeam(core, source, impactPoints[i]!, pulse * 0.98);

    const impact = group.getObjectByName(`StormImpactSlash${i}`) as THREE.Mesh | undefined;
    if (impact) {
      setBillboardSlash(
        impact,
        impactPoints[i]!,
        cameraQuaternion,
        (i - 1) * 0.52,
        0.70 + pulse * 0.90,
        1,
        pulse * 0.86,
      );
    }

    const charge = group.getObjectByName(`StormChargeSlash${i}`) as THREE.Mesh | undefined;
    if (charge) {
      const angle = -0.62 + i * 0.62;
      const chargeOpacity = Math.max(0, pose.electricPulse - 0.42) * 0.52 * (1 - maxShotPulse * 0.75);
      setBillboardSlash(
        charge,
        source,
        cameraQuaternion,
        angle,
        0.78 + pose.electricPulse * 0.40,
        1,
        chargeOpacity,
      );
    }
  }

  placeChain(group, 0, impactPoints[0], impactPoints[1], cameraQuaternion, pose.chainPulse);
  placeChain(group, 1, impactPoints[1], impactPoints[2], cameraQuaternion, pose.chainPulse);
}
