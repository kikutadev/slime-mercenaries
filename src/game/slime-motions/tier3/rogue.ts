import {
  clamp01,
  easeInOutCubic,
  easeOutCubic,
  type EquipmentPose,
  type SlimeDeformationPose,
} from '../../slime-motion';

/**
 * Tier-3 Rogue motion contracts are intentionally runtime-agnostic.
 * The parent runtime owns target selection, scene objects, damage, and camera shake.
 * This module owns authored timing, character poses, and normalized VFX envelopes.
 */

export const NINJA_SIGNATURE_TIMING = {
  duration: 1.08,
  vanishStartU: 0.08,
  vanishEndU: 0.22,
  dashStartU: 0.20,
  dashPassUs: [0.29, 0.40, 0.51] as const,
  dashEndU: 0.57,
  reappearStartU: 0.56,
  reappearU: 0.64,
  delayedSlashUs: [0.665, 0.695, 0.725, 0.755] as const,
  delayedSlashEndU: 0.84,
  recoverStartU: 0.82,
} as const;

export const ASSASSIN_SIGNATURE_TIMING = {
  duration: 1.18,
  stillnessEndU: 0.30,
  launchU: 0.32,
  behindTargetU: 0.40,
  crossSlashStartU: 0.42,
  crossHitU: 0.50,
  crossSlashEndU: 0.55,
  hitStopStartU: 0.50,
  hitStopEndU: 0.62,
  executionLineU: 0.70,
  executionLineEndU: 0.82,
  recoverStartU: 0.84,
} as const;

export interface NinjaSignatureVfxPose {
  /** Origin smoke that keeps the vanish readable at mobile size. */
  vanishSmoke: number;
  /** Expansion multiplier for origin smoke. */
  vanishSmokeScale: number;
  /** Return smoke that marks the exact point where the real body comes back. */
  returnSmoke: number;
  /** Overall afterimage opacity/intensity while crossing the enemy row. */
  afterimage: number;
  /** 0..1 spread of afterimages along the authored dash path. */
  afterimageSpread: number;
  /** Thin speed-line envelope; stronger than ordinary Rogue streaks. */
  speedLines: number;
  /** Pulse when an afterimage crosses an enemy slot. */
  dashPassPulse: number;
  /** Which authored pass is currently dominant, or null outside a pass beat. */
  dashPassIndex: 0 | 1 | 2 | null;
  /** 0..1 delayed-slash lifecycle. -1 before the body has returned. */
  delayedSlashProgress: number;
  /** Four tightly staggered slash-line envelopes resolved after reappearance. */
  delayedSlashPulses: [number, number, number, number];
  /** Combined delayed-slash brightness for a single pooled VFX rig. */
  delayedSlashBurst: number;
  /** Small impact punch for the parent runtime; intentionally below Assassin. */
  screenPunch: number;
}

export interface NinjaSignatureMotionPose {
  deformation: SlimeDeformationPose;
  equipment: EquipmentPose;
  secondaryEquipment: EquipmentPose;
  /** Local offset only; actual row traversal should consume dashProgress. */
  bodyOffset: number;
  lateralOffset: number;
  /** 0..1 alpha for the real body. */
  bodyAlpha: number;
  /** 0..1 completed vanish phase. */
  vanishProgress: number;
  /** 0..1 authored path progress across the enemy row. */
  dashProgress: number;
  /** 0..1 completed return phase. */
  reappearProgress: number;
  vfx: NinjaSignatureVfxPose;
}

export interface AssassinSignatureVfxPose {
  /** Very brief shadow/smoke blink around the teleport; deliberately sparse. */
  shadowBlink: number;
  /** First diagonal of the crossing execute slash. */
  crossSlashA: number;
  /** Second diagonal of the crossing execute slash. */
  crossSlashB: number;
  /** Compact white impact flash at the cross hit. */
  impactFlash: number;
  /** Delayed red-purple execution line; this is the visual payoff. */
  executionLine: number;
  /** 0..1 execution-line lifecycle. -1 before the delayed line begins. */
  executionLineProgress: number;
  /** Low-count glow halo behind the execution line. */
  executionGlow: number;
  /** Parent-runtime camera/screen punch. Stronger and later than Ninja. */
  screenPunch: number;
}

