import * as THREE from 'three';
import {
  clampEnemy01,
  type EnemyDefeatPose,
  type EnemyHitPose,
  type EnemyMotionProfile,
  type EnemyPose,
} from './shared';

export type DragonBehaviorId =
  | 'dragon-egg-fire'
  | 'dragon-tiny-wing-dive'
  | 'dragon-star-lizard-charge'
  | 'dragon-meteor-cast'
  | 'dragon-star-eater-boss';

const tau = Math.PI * 2;

function pose(overrides: Partial<EnemyPose> = {}): EnemyPose {
  return {
    scaleX: 1,
    scaleY: 1,
    scaleZ: 1,
    jump: 0,
    wobbleZ: 0,
    travel: 0,
    releaseProgress: -1,
    ...overrides,
  };
}

function phase(t: number, from: number, to: number): number {
  return clampEnemy01((t - from) / Math.max(0.0001, to - from));
}

function easeOut(t: number): number {
  const x = clampEnemy01(t);
  return 1 - (1 - x) ** 3;
}

function easeInOut(t: number): number {
  const x = clampEnemy01(t);
  return x * x * (3 - 2 * x);
}

/* たまごドラゴン --------------------------------------------------------- */

function eggIdle(now: number, offset = 0): EnemyPose {
  const breathe = Math.sin(now * 1.08 + offset);
  return pose({
    scaleX: 1 + breathe * 0.004,
    scaleY: 1 - breathe * 0.006,
    scaleZ: 1 + breathe * 0.005,
    secondary: {
      headNod: breathe * 0.018,
      shellRoll: -breathe * 0.014,
      inflate: Math.max(0, breathe) * 0.025,
    },
  });
}

function eggMove(now: number, offset = 0): EnemyPose {
  const cycle = (now / 1.05 + offset) % 1;
  const hop = Math.sin(cycle * Math.PI);
  const sway = Math.sin(cycle * tau);
  return pose({
    jump: Math.max(0, hop) * 0.050,
    wobbleZ: sway * 0.020,
    scaleY: 1 - Math.max(0, hop) * 0.018,
    secondary: {
      headNod: -sway * 0.050,
      shellRoll: sway * 0.065,
    },
  });
}

function eggAttack(u: number): EnemyPose {
  const t = clampEnemy01(u);
  const inhale =
    t < 0.28 ? easeOut(t / 0.28)
      : t < 0.46 ? 1
        : Math.max(0, 1 - phase(t, 0.46, 0.60));
  // 0.34..0.46 is a full-body held breath: >= 0.12 s at 1.20 s duration.
  const hold = t >= 0.34 && t < 0.46;
  const fireRelease = t >= 0.50 ? phase(t, 0.50, 1) : -1;
  const recoil = t < 0.50 ? 0 : t < 0.66 ? Math.sin(phase(t, 0.50, 0.66) * Math.PI) : 0;
  const shellAfter = t < 0.60 ? 0 : t < 0.90
    ? Math.sin(phase(t, 0.60, 0.90) * tau) * (1 - phase(t, 0.60, 0.90))
    : 0;
  return pose({
    scaleX: 1 + inhale * 0.025 + recoil * 0.025,
    scaleY: 1 - inhale * 0.025 - recoil * 0.045,
    scaleZ: 1 + inhale * 0.022 - recoil * 0.025,
    jump: recoil * 0.012,
    wobbleZ: hold ? 0 : -recoil * 0.045,
    releaseProgress: fireRelease,
    secondary: {
      inflate: inhale * 0.28,
      headRetract: inhale * 0.035 - recoil * 0.055,
      headNod: recoil * 0.10,
      shellRoll: shellAfter * 0.28,
      shellCurl: Math.abs(shellAfter) * 0.05,
    },
  });
}

function eggHit(u: number, side: number): EnemyHitPose {
  const t = clampEnemy01(u);
  const body = Math.sin(t * Math.PI);
  const shell = t < 0.18 ? 0 : Math.sin(phase(t, 0.18, 0.92) * Math.PI * 2) * (1 - phase(t, 0.18, 0.92));
  return {
    scaleX: 1 - body * 0.035,
    scaleY: 1 + body * 0.020,
    scaleZ: 1 - body * 0.025,
    rotationZ: side * body * 0.050,
    secondary: {
      headNod: side * body * 0.12,
      shellRoll: side * shell * 0.20,
    },
  };
}

