import * as THREE from 'three';

import {
  clamp01,
  easeInOutCubic,
  easeOutCubic,
  type EquipmentPose,
  type IdleMotionPose,
} from '../../slime-motion';

/**
 * Tier-3 Sword timing is authored for 1x battle playback first.
 * The normalized windows below are part of the parent runtime contract:
 * damage/hit-stop should be triggered once when crossing the matching threshold.
 */
export const TIER3_SWORD_TIMING = {
  blademasterAttack: 0.92,
  berserkerAttack: 1.08,
} as const;

export const TIER3_SWORD_THRESHOLDS = {
  blademasterDashStartU: 0.18,
  blademasterDashEndU: 0.40,
  blademasterBehindHoldEndU: 0.56,
  blademasterCutU: 0.63,
  blademasterRecoveryStartU: 0.75,
  berserkerWindupEndU: 0.34,
  berserkerImpactU: 0.50,
  berserkerFollowThroughU: 0.69,
  berserkerRecoveryStartU: 0.82,
} as const;

/**
 * Stateless cues consumed by BattleRuntime/GalleryStage.
 * Keeping these values beside the motion prevents gallery-only "cooler" timing.
 */
export const TIER3_SWORD_RUNTIME_CUES = {
  blademaster: {
    hitStopSeconds: 0.045,
    cameraImpulse: 0.018,
    passThroughDistance: 1.48,
    afterimageCount: 3,
    afterimageSpacing: 0.18,
  },
  berserker: {
    hitStopSeconds: 0.072,
    cameraShakeDuration: 0.12,
    cameraShakeAmplitude: 0.055,
    debrisCount: 7,
  },
} as const;

export interface BlademasterAttackMotionPose extends IdleMotionPose {
  /**
   * Forward displacement along the attack direction captured at attack start.
   * Parent runtime must not clamp this to the near side of the target: the signature
   * intentionally passes through and holds behind the enemy.
   */
  bodyOffset: number;
  dashProgress: number;
  cutProgress: number;
  scarfPulse: number;
  vanishPulse: number;
  bodyVisibility: number;
  afterimagePulse: number;
  behindTargetHold: number;
  hitStopPulse: number;
}

export interface BerserkerAttackMotionPose extends IdleMotionPose {
  bodyOffset: number;
  impactProgress: number;
  followThroughProgress: number;
  recoilProgress: number;
  impactPulse: number;
  groundImpactPulse: number;
  debrisPulse: number;
  ragePulse: number;
  hitStopPulse: number;
}

export interface BlademasterSignatureVfxPose {
  visible: boolean;
  dashVisible: boolean;
  delayedCutVisible: boolean;
  afterimageOpacity: number;
  cutOpacity: number;
  cutScaleX: number;
  cutScaleY: number;
  hitStopSeconds: number;
  cameraImpulse: number;
}

export interface BerserkerSignatureVfxPose {
  visible: boolean;
  arcOpacity: number;
  arcScaleX: number;
  arcScaleY: number;
  groundRingOpacity: number;
  groundRingScale: number;
  debrisOpacity: number;
  debrisTravel: number;
  flashOpacity: number;
  hitStopSeconds: number;
  cameraShakeDuration: number;
  cameraShakeAmplitude: number;
}

const equipment = (angle = 0, lift = 0, sweep = 0): EquipmentPose => ({ angle, lift, sweep });

/** Clamp malformed input as well as ordinary out-of-range progress. */
const normalizedProgress = (value: number): number => {
  if (Number.isNaN(value) || value === Number.NEGATIVE_INFINITY) return 0;
  if (value === Number.POSITIVE_INFINITY) return 1;
  return clamp01(value);
};

/**
 * Blademaster: tight iaijutsu coil -> near-invisible pass-through -> stillness behind target
 * -> delayed oversized cut -> clean finish. The stillness is intentional contrast: it makes
 * the delayed line read at phone battle size instead of becoming another fast two-hit combo.
 */
