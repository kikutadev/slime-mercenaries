import { CAMP_LIFE_STATIONS, campLifeHomeForSlot, yawToward } from '../camp-life-layout';
import { basePose, travel } from './base';
import { mod, pulse } from './math';
import type { CampLifePose } from './types';

export type CampChatSide = 'left' | 'right';

export function chatPose(
  timeSec: number,
  slotIndex: number,
  pairSide: CampChatSide,
  cycleSec: number,
): CampLifePose {
  const t = mod(timeSec, cycleSec);
  const home = campLifeHomeForSlot(slotIndex);
  const chat = pairSide === 'left'
    ? CAMP_LIFE_STATIONS['chat-left']
    : CAMP_LIFE_STATIONS['chat-right'];
  const pose = basePose(slotIndex, timeSec);

  if (t < 1.85) return pose;
  if (t < 3.55) {
    return travel(
      pose,
      t,
      1.85,
      1.70,
      home.position.x,
      home.position.z,
      chat.position.x,
      chat.position.z,
    );
  }

  if (t < 8.45) {
    const local = t - 3.55;
    const myTurns = pairSide === 'left'
      ? [pulse(local, 0.55, 0.55), pulse(local, 2.55, 0.55)]
      : [pulse(local, 1.35, 0.55), pulse(local, 3.25, 0.55)];
    const talk = Math.max(...myTurns);
    const shared = pulse(local, 4.05, 0.68);

    return {
      ...pose,
      activity: 'chat',
      x: chat.position.x + (pairSide === 'left' ? 1 : -1) * talk * 0.035,
      y: chat.position.y + talk * 0.075 + shared * 0.035,
      z: chat.position.z,
      yaw: yawToward(chat.position, chat.facingTarget),
      roll: (pairSide === 'left' ? -1 : 1) * talk * 0.035,
      bodySquash: 0.03 + talk * 0.055 + shared * 0.035,
      bodyStretch: talk * 0.075 + shared * 0.04,
      lean: (pairSide === 'left' ? 1 : -1) * talk * 0.055,
      wobble: Math.sin(local * Math.PI * 2.2) * talk * 0.07 + shared * 0.06,
      eyeOpen: 1,
      mouthOpen: 1 + talk * 0.42,
      mouthWidth: 1 + talk * 0.18,
    };
  }

  if (t < 10.15) {
    return travel(
      pose,
      t,
      8.45,
      1.70,
      chat.position.x,
      chat.position.z,
      home.position.x,
      home.position.z,
    );
  }

  const lookBack = pulse(t, 10.55, 0.85);
  return {
    ...pose,
    yaw: pose.yaw + (pairSide === 'left' ? 1 : -1) * lookBack * 0.18,
    wobble: pose.wobble + lookBack * 0.035,
  };
}