function eggDefeat(u: number, side: number): EnemyDefeatPose {
  const t = clampEnemy01(u);
  const sink = Math.sin(Math.min(1, phase(t, 0.14, 0.82)) * Math.PI * 0.5);
  const shell = t < 0.35 ? 0 : Math.sin(phase(t, 0.35, 0.88) * Math.PI * 2) * (1 - phase(t, 0.35, 0.88));
  const fade = phase(t, 0.985, 1);
  return {
    scaleX: 1 + sink * 0.06,
    scaleY: 1 - sink * 0.24,
    scaleZ: 1 - sink * 0.13,
    rotationZ: side * sink * 0.06,
    yOffset: -0.080 * sink,
    lateralDrift: side * 0.015 * sink,
    backwardDrift: 0.012 * sink,
    opacity: 1 - fade,
    secondary: {
      headNod: sink * 0.15,
      headRetract: sink * 0.05,
      shellRoll: side * shell * 0.13,
    },
  };
}

/* こつばさ竜 ------------------------------------------------------------- */

function tinyWingIdle(now: number, offset = 0): EnemyPose {
  const cycle = (now / 2.30 + offset) % 1;
  const failWindow = cycle < 0.24 ? phase(cycle, 0, 0.24) : 0;
  const flap = failWindow > 0 ? Math.sin(failWindow * Math.PI * 6) * (1 - failWindow * 0.25) : 0;
  const breathe = Math.sin(now * 0.92 + offset);
  return pose({
    jump: Math.max(0, flap) * 0.010,
    secondary: {
      open: flap * 0.17,
      wag: -flap * 0.055 + breathe * 0.020,
      headNod: -Math.abs(flap) * 0.022,
    },
  });
}

function tinyWingMove(now: number, offset = 0): EnemyPose {
  const cycle = (now / 1.12 + offset) % 1;
  const flapPhase = Math.min(1, cycle / 0.55);
  const threeFlaps = cycle < 0.55 ? Math.sin(flapPhase * Math.PI * 6) : 0;
  const hover = cycle >= 0.42 && cycle < 0.72 ? Math.sin(phase(cycle, 0.42, 0.72) * Math.PI) : 0;
  const land = cycle >= 0.72 ? Math.sin(phase(cycle, 0.72, 1) * Math.PI) : 0;
  return pose({
    jump: Math.max(0, threeFlaps) * 0.035 + hover * 0.055 - land * 0.008,
    wobbleZ: threeFlaps * 0.010,
    secondary: {
      open: threeFlaps * 0.24 - land * 0.05,
      wag: -threeFlaps * 0.06,
      headNod: land * 0.035,
    },
  });
}

function tinyWingAttack(u: number): EnemyPose {
  const t = clampEnemy01(u);
  const failedFlaps = t < 0.36 ? Math.sin(phase(t, 0, 0.36) * Math.PI * 6) : 0;
  const hover = t < 0.30 ? 0 : t < 0.50 ? Math.sin(phase(t, 0.30, 0.50) * Math.PI * 0.5) : t < 0.60 ? 1 : Math.max(0, 1 - phase(t, 0.60, 0.74));
  const fold = t < 0.48 ? 0 : t < 0.58 ? easeOut(phase(t, 0.48, 0.58)) : t < 0.68 ? 1 : Math.max(0, 1 - phase(t, 0.68, 0.80));
  const dive = t < 0.58 ? 0 : t < 0.74 ? easeOut(phase(t, 0.58, 0.74)) : t < 0.82 ? 1 : Math.max(0, 1 - phase(t, 0.82, 0.96));
  const impact = Math.exp(-Math.pow((t - 0.74) / 0.045, 2));
  const afterFlutter = t < 0.77 ? 0 : t < 0.96
    ? Math.sin(phase(t, 0.77, 0.96) * Math.PI * 4) * (1 - phase(t, 0.77, 0.96))
    : 0;
  return pose({
    scaleX: 1 + impact * 0.035,
    scaleY: 1 - dive * 0.030 - impact * 0.030,
    scaleZ: 1 + hover * 0.010 - impact * 0.022,
    jump: hover * 0.075 - dive * 0.020,
    travel: dive * 0.78,
    wobbleZ: failedFlaps * 0.012 + impact * 0.040,
    secondary: {
      open: failedFlaps * 0.24 - fold * 0.26 + afterFlutter * 0.22,
      wag: -dive * 0.20 + afterFlutter * -0.08,
      headNod: dive * 0.10,
    },
  });
}