export function getBlademasterAttackMotion(uInput: number): BlademasterAttackMotionPose {
  const u = normalizedProgress(uInput);

  if (u < TIER3_SWORD_THRESHOLDS.blademasterDashStartU) {
    const t = easeInOutCubic(u / TIER3_SWORD_THRESHOLDS.blademasterDashStartU);
    return {
      bodyOffset: 0,
      dashProgress: 0,
      cutProgress: -1,
      scarfPulse: t * 0.46,
      vanishPulse: 0,
      bodyVisibility: 1,
      afterimagePulse: 0,
      behindTargetHold: 0,
      hitStopPulse: 0,
      deformation: {
        squash: 0.56 * t,
        stretch: 0,
        lean: -0.22 * t,
        wobble: -0.07 * t,
        jump: 0,
      },
      equipment: equipment(-0.90 * t, -0.020 * t, -0.18 * t),
    };
  }

  if (u < TIER3_SWORD_THRESHOLDS.blademasterDashEndU) {
    const dashU = normalizedProgress(
      (u - TIER3_SWORD_THRESHOLDS.blademasterDashStartU)
      / (TIER3_SWORD_THRESHOLDS.blademasterDashEndU - TIER3_SWORD_THRESHOLDS.blademasterDashStartU),
    );
    const t = easeOutCubic(dashU);
    const speedPulse = Math.sin(dashU * Math.PI);
    const vanishPulse = speedPulse;
    return {
      bodyOffset: TIER3_SWORD_RUNTIME_CUES.blademaster.passThroughDistance * t,
      dashProgress: t,
      cutProgress: -1,
      scarfPulse: 0.46 + speedPulse * 0.54,
      vanishPulse,
      bodyVisibility: 1 - vanishPulse * 0.92,
      afterimagePulse: speedPulse,
      behindTargetHold: 0,
      hitStopPulse: 0,
      deformation: {
        squash: 0.07 * (1 - t),
        stretch: 0.66 * speedPulse,
        lean: 0.42 * speedPulse,
        wobble: 0.12 * Math.sin(t * Math.PI * 2),
        jump: 0.040 * speedPulse,
      },
      equipment: equipment(
        THREE.MathUtils.lerp(-0.90, -0.12, t),
        0.022 * speedPulse,
        THREE.MathUtils.lerp(-0.18, -0.04, t),
      ),
    };
  }

  if (u < TIER3_SWORD_THRESHOLDS.blademasterBehindHoldEndU) {
    const t = (
      u - TIER3_SWORD_THRESHOLDS.blademasterDashEndU
    ) / (
      TIER3_SWORD_THRESHOLDS.blademasterBehindHoldEndU
      - TIER3_SWORD_THRESHOLDS.blademasterDashEndU
    );
    return {
      bodyOffset: THREE.MathUtils.lerp(
        TIER3_SWORD_RUNTIME_CUES.blademaster.passThroughDistance,
        TIER3_SWORD_RUNTIME_CUES.blademaster.passThroughDistance - 0.05,
        t,
      ),
      dashProgress: 1,
      cutProgress: -1,
      scarfPulse: THREE.MathUtils.lerp(0.88, 0.72, t),
      vanishPulse: 0.16 * (1 - t),
      bodyVisibility: 1,
      afterimagePulse: 0.30 * (1 - t),
      behindTargetHold: Math.sin(t * Math.PI),
      hitStopPulse: 0,
      deformation: {
        squash: 0.045,
        stretch: 0.08 * (1 - t),
        lean: -0.04,
        wobble: 0,
        jump: 0,
      },
      equipment: equipment(-0.12, 0, -0.04),
    };
  }

  if (u < TIER3_SWORD_THRESHOLDS.blademasterRecoveryStartU) {
    const t = normalizedProgress(
      (u - TIER3_SWORD_THRESHOLDS.blademasterBehindHoldEndU)
      / (
        TIER3_SWORD_THRESHOLDS.blademasterRecoveryStartU
        - TIER3_SWORD_THRESHOLDS.blademasterBehindHoldEndU
      ),
    );
    const cut = easeOutCubic(t);
    const pulse = Math.sin(t * Math.PI);
    const hitStopCenter = normalizedProgress(
      (u - (TIER3_SWORD_THRESHOLDS.blademasterCutU - 0.025)) / 0.08,
    );
    return {
      bodyOffset: THREE.MathUtils.lerp(
        TIER3_SWORD_RUNTIME_CUES.blademaster.passThroughDistance - 0.05,
        TIER3_SWORD_RUNTIME_CUES.blademaster.passThroughDistance - 0.14,
        t,
      ),
      dashProgress: 1,
      cutProgress: t,
      scarfPulse: THREE.MathUtils.lerp(0.72, 0.56, t),
      vanishPulse: 0,
      bodyVisibility: 1,
      afterimagePulse: 0,
      behindTargetHold: 0.15 * (1 - t),
      hitStopPulse: Math.sin(hitStopCenter * Math.PI),
      deformation: {
        squash: 0.05 * pulse,
        stretch: 0.07 * (1 - t),
        lean: -0.20 * pulse,
        wobble: -0.18 * pulse,
        jump: 0,
      },
      equipment: equipment(
        THREE.MathUtils.lerp(-0.12, 1.78, cut),
        0.028 * pulse,
        THREE.MathUtils.lerp(-0.04, 1.02, cut),
      ),
    };
  }

  const t = easeInOutCubic(
    (u - TIER3_SWORD_THRESHOLDS.blademasterRecoveryStartU)
    / (1 - TIER3_SWORD_THRESHOLDS.blademasterRecoveryStartU),
  );
  return {
    bodyOffset: THREE.MathUtils.lerp(
      TIER3_SWORD_RUNTIME_CUES.blademaster.passThroughDistance - 0.14,
      0,
      t,
    ),
    dashProgress: 1,
    cutProgress: 1,
    scarfPulse: 0.56 * (1 - t),
    vanishPulse: 0,
    bodyVisibility: 1,
    afterimagePulse: 0,
    behindTargetHold: 0,
    hitStopPulse: 0,
    deformation: {
      squash: 0.10 * Math.sin(t * Math.PI),
      stretch: 0.05 * (1 - t),
      lean: -0.07 * (1 - t),
      wobble: 0.07 * Math.sin(t * Math.PI * 2),
      jump: 0.030 * Math.sin(t * Math.PI),
    },
    equipment: equipment(1.78 * (1 - t), 0, 1.02 * (1 - t)),
  };
}

