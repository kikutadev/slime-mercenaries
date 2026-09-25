import { clamp01, easeInOutCubic, easeOutCubic } from './slime-motion';
import { CAMP_LIFE_STATIONS, campLifeHomeForSlot, yawToward } from './camp-life-layout';
import type { SlimeId } from './slimes';

export type CampLifeActivity =
  | 'idle'
  | 'travel'
  | 'practice'
  | 'yawn'
  | 'drowsy'
  | 'sleep'
  | 'wake'
  | 'chat'
  | 'inspect-rack'
  | 'inspect-nursery'
  | 'inspect-altar';

export interface CampLifePose {
  activity: CampLifeActivity;
  x: number;
  y: number;
  z: number;
  yaw: number;
  roll: number;
  bodySquash: number;
  bodyStretch: number;
  lean: number;
  wobble: number;
  eyeOpen: number;
  mouthOpen: number;
  mouthWidth: number;
  equipmentAngle: number;
  practiceImpact: number;
}

const CAMP_LIFE_PHASE_SEC = 18;
const TRAINING_CYCLE_SEC = CAMP_LIFE_PHASE_SEC;
const REST_CYCLE_SEC = CAMP_LIFE_PHASE_SEC;
const CHAT_CYCLE_SEC = CAMP_LIFE_PHASE_SEC;

function mod(value: number, divisor: number): number {
  return ((value % divisor) + divisor) % divisor;
}

function segment(time: number, start: number, duration: number): number {
  return clamp01((time - start) / duration);
}

function pulse(time: number, start: number, duration: number): number {
  const u = segment(time, start, duration);
  return u <= 0 || u >= 1 ? 0 : Math.sin(u * Math.PI);
}