function tinyWingHit(u: number, side: number): EnemyHitPose {
  const t = clampEnemy01(u);
  const p = Math.sin(t * Math.PI);
  const flutter = t < 0.18 ? 0 : Math.sin(phase(t, 0.18, 1) * Math.PI * 4) * (1 - phase(t, 0.18, 1));
  return {
    scaleX: 1 - p * 0.030,
    scaleY: 1 + p * 0.020,
    scaleZ: 1 - p * 0.025,
    rotationZ: side * p * 0.060,
    secondary: { open: flutter * 0.18, wag: side * p * 0.14, headNod: side * p * 0.08 },
  };
}

function tinyWingDefeat(u: number, side: number): EnemyDefeatPose {
  const t = clampEnemy01(u);
  const emptyFlap = t < 0.28 ? Math.sin(phase(t, 0, 0.28) * Math.PI * 2) * (1 - phase(t, 0, 0.28)) : 0;
  const sit = t < 0.20 ? 0 : Math.sin(Math.min(1, phase(t, 0.20, 0.84)) * Math.PI * 0.5);
  const fade = phase(t, 0.985, 1);
  return {
    scaleX: 1 + sit * 0.07,
    scaleY: 1 - sit * 0.23,
    scaleZ: 1 - sit * 0.12,
    rotationZ: side * sit * 0.09,
    yOffset: -0.085 * sit,
    lateralDrift: side * 0.018 * sit,
    backwardDrift: 0.012 * sit,
    opacity: 1 - fade,
    secondary: { open: emptyFlap * 0.22 - sit * 0.18, wag: -side * sit * 0.10, headNod: sit * 0.12 },
  };
}

/* 星くいトカゲ ----------------------------------------------------------- */

function lizardIdle(now: number, offset = 0): EnemyPose {
  const glow = (Math.sin(now * 0.72 + offset) + 1) * 0.5;
  return pose({
    scaleX: 1 + Math.sin(now * 0.86 + offset) * 0.005,
    secondary: {
      glow: glow * 0.14,
      glowHeat: glow * 0.10,
      primaryLift: Math.sin(now * 0.72 + offset) * 0.008,
      wag: -Math.sin(now * 0.86 + offset) * 0.035,
    },
  });
}

function lizardMove(now: number, offset = 0): EnemyPose {
  const cycle = (now / 1.18 + offset) % 1;
  const bob = Math.sin(cycle * tau);
  return pose({
    jump: Math.max(0, Math.sin(cycle * Math.PI)) * 0.018,
    wobbleZ: bob * 0.012,
    secondary: { primaryLift: -Math.abs(bob) * 0.012, wag: -bob * 0.10, glow: 0.10 },
  });
}

function lizardAttack(u: number): EnemyPose {
  const t = clampEnemy01(u);
  const drain = t < 0.22 ? easeOut(t / 0.22) : t < 0.48 ? 1 : Math.max(0, 1 - phase(t, 0.48, 0.70));
  const compress = t < 0.20 ? 0 : t < 0.36 ? easeOut(phase(t, 0.20, 0.36)) : t < 0.48 ? 1 : Math.max(0, 1 - phase(t, 0.48, 0.62));
  // 0.36..0.48 is the completely held charged posture.
  const dash = t < 0.48 ? 0 : t < 0.64 ? easeOut(phase(t, 0.48, 0.64)) : t < 0.72 ? 1 : Math.max(0, 1 - phase(t, 0.72, 0.94));
  const impact = Math.exp(-Math.pow((t - 0.64) / 0.040, 2));
  const starReturn = t < 0.72 ? 0 : t < 0.94 ? Math.sin(phase(t, 0.72, 0.94) * Math.PI) : 0;
  return pose({
    scaleX: 1 + dash * 0.045 + impact * 0.035,
    scaleY: 1 - compress * 0.060 - impact * 0.030,
    scaleZ: 1 - compress * 0.050 + impact * 0.018,
    travel: dash * 0.86,
    wobbleZ: impact * 0.045,
    secondary: {
      glow: -drain * 0.42 + starReturn * 1.05,
      glowHeat: starReturn * 0.80,
      primaryLift: -compress * 0.045 + starReturn * 0.080,
      primaryBend: -compress * 0.12 + starReturn * 0.22,
      wag: -dash * 0.15 + starReturn * 0.10,
    },
  });
}