/**
 * Berserker: deep compression -> brutally quick committed smash/sweep -> long recoil.
 * Release speed is high despite the heavy wind-up; weight comes from anticipation,
 * body deformation, hit-stop and aftermath rather than sluggish weapon travel.
 */
export function getBerserkerAttackMotion(uInput: number): BerserkerAttackMotionPose {
  const u = normalizedProgress(uInput);

  if (u < TIER3_SWORD_THRESHOLDS.berserkerWindupEndU) {
    const t = easeInOutCubic(u / TIER3_SWORD_THRESHOLDS.berserkerWindupEndU);
    const tremor = Math.sin(t * Math.PI * 8) * t;
    return {
      bodyOffset: -0.06 * t,
      impactProgress: -1,
      followThroughProgress: -1,
      recoilProgress: 0,
      impactPulse: 0,
      groundImpactPulse: 0,
      debrisPulse: 0,
      ragePulse: 0.22 + t * 0.78,
      hitStopPulse: 0,
      deformation: {
        squash: 0.72 * t,
        stretch: 0,
        lean: -0.34 * t,
        wobble: tremor * 0.13,
        jump: 0,
      },
      equipment: equipment(-1.42 * t, -0.050 * t, -0.24 * t),
    };
  }

  if (u < 0.56) {
    const t = easeOutCubic(
      (u - TIER3_SWORD_THRESHOLDS.berserkerWindupEndU)
      / (0.56 - TIER3_SWORD_THRESHOLDS.berserkerWindupEndU),
    );
    const speedPulse = Math.sin(t * Math.PI);
    const impactPulse = Math.sin(normalizedProgress((u - 0.42) / 0.16) * Math.PI);
    const hitStopPulse = Math.sin(normalizedProgress((u - 0.47) / 0.06) * Math.PI);
    return {
      bodyOffset: THREE.MathUtils.lerp(-0.06, 0.44, t),
      impactProgress: t,
      followThroughProgress: -1,
      recoilProgress: 0,
      impactPulse,
      groundImpactPulse: impactPulse,
      debrisPulse: impactPulse * 0.92,
      ragePulse: 1,
      hitStopPulse,
      deformation: {
        squash: 0.16 * (1 - t),
        stretch: 0.54 * speedPulse,
        lean: 0.60 * speedPulse,
        wobble: 0.22 * Math.sin(t * Math.PI * 2),
        jump: 0.034 * speedPulse,
      },
      equipment: equipment(
        THREE.MathUtils.lerp(-1.42, 1.68, t),
        0.046 * speedPulse,
        THREE.MathUtils.lerp(-0.24, 0.88, t),
      ),
    };
  }

  if (u < TIER3_SWORD_THRESHOLDS.berserkerRecoveryStartU) {
    const recoilU = normalizedProgress(
      (u - 0.56) / (TIER3_SWORD_THRESHOLDS.berserkerRecoveryStartU - 0.56),
    );
    const t = easeOutCubic(recoilU);
    const recoilPulse = Math.sin(recoilU * Math.PI);
    return {
      bodyOffset: THREE.MathUtils.lerp(0.44, 0.19, t),
      impactProgress: 1,
      followThroughProgress: t,
      recoilProgress: t,
      impactPulse: recoilPulse * 0.34,
      groundImpactPulse: (1 - t) * 0.64,
      debrisPulse: (1 - t) * 0.76,
      ragePulse: THREE.MathUtils.lerp(0.88, 0.54, t),
      hitStopPulse: 0,
      deformation: {
        squash: 0.40 * recoilPulse,
        stretch: 0.12 * (1 - t),
        lean: -0.40 * recoilPulse,
        wobble: -0.48 * recoilPulse,
        jump: 0,
      },
      equipment: equipment(
        THREE.MathUtils.lerp(1.68, -0.56, t),
        0.018 * recoilPulse,
        THREE.MathUtils.lerp(0.88, -0.52, t),
      ),
    };
  }

  const t = easeInOutCubic(
    (u - TIER3_SWORD_THRESHOLDS.berserkerRecoveryStartU)
    / (1 - TIER3_SWORD_THRESHOLDS.berserkerRecoveryStartU),
  );
  return {
    bodyOffset: THREE.MathUtils.lerp(0.19, 0, t),
    impactProgress: 1,
    followThroughProgress: 1,
    recoilProgress: 1,
    impactPulse: 0,
    groundImpactPulse: 0,
    debrisPulse: 0,
    ragePulse: 0.54 * (1 - t),
    hitStopPulse: 0,
    deformation: {
      squash: 0.22 * (1 - t),
      stretch: 0,
      lean: -0.13 * (1 - t),
      wobble: 0.16 * Math.sin(t * Math.PI * 2) * (1 - t),
      jump: 0,
    },
    equipment: equipment(-0.56 * (1 - t), 0, -0.52 * (1 - t)),
  };
}

