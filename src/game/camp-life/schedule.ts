import type { SlimeId } from '../slimes';
import { basePose } from './base';
import { inspectStationPose } from './inspect';
import { mod } from './math';
import { restPose } from './rest';
import { chatPose } from './social';
import { trainingPose } from './training';
import type { CampLifePose } from './types';

export const CAMP_LIFE_PHASE_SEC = 18;

const TRAINING_CYCLE_SEC = CAMP_LIFE_PHASE_SEC;
const REST_CYCLE_SEC = CAMP_LIFE_PHASE_SEC;
const CHAT_CYCLE_SEC = CAMP_LIFE_PHASE_SEC;

export function getCampLifePose(
  timeSec: number,
  slotIndex: number,
  slimeId: SlimeId,
): CampLifePose {
  const phase = Math.floor(Math.max(0, timeSec) / CAMP_LIFE_PHASE_SEC) % 6;
  const phaseTime = mod(timeSec, CAMP_LIFE_PHASE_SEC);

  if (phase === 0) {
    if (slotIndex === 0) return trainingPose(phaseTime, slimeId, slotIndex, TRAINING_CYCLE_SEC);
    if (slotIndex === 1) return restPose(phaseTime, slotIndex, REST_CYCLE_SEC);
    if (slotIndex === 2) return chatPose(phaseTime, slotIndex, 'left', CHAT_CYCLE_SEC);
    if (slotIndex === 3) return chatPose(phaseTime, slotIndex, 'right', CHAT_CYCLE_SEC);
  }

  if (phase === 1) {
    if (slotIndex === 0) return chatPose(phaseTime, slotIndex, 'left', CHAT_CYCLE_SEC);
    if (slotIndex === 1) return chatPose(phaseTime, slotIndex, 'right', CHAT_CYCLE_SEC);
    if (slotIndex === 2) return trainingPose(phaseTime, slimeId, slotIndex, TRAINING_CYCLE_SEC);
    if (slotIndex === 3) return restPose(phaseTime, slotIndex, REST_CYCLE_SEC);
  }

  if (phase === 2) {
    if (slotIndex === 0) return restPose(phaseTime, slotIndex, REST_CYCLE_SEC);
    if (slotIndex === 1) return trainingPose(phaseTime, slimeId, slotIndex, TRAINING_CYCLE_SEC);
    if (slotIndex === 2) return chatPose(phaseTime, slotIndex, 'left', CHAT_CYCLE_SEC);
    if (slotIndex === 3) return chatPose(phaseTime, slotIndex, 'right', CHAT_CYCLE_SEC);
  }

  if (phase === 3) {
    if (slotIndex === 0) return chatPose(phaseTime, slotIndex, 'left', CHAT_CYCLE_SEC);
    if (slotIndex === 1) return chatPose(phaseTime, slotIndex, 'right', CHAT_CYCLE_SEC);
    if (slotIndex === 2) return restPose(phaseTime, slotIndex, REST_CYCLE_SEC);
    if (slotIndex === 3) return trainingPose(phaseTime, slimeId, slotIndex, TRAINING_CYCLE_SEC);
  }

  if (phase === 4) {
    if (slotIndex === 0) {
      return inspectStationPose(
        phaseTime,
        slotIndex,
        slimeId,
        'weapon-rack',
        'inspect-rack',
        CAMP_LIFE_PHASE_SEC,
      );
    }
    if (slotIndex === 1) {
      return inspectStationPose(
        phaseTime,
        slotIndex,
        slimeId,
        'nursery',
        'inspect-nursery',
        CAMP_LIFE_PHASE_SEC,
      );
    }
    if (slotIndex === 2) {
      return inspectStationPose(
        phaseTime,
        slotIndex,
        slimeId,
        'fusion-altar',
        'inspect-altar',
        CAMP_LIFE_PHASE_SEC,
      );
    }
    if (slotIndex === 3) return restPose(phaseTime, slotIndex, REST_CYCLE_SEC);
  }

  if (phase === 5) {
    if (slotIndex === 0) {
      return inspectStationPose(
        phaseTime,
        slotIndex,
        slimeId,
        'fusion-altar',
        'inspect-altar',
        CAMP_LIFE_PHASE_SEC,
      );
    }
    if (slotIndex === 1) {
      return inspectStationPose(
        phaseTime,
        slotIndex,
        slimeId,
        'weapon-rack',
        'inspect-rack',
        CAMP_LIFE_PHASE_SEC,
      );
    }
    if (slotIndex === 2) {
      return inspectStationPose(
        phaseTime,
        slotIndex,
        slimeId,
        'nursery',
        'inspect-nursery',
        CAMP_LIFE_PHASE_SEC,
      );
    }
    if (slotIndex === 3) return trainingPose(phaseTime, slimeId, slotIndex, TRAINING_CYCLE_SEC);
  }

  return basePose(slotIndex, phaseTime);
}

export const CAMP_LIFE_CYCLE_DURATIONS = {
  training: TRAINING_CYCLE_SEC,
  rest: REST_CYCLE_SEC,
  chat: CHAT_CYCLE_SEC,
  phase: CAMP_LIFE_PHASE_SEC,
} as const;