export interface AssassinSignatureMotionPose {
  deformation: SlimeDeformationPose;
  equipment: EquipmentPose;
  secondaryEquipment: EquipmentPose;
  bodyOffset: number;
  lateralOffset: number;
  /** 0..1 alpha for the real body during the instant reposition. */
  bodyAlpha: number;
  /** 0..1 launch from the low static stance. */
  launchProgress: number;
  /** 0..1 relocation to the target's back side. */
  behindTargetProgress: number;
  /** 0..1 crossing slash lifecycle. */
  crossSlashProgress: number;
  /** 0..1 authored hit-stop strength. Parent runtime may freeze camera/target with it. */
  hitStop: number;
  /** 0..1 stillness/intent before launch. */
  stillness: number;
  vfx: AssassinSignatureVfxPose;
}

function safeU(value: number): number {
  return Number.isFinite(value) ? clamp01(value) : 0;
}

function phase(u: number, start: number, end: number): number {
  if (end <= start) return u >= end ? 1 : 0;
  return clamp01((u - start) / (end - start));
}

function pulseAround(u: number, center: number, halfWidth: number): number {
  if (halfWidth <= 0) return 0;
  const distance = Math.abs(u - center);
  if (distance >= halfWidth) return 0;
  return 1 - distance / halfWidth;
}

function smoothEnvelope(
  u: number,
  riseStart: number,
  riseEnd: number,
  fallStart: number,
  fallEnd: number,
): number {
  const rise = easeOutCubic(phase(u, riseStart, riseEnd));
  const fall = 1 - easeInOutCubic(phase(u, fallStart, fallEnd));
  return clamp01(rise * fall);
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * clamp01(t);
}

function equipment(angle = 0, lift = 0, sweep = 0): EquipmentPose {
  return { angle, lift, sweep };
}

export function getNinjaDashPassU(index: 0 | 1 | 2): number {
  return NINJA_SIGNATURE_TIMING.dashPassUs[index];
}

export function getNinjaDelayedSlashU(index: 0 | 1 | 2 | 3): number {
  return NINJA_SIGNATURE_TIMING.delayedSlashUs[index];
}

/**
 * Ninja signature:
 * flatten -> smoke vanish -> repeated afterimage passes -> body returns ->
 * tightly staggered delayed slash lines resolve in one clustered payoff.
 */