/** Pure VFX/runtime contract for the Blademaster signature. */
export function getBlademasterSignatureVfxPose(
  pose: Pick<
    BlademasterAttackMotionPose,
    'dashProgress' | 'cutProgress' | 'vanishPulse' | 'afterimagePulse' | 'hitStopPulse'
  >,
): BlademasterSignatureVfxPose {
  const dashVisible = pose.dashProgress > 0 && pose.dashProgress < 1 && pose.cutProgress < 0;
  const delayedCutVisible = pose.cutProgress >= 0 && pose.cutProgress < 1;
  const cutU = normalizedProgress(pose.cutProgress);
  const cutPulse = delayedCutVisible ? Math.sin(cutU * Math.PI) : 0;
  return {
    visible: dashVisible || delayedCutVisible || pose.hitStopPulse > 0.01,
    dashVisible,
    delayedCutVisible,
    afterimageOpacity: normalizedProgress(pose.afterimagePulse) * 0.78,
    cutOpacity: cutPulse * 0.98,
    cutScaleX: 0.80 + cutU * 1.25,
    cutScaleY: 0.72 + cutPulse * 0.62,
    hitStopSeconds: pose.hitStopPulse > 0.01 ? TIER3_SWORD_RUNTIME_CUES.blademaster.hitStopSeconds : 0,
    cameraImpulse: pose.hitStopPulse > 0.01 ? TIER3_SWORD_RUNTIME_CUES.blademaster.cameraImpulse : 0,
  };
}

/** Pure VFX/runtime contract for the Berserker signature. */
export function getBerserkerSignatureVfxPose(
  pose: Pick<
    BerserkerAttackMotionPose,
    'impactProgress' | 'impactPulse' | 'groundImpactPulse' | 'debrisPulse' | 'hitStopPulse'
  >,
): BerserkerSignatureVfxPose {
  const impactPulse = normalizedProgress(pose.impactPulse);
  const groundImpactPulse = normalizedProgress(pose.groundImpactPulse);
  const debrisPulse = normalizedProgress(pose.debrisPulse);
  const pulse = Math.max(impactPulse, groundImpactPulse, pose.hitStopPulse);
  return {
    visible: pulse > 0.01,
    arcOpacity: impactPulse * 0.72,
    arcScaleX: 1.12 + impactPulse * 0.88,
    arcScaleY: 0.68 + impactPulse * 0.30,
    groundRingOpacity: groundImpactPulse * 0.64,
    groundRingScale: 0.86 + normalizedProgress(pose.impactProgress) * 2.45,
    debrisOpacity: debrisPulse * 0.82,
    debrisTravel: 0.18 + debrisPulse * 0.42,
    // Keep the body and greatsword readable: the flash is deliberately subordinate.
    flashOpacity: Math.min(0.42, pose.hitStopPulse * 0.38 + impactPulse * 0.16),
    hitStopSeconds: pose.hitStopPulse > 0.01 ? TIER3_SWORD_RUNTIME_CUES.berserker.hitStopSeconds : 0,
    cameraShakeDuration: pose.hitStopPulse > 0.01 ? TIER3_SWORD_RUNTIME_CUES.berserker.cameraShakeDuration : 0,
    cameraShakeAmplitude: pose.hitStopPulse > 0.01 ? TIER3_SWORD_RUNTIME_CUES.berserker.cameraShakeAmplitude : 0,
  };
}

