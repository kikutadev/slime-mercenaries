import {
  clamp01,
  easeInOutCubic,
  easeOutCubic,
  type EquipmentPose,
  type SlimeDeformationPose,
} from '../../slime-motion';

/**
 * Tier-3 Gun motion contracts intentionally stay runtime-agnostic.
 * The parent runtime owns scene objects/projectiles; this module owns authored timing,
 * body/equipment poses, and normalized VFX envelopes.
 */

export const CANNONEER_SIGNATURE_TIMING = {
  duration: 1.62,
  braceEndU: 0.22,
  chargeEndU: 0.49,
  shellReleaseU: 0.50,
  recoilPeakU: 0.56,
  impactU: 0.77,
  impactEndU: 0.93,
} as const;

export const ENGINEER_SIGNATURE_TIMING = {
  duration: 2.02,
  gatherStartU: 0.06,
  gatherEndU: 0.28,
  assemblyStartU: 0.20,
  assemblyEndU: 0.49,
  deployStartU: 0.43,
  deployEndU: 0.63,
  turretOnlineU: 0.64,
  burstReleaseUs: [0.70, 0.78, 0.86] as const,
  retractStartU: 0.90,
} as const;

export interface CannoneerSignatureVfxPose {
  /** One-frame-dominant muzzle flash. Parent runtime can scale a flash mesh with this. */
  muzzleFlash: number;
  /** Hot core inside the larger muzzle flash; shorter and brighter than muzzleFlash. */
  muzzleCore: number;
  /** Lingering post-shot smoke envelope. */
  smoke: number;
  /** Smoke expansion scale in local cannon units. */
  smokeScale: number;
  /** Forward smoke drift from the muzzle. */
  smokeDrift: number;
  /** 0..1 shell travel after release. -1 before release. */
  shellTravelProgress: number;
  /** Authored vertical shell arc offset for the parent runtime. */
  shellArcHeight: number;
  /** Bright tracer/shell-tail envelope during flight. */
  tracer: number;
  /** 0..1 impact lifecycle. -1 before impact. */
  impactProgress: number;
  /** Instant white-hot impact flash. */
  impactFlash: number;
  /** Expanding fireball envelope. */
  explosion: number;
  /** World-relative explosion radius multiplier. */
  explosionScale: number;
  /** Slower dust/smoke layer after the fireball. */
  impactSmoke: number;
  /** Optional screen/camera punch scalar; parent runtime decides whether to consume it. */
  screenPunch: number;
}

export interface CannoneerSignatureMotionPose {
  deformation: SlimeDeformationPose;
  equipment: EquipmentPose;
  /** Signed displacement along the attacker -> target axis. Negative is recoil. */
  bodyOffset: number;
  /** How firmly the slime is planted into the cannon before firing. */
  brace: number;
  /** 0..1 pre-shot charge. */
  charge: number;
  /** 0..1 recoil envelope. */
  recoil: number;
  vfx: CannoneerSignatureVfxPose;
}

export interface EngineerAssemblyVfxPose {
  /** Visibility/intensity of loose components before assembly. */
  partsOpacity: number;
  /** Orbit radius for loose components. */
  partsRadius: number;
  /** Shared orbit rotation in radians. Parent can offset each part by index. */
  partsRotation: number;
  /** Vertical gathering lift for loose components. */
  partsLift: number;
  /** Energy field used to pull parts into the jelly-assisted build. */
  energyPulse: number;
  /** Energy field radius multiplier. */
  energyScale: number;
  /** Fast assembly sparks during the actual build beat. */
  assemblySparks: number;
  /** Activation ring/flash when the completed turret comes online. */
  activationPulse: number;
}