export function getNinjaSignatureMotion(uInput: number): NinjaSignatureMotionPose {
  const u = safeU(uInput);
  const timing = NINJA_SIGNATURE_TIMING;

  const vanishProgress = phase(u, timing.vanishStartU, timing.vanishEndU);
  const dashProgress = phase(u, timing.dashStartU, timing.dashEndU);
  const reappearProgress = phase(u, timing.reappearStartU, timing.reappearU);

  let bodyAlpha = 1;
  if (u >= timing.vanishStartU && u < timing.vanishEndU) {
    bodyAlpha = 1 - easeOutCubic(vanishProgress);
  } else if (u >= timing.vanishEndU && u < timing.reappearStartU) {
    bodyAlpha = 0;
  } else if (u >= timing.reappearStartU && u < timing.reappearU) {
    bodyAlpha = easeOutCubic(reappearProgress);
  }

  const anticipation = smoothEnvelope(
    u,
    0.0,
    timing.vanishStartU,
    timing.vanishStartU,
    timing.vanishEndU,
  );
  const dashEnvelope = smoothEnvelope(
    u,
    timing.dashStartU,
    timing.dashStartU + 0.035,
    timing.dashEndU - 0.05,
    timing.reappearU + 0.01,
  );
  const afterimage = smoothEnvelope(
    u,
    timing.dashStartU,
    timing.dashStartU + 0.03,
    timing.dashEndU,
    timing.reappearU + 0.05,
  );

  const passPulses = timing.dashPassUs.map((center) => pulseAround(u, center, 0.052));
  const dashPassPulse = Math.max(...passPulses);
  const passIndexRaw = passPulses.indexOf(dashPassPulse);
  const dashPassIndex = dashPassPulse > 0
    ? (passIndexRaw as 0 | 1 | 2)
    : null;

  const delayedSlashPulses = timing.delayedSlashUs.map(
    (center) => pulseAround(u, center, 0.052),
  ) as [number, number, number, number];
  const delayedSlashBurst = Math.max(...delayedSlashPulses);
  const delayedSlashProgress = u < timing.reappearU
    ? -1
    : phase(u, timing.reappearU, timing.delayedSlashEndU);

  const returnSmoke = pulseAround(u, timing.reappearU, 0.075);
  const recover = easeInOutCubic(phase(u, timing.recoverStartU, 1));
  const dashWave = Math.sin(dashProgress * Math.PI * 6);
  const returnCompression = pulseAround(u, timing.reappearU, 0.065);
  const slashKick = delayedSlashBurst * (1 - recover);

  const weaponSweep = dashEnvelope > 0
    ? dashWave * 0.56
    : delayedSlashBurst * 0.74;

  return {
    bodyOffset: (
      -0.035 * anticipation
      + dashEnvelope * Math.sin(dashProgress * Math.PI * 2) * 0.12
      + slashKick * 0.045
    ) * (1 - recover),
    lateralOffset: (
      dashEnvelope * dashWave * 0.15
      + delayedSlashBurst * Math.sin(delayedSlashProgress * Math.PI * 5) * 0.055
    ) * (1 - recover),
    bodyAlpha,
    vanishProgress,
    dashProgress,
    reappearProgress,
    deformation: {
      squash: clamp01(
        0.52 * anticipation
        + 0.18 * dashEnvelope
        + 0.30 * returnCompression
        + 0.10 * delayedSlashBurst,
      ) * (1 - recover),
      stretch: clamp01(
        0.42 * dashEnvelope
        + 0.18 * returnSmoke
        + 0.16 * delayedSlashBurst,
      ) * (1 - recover),
      lean: (
        dashEnvelope * dashWave * 0.22
        + delayedSlashBurst * 0.12
      ) * (1 - recover),
      wobble: (
        dashEnvelope * Math.sin(dashProgress * Math.PI * 12) * 0.10
        + delayedSlashBurst * Math.sin(delayedSlashProgress * Math.PI * 8) * 0.075
      ) * (1 - recover),
      jump: (0.055 * dashEnvelope + 0.018 * returnSmoke) * (1 - recover),
    },
    equipment: equipment(
      (dashEnvelope * 0.82 + delayedSlashBurst * 1.08) * (1 - recover),
      (dashEnvelope * 0.018 + delayedSlashBurst * 0.012) * (1 - recover),
      weaponSweep * (1 - recover),
    ),
    secondaryEquipment: equipment(
      (-dashEnvelope * 0.82 - delayedSlashBurst * 1.08) * (1 - recover),
      (dashEnvelope * 0.018 + delayedSlashBurst * 0.012) * (1 - recover),
      -weaponSweep * (1 - recover),
    ),
    vfx: {
      vanishSmoke: pulseAround(u, timing.vanishEndU - 0.025, 0.095),
      vanishSmokeScale: 0.82 + vanishProgress * 1.65,
      returnSmoke,
      afterimage,
      afterimageSpread: dashProgress,
      speedLines: dashEnvelope * (0.58 + 0.42 * Math.abs(dashWave)),
      dashPassPulse,
      dashPassIndex,
      delayedSlashProgress,
      delayedSlashPulses,
      delayedSlashBurst,
      screenPunch: Math.max(dashPassPulse * 0.28, delayedSlashBurst * 0.48),
    },
  };
}

export function getAssassinCrossHitU(): number {
  return ASSASSIN_SIGNATURE_TIMING.crossHitU;
}

export function getAssassinExecutionLineU(): number {
  return ASSASSIN_SIGNATURE_TIMING.executionLineU;
}

/**
 * Assassin signature:
 * unusually still low stance -> instant back-side relocation -> crossing slash ->
 * strong held hit-stop -> one delayed red-purple execution line.
 *
 * VFX count is intentionally lower than Ninja; contrast and timing carry the identity.
 */