export function createBlademasterSignatureVfx(): THREE.Group {
  const group = new THREE.Group();
  group.visible = false;

  for (let i = 0; i < TIER3_SWORD_RUNTIME_CUES.blademaster.afterimageCount; i += 1) {
    const streak = new THREE.Mesh(
      new THREE.PlaneGeometry(0.90 - i * 0.14, 0.050 - i * 0.007),
      new THREE.MeshBasicMaterial({
        color: '#54d9ff',
        transparent: true,
        opacity: 0,
        depthWrite: false,
        depthTest: false,
        side: THREE.DoubleSide,
      }),
    );
    streak.name = `BlademasterDashStreak${i}`;
    streak.position.y = (i - 1) * 0.10;
    group.add(streak);
  }

  const cut = new THREE.Mesh(
    new THREE.PlaneGeometry(2.12, 0.070),
    new THREE.MeshBasicMaterial({
      color: '#ecfdff',
      transparent: true,
      opacity: 0,
      depthWrite: false,
      depthTest: false,
      side: THREE.DoubleSide,
    }),
  );
  cut.name = 'BlademasterDelayedCut';
  cut.rotation.z = -0.60;
  group.add(cut);

  const echo = new THREE.Mesh(
    new THREE.PlaneGeometry(1.72, 0.032),
    new THREE.MeshBasicMaterial({
      color: '#5aaeff',
      transparent: true,
      opacity: 0,
      depthWrite: false,
      depthTest: false,
      side: THREE.DoubleSide,
    }),
  );
  echo.name = 'BlademasterCutEcho';
  echo.rotation.z = -0.60;
  echo.position.y = 0.05;
  group.add(echo);

  group.renderOrder = 10;
  return group;
}

export function applyBlademasterSignatureVfx(
  group: THREE.Group | null,
  pose: Pick<
    BlademasterAttackMotionPose,
    'dashProgress' | 'cutProgress' | 'vanishPulse' | 'afterimagePulse' | 'hitStopPulse'
  >,
  cameraQuaternion: THREE.Quaternion,
  position: THREE.Vector3,
): void {
  if (!group) return;
  const vfx = getBlademasterSignatureVfxPose(pose);
  group.visible = vfx.visible;
  if (!group.visible) return;

  group.position.copy(position);
  group.quaternion.copy(cameraQuaternion);

  group.children.forEach((child) => {
    if (!(child instanceof THREE.Mesh) || !(child.material instanceof THREE.MeshBasicMaterial)) return;

    if (child.name.startsWith('BlademasterDashStreak')) {
      const index = Number(child.name.at(-1) ?? 0);
      child.visible = vfx.dashVisible;
      child.position.x = -0.35
        - index * TIER3_SWORD_RUNTIME_CUES.blademaster.afterimageSpacing
        - normalizedProgress(pose.dashProgress) * 0.28;
      child.scale.x = 0.92 + normalizedProgress(pose.afterimagePulse) * (0.62 - index * 0.08);
      child.material.opacity = vfx.afterimageOpacity * (1 - index * 0.18) * (0.72 + pose.vanishPulse * 0.28);
      return;
    }

    if (child.name === 'BlademasterDelayedCut') {
      child.visible = vfx.delayedCutVisible;
      child.scale.set(vfx.cutScaleX, vfx.cutScaleY, 1);
      child.material.opacity = vfx.cutOpacity;
      return;
    }

    if (child.name === 'BlademasterCutEcho') {
      const echoU = normalizedProgress((pose.cutProgress - 0.10) / 0.90);
      const echoPulse = Math.sin(echoU * Math.PI);
      child.visible = vfx.delayedCutVisible && echoU > 0;
      child.scale.set(0.72 + echoU * 0.76, 0.84, 1);
      child.material.opacity = echoPulse * 0.58;
    }
  });
}

