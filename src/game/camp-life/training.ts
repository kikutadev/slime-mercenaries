import type { SlimeId } from '../slimes';
import { CAMP_LIFE_STATIONS, campLifeHomeForSlot, yawToward } from '../camp-life-layout';
import { basePose, travel } from './base';
import { mod, pulse } from './math';
import type { CampLifePose } from './types';

const JOB_AMPLITUDE: Readonly<Record<SlimeId, number>> = {
  sword: 0.48,
  shield: 0.24,
  bow: 0.20,
  wand: 0.18,
  dagger: 0.58,
  gun: 0.30,
  mimic: 0.22,
};

export function trainingPose(
  timeSec: number,
  slimeId: SlimeId,
  slotIndex: number,
  cycleSec: number,
): CampLifePose {
  const t = mod(timeSec, cycleSec);
  const home = campLifeHomeForSlot(slotIndex);
  const training = CAMP_LIFE_STATIONS.training;
  const pose = basePose(slotIndex, timeSec);

  if (t < 1.35) return pose;
  if (t < 3.05) {
    return travel(
      pose,
      t,
      1.35,
      1.70,
      home.position.x,
      home.position.z,
      training.position.x,
      training.position.z,
    );
  }

  if (t < 6.55) {
    const local = t - 3.05;
    const strikeA = pulse(local, 0.70, 0.54);
    const strikeB = pulse(local, 1.68, 0.56);
    const strikeC = slimeId === 'dagger' || slimeId === 'gun'
      ? pulse(local, 2.52, 0.46)
      : 0;
    const strike = Math.max(strikeA, strikeB, strikeC);
    const recoil = Math.sin(local * Math.PI * 3.1) * strike;
    const amplitude = JOB_AMPLITUDE[slimeId] ?? 0.3;

    return {
      ...pose,
      activity: 'practice',
      x: training.position.x,
      y: training.position.y + strike * (slimeId === 'shield' ? 0.025 : 0.065),
      z: training.position.z,
      yaw: yawToward(training.position, training.facingTarget),
      roll: recoil * 0.045,
      bodySquash: 0.035 + strike * (slimeId === 'shield' ? 0.12 : 0.065),
      bodyStretch: strike * (slimeId === 'shield' ? 0.025 : 0.10),
      lean: -amplitude * strike,
      wobble: recoil * 0.14,
      equipmentAngle: amplitude * strike * (slimeId === 'shield' ? -0.45 : 1),
      practiceImpact: Math.max(
        pulse(local, 0.98, 0.16),
        pulse(local, 1.96, 0.16),
        strikeC > 0 ? pulse(local, 2.77, 0.14) : 0,
      ),
    };
  }

  if (t < 8.25) {
    return travel(
      pose,
      t,
      6.55,
      1.70,
      training.position.x,
      training.position.z,
      home.position.x,
      home.position.z,
    );
  }

  const satisfied = pulse(t, 8.55, 0.70);
  return {
    ...pose,
    y: home.position.y + satisfied * 0.055,
    wobble: pose.wobble + Math.sin(satisfied * Math.PI * 2) * 0.065,
    bodyStretch: pose.bodyStretch + satisfied * 0.055,
  };
}