export interface EngineerTurretPose {
  /** 0..1 deployment amount; zero means folded/stowed. */
  deployProgress: number;
  /** 0..1 visibility/lifecycle envelope. */
  visibility: number;
  /** Vertical offset applied while the gadget pops onto the battlefield. */
  lift: number;
  /** Small startup rotation to make the mechanism visibly lock into place. */
  yaw: number;
  /** Per-shot recoil envelope for the independent turret. */
  recoil: number;
  /** Turret muzzle flash envelope. */
  muzzlePulse: number;
  /** Current burst shot, or null outside the burst window. */
  shotIndex: 0 | 1 | 2 | null;
  /** Local progress around the current shot. -1 outside the burst window. */
  shotProgress: number;
}

export interface EngineerSignatureMotionPose {
  deformation: SlimeDeformationPose;
  /** Wrench/tool pose rather than a firearm pose. */
  equipment: EquipmentPose;
  bodyOffset: number;
  /** 0..1 progress while loose parts converge. */
  gatherProgress: number;
  /** 0..1 actual jelly-assisted assembly progress. */
  assemblyProgress: number;
  /** 0..1 overall deploy phase before retraction. */
  deploymentProgress: number;
  vfx: EngineerAssemblyVfxPose;
  turret: EngineerTurretPose;
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

function smoothEnvelope(u: number, riseStart: number, riseEnd: number, fallStart: number, fallEnd: number): number {
  const rise = easeOutCubic(phase(u, riseStart, riseEnd));
  const fall = 1 - easeInOutCubic(phase(u, fallStart, fallEnd));
  return clamp01(rise * fall);
}

/** Normalized shell release point used by the parent runtime to spawn the shell. */
export function getCannoneerShellReleaseU(): number {
  return CANNONEER_SIGNATURE_TIMING.shellReleaseU;
}

/** Normalized shell impact point used by the parent runtime to trigger AoE damage/VFX. */
export function getCannoneerImpactU(): number {
  return CANNONEER_SIGNATURE_TIMING.impactU;
}

/**
 * Heavy Tier-3 cannon signature.
 *
 * The animation spends almost half of its duration bracing/charging, then delivers
 * one dominant shot. It deliberately does not inherit Gunner's repeated-shot cadence.
 */
export function getCannoneerSignatureMotion(uInput: number): CannoneerSignatureMotionPose {
  const u = safeU(uInput);
  const timing = CANNONEER_SIGNATURE_TIMING;

  const braceIn = easeInOutCubic(phase(u, 0.02, timing.braceEndU));
  const chargeBuild = easeInOutCubic(phase(u, timing.braceEndU * 0.55, timing.chargeEndU));
  const chargeRelease = 1 - easeOutCubic(phase(u, timing.shellReleaseU, timing.recoilPeakU + 0.05));
  const charge = clamp01(chargeBuild * chargeRelease);
  const braceRelease = chargeRelease;
  const brace = clamp01(braceIn * braceRelease);

  const recoilRise = easeOutCubic(phase(u, timing.shellReleaseU, timing.recoilPeakU));
  const recoilRecover = 1 - easeInOutCubic(phase(u, timing.recoilPeakU, 0.88));
  const recoil = clamp01(recoilRise * recoilRecover);

  const muzzleFlash = u < timing.shellReleaseU
    ? 0
    : 1 - easeOutCubic(phase(u, timing.shellReleaseU, timing.shellReleaseU + 0.085));
  const muzzleCore = u < timing.shellReleaseU
    ? 0
    : 1 - easeOutCubic(phase(u, timing.shellReleaseU, timing.shellReleaseU + 0.034));

  const smoke = smoothEnvelope(u, timing.shellReleaseU + 0.01, timing.shellReleaseU + 0.08, 0.70, 0.94);
  const smokeProgress = phase(u, timing.shellReleaseU, 0.94);

  const shellTravelProgress = u < timing.shellReleaseU
    ? -1
    : phase(u, timing.shellReleaseU, timing.impactU);
  const shellArcHeight = shellTravelProgress < 0
    ? 0
    : 4 * shellTravelProgress * (1 - shellTravelProgress) * 0.34;
  const tracer = shellTravelProgress > 0 && shellTravelProgress < 1
    ? 0.72 + Math.sin(shellTravelProgress * Math.PI) * 0.28
    : 0;

  const impactProgress = u < timing.impactU ? -1 : phase(u, timing.impactU, timing.impactEndU);
  const impactFlash = impactProgress < 0 ? 0 : 1 - easeOutCubic(impactProgress);
  const explosion = impactProgress < 0 || impactProgress >= 1
    ? 0
    : Math.max(impactFlash * 0.86, Math.sin(Math.PI * Math.sqrt(impactProgress)));
  const impactSmoke = impactProgress < 0
    ? 0
    : smoothEnvelope(impactProgress, 0.08, 0.26, 0.64, 1);
  const screenPunch = Math.max(muzzleCore * 0.70, impactFlash);

  const chargeTremor = charge * (1 - recoil) * Math.sin(u * Math.PI * 18) * 0.022;
  const recoverySpring = Math.sin(phase(u, 0.62, 1) * Math.PI * 3) * (1 - phase(u, 0.62, 1));

  return {
    bodyOffset: -0.46 * recoil,
    brace,
    charge,
    recoil,
    deformation: {
      squash: clamp01(0.11 * brace + 0.30 * charge + 0.52 * recoil),
      stretch: clamp01(0.10 * Math.max(0, recoverySpring)),
      lean: -0.16 * brace - 0.23 * charge - 0.38 * recoil + chargeTremor,
      wobble: chargeTremor + 0.11 * recoverySpring,
      jump: 0.035 * recoil,
    },
    equipment: {
      angle: -0.08 * brace - 0.13 * charge + 0.24 * recoil - 0.05 * recoverySpring,
      lift: 0.010 * charge + 0.030 * recoil,
      sweep: -0.025 * chargeTremor,
    },
    vfx: {
      muzzleFlash,
      muzzleCore,
      smoke,
      smokeScale: 0.75 + smokeProgress * 2.25,
      smokeDrift: smokeProgress * 0.46,
      shellTravelProgress,
      shellArcHeight,
      tracer,
      impactProgress,
      impactFlash,
      explosion,
      explosionScale: impactProgress < 0 ? 0 : 0.95 + easeOutCubic(impactProgress) * 2.05,
      impactSmoke,
      screenPunch,
    },
  };
}

/** Ordered normalized burst release points for the deployed Engineer turret. */
export function getEngineerTurretShotReleaseU(shotIndex: 0 | 1 | 2): number {
  return ENGINEER_SIGNATURE_TIMING.burstReleaseUs[shotIndex];
}

function getEngineerBurstState(u: number): Pick<EngineerTurretPose, 'shotIndex' | 'shotProgress' | 'muzzlePulse' | 'recoil'> {
  const releases = ENGINEER_SIGNATURE_TIMING.burstReleaseUs;
  let shotIndex: 0 | 1 | 2 | null = null;
  let shotProgress = -1;
  let muzzlePulse = 0;
  let recoil = 0;

  releases.forEach((releaseU, index) => {
    const pulse = pulseAround(u, releaseU, 0.028);
    muzzlePulse = Math.max(muzzlePulse, pulse);

    const localProgress = phase(u, releaseU - 0.018, releaseU + 0.055);
    const localRecoil = u >= releaseU
      ? (1 - easeOutCubic(phase(u, releaseU, releaseU + 0.075)))
      : 0;
    recoil = Math.max(recoil, localRecoil);

    if (u >= releaseU - 0.018 && u <= releaseU + 0.055) {
      shotIndex = index as 0 | 1 | 2;
      shotProgress = localProgress;
    }
  });

  return { shotIndex, shotProgress, muzzlePulse, recoil };
}

/**
 * Tier-3 Engineer signature: collect -> assemble -> deploy -> boot -> turret burst -> retract.
 *
 * Most of the authored time is spent on the gadget lifecycle. The gunfire is a short
 * payoff at the end, keeping Engineer visually distinct from Gunner/Cannoneer.
 */
export function getEngineerSignatureMotion(uInput: number): EngineerSignatureMotionPose {
  const u = safeU(uInput);
  const timing = ENGINEER_SIGNATURE_TIMING;

  const gatherProgress = easeInOutCubic(phase(u, timing.gatherStartU, timing.gatherEndU));
  const gatherFade = 1 - easeInOutCubic(phase(u, timing.assemblyStartU + 0.10, timing.assemblyEndU));
  const partsOpacity = clamp01(gatherProgress * gatherFade);

  const assemblyProgress = easeInOutCubic(phase(u, timing.assemblyStartU, timing.assemblyEndU));
  const assemblyWindow = smoothEnvelope(u, timing.assemblyStartU, timing.assemblyStartU + 0.07, timing.assemblyEndU - 0.06, timing.assemblyEndU + 0.03);
  const assemblyBeat = Math.sin(assemblyProgress * Math.PI * 6) * assemblyWindow;
  const assemblySparks = Math.abs(Math.sin(assemblyProgress * Math.PI * 5)) * assemblyWindow;

  const deployIn = easeOutCubic(phase(u, timing.deployStartU, timing.deployEndU));
  const retract = easeInOutCubic(phase(u, timing.retractStartU, 1));
  const deploymentProgress = clamp01(deployIn * (1 - retract));
  const turretVisibility = clamp01(smoothEnvelope(u, timing.deployStartU, timing.deployStartU + 0.06, timing.retractStartU, 1));

  const activationPulse = pulseAround(u, timing.turretOnlineU, 0.075);
  const bootSpin = phase(u, timing.deployStartU, timing.turretOnlineU);
  const burst = getEngineerBurstState(u);

  const energyGather = smoothEnvelope(u, timing.gatherStartU, timing.gatherStartU + 0.10, timing.assemblyEndU - 0.04, timing.deployEndU);
  const energyPulse = clamp01(Math.max(
    energyGather * (0.62 + Math.abs(Math.sin(u * Math.PI * 12)) * 0.38),
    activationPulse,
  ));

  const bodyBuildHop = Math.max(0, assemblyBeat) * 0.055;
  const settle = Math.sin(phase(u, timing.retractStartU, 1) * Math.PI * 2) * (1 - phase(u, timing.retractStartU, 1));

  return {
    bodyOffset: -0.055 * assemblyWindow + 0.035 * activationPulse,
    gatherProgress,
    assemblyProgress,
    deploymentProgress,
    deformation: {
      squash: clamp01(0.10 * gatherProgress * gatherFade + 0.26 * assemblyWindow + 0.12 * activationPulse),
      stretch: clamp01(0.13 * Math.max(0, -assemblyBeat) + 0.05 * Math.max(0, settle)),
      lean: 0.11 * assemblyBeat - 0.06 * activationPulse,
      wobble: 0.13 * assemblyBeat + 0.045 * settle,
      jump: bodyBuildHop,
    },
    equipment: {
      angle: assemblyBeat * 0.72 + activationPulse * 0.18,
      lift: Math.abs(assemblyBeat) * 0.025,
      sweep: -assemblyBeat * 0.34,
    },
    vfx: {
      partsOpacity,
      partsRadius: 0.62 * (1 - gatherProgress) + 0.10,
      partsRotation: gatherProgress * Math.PI * 4.5 + assemblyProgress * Math.PI * 1.5,
      partsLift: 0.12 + Math.sin(gatherProgress * Math.PI) * 0.24,
      energyPulse,
      energyScale: 0.72 + assemblyProgress * 0.74 + activationPulse * 0.34,
      assemblySparks,
      activationPulse,
    },
    turret: {
      deployProgress: deploymentProgress,
      visibility: turretVisibility,
      lift: (1 - deployIn) * 0.24 * turretVisibility + activationPulse * 0.035,
      yaw: ((1 - easeOutCubic(bootSpin)) * -0.72 + activationPulse * 0.08) * deploymentProgress,
      recoil: burst.recoil * deploymentProgress,
      muzzlePulse: burst.muzzlePulse * deploymentProgress,
      shotIndex: burst.shotIndex,
      shotProgress: burst.shotProgress,
    },
  };
}