export function createBerserkerSignatureVfx(): THREE.Group {
  const group = new THREE.Group();
  group.visible = false;

  const arc = new THREE.Mesh(
    new THREE.TorusGeometry(0.46, 0.055, 10, 56, Math.PI * 1.18),
    new THREE.MeshBasicMaterial({
      color: '#ff7438',
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      depthWrite: false,
      depthTest: false,
    }),
  );
  arc.name = 'BerserkerImpactArc';
  group.add(arc);

  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.20, 0.29, 48),
    new THREE.MeshBasicMaterial({
      color: '#ff9b42',
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      depthWrite: false,
      depthTest: false,
    }),
  );
  ring.name = 'BerserkerGroundRing';
  ring.rotation.x = -Math.PI / 2;
  group.add(ring);

  const flash = new THREE.Mesh(
    new THREE.CircleGeometry(0.17, 28),
    new THREE.MeshBasicMaterial({
      color: '#ffd36d',
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      depthWrite: false,
      depthTest: false,
    }),
  );
  flash.name = 'BerserkerImpactFlash';
  group.add(flash);

  for (let i = 0; i < TIER3_SWORD_RUNTIME_CUES.berserker.debrisCount; i += 1) {
    const shard = new THREE.Mesh(
      new THREE.ConeGeometry(0.028, 0.18, 5),
      new THREE.MeshBasicMaterial({
        color: i % 2 === 0 ? '#ffad45' : '#ff5530',
        transparent: true,
        opacity: 0,
        depthWrite: false,
        depthTest: false,
      }),
    );
    shard.name = `BerserkerShard${i}`;
    group.add(shard);
  }

  group.renderOrder = 10;
  return group;
}

export function applyBerserkerSignatureVfx(
  group: THREE.Group | null,
  pose: Pick<
    BerserkerAttackMotionPose,
    'impactProgress' | 'impactPulse' | 'groundImpactPulse' | 'debrisPulse' | 'hitStopPulse'
  >,
  cameraQuaternion: THREE.Quaternion,
  position: THREE.Vector3,
): void {
  if (!group) return;
  const vfx = getBerserkerSignatureVfxPose(pose);
  group.visible = vfx.visible;
  if (!group.visible) return;

  group.position.copy(position);

  const arc = group.getObjectByName('BerserkerImpactArc') as
    | THREE.Mesh<THREE.TorusGeometry, THREE.MeshBasicMaterial>
    | undefined;
  const ring = group.getObjectByName('BerserkerGroundRing') as
    | THREE.Mesh<THREE.RingGeometry, THREE.MeshBasicMaterial>
    | undefined;
  const flash = group.getObjectByName('BerserkerImpactFlash') as
    | THREE.Mesh<THREE.CircleGeometry, THREE.MeshBasicMaterial>
    | undefined;

  if (arc) {
    arc.quaternion.copy(cameraQuaternion);
    arc.rotation.z = -1.08 + normalizedProgress(pose.impactProgress) * 1.48;
    arc.scale.set(vfx.arcScaleX, vfx.arcScaleY, 1);
    arc.material.opacity = vfx.arcOpacity;
  }

  if (ring) {
    ring.scale.setScalar(vfx.groundRingScale);
    ring.material.opacity = vfx.groundRingOpacity;
  }

  if (flash) {
    flash.quaternion.copy(cameraQuaternion);
    flash.scale.setScalar(0.72 + normalizedProgress(pose.hitStopPulse) * 1.45);
    flash.material.opacity = vfx.flashOpacity;
  }

  for (let i = 0; i < TIER3_SWORD_RUNTIME_CUES.berserker.debrisCount; i += 1) {
    const shard = group.getObjectByName(`BerserkerShard${i}`) as
      | THREE.Mesh<THREE.ConeGeometry, THREE.MeshBasicMaterial>
      | undefined;
    if (!shard) continue;

    const angle = (i / TIER3_SWORD_RUNTIME_CUES.berserker.debrisCount) * Math.PI * 2;
    const travel = vfx.debrisTravel * (0.88 + (i % 3) * 0.08);
    shard.position.set(
      Math.cos(angle) * travel,
      0.035 + normalizedProgress(pose.debrisPulse) * (0.07 + (i % 2) * 0.04),
      Math.sin(angle) * travel,
    );
    shard.rotation.z = -angle;
    shard.scale.setScalar(0.70 + normalizedProgress(pose.debrisPulse) * 0.50);
    shard.material.opacity = vfx.debrisOpacity;
  }
}
