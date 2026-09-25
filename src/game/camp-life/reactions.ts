import { clamp01 } from '../slime-motion';
import type { CampReaction } from '../camp-types';
import { pulse } from './math';
import type { CampLifePose } from './types';

export function applyCampLifeWorldReaction(
  pose: CampLifePose,
  elapsedSec: number,
  slotIndex: number,
  reaction: CampReaction,
): CampLifePose {
  if (reaction === 'idle' || elapsedSec < 0) return pose;
  const delayed = Math.max(0, elapsedSec - slotIndex * 0.055);

  if (reaction === 'level-up' && delayed < 1.05) {
    const u = clamp01(delayed / 1.05);
    const cheer = Math.sin(u * Math.PI);
    return {
      ...pose,
      y: pose.y + cheer * 0.085,
      yaw: Math.atan2(-pose.x, 1.15 - pose.z),
      roll: pose.roll + Math.sin(u * Math.PI * 3) * cheer * 0.035,
      bodySquash: Math.max(pose.bodySquash, cheer * 0.065),
      bodyStretch: Math.max(pose.bodyStretch, cheer * 0.085),
      wobble: pose.wobble + Math.sin(u * Math.PI * 4) * cheer * 0.065,
      eyeOpen: 1,
    };
  }

  if (reaction === 'recruit' && delayed < 1.20) {
    const u = clamp01(delayed / 1.20);
    const notice = Math.sin(u * Math.PI);
    const hop = pulse(delayed, 0.36, 0.52);
    return {
      ...pose,
      y: pose.y + hop * 0.065,
      yaw: Math.atan2(-2.55 - pose.x, 1.55 - pose.z),
      roll: pose.roll + (slotIndex % 2 === 0 ? -1 : 1) * notice * 0.025,
      bodyStretch: Math.max(pose.bodyStretch, hop * 0.065),
      lean: pose.lean + notice * 0.035,
      wobble: pose.wobble + Math.sin(u * Math.PI * 2) * notice * 0.035,
      eyeOpen: 1,
    };
  }

  if (reaction === 'fusion' && delayed < 1.15) {
    const u = clamp01(delayed / 1.15);
    const notice = Math.sin(u * Math.PI);
    const tinyHop = pulse(delayed, 0.28, 0.48);
    return {
      ...pose,
      y: pose.y + tinyHop * 0.055,
      yaw: Math.atan2(2.55 - pose.x, -0.35 - pose.z),
      roll: pose.roll + (slotIndex % 2 === 0 ? -1 : 1) * notice * 0.028,
      bodySquash: Math.max(pose.bodySquash, tinyHop * 0.045),
      bodyStretch: Math.max(pose.bodyStretch, tinyHop * 0.07),
      lean: pose.lean - notice * 0.035,
      wobble: pose.wobble + Math.sin(u * Math.PI * 3) * notice * 0.045,
      eyeOpen: 1,
    };
  }

  if (reaction === 'formation' && delayed < 0.90) {
    const u = clamp01(delayed / 0.90);
    const nod = Math.sin(u * Math.PI * 2) * (1 - u);
    return {
      ...pose,
      yaw: Math.atan2(2.65 - pose.x, 1.55 - pose.z),
      bodySquash: Math.max(pose.bodySquash, Math.max(0, nod) * 0.075),
      bodyStretch: Math.max(pose.bodyStretch, Math.max(0, -nod) * 0.05),
      lean: pose.lean - nod * 0.05,
      wobble: pose.wobble + nod * 0.04,
      eyeOpen: 1,
    };
  }

  return pose;
}