function basePose(slotIndex: number, timeSec: number): CampLifePose {
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

function travel(
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
  const x = THREE_LERP(fromX, toX, u);
  const z = THREE_LERP(fromZ, toZ, u);
  return {
    ...pose,
    activity: 'travel',
    x,
    y: 0.02 + hop * 0.15,
    z,
    yaw: Math.atan2(toX - fromX, toZ - fromZ),
    roll: Math.sin(hopPhase) * 0.035,
    bodySquash: 0.025 + landing * 0.07,
    bodyStretch: hop * 0.11,
    lean: Math.sin(hopPhase) * 0.045,
    wobble: Math.sin(hopPhase * 2) * 0.05 * (1 - hop * 0.4),
  };
}

function THREE_LERP(from: number, to: number, t: number): number {
  return from + (to - from) * t;
}

function trainingPose(timeSec: number, slimeId: SlimeId, slotIndex: number): CampLifePose {
  const t = mod(timeSec, TRAINING_CYCLE_SEC);
  const home = campLifeHomeForSlot(slotIndex);
  const training = CAMP_LIFE_STATIONS.training;
  let pose = basePose(slotIndex, timeSec);

  if (t < 1.35) return pose;
  if (t < 3.05) {
    return travel(pose, t, 1.35, 1.70, home.position.x, home.position.z, training.position.x, training.position.z);
  }
  if (t < 6.55) {
    const local = t - 3.05;
    const strikeA = pulse(local, 0.70, 0.54);
    const strikeB = pulse(local, 1.68, 0.56);
    const strikeC = slimeId === 'dagger' || slimeId === 'gun' ? pulse(local, 2.52, 0.46) : 0;
    const strike = Math.max(strikeA, strikeB, strikeC);
    const recoil = Math.sin(local * Math.PI * 3.1) * strike;

    const jobAmplitude: Readonly<Record<SlimeId, number>> = {
      sword: 0.48,
      shield: 0.24,
      bow: 0.20,
      wand: 0.18,
      dagger: 0.58,
      gun: 0.30,
      mimic: 0.22,
    };
    const amplitude = jobAmplitude[slimeId] ?? 0.3;

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
    return travel(pose, t, 6.55, 1.70, training.position.x, training.position.z, home.position.x, home.position.z);
  }

  const satisfied = pulse(t, 8.55, 0.70);
  return {
    ...pose,
    y: home.position.y + satisfied * 0.055,
    wobble: pose.wobble + Math.sin(satisfied * Math.PI * 2) * 0.065,
    bodyStretch: pose.bodyStretch + satisfied * 0.055,
  };
}

function restPose(timeSec: number, slotIndex: number): CampLifePose {
  const t = mod(timeSec, REST_CYCLE_SEC);
  const home = campLifeHomeForSlot(slotIndex);
  const rest = CAMP_LIFE_STATIONS.rest;
  let pose = basePose(slotIndex, timeSec);

  if (t < 1.10) return pose;
  if (t < 2.85) {
    return travel(pose, t, 1.10, 1.75, home.position.x, home.position.z, rest.position.x, rest.position.z);
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
    return travel(pose, t, 10.95, 1.85, rest.position.x, rest.position.z, home.position.x, home.position.z);
  }

  return pose;
}

function chatPose(timeSec: number, slotIndex: number, pairSide: 'left' | 'right'): CampLifePose {
  const t = mod(timeSec, CHAT_CYCLE_SEC);
  const home = campLifeHomeForSlot(slotIndex);
  const chat = pairSide === 'left' ? CAMP_LIFE_STATIONS['chat-left'] : CAMP_LIFE_STATIONS['chat-right'];
  let pose = basePose(slotIndex, timeSec);

  if (t < 1.85) return pose;
  if (t < 3.55) {
    return travel(pose, t, 1.85, 1.70, home.position.x, home.position.z, chat.position.x, chat.position.z);
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
    return travel(pose, t, 8.45, 1.70, chat.position.x, chat.position.z, home.position.x, home.position.z);
  }

  const lookBack = pulse(t, 10.55, 0.85);
  return {
    ...pose,
    yaw: pose.yaw + (pairSide === 'left' ? 1 : -1) * lookBack * 0.18,
    wobble: pose.wobble + lookBack * 0.035,
  };
}

type InspectActivity = 'inspect-rack' | 'inspect-nursery' | 'inspect-altar';

function inspectStationPose(
  timeSec: number,
  slotIndex: number,
  slimeId: SlimeId,
  stationId: 'weapon-rack' | 'nursery' | 'fusion-altar',
  activity: InspectActivity,
): CampLifePose {
  const t = mod(timeSec, CAMP_LIFE_PHASE_SEC);
  const home = campLifeHomeForSlot(slotIndex);
  const station = CAMP_LIFE_STATIONS[stationId];
  const pose = basePose(slotIndex, timeSec);

  if (t < 1.35) return pose;
  if (t < 3.10) {
    return travel(pose, t, 1.35, 1.75, home.position.x, home.position.z, station.position.x, station.position.z);
  }
  if (t < 8.65) {
    const local = t - 3.10;
    const firstLook = pulse(local, 0.45, 0.90);
    const secondLook = pulse(local, 2.05, 0.90);
    const delight = pulse(local, 3.70, 0.72);
    const curious = Math.max(firstLook, secondLook);
    const isRack = activity === 'inspect-rack';
    const isNursery = activity === 'inspect-nursery';
    const isAltar = activity === 'inspect-altar';
    const nurserySurprise = isNursery ? pulse(local, 2.78, 0.48) : 0;
    const altarHum = isAltar ? 0.5 + Math.sin(local * 3.1) * 0.5 : 0;
    const rackAdmire = isRack ? delight : 0;
    const wandAffinity = isAltar && slimeId === 'wand' ? 1 : 0;

    return {
      ...pose,
      activity,
      x: station.position.x + nurserySurprise * 0.08,
      y: station.position.y + delight * 0.05 + altarHum * wandAffinity * 0.012,
      z: station.position.z + nurserySurprise * 0.10,
      yaw: yawToward(station.position, station.facingTarget)
        + Math.sin(local * 1.65) * curious * 0.08,
      roll: (isRack ? -1 : 1) * curious * 0.025 + nurserySurprise * 0.035,
      bodySquash: 0.03 + nurserySurprise * 0.08 + delight * 0.035,
      bodyStretch: delight * 0.065 + wandAffinity * altarHum * 0.035,
      lean: -curious * 0.055 + nurserySurprise * 0.10 - wandAffinity * altarHum * 0.025,
      wobble: Math.sin(local * 2.4) * curious * 0.035 + delight * 0.055,
      eyeOpen: 1,
      mouthOpen: 1 + delight * (isNursery ? 0.25 : 0.12),
      mouthWidth: 1 + delight * 0.08,
      equipmentAngle: rackAdmire * 0.13 + wandAffinity * altarHum * 0.07,
      practiceImpact: 0,
    };
  }
  if (t < 10.45) {
    return travel(pose, t, 8.65, 1.80, station.position.x, station.position.z, home.position.x, home.position.z);
  }

  return pose;
}

export function getCampLifePose(
  timeSec: number,
  slotIndex: number,
  slimeId: SlimeId,
): CampLifePose {
  const phase = Math.floor(Math.max(0, timeSec) / CAMP_LIFE_PHASE_SEC) % 6;
  const phaseTime = mod(timeSec, CAMP_LIFE_PHASE_SEC);

  if (phase === 0) {
    if (slotIndex === 0) return trainingPose(phaseTime, slimeId, slotIndex);
    if (slotIndex === 1) return restPose(phaseTime, slotIndex);
    if (slotIndex === 2) return chatPose(phaseTime, slotIndex, 'left');
    if (slotIndex === 3) return chatPose(phaseTime, slotIndex, 'right');
  }
  if (phase === 1) {
    if (slotIndex === 0) return chatPose(phaseTime, slotIndex, 'left');
    if (slotIndex === 1) return chatPose(phaseTime, slotIndex, 'right');
    if (slotIndex === 2) return trainingPose(phaseTime, slimeId, slotIndex);
    if (slotIndex === 3) return restPose(phaseTime, slotIndex);
  }
  if (phase === 2) {
    if (slotIndex === 0) return restPose(phaseTime, slotIndex);
    if (slotIndex === 1) return trainingPose(phaseTime, slimeId, slotIndex);
    if (slotIndex === 2) return chatPose(phaseTime, slotIndex, 'left');
    if (slotIndex === 3) return chatPose(phaseTime, slotIndex, 'right');
  }
  if (phase === 3) {
    if (slotIndex === 0) return chatPose(phaseTime, slotIndex, 'left');
    if (slotIndex === 1) return chatPose(phaseTime, slotIndex, 'right');
    if (slotIndex === 2) return restPose(phaseTime, slotIndex);
    if (slotIndex === 3) return trainingPose(phaseTime, slimeId, slotIndex);
  }
  if (phase === 4) {
    if (slotIndex === 0) return inspectStationPose(phaseTime, slotIndex, slimeId, 'weapon-rack', 'inspect-rack');
    if (slotIndex === 1) return inspectStationPose(phaseTime, slotIndex, slimeId, 'nursery', 'inspect-nursery');
    if (slotIndex === 2) return inspectStationPose(phaseTime, slotIndex, slimeId, 'fusion-altar', 'inspect-altar');
    if (slotIndex === 3) return restPose(phaseTime, slotIndex);
  }
  if (phase === 5) {
    if (slotIndex === 0) return inspectStationPose(phaseTime, slotIndex, slimeId, 'fusion-altar', 'inspect-altar');
    if (slotIndex === 1) return inspectStationPose(phaseTime, slotIndex, slimeId, 'weapon-rack', 'inspect-rack');
    if (slotIndex === 2) return inspectStationPose(phaseTime, slotIndex, slimeId, 'nursery', 'inspect-nursery');
    if (slotIndex === 3) return trainingPose(phaseTime, slimeId, slotIndex);
  }
  return basePose(slotIndex, phaseTime);
}


export type CampLifeWorldReaction = 'idle' | 'level-up' | 'formation' | 'recruit' | 'fusion';

export function applyCampLifeWorldReaction(
  pose: CampLifePose,
  elapsedSec: number,
  slotIndex: number,
  reaction: CampLifeWorldReaction,
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

export const CAMP_LIFE_CYCLE_DURATIONS = {
  training: TRAINING_CYCLE_SEC,
  rest: REST_CYCLE_SEC,
  chat: CHAT_CYCLE_SEC,
  phase: CAMP_LIFE_PHASE_SEC,
} as const;
