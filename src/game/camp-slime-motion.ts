import { clamp01, easeInOutCubic } from './slime-motion';
import type { SlimeId } from './slimes';

export interface CampIdleMotionPose {
  offsetX: number;
  offsetY: number;
  yawOffset: number;
  pitch: number;
  roll: number;
  squash: number;
  stretch: number;
  lean: number;
  wobble: number;
}

const CAMP_IDLE_CYCLE_SEC = 9.2;

const CAMP_IDLE_ENERGY: Readonly<Record<SlimeId, number>> = {
  sword: 1,
  shield: 0.78,
  bow: 0.94,
  wand: 0.90,
  dagger: 1.18,
  gun: 0.88,
  mimic: 1.08,
};

const CAMP_IDLE_DIRECTION: Readonly<Record<SlimeId, 1 | -1>> = {
  sword: 1,
  shield: -1,
  bow: -1,
  wand: 1,
  dagger: 1,
  gun: -1,
  mimic: 1,
};

function segment(time: number, start: number, duration: number): number {
  return clamp01((time - start) / duration);
}

function hopPulse(time: number, start: number, duration: number): number {
  const u = segment(time, start, duration);
  if (u <= 0 || u >= 1) return 0;
  return Math.sin(u * Math.PI);
}

function smoothWindow(time: number, enterStart: number, enterDuration: number, exitStart: number, exitDuration: number): number {
  const enter = easeInOutCubic(segment(time, enterStart, enterDuration));
  const exit = easeInOutCubic(segment(time, exitStart, exitDuration));
  return enter * (1 - exit);
}

/**
 * Camp is an observation space rather than a combat state.
 * The slime should therefore look alive without looping a conspicuous canned animation:
 * breathe -> notice something -> two small hops -> look around -> hop home -> happy bounce.
 */
export function getCampIdleMotion(timeSec: number, slimeId: SlimeId): CampIdleMotionPose {
  const cycle = ((timeSec % CAMP_IDLE_CYCLE_SEC) + CAMP_IDLE_CYCLE_SEC) % CAMP_IDLE_CYCLE_SEC;
  const energy = CAMP_IDLE_ENERGY[slimeId] ?? 1;
  const direction = CAMP_IDLE_DIRECTION[slimeId] ?? 1;

  const breatheWave = Math.sin(timeSec * 2.35 + slimeId.length * 0.31);
  const breathe = 0.5 + breatheWave * 0.5;
  const slowSway = Math.sin(timeSec * 1.18 + slimeId.length * 0.47);

  const curious = Math.sin(segment(cycle, 1.45, 1.10) * Math.PI);
  const stepOutA = hopPulse(cycle, 2.75, 0.58);
  const stepOutB = hopPulse(cycle, 3.43, 0.54);
  const away = smoothWindow(cycle, 2.72, 1.15, 5.56, 1.02);
  const lookAround = Math.sin(segment(cycle, 4.15, 1.55) * Math.PI);
  const stepHomeA = hopPulse(cycle, 5.55, 0.54);
  const stepHomeB = hopPulse(cycle, 6.16, 0.54);
  const happyHop = hopPulse(cycle, 7.46, 0.62);

  const hop = Math.max(stepOutA, stepOutB, stepHomeA, stepHomeB);
  const landingWobble =
    Math.sin(segment(cycle, 3.88, 0.68) * Math.PI * 2) * (1 - segment(cycle, 3.88, 0.68))
    + Math.sin(segment(cycle, 6.60, 0.72) * Math.PI * 2) * (1 - segment(cycle, 6.60, 0.72));

  const offsetX = direction * away * 0.105 * energy;
  const offsetY =
    Math.sin(timeSec * 1.75) * 0.012
    + hop * 0.105 * energy
    + happyHop * 0.085 * energy;

  const yawOffset =
    slowSway * 0.035
    + direction * curious * 0.17
    - direction * lookAround * 0.22
    + direction * away * 0.055;

  const roll =
    -direction * hop * 0.042 * energy
    + landingWobble * 0.035 * energy
    + slowSway * 0.012;

  const lean =
    slowSway * 0.055
    + direction * curious * 0.08
    - direction * lookAround * 0.06
    - direction * hop * 0.07;

  const wobble =
    slowSway * 0.045
    + landingWobble * 0.14 * energy
    + Math.sin(segment(cycle, 7.86, 0.72) * Math.PI * 3) * (1 - segment(cycle, 7.86, 0.72)) * 0.11 * energy;

  return {
    offsetX,
    offsetY,
    yawOffset,
    pitch: curious * 0.018 - happyHop * 0.025,
    roll,
    squash: 0.035 * breathe + (stepOutA + stepOutB + stepHomeA + stepHomeB) * 0.055 + happyHop * 0.045,
    stretch: 0.018 * (1 - breathe) + hop * 0.13 + happyHop * 0.11,
    lean,
    wobble,
  };
}

export const CAMP_IDLE_MOTION_CYCLE_SEC = CAMP_IDLE_CYCLE_SEC;