function lizardHit(u: number, side: number): EnemyHitPose {
  const t = clampEnemy01(u);
  const p = Math.sin(t * Math.PI);
  return {
    scaleX: 1 - p * 0.035,
    scaleY: 1 + p * 0.018,
    scaleZ: 1 - p * 0.025,
    rotationZ: side * p * 0.035,
    secondary: { primaryLift: p * 0.035, primaryBend: side * p * 0.13, glow: -p * 0.18, wag: side * p * 0.12 },
  };
}

function lizardDefeat(u: number, side: number): EnemyDefeatPose {
  const t = clampEnemy01(u);
  const drain = Math.sin(Math.min(1, phase(t, 0.04, 0.38)) * Math.PI * 0.5);
  const curl = t < 0.22 ? 0 : Math.sin(Math.min(1, phase(t, 0.22, 0.84)) * Math.PI * 0.5);
  const fade = phase(t, 0.985, 1);
  return {
    scaleX: 1 - curl * 0.09,
    scaleY: 1 - curl * 0.20,
    scaleZ: 1 - curl * 0.10,
    rotationZ: side * curl * 0.10,
    yOffset: -0.070 * curl,
    lateralDrift: side * 0.012 * curl,
    backwardDrift: 0.012 * curl,
    opacity: 1 - fade,
    secondary: {
      glow: -drain * 0.65,
      primaryLift: -curl * 0.075,
      primaryBend: side * curl * 0.20,
      wag: side * curl * 0.12,
    },
  };
}

/* りゅうせいヒナ --------------------------------------------------------- */

function meteorIdle(now: number, offset = 0): EnemyPose {
  const orbit = now * 0.58 + offset;
  return pose({
    jump: 0.012 + Math.sin(now * 0.62 + offset) * 0.008,
    secondary: {
      twist: orbit,
      secondaryTwist: -orbit,
      primaryLift: Math.sin(orbit) * 0.018,
      secondaryLift: -Math.sin(orbit) * 0.018,
      glow: 0.16,
    },
  });
}

function meteorMove(now: number, offset = 0): EnemyPose {
  const cycle = (now / 1.15 + offset) % 1;
  const hop = Math.sin(cycle * Math.PI);
  const orbit = cycle * tau;
  return pose({
    jump: Math.max(0, hop) * 0.055,
    wobbleZ: Math.sin(orbit) * 0.010,
    secondary: {
      twist: orbit * 0.55,
      secondaryTwist: -orbit * 0.55,
      primaryLift: Math.sin(orbit) * 0.030,
      secondaryLift: -Math.sin(orbit) * 0.030,
      glow: 0.18,
    },
  });
}

function meteorAttack(u: number): EnemyPose {
  const t = clampEnemy01(u);
  // Body is intentionally motionless until release; only the two motes move.
  const gather = t < 0.18 ? 0 : t < 0.50 ? easeInOut(phase(t, 0.18, 0.50)) : t < 0.62 ? 1 : Math.max(0, 1 - phase(t, 0.62, 0.82));
  const orbit = t < 0.18 ? 0 : phase(t, 0.18, 0.50) * Math.PI * 1.25;
  // 0.50..0.62 is a >= 0.16 s merged hold at 1.40 s duration.
  const release = t >= 0.62 ? phase(t, 0.62, 1) : -1;
  const reForm = t < 0.70 ? 0 : easeOut(phase(t, 0.70, 0.96));
  const impactPulse = Math.exp(-Math.pow((t - 0.62) / 0.045, 2));
  return pose({
    scaleX: 1 + impactPulse * 0.018,
    scaleY: 1 - impactPulse * 0.020,
    scaleZ: 1 + impactPulse * 0.012,
    releaseProgress: release,
    secondary: {
      twist: orbit,
      secondaryTwist: -orbit,
      primaryLift: gather * 0.105 - reForm * 0.105,
      secondaryLift: gather * 0.105 - reForm * 0.105,
      inflate: -gather * 0.36 + reForm * 0.36,
      glow: gather * 0.75 + reForm * 0.15,
      glowHeat: gather * 0.42,
    },
  });
}