export function getAssassinSignatureMotion(uInput: number): AssassinSignatureMotionPose {
  const u = safeU(uInput);
  const timing = ASSASSIN_SIGNATURE_TIMING;

  const stillness = u < timing.launchU
    ? easeInOutCubic(phase(u, 0.02, timing.stillnessEndU))
    : 1 - easeOutCubic(phase(u, timing.launchU, timing.behindTargetU));

  const launchProgress = phase(u, timing.launchU, timing.behindTargetU);
  const behindTargetProgress = easeOutCubic(launchProgress);
  const crossSlashProgress = phase(u, timing.crossSlashStartU, timing.crossSlashEndU);

  const teleportDip = pulseAround(
    u,
    (timing.launchU + timing.behindTargetU) * 0.5,
    (timing.behindTargetU - timing.launchU) * 0.62,
  );
  const bodyAlpha = 1 - teleportDip * 0.96;

  let hitStop = 0;
  if (u >= timing.hitStopStartU && u <= timing.hitStopEndU) {
    const edge = Math.min(
      phase(u, timing.hitStopStartU, timing.hitStopStartU + 0.018),
      1 - phase(u, timing.hitStopEndU - 0.018, timing.hitStopEndU),
    );
    hitStop = clamp01(edge);
  }

  const crossA = pulseAround(u, timing.crossHitU - 0.018, 0.065);
  const crossB = pulseAround(u, timing.crossHitU + 0.018, 0.065);
  const impactFlash = pulseAround(u, timing.crossHitU, 0.042);
  const executionLine = pulseAround(u, timing.executionLineU, 0.082);
  const executionLineProgress = u < timing.hitStopEndU
    ? -1
    : phase(u, timing.hitStopEndU, timing.executionLineEndU);
  const executionGlow = smoothEnvelope(
    u,
    timing.hitStopEndU,
    timing.executionLineU,
    timing.executionLineU + 0.02,
    timing.executionLineEndU,
  );
  const shadowBlink = pulseAround(u, timing.behindTargetU - 0.015, 0.065);

  const recover = easeInOutCubic(phase(u, timing.recoverStartU, 1));
  const launchKick = Math.sin(launchProgress * Math.PI);
  const crossKick = Math.sin(crossSlashProgress * Math.PI);
  const heldPose = hitStop > 0 ? 1 : 0;
  const executionKick = executionLine * (1 - recover);

  const settledCrossAngle = 1.22;
  const primaryAngle = lerp(-0.78 * stillness, settledCrossAngle, crossSlashProgress);
  const secondaryAngle = lerp(0.58 * stillness, -settledCrossAngle, crossSlashProgress);

  return {
    bodyOffset: (
      -0.055 * stillness
      + 0.095 * launchKick
      + 0.060 * crossKick
      + 0.020 * heldPose
      - 0.028 * executionKick
    ) * (1 - recover),
    lateralOffset: (
      -0.025 * stillness
      + 0.11 * launchKick
      - 0.045 * crossKick
    ) * (1 - recover),
    bodyAlpha,
    launchProgress,
    behindTargetProgress,
    crossSlashProgress,
    hitStop,
    stillness,
    deformation: {
      squash: clamp01(
        0.44 * stillness
        + 0.12 * launchKick
        + 0.20 * heldPose
        + 0.10 * executionLine,
      ) * (1 - recover),
      stretch: clamp01(0.46 * launchKick + 0.24 * crossKick) * (1 - recover),
      lean: (
        -0.11 * stillness
        + 0.28 * launchKick
        + 0.16 * crossKick
        - 0.08 * executionKick
      ) * (1 - recover),
      wobble: (
        crossKick * 0.028
        + executionLine * Math.sin(executionLineProgress * Math.PI * 2) * 0.018
      ) * (1 - recover),
      jump: 0.022 * launchKick * (1 - recover),
    },
    equipment: equipment(
      primaryAngle * (1 - recover),
      (0.010 * stillness + 0.016 * crossKick) * (1 - recover),
      (0.22 * crossSlashProgress + 0.18 * executionLine) * (1 - recover),
    ),
    secondaryEquipment: equipment(
      secondaryAngle * (1 - recover),
      (0.008 * stillness + 0.014 * crossKick) * (1 - recover),
      (-0.22 * crossSlashProgress - 0.18 * executionLine) * (1 - recover),
    ),
    vfx: {
      shadowBlink,
      crossSlashA: crossA,
      crossSlashB: crossB,
      impactFlash,
      executionLine,
      executionLineProgress,
      executionGlow,
      screenPunch: Math.max(impactFlash * 0.84, executionLine * 1.0),
    },
  };
}
