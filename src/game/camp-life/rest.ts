import { easeOutCubic } from '../slime-motion';
import { CAMP_LIFE_STATIONS, campLifeHomeForSlot, yawToward } from '../camp-life-layout';
import { basePose, travel } from './base';
import { mod, pulse, segment } from './math';
import type { CampLifePose } from './types';

export function restPose(
  timeSec: number,
  slotIndex: number,
  cycleSec: number,
): CampLifePose {
  const t = mod(timeSec, cycleSec);
  const home = campLifeHomeForSlot(slotIndex);
  const rest = CAMP_LIFE_STATIONS.rest;
  const pose = basePose(slotIndex, timeSec);

  if (t < 1.10) return pose;
  if (t < 2.85) {
    return travel(
      pose,
      t,
      1.10,
      1.75,
      home.position.x,
      home.position.z,
      rest.position.x,
      rest.position.z,
    );
  }

  if (t < 4.45) {
    const u = segment(t, 2.85, 1.60);
    const yawn = Math.sin(u * Math.PI);
    return {
      ...pose,
      activity: 'yawn',
      x: rest.position.x,
      y: rest.position.y + yawn * 0.045,
      z: rest.position.z,
      yaw: yawToward(rest.position, rest.facingTarget),
      roll: -0.025 * yawn,
      bodySquash: 0.055 + (1 - yawn) * 0.035,
      bodyStretch: yawn * 0.11,
      lean: 0.045 * yawn,
      wobble: Math.sin(u * Math.PI * 2) * 0.025,
      eyeOpen: 1 - yawn * 0.72,
      mouthOpen: 1 + yawn * 5.0,
      mouthWidth: 1 + yawn * 0.62,
    };
  }

  if (t < 5.15) {
    const u = easeOutCubic(segment(t, 4.45, 0.70));
    return {
      ...pose,
      activity: 'drowsy',
      x: rest.position.x,
      y: rest.position.y - u * 0.025,
      z: rest.position.z,
      yaw: yawToward(rest.position, rest.facingTarget),
      roll: -0.065 * u,
      bodySquash: 0.05 + u * 0.08,
      bodyStretch: 0,
      lean: -0.03 * u,
      wobble: Math.sin(t * 2.4) * 0.018 * (1 - u * 0.5),
      eyeOpen: 1 - u * 0.78,
      mouthOpen: 1 - u * 0.18,
      mouthWidth: 1,
    };
  }

  if (t < 9.80) {
    const sleepyBreathe = 0.5 + Math.sin((t - 5.15) * 1.05) * 0.5;
    const dreamTwitch = pulse(t, 7.05, 0.55);
    return {
      ...pose,
      activity: 'sleep',
      x: rest.position.x,
      y: rest.position.y - 0.032 + sleepyBreathe * 0.008,
      z: rest.position.z,
      yaw: yawToward(rest.position, rest.facingTarget),
      roll: -0.075 + dreamTwitch * 0.018,
      bodySquash: 0.12 + sleepyBreathe * 0.025,
      bodyStretch: 0,
      lean: -0.045,
      wobble: Math.sin(t * 1.1) * 0.014 + dreamTwitch * 0.035,
      eyeOpen: 0.15 + dreamTwitch * 0.10,
      mouthOpen: 0.78,
      mouthWidth: 1.08,
    };
  }

  if (t < 10.95) {
    const u = segment(t, 9.80, 1.15);
    const stretch = Math.sin(u * Math.PI);
    return {
      ...pose,
      activity: 'wake',
      x: rest.position.x,
      y: rest.position.y + stretch * 0.07,
      z: rest.position.z,
      yaw: yawToward(rest.position, rest.facingTarget),
      roll: -0.075 * (1 - u),
      bodySquash: 0.12 * (1 - u),
      bodyStretch: stretch * 0.19,
      lean: Math.sin(u * Math.PI * 2) * 0.055,
      wobble: Math.sin(u * Math.PI * 3) * 0.075 * (1 - u * 0.45),
      eyeOpen: 0.15 + u * 0.85,
      mouthOpen: 0.78 + u * 0.22,
      mouthWidth: 1,
    };
  }

  if (t < 12.80) {
    return travel(
      pose,
      t,
      10.95,
      1.85,
      rest.position.x,
      rest.position.z,
      home.position.x,
      home.position.z,
    );
  }

  return pose;
}