function meteorHit(u: number, side: number): EnemyHitPose {
  const t = clampEnemy01(u);
  const p = Math.sin(t * Math.PI);
  return {
    scaleX: 1 - p * 0.025,
    scaleY: 1 + p * 0.015,
    scaleZ: 1 - p * 0.020,
    rotationZ: side * p * 0.045,
    secondary: {
      twist: side * p * 0.35,
      secondaryTwist: -side * p * 0.35,
      primaryLift: p * 0.030,
      secondaryLift: -p * 0.020,
      glow: -p * 0.20,
    },
  };
}

function meteorDefeat(u: number, side: number): EnemyDefeatPose {
  const t = clampEnemy01(u);
  const dim = Math.sin(Math.min(1, phase(t, 0.05, 0.42)) * Math.PI * 0.5);
  const descend = t < 0.18 ? 0 : Math.sin(Math.min(1, phase(t, 0.18, 0.78)) * Math.PI * 0.5);
  const sit = t < 0.36 ? 0 : Math.sin(Math.min(1, phase(t, 0.36, 0.86)) * Math.PI * 0.5);
  const fade = phase(t, 0.985, 1);
  return {
    scaleX: 1 + sit * 0.055,
    scaleY: 1 - sit * 0.20,
    scaleZ: 1 - sit * 0.10,
    rotationZ: side * sit * 0.06,
    yOffset: -0.075 * sit,
    lateralDrift: side * 0.010 * sit,
    backwardDrift: 0.010 * sit,
    opacity: 1 - fade,
    secondary: {
      primaryLift: -descend * 0.15,
      secondaryLift: -descend * 0.15,
      twist: side * descend * 0.22,
      secondaryTwist: -side * descend * 0.22,
      glow: -dim * 0.60,
    },
  };
}

/* 星喰らい竜 ------------------------------------------------------------- */

function bossIdle(now: number, offset = 0): EnemyPose {
  const breathe = Math.sin(now * 0.60 + offset);
  return pose({
    scaleX: 1 + breathe * 0.002,
    scaleY: 1 - breathe * 0.004,
    scaleZ: 1 + breathe * 0.003,
    secondary: {
      open: breathe * 0.028,
      wag: -breathe * 0.022,
      headNod: breathe * 0.012,
      glow: 0.14 + Math.max(0, breathe) * 0.08,
    },
  });
}

function bossMove(now: number, offset = 0): EnemyPose {
  const cycle = (now / 1.90 + offset) % 1;
  const glide = Math.sin(cycle * tau);
  const wingSettle = Math.sin((cycle - 0.12) * tau);
  return pose({
    jump: 0.020 + Math.max(0, Math.sin(cycle * Math.PI)) * 0.014,
    wobbleZ: glide * 0.008,
    secondary: {
      open: wingSettle * 0.075,
      wag: -glide * 0.060,
      headNod: -glide * 0.018,
      glow: 0.15,
    },
  });
}

