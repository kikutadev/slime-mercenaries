import { easeInOutCubic } from '../slime-motion';
import { campLifeHomeForSlot, yawToward } from '../camp-life-layout';
import { lerp, segment } from './math';
import type { CampLifePose } from './types';

export function basePose(slotIndex: number, timeSec: number): CampLifePose {
  const home = campLifeHomeForSlot(slotIndex);
  const breathe = 0.5 + Math.sin(timeSec * 1.8 + slotIndex * 0.7) * 0.5;

  return {
    activity: 'idle',
    x: home.position.x,
    y: home.position.y,
    z: home.position.z,
    yaw: yawToward(home.position, home.facingTarget) + Math.sin(timeSec * 0.72 + slotIndex) * 0.055,
    roll: Math.sin(timeSec * 1.05 + slotIndex * 0.8) * 0.012,
    bodySquash: 0.022 + breathe * 0.022,
    bodyStretch: (1 - breathe) * 0.012,
    lean: Math.sin(timeSec * 0.92 + slotIndex) * 0.035,
    wobble: Math.sin(timeSec * 1.12 + slotIndex * 0.5) * 0.032,
    eyeOpen: 1,
    mouthOpen: 1,
    mouthWidth: 1,
    equipmentAngle: 0,
    practiceImpact: 0,
  };
}

export function travel(
  pose: CampLifePose,
  time: number,
  start: number,
  duration: number,
  fromX: number,
  fromZ: number,
  toX: number,
  toZ: number,
): CampLifePose {
  const u = easeInOutCubic(segment(time, start, duration));
  const hopPhase = segment(time, start, duration) * Math.PI * 3;
  const hop = Math.abs(Math.sin(hopPhase));
  const landing = Math.max(0, Math.cos(hopPhase * 2)) * (1 - hop);

  return {
    ...pose,
    activity: 'travel',
    x: lerp(fromX, toX, u),
    y: 0.02 + hop * 0.15,
    z: lerp(fromZ, toZ, u),
    yaw: Math.atan2(toX - fromX, toZ - fromZ),
    roll: Math.sin(hopPhase) * 0.035,
    bodySquash: 0.025 + landing * 0.07,
    bodyStretch: hop * 0.11,
    lean: Math.sin(hopPhase) * 0.045,
    wobble: Math.sin(hopPhase * 2) * 0.05 * (1 - hop * 0.4),
  };
}