function bossAttack(u: number): EnemyPose {
  const t = clampEnemy01(u);
  // Seven readable beats:
  // 1 crouch -> 2 wings close -> 3 star pull-in -> 4 full hold ->
  // 5 wing burst -> 6 charge/contact -> 7 delayed tail/ring -> recovery.
  const crouch =
    t < 0.15 ? easeOut(t / 0.15)
      : t < 0.50 ? 1
        : Math.max(0, 1 - phase(t, 0.50, 0.63));
  const close =
    t < 0.15 ? 0
      : t < 0.30 ? easeOut(phase(t, 0.15, 0.30))
        : t < 0.50 ? 1
          : Math.max(0, 1 - phase(t, 0.50, 0.58));
  const gather =
    t < 0.30 ? 0
      : t < 0.42 ? easeInOut(phase(t, 0.30, 0.42))
        : t < 0.50 ? 1
          : Math.max(0, 1 - phase(t, 0.50, 0.64));
  // 0.42..0.50 = 0.163 s still hold at attackDuration 2.04 s.
  const wingBurst = t < 0.50 ? 0 : t < 0.60 ? easeOut(phase(t, 0.50, 0.60)) : t < 0.75 ? 1 : Math.max(0, 1 - phase(t, 0.75, 0.96));
  const charge = t < 0.54 ? 0 : t < 0.63 ? easeOut(phase(t, 0.54, 0.63)) : t < 0.72 ? 1 : Math.max(0, 1 - phase(t, 0.72, 0.94));
  const impact = Math.exp(-Math.pow((t - 0.63) / 0.030, 2));
  // 0.63 -> 0.70 = 0.143 s delayed secondary reaction.
  const delayedRing = t >= 0.70 ? phase(t, 0.70, 1) : -1;
  const tailAfter = t < 0.70 ? 0 : t < 0.90
    ? Math.sin(phase(t, 0.70, 0.90) * Math.PI) * (1 - phase(t, 0.70, 0.90) * 0.45)
    : 0;
  const recover = t < 0.80 ? 0 : easeInOut(phase(t, 0.80, 1));
  return pose({
    scaleX: 1 - crouch * 0.030 + impact * 0.060,
    scaleY: 1 - crouch * 0.070 - impact * 0.055,
    scaleZ: 1 - crouch * 0.060 + impact * 0.030,
    jump: charge * 0.028 * (1 - recover),
    travel: charge * 0.92 * (1 - recover * 0.20),
    wobbleZ: impact * 0.045,
    releaseProgress: delayedRing,
    secondary: {
      open: -close * 0.48 + wingBurst * 0.46 - recover * 0.12,
      inflate: -gather * 0.32 + wingBurst * 0.10,
      glow: gather * 1.30 + wingBurst * 0.65 - recover * 0.25,
      glowHeat: gather * 0.72 + impact * 0.28,
      wag: tailAfter * 0.48,
      headNod: crouch * 0.075 - impact * 0.055,
      headRetract: crouch * 0.035,
    },
  });
}

function bossHit(u: number, side: number): EnemyHitPose {
  const t = clampEnemy01(u);
  const p = Math.sin(t * Math.PI);
  return {
    scaleX: 1 - p * 0.020,
    scaleY: 1 + p * 0.012,
    scaleZ: 1 - p * 0.018,
    rotationZ: side * p * 0.030,
    secondary: {
      open: -p * 0.10,
      wag: side * p * 0.15,
      headNod: side * p * 0.045,
      glow: -p * 0.18,
    },
  };
}

function bossDefeat(u: number, side: number): EnemyDefeatPose {
  const t = clampEnemy01(u);
  const breath = t < 0.18 ? Math.sin(phase(t, 0, 0.18) * Math.PI) : 0;
  const glowOff = Math.sin(Math.min(1, phase(t, 0.08, 0.40)) * Math.PI * 0.5);
  const wingDroop = t < 0.20 ? 0 : Math.sin(Math.min(1, phase(t, 0.20, 0.58)) * Math.PI * 0.5);
  const sit = t < 0.42 ? 0 : Math.sin(Math.min(1, phase(t, 0.42, 0.78)) * Math.PI * 0.5);
  const headDrop = t < 0.68 ? 0 : Math.sin(Math.min(1, phase(t, 0.68, 0.94)) * Math.PI * 0.5);
  const fade = phase(t, 0.99, 1);
  return {
    scaleX: 1 + sit * 0.08,
    scaleY: 1 - sit * 0.26,
    scaleZ: 1 - sit * 0.13 - headDrop * 0.035,
    rotationZ: side * headDrop * 0.035,
    yOffset: -0.105 * sit,
    lateralDrift: side * 0.012 * sit,
    backwardDrift: 0.018 * sit,
    opacity: 1 - fade,
    secondary: {
      open: -wingDroop * 0.42,
      wag: side * breath * 0.10,
      headNod: headDrop * 0.22,
      headRetract: headDrop * 0.055,
      glow: -glowOff * 0.78,
      inflate: -glowOff * 0.18,
    },
  };
}

function fireballMesh(): THREE.Object3D {
  const group = new THREE.Group();
  const core = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.075, 1),
    new THREE.MeshStandardMaterial({
      color: '#ffca74',
      emissive: '#ff6f2c',
      emissiveIntensity: 1.05,
      roughness: 0.30,
    }),
  );
  core.scale.set(0.88, 0.88, 1.25);
  group.add(core);
  return group;
}

function meteorMesh(): THREE.Object3D {
  const group = new THREE.Group();
  const core = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.085, 0),
    new THREE.MeshStandardMaterial({
      color: '#e5dcff',
      emissive: '#8c74e8',
      emissiveIntensity: 0.90,
      roughness: 0.28,
    }),
  );
  core.rotation.z = Math.PI / 4;
  group.add(core);
  return group;
}

function starRingMesh(): THREE.Object3D {
  const group = new THREE.Group();
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.18, 0.024, 9, 32),
    new THREE.MeshStandardMaterial({
      color: '#eee8ff',
      emissive: '#8c74e8',
      emissiveIntensity: 0.95,
      roughness: 0.24,
    }),
  );
  ring.rotation.x = Math.PI / 2;
  group.add(ring);
  return group;
}

const profiles: Record<DragonBehaviorId, EnemyMotionProfile> = {
  'dragon-egg-fire': {
    familyId: 'dragon',
    idle: eggIdle,
    move: eggMove,
    attack: eggAttack,
    hit: eggHit,
    defeat: eggDefeat,
    moveDuration: 1.05,
    moveDistance: 0.58,
    attackDuration: 1.20,
    attackTravelDistance: 0.03,
    contactU: 0.50,
    defeatDuration: 1.48,
    projectile: {
      kind: 'dragon-fireball',
      flightSeconds: 0.36,
      createMesh: fireballMesh,
      arcHeight: (u) => Math.sin(clampEnemy01(u) * Math.PI) * 0.035,
    },
  },
  'dragon-tiny-wing-dive': {
    familyId: 'dragon',
    idle: tinyWingIdle,
    move: tinyWingMove,
    attack: tinyWingAttack,
    hit: tinyWingHit,
    defeat: tinyWingDefeat,
    moveDuration: 1.12,
    moveDistance: 0.66,
    attackDuration: 1.20,
    attackTravelDistance: 0.56,
    contactU: 0.74,
    defeatDuration: 1.46,
  },
  'dragon-star-lizard-charge': {
    familyId: 'dragon',
    idle: lizardIdle,
    move: lizardMove,
    attack: lizardAttack,
    hit: lizardHit,
    defeat: lizardDefeat,
    moveDuration: 1.18,
    moveDistance: 0.75,
    attackDuration: 1.28,
    attackTravelDistance: 0.62,
    contactU: 0.64,
    defeatDuration: 1.52,
  },
  'dragon-meteor-cast': {
    familyId: 'dragon',
    idle: meteorIdle,
    move: meteorMove,
    attack: meteorAttack,
    hit: meteorHit,
    defeat: meteorDefeat,
    moveDuration: 1.15,
    moveDistance: 0.60,
    attackDuration: 1.40,
    attackTravelDistance: 0.02,
    contactU: 0.62,
    defeatDuration: 1.58,
    projectile: {
      kind: 'dragon-meteor',
      flightSeconds: 0.48,
      createMesh: meteorMesh,
      arcHeight: (u) => Math.sin(clampEnemy01(u) * Math.PI) * 0.32,
    },
  },
  'dragon-star-eater-boss': {
    familyId: 'dragon',
    idle: bossIdle,
    move: bossMove,
    attack: bossAttack,
    hit: bossHit,
    defeat: bossDefeat,
    moveDuration: 1.90,
    moveDistance: 0.48,
    attackDuration: 2.04,
    attackTravelDistance: 0.76,
    contactU: 0.63,
    defeatDuration: 2.12,
    projectile: {
      kind: 'dragon-star-ring',
      flightSeconds: 0.24,
      createMesh: starRingMesh,
      arcHeight: () => 0,
    },
    attackVfx: {
      color: '#8c74e8',
      radius: 0.48,
      pose: (u) => {
        const t = clampEnemy01(u);
        const gather = t < 0.30 ? 0 : t < 0.50 ? easeInOut(phase(t, 0.30, 0.50)) : Math.max(0, 1 - phase(t, 0.50, 0.66));
        const impact = Math.exp(-Math.pow((t - 0.63) / 0.035, 2));
        return {
          telegraphOpacity: gather * 0.58,
          telegraphScale: 0.72 + gather * 0.28,
          impactStrength: impact,
        };
      },
      impactColor: '#d9ceff',
      impactSize: 0.70,
      cameraShakeDuration: 0.14,
      cameraShakeAmplitude: 0.055,
    },
  },
};

export const getDragonMotionProfile = (id: DragonBehaviorId): EnemyMotionProfile => profiles[id];
